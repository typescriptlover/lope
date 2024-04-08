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

**Next.js with App Router**

`src/lib/lope.ts`

> we store lope inside global to prevent reconnecting every time HMR happens.

```ts
import Lope from "@fell/lope";

let lope: Lope;

const options: Lope["config"] = {
   // your base options
};

if (process.env.NODE_ENV !== "production") {
   if (!global.lope) {
      global.lope = new Lope(options);
   }
   lope = global.lope;
} else {
   lope = new Lope({
      ...options,
      logging: "all", // development environment logging, optional
   });
}

export { lope };
```

`src/app/api/upload/route.ts`

> file uploading, returns `image` key inside JSON Response

```ts
import { lope } from "@/lib/lope";

export async function POST(request: Request) {
   const formData = await request.formData();
   const file = formData.get("file") as File | undefined;

   if (file) {
      const fileArrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(fileArrayBuffer);

      const id = await lope.upload(fileBuffer);

      return Response.json({ image: id });
   }

   return Response.json({ image: false });
}
```

`src/app/api/image/[id]/route.ts`

> file serving via url

```ts
import { lope } from "@/lib/lope";

export async function GET(
   request: Request,
   { params }: { params: { id: string } },
) {
   const file = await lope.get(params.id);

   if (file) {
      return new Response(file, { headers: { "content-type": "image/png" } });
   }
   return Response.json({ success: false, message: "Image not found" });
}
```

**Now here's a component uploading and displaying the image in realtime**

`src/app/page.tsx`

```ts
'use client';

import axios from 'axios';
import { ChangeEvent, useState } from 'react';

export default function Home() {
   const [fail, setFail] = useState<boolean>(false);
   const [imageId, setImageId] = useState<string | false>(false);

   async function onChange(event: ChangeEvent<HTMLInputElement>) {
      if (event.target.files && event.target.files.length) {
         setFail(false);
         const file = event.target.files[0];

         const formData = new FormData();

         formData.append('file', file);

         const res = await axios
            .post('/api/upload', formData, {
               headers: { 'Content-Type': 'multipart/form-data' },
            })
            .then((res) => res.data)
            .then((data) => {
               if (data && data.image) {
                  setImageId(data.image);
               } else {
                  setFail(true);
               }
            });
      }
   }

   return (
      <main className="max-w-md mx-auto w-full flex items-center p-10 justify-center flex-col text-center">
         <h1 className="text-4xl font-semibold tracking-tighter">
            lope + next
         </h1>
         <input
            className="block w-full p-2.5 mt-10 text-sm bg-black rounded-lg text-white"
            type="file"
            onChange={onChange}
         ></input>
         {!!imageId && (
            <img
               src={`/api/image/${imageId}`}
               alt="Lope Image"
               className="mt-10"
            />
         )}
         {!!fail && (
            <p className="mt-10 text-red-500 font-medium tracking-tight">
               Failed uploading image
            </p>
         )}
      </main>
   );
}
```

**Just like that, you now have an easy image solution for your Next app**

#

**pkgs**

-  `redis` from node as redis client
-  `pika` for generating file ids
-  `file-type` for file validation
-  `chalk` for pretty logs

**to do**

-  proper error handling
-  documenting in readme
-  uploading with multiple types: `ArrayBuffer`, `UInt8Array`, `File` and `Blob`
