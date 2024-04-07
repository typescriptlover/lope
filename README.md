# lope

`bun install @fell/lope`

**why**

_sometimes you just want a quick n easy image storage that does the job, without a hassle to set up, especially for personal projects or development environments_

> also, this is mostly for my personal use

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
