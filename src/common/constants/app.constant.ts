import * as path from "path";

export const APP_CONSTANTS = {
  APP_NAME: "KAIROZLBOT",
};

export const ASSETDIR = path.join(process.cwd(), "src", "common", "assets");

export const CACHEDIR = path.join(ASSETDIR, "cache");
