# lope

🔮 ready to go redis image storage

**why**

_sometimes you just want a quick n easy way to store and retrieve images fast, without a hassle to set up, especially for personal projects or development environments_

#

**install**

_bun_

`bun install @fell/lope`

_npm_

`npm install @fell/lope`

_pnpm_

`pnpm install @fell/lope`

#

**how to**

lope is meant to be used server-side, handling file uploading and returning to client.

`lope.ts`

```ts
const lope = new Lope({
    storage: "redis",
    storageOptions: {
        url: "your redis uri"
        // url is optional,
        // otherwise it will use default redis connection if not set.
    }
    logging: "default",
    // "all" | "default"
    // all will show you retrieval, uploading, failure logs, and anything extra.
    // default will show you important logs only.
})

export default lope;
```

`server.ts`

```ts
// before starting server,
// make sure to run lope.

await lope.connect();
```

write more...

#

**pkgs**

- `redis` from node as redis client
- `pika` for generating file ids
- `chalk` for pretty logs

**to do**

- file format validation
- max file size validation
- proper error handling
- documenting in readme
