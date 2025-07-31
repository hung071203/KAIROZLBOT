import { createCanvas, loadImage } from "canvas";
import fs from "fs";

export interface RenderOptions {
  width?: number;
  height?: number;
  padding?: number;
  font?: string;
  lineHeight?: number;
  textColor?: string;
  backgroundColor?: string;
  backgroundImagePath?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "");
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function getContrastRatio(l1: number, l2: number): number {
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function isReadable(bgColor: string, color: string): boolean {
  const [r1, g1, b1] = hexToRgb(bgColor);
  const [r2, g2, b2] = hexToRgb(color);
  const lum1 = getLuminance(r1, g1, b1);
  const lum2 = getLuminance(r2, g2, b2);
  return getContrastRatio(lum1, lum2) > 4.5;
}

function getRandomColor(bgColor: string): string {
  let color: string;
  let attempts = 0;
  do {
    color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
    attempts++;
    // Tránh vòng lặp vô hạn
    if (attempts > 100) {
      // Fallback: chọn màu đen hoặc trắng tùy theo background
      const [r, g, b] = hexToRgb(bgColor);
      const lum = getLuminance(r, g, b);
      color = lum > 0.5 ? "#000000" : "#ffffff";
      break;
    }
  } while (!isReadable(bgColor, color));
  return color;
}

export async function renderTextImage(
  text: string,
  outputPath: string,
  options: RenderOptions = {}
): Promise<void | Buffer> {
  const padding = options.padding ?? 20;
  const font = options.font ?? "28px sans-serif";
  const lineHeight = options.lineHeight ?? 40;
  const backgroundColor = options.backgroundColor ?? "#ffffff";
  const defaultTextColor = options.textColor ?? "#000000";

  const tempCanvas = createCanvas(1, 1);
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.font = font;

  const lines = text.split("\n");
  const maxLineWidth = Math.max(...lines.map(line => tempCtx.measureText(line).width));
  const contentWidth = maxLineWidth + padding * 2;
  const contentHeight = lines.length * lineHeight + padding * 2;

  let width = options.width;
  let height = options.height;

  if (options.backgroundImagePath) {
    const bgImage = await loadImage(options.backgroundImagePath);
    width = width ?? bgImage.width;
    height = height ?? bgImage.height;
  } else {
    width = width ?? contentWidth;
    height = height ?? contentHeight;
  }

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Vẽ nền
  if (options.backgroundImagePath) {
    const bgImage = await loadImage(options.backgroundImagePath);
    ctx.drawImage(bgImage, 0, 0, width, height);
  } else {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.font = font;
  ctx.textBaseline = "top";

  // Cache màu cho các key để đảm bảo cùng một key có cùng màu
  const keyColors: Record<string, string> = {};

  lines.forEach((line, index) => {
    let x = padding;
    const y = padding + index * lineHeight;
    
    // Kiểm tra xem dòng có chứa dấu : không
    const colonIndex = line.indexOf(':');
    
    if (colonIndex !== -1) {
      // Có dấu :, tách key và content
      const key = line.substring(0, colonIndex);
      const content = line.substring(colonIndex);
      
      // Vẽ key với màu ngẫu nhiên
      const keyTrimmed = key.trim();
      if (keyTrimmed.length > 0) {
        if (!(keyTrimmed in keyColors)) {
          keyColors[keyTrimmed] = getRandomColor(backgroundColor);
        }
        ctx.fillStyle = keyColors[keyTrimmed];
        ctx.fillText(key, x, y);
        x += ctx.measureText(key).width;
      }
      
      // Vẽ phần content với màu mặc định
      ctx.fillStyle = defaultTextColor;
      ctx.fillText(content, x, y);
    } else {
      // Không có dấu :, vẽ toàn bộ dòng với màu mặc định
      ctx.fillStyle = defaultTextColor;
      ctx.fillText(line, x, y);
    }
  });

  const buffer = canvas.toBuffer("image/png");
  if (outputPath) {
    fs.writeFileSync(outputPath, buffer);
    setTimeout(() => {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    }, 60000); // Xóa file sau 1 phút
  } else {
    return buffer;
  }
}