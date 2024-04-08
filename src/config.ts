import type { LopeConfig } from "./types";

export default {
   fileOptions: {
      maxSize: 18,
      allowFormats: ["png", "jpg", "jpeg", "webp", "gif", "svg"],
      denyFormats: [],
   },
   logging: "default",
} satisfies LopeConfig;
