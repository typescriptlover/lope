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

   async upload(files: Buffer, fileNames?: string): Promise<string | false>;
   async upload(
      files: Buffer[],
      fileNames?: string[],
   ): Promise<Array<string | false>>;
   async upload(
      files: Buffer | Buffer[],
      fileNames?: string | string[],
   ): Promise<string | false | Array<string | false>> {
      if (!this.connected) await this.connect();

      if (Array.isArray(files)) {
         let fileNamesOut: Array<string | false> = [];

         for (let i = 0; i < files.length; ++i) {
            const file = files[i];

            await this.validateFile(file);

            let fileName: string;

            if (
               !Array.isArray(fileNames) ||
               !fileNames ||
               !fileNames.length ||
               fileNames.length < i + 1
            ) {
               fileName = this.#pika.gen("lope");
            } else {
               fileName = fileNames[i];
            }

            const success = await this.connection.set(fileName, file);

            if (success) {
               if (this.config.logging === "all") {
                  log("info", `uploaded file ${i + 1} ''${fileName}''`);
               }
               fileNamesOut.push(fileName);
            } else {
               if (this.config.logging === "all") {
                  log("warn", `failed uploading file ${i + 1}`);
               }
               fileNamesOut.push(false);
            }
         }

         return fileNamesOut;
      } else {
         const file = files;

         await this.validateFile(file);

         let fileName: string;

         if (!fileNames || !fileNames.length || typeof fileNames !== "string") {
            fileName = this.#pika.gen("lope");
         } else {
            fileName = fileNames;
         }

         const success = await this.connection.set(fileName, file);

         if (this.config.logging === "all") {
            if (success) {
               log("info", `uploaded file ''${fileName}''`);
            } else {
               log("warn", `failed uploading file`);
            }
         }

         return success ? fileName : false;
      }
   }

   async get(fileNames: string): Promise<Buffer | false>;
   async get(fileNames: string[]): Promise<Array<Buffer | false>>;
   async get(
      fileNames: string | string[],
   ): Promise<Buffer | false | Array<Buffer | false>> {
      if (!this.connected) await this.connect();

      if (Array.isArray(fileNames)) {
         const files: Array<Buffer | false> = [];

         for (let i = 0; i < fileNames.length; ++i) {
            const fileName = fileNames[i];

            const file = await this.connection.get(
               this.connection.commandOptions({ returnBuffers: true }),
               fileName,
            );

            if (file) {
               if (this.config.logging === "all") {
                  log(
                     "info",
                     `retrieved file ${i + 1} with key ''${fileName}''`,
                  );
               }
               files.push(file);
            } else {
               if (this.config.logging === "all") {
                  log(
                     "warn",
                     `failed retrieving file ${i + 1} with key ''${fileName}''`,
                  );
               }
               files.push(false);
            }
         }

         return files;
      } else {
         const fileName = fileNames;

         const file = await this.connection.get(
            this.connection.commandOptions({ returnBuffers: true }),
            fileName,
         );

         if (file) {
            if (this.config.logging === "all") {
               log("info", `retrieved file with key ''${fileName}''`);
            }
            return file;
         } else {
            if (this.config.logging === "all") {
               log("warn", `failed retrieving file with key ''${fileName}''`);
            }
            return false;
         }
      }
   }
}
