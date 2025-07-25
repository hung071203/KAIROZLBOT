import axios from "axios";
import * as mime from "mime-types";
import * as fs from "fs";
import * as path from "path";
import { generateRandomString } from "./hash.utils";

interface DownloadOptions {
  url: string;
  includesExt?: string | string[];
  expireIn?: number; // in minutes, default is 1
}

export function safeBase64(path: string, base64: string) {
  // Tự loại bỏ prefix nếu có
  const cleanedBase64 = base64.replace(/^data:image\/\w+;base64,/, "");

  fs.writeFile(path, cleanedBase64, "base64", function (err) {
    if (err) {
      console.error("Lỗi khi ghi file:", err);
    } else {
      console.log("Đã lưu ảnh thành công:", path);

      // Hẹn giờ xóa file sau 1 phút
      setTimeout(() => {
        fs.unlink(path, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Lỗi khi xóa file:", unlinkErr);
          } else {
            console.log("Đã xóa file:", path);
          }
        });
      }, 60000);
    }
  });
}

export async function downloadData({
  url,
  includesExt,
  expireIn = 60000,
}: DownloadOptions) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const contentType = res.headers["content-type"];
  const extension: any = mime.extension(contentType);

  if (includesExt) {
    if (typeof includesExt === "string") {
      if (!extension.includes(includesExt))
        throw new Error("Only supports format " + includesExt);
    } else if (Array.isArray(includesExt)) {
      if (!includesExt.includes(extension))
        throw new Error("Only supports formats " + includesExt.join(", "));
    } else {
      throw new Error("includesExt must be a string or an array");
    }
  }

  const filename =
    Date.now() + "-" + generateRandomString(10) + "." + extension;
  const filePath = path.join(
    process.cwd(),
    "src",
    "common",
    "assets",
    "cache",
    filename
  );

  fs.writeFileSync(filePath, res.data);
  console.log(`File downloaded to ${filePath}`);

  setTimeout(() => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log("Error deleting file:", err);
      } else {
        console.log(
          `File ${filePath} deleted after ${expireIn / 1000} seconds`
        );
      }
    });
  }, expireIn);
  return {
    readStream: fs.createReadStream(filePath),
    filePath,
    fileName: filename,
  };
}

export const imageExtensions = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "tiff",
  "webp",
  "svg",
  "heif",
  "heic",
  "raw",
  "cr2",
  "nef",
  "orf",
  "sr2",
  "psd",
  "ai",
  "eps",
  "ico",
];

export const videoExtentions = [
  "mp4",
  "webm",
  "ogg",
  "avi",
  "flv",
  "mov",
  "wmv",
  "rm",
  "rmvb",
  "mkv",
  "m4v",
  "3gp",
  "3g2",
  "mpg",
  "mpeg",
  "m2v",
  "vob",
  "asf",
  "divx",
  "ts",
  "swf",
  "f4v",
  "h264",
  "h265",
  "hevc",
  "avchd",
  "m2ts",
  "mxf",
  "mts",
  "ogv",
];

export const audioExtensions = [
  "mp3",
  "wav",
  "aac",
  "flac",
  "ogg",
  "m4a",
  "wma",
  "alac",
  "aiff",
  "amr",
  "opus",
  "pcm",
  "mid",
  "midi",
  "ape",
  "ra",
  "au",
  "mp2",
  "ac3",
];
