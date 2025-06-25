import "https://char.lt/esm/pipe.ts";

import type { Infer, MakeLexiconUniverse } from "@char/lexicon.ts";
import type { ATProtoUniverse } from "@char/lexicon.ts/atproto";
import { XRPC } from "@char/lexicon.ts/rpc";
import * as fs from "@std/fs";
import { serveFile } from "@std/http/file-server";
import * as path from "@std/path";
import vento from "@vento/vento";
import { marked } from "marked";
import type WWEntryLexicon from "../lexicons/com/whtwnd/blog/entry.ts";
import { db } from "./db.ts";
import { resolveDocument, resolveHandle } from "./identity.ts";

type WWUniverse = MakeLexiconUniverse<[typeof WWEntryLexicon]>;
type WWEntry = Infer<WWUniverse, "com.whtwnd.blog.entry">;

const styles = async (req: Request) => {
  return await serveFile(req, "./static/styles.css");
};

const ventoEnv = vento();

const getCachedArticle = db.articles.prepare(
  "SELECT record FROM articles WHERE at_identifier = :did AND rkey = :rkey AND fetched_at > (unixepoch() - 3600)",
);
const insertArticle = db.articles.prepare(
  "INSERT INTO articles (at_identifier, rkey, record) VALUES (:did, :rkey, :record)",
);

const fetchArticle = async (
  did: `did:${string}`,
  rkey: string,
  noCache?: boolean,
): Promise<WWEntry> => {
  if (!noCache) {
    const cachedArticle = getCachedArticle.value<[v: string]>({ did, rkey })?.[0];
    if (cachedArticle) return JSON.parse(cachedArticle) as WWEntry;
  }

  const doc = await resolveDocument(did, noCache);
  const pds = doc.service?.find(it => it.id === "#atproto_pds")?.serviceEndpoint;
  if (typeof pds !== "string") throw new Error("could not find atproto pds for did");

  const rpc = new XRPC<ATProtoUniverse>(pds);
  const record = await rpc.get("com.atproto.repo.getRecord", {
    params: { repo: did, collection: "com.whtwnd.blog.entry", rkey },
  });
  const article = record.value as WWEntry;
  insertArticle.run({ did, rkey, record: JSON.stringify(article) });
  return article;
};

const article = async (req: Request, { handle, rkey }: { handle: string; rkey: string }) => {
  const noCache = new URL(req.url).searchParams.has("no_cache");
  const renderedPath = path.join("./data", "articles", handle, rkey) + ".html";

  if (!noCache) {
    try {
      const stat = await Deno.stat(renderedPath);
      return await serveFile(req, renderedPath, { fileInfo: stat });
    } catch {
      // ignore
    }
  }

  try {
    const did = handle.startsWith("did:")
      ? (handle as `did:${string}`)
      : await resolveHandle(handle);
    const article = await fetchArticle(did, rkey, noCache);
    const output = await ventoEnv.run("./static/article.vto", {
      did,
      rkey,
      handle,
      title: article.title,
      subtitle: article.subtitle,
      content: marked.parse(article.content),
    });

    void (async () => {
      await fs.ensureDir(path.dirname(renderedPath));
      await Deno.writeTextFile(renderedPath, output.content);
    })();

    return new Response(output.content, { headers: { "content-type": "text/html" } });
  } catch (err) {
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  }
};

export default {
  async fetch(req, _info) {
    const url = new URL(req.url);

    if (url.pathname === "/styles.css") return await styles(req);

    const pattern = new URLPattern({ pathname: "/:handle/:rkey" }).exec(url);
    if (pattern) {
      const { handle, rkey } = pattern.pathname.groups as Record<string, string>;
      return await article(req, { handle, rkey });
    }

    return new Response("Not Found");
  },
} satisfies Deno.ServeDefaultExport;
