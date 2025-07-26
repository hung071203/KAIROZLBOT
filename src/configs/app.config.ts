import { assert } from "console";
import { DatabaseManager } from "../database";
import * as fs from "fs";
import * as path from "path";

export class AppConfig {
  private db: DatabaseManager;
  private configFilePath = path.join(
    process.cwd(),
    "src",
    "configs",
    "config.json"
  );

  constructor(databaseManager: DatabaseManager) {
    this.db = databaseManager;
  }

  async initialize() {
    const defaultConfig = {
      botName: "ZCA",
      prefix: "!",
      admins: ["10001", "10002"],
    };

    let config: typeof defaultConfig;

    // Kiểm tra file tồn tại
    if (fs.existsSync(this.configFilePath)) {
      const fileContent = fs.readFileSync(this.configFilePath, "utf-8");
      config = JSON.parse(fileContent);
      console.log(`📄 Đã đọc file cấu hình: ${this.configFilePath}`);
    } else {
      config = defaultConfig;

      fs.writeFileSync(this.configFilePath, JSON.stringify(config, null, 2));
      console.log(`📄 Đã tạo file cấu hình mới: ${this.configFilePath}`);
    }

    // Lưu vào DB
    type ConfigKey = keyof typeof config;
    for (const key of Object.keys(config) as ConfigKey[]) {
      const value = config[key];
      await this.db.config.setConfig(
        key,
        typeof value === "string" ? value : JSON.stringify(value)
      );
    }
  }

  async getAllConfigs(): Promise<Record<string, any>> {
    const configs = await this.db.config.findAll(); // hoặc this.repo.find() nếu dùng repo

    const result: Record<string, any> = {};
    for (const { key, value } of configs) {
      try {
        result[key] = JSON.parse(value); // nếu là JSON string
      } catch {
        result[key] = value; // nếu là string thường
      }
    }

    return result;
  }
}
