import { Logger } from "../utils/logger.util";
import * as fs from "fs";
import * as path from "path";

export class AppConfig {
  private configFilePath = path.join(
    process.cwd(),
    "src",
    "configs",
    "config.json"
  );
  private config: Record<string, any> = {};

  constructor() {}

  async initialize() {
    const defaultConfig = {
      botName: "ZCA",
      prefix: "!",
      admins: ["10001", "10002"],
      logging: ["info", "warn", "error", "debug", "success"],
      logMemoryUsage: {
        enabled: true,
        interval: 60000, // 60 giây
      },
    };

    // Đọc file nếu tồn tại
    if (fs.existsSync(this.configFilePath)) {
      const fileContent = fs.readFileSync(this.configFilePath, "utf-8");
      this.config = JSON.parse(fileContent);
      Logger.info(`📄 Đã đọc file cấu hình: ${this.configFilePath}`);
    } else {
      this.config = defaultConfig;
      fs.writeFileSync(
        this.configFilePath,
        JSON.stringify(this.config, null, 2)
      );
      Logger.info(`📄 Đã tạo file cấu hình mới: ${this.configFilePath}`);
    }
  }

  getAllConfigs(): Record<string, any> {
    return this.config;
  }

  getConfig(key: string): any {
    return this.config[key];
  }

  setConfig(key: string, value: any): void {
    this.config[key] = value;
    fs.writeFileSync(this.configFilePath, JSON.stringify(this.config, null, 2));
    Logger.info(`✅ Đã cập nhật cấu hình: ${key} = ${value}`);
  }

  delConfig(key: string): void {
    if (this.config[key]) {
      delete this.config[key];
      fs.writeFileSync(
        this.configFilePath,
        JSON.stringify(this.config, null, 2)
      );
      Logger.info(`✅ Đã xóa cấu hình: ${key}`);
    } else {
      Logger.warn(`⚠️ Không tìm thấy cấu hình để xóa: ${key}`);
    }
  }
}
