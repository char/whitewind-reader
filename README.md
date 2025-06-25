# whitewind-reader

a minimal reader for `whtwnd.com` blog entries.

- cheap: nginx can serve static html out of `./data/articles/…` for hot pages
- no full-screen modal popup on first load like the canonical whtwnd frontend
- no client-side JS is required

## setup

```shell
$ deno task start
deno serve: Listening on http://0.0.0.0:8000/
```
