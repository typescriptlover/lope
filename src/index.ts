import Pika from "pika-id";
import { createClient, type RedisClientType } from "redis";
import { fileTypeFromBuffer } from "file-type";

import defaultConfig from "./config";
import log from "./log";

import type { LopeConfig, LopeConnection } from "./types";

export default class Lope {
   public config: LopeConfig = defaultConfig;
   public connection: LopeConnection = createClient();

   public connected: boolean = false;

   #retries = 1;

   #pika = new Pika([
      "lope",
      {
         prefix: "lope",
         description: "Lope File",
      },
   ]);

   constructor(config: LopeConfig) {
      this.config = {
         ...defaultConfig,
         ...config,
      };

      if (this.config.redisOptions) {
         this.connection = createClient(
            this.config.redisOptions,
         ) as RedisClientType;
      }

      this.#listener();
   }

   #reconnecting() {
      if (this.#retries < 5) {
         log("warn", `reconnecting to redis...`);
         this.#retries += 1;
      } else {
         log(
            "error",
            `too many redis connection retries, make sure your uri is valid, quitting.`,
         );
         this.connection.quit();
      }
   }

   #listener() {
      this.connection.on("ready", () => {
         log("info", "connected to redis");
         this.connected = true;
      });

      this.connection.on("end", () => {
         log("error", "disconnected from redis");
         this.connected = false;
      });

      this.connection.on("reconnecting", () => {
         if (this.connected) {
            this.connected = false;
         }
         this.#reconnecting();
      });

      this.connection.on("error", (err) => {
         log("error", "redis error");
         console.error(err);
      });
   }

   async connect() {
      if (this.connected) return false;
      await this.connection.connect();
      return true;
   }

   async disconnect() {
      if (!this.connected) return false;
      await this.connection.disconnect();
      return true;
   }

   async validateFile(file: Buffer) {
      const type = await fileTypeFromBuffer(file);

      if (type) {
         const ext = type.ext as any;

         if (this.config.fileOptions) {
            const { allowFormats, denyFormats, maxSize } =
               this.config.fileOptions;

            if (allowFormats && allowFormats.length) {
               if (!allowFormats.includes(ext)) {
                  throw new Error(`File format .${ext} is not allowed`);
               }
            }
            if (denyFormats && denyFormats.length) {
               if (denyFormats.includes(ext)) {
                  throw new Error(`File format .${ext} is not allowed`);
               }
            }

            if (maxSize) {
               const fileSize = Buffer.byteLength(file);
               const fileSizeAsMB = parseFloat(
                  (fileSize / (1024 * 1024)).toFixed(2),
               );

               if (fileSizeAsMB > maxSize) {
                  throw new Error(
                     `File is too large, max size is ${maxSize}MB`,
                  );
               }
            }
         }
      }
   }

   async upload(files: Buffer): Promise<string | false>;
   async upload(files: Buffer[]): Promise<Array<string | false>>;
   async upload(
      files: Buffer | Buffer[],
   ): Promise<string | false | Array<string | false>> {
      if (!this.connected) await this.connect();

      if (Array.isArray(files)) {
         let fileKeys: Array<string | false> = [];

         for (let i = 0; i < files.length; ++i) {
            const file = files[i];

            await this.validateFile(file);

            const fileKey = this.#pika.gen("lope");
            const success = await this.connection.set(fileKey, file);

            if (success) {
               if (this.config.logging === "all") {
                  log("info", `uploaded file ${i + 1} with key ''${fileKey}''`);
               }
               fileKeys.push(fileKey);
            } else {
               if (this.config.logging === "all") {
                  log("warn", `failed uploading file ${i + 1}`);
               }
               fileKeys.push(false);
            }
         }

         return fileKeys;
      } else {
         const file = files;

         await this.validateFile(file);

         const fileKey = this.#pika.gen("lope");
         const success = await this.connection.set(fileKey, file);

         if (this.config.logging === "all") {
            if (success) {
               log("info", `uploaded file with key ''${fileKey}''`);
            } else {
               log("warn", `failed uploading file`);
            }
         }

         return success ? fileKey : false;
      }
   }

   async get(fileKeys: string): Promise<Buffer | false>;
   async get(fileKeys: string[]): Promise<Array<Buffer | false>>;
   async get(
      fileKeys: string | string[],
   ): Promise<Buffer | false | Array<Buffer | false>> {
      if (!this.connected) await this.connect();

      if (Array.isArray(fileKeys)) {
         const files: Array<Buffer | false> = [];

         for (let i = 0; i < fileKeys.length; ++i) {
            const fileKey = fileKeys[i];

            const file = await this.connection.get(
               this.connection.commandOptions({ returnBuffers: true }),
               fileKey,
            );

            if (file) {
               if (this.config.logging === "all") {
                  log(
                     "info",
                     `retrieved file ${i + 1} with key ''${fileKey}''`,
                  );
               }
               files.push(file);
            } else {
               if (this.config.logging === "all") {
                  log(
                     "warn",
                     `failed retrieving file ${i + 1} with key ''${fileKey}''`,
                  );
               }
               files.push(false);
            }
         }

         return files;
      } else {
         const fileKey = fileKeys;

         const file = await this.connection.get(
            this.connection.commandOptions({ returnBuffers: true }),
            fileKey,
         );

         if (file) {
            if (this.config.logging === "all") {
               log("info", `retrieved file with key ''${fileKey}''`);
            }
            return file;
         } else {
            if (this.config.logging === "all") {
               log("warn", `failed retrieving file with key ''${fileKey}''`);
            }
            return false;
         }
      }
   }
}
