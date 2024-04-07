# lope

🔮 ready to go redis image storage

**why**

_sometimes you just want a quick n easy way to store and retrieve images fast, without a hassle to set up, especially for personal projects or development environments_

> also, this is mostly for my personal use

**install**

_bun_

`bun install @fell/lope`

_npm_

`npm install @fell/lope`

_pnpm_

`pnpm install @fell/lope`

**how to**

lope is meant to be used server-side, handling file uploading and returning to client.

**pkgs**

- `redis` from node as redis client
- `pika` for generating file ids
- `chalk` for pretty logs

**to do**

- file format validation
- max file size validation
- proper error handling
- documenting in readme
