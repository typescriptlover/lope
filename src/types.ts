import type { RedisClientOptions, RedisClientType } from "redis";

// implemented storage databases
export type LopeStorage = "redis";

// storage client options
export type LopeStorageOptions = RedisClientOptions;

// file formats supported
export type LopeFileFormat = "png" | "jpg" | "jpeg" | "webp" | "gif" | "svg";

// current connection
export type LopeConnection = RedisClientType;

export interface LopeFile {
  // maximum size of file allowed
  // Megabytes (MB)
  maxSize?: number;

  // whitelist only these file formats as allowed
  allowFormats?: LopeFileFormat[];

  // blacklist only these file formats as disallowed
  denyFormats?: LopeFileFormat[];
}

export interface LopeConfig {
  // which storage database to use
  storage: LopeStorage;

  // storage uri connection string, empty if default uri
  storageOptions?: LopeStorageOptions;

  // file configuration for upload
  file?: LopeFile;

  // what type of logging
  logging?: "all" | "default";
}
