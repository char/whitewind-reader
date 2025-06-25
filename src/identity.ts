import type { DidDocument } from "@atcute/identity";
import {
  CompositeDidDocumentResolver,
  CompositeHandleResolver,
  DohJsonHandleResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  WellKnownHandleResolver,
} from "@atcute/identity-resolver";

import { db } from "./db.ts";

const handleResolver = new CompositeHandleResolver({
  strategy: "race",
  methods: {
    dns: new DohJsonHandleResolver({ dohUrl: "https://mozilla.cloudflare-dns.com/dns-query" }),
    http: new WellKnownHandleResolver(),
  },
});
const docResolver = new CompositeDidDocumentResolver({
  methods: {
    plc: new PlcDidDocumentResolver(),
    web: new WebDidDocumentResolver(),
  },
});

const getCachedDoc = db.didCache.prepare(
  "SELECT doc FROM did WHERE did = :did AND fetched_at > (unixepoch() - 3600)",
);
const insertDoc = db.didCache.prepare(
  "INSERT OR REPLACE INTO did (did, doc) VALUES (:did, :doc)",
);

export async function resolveDocument(
  did: `did:${string}`,
  noCache?: boolean,
): Promise<DidDocument> {
  if (!noCache) {
    const cachedDoc = getCachedDoc.value<[doc: string]>({ did })?.[0];
    if (cachedDoc) return JSON.parse(cachedDoc) as DidDocument;
  }

  const doc = await docResolver.resolve(did as `did:${"plc" | "web"}:${string}`);
  insertDoc.run({ did, doc: JSON.stringify(doc) });

  return doc;
}

const getCachedDid = db.didCache.prepare(
  "SELECT did FROM handle WHERE handle = :handle AND fetched_at > (unixepoch() - 3600)",
);
const insertDid = db.didCache.prepare(
  "INSERT OR REPLACE INTO handle (handle, did) VALUES (:handle, :did)",
);

export async function resolveHandle(
  handle: string,
  noCache?: boolean,
): Promise<`did:${string}`> {
  if (!noCache) {
    const cachedDid = getCachedDid.value<[did: `did:${string}`]>({ handle })?.[0];
    if (cachedDid) return cachedDid;
  }

  const did = await handleResolver.resolve(handle as `${string}.${string}`, { noCache: true });
  insertDid.run({ handle, did });

  return did;
}
