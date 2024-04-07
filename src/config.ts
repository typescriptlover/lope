import type { LopeConfig } from "./types";

export default {
  storage: "redis",
  file: {
    maxSize: 512,
    allowFormats: ["png", "jpg", "jpeg", "webp", "gif", "svg"],
    denyFormats: [],
  },
  logging: "default",
} satisfies LopeConfig;
