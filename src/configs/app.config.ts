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
      logging: {
        enabled: true,
        level: ["info", "warn", "error", "debug"],
      },
    };

    let config: typeof defaultConfig;

    // Đọc file nếu tồn tại
    if (fs.existsSync(this.configFilePath)) {
      const fileContent = fs.readFileSync(this.configFilePath, "utf-8");
      config = JSON.parse(fileContent);
      console.log(`📄 Đã đọc file cấu hình: ${this.configFilePath}`);
    } else {
      config = defaultConfig;
      fs.writeFileSync(this.configFilePath, JSON.stringify(config, null, 2));
      console.log(`📄 Đã tạo file cấu hình mới: ${this.configFilePath}`);
    }

    const fileKeys = Object.keys(config);
    const dbConfig = await this.db.config.getAllConfigs();
    const dbKeys = Object.keys(dbConfig);

    // 🔁 Thêm hoặc cập nhật từ file vào DB
    for (const key of fileKeys) {
      const value = config[key as keyof typeof config];
      await this.db.config.setConfig(
        key,
        typeof value === "string" ? value : JSON.stringify(value)
      );
    }

    // 🗑️ Xóa key trong DB nếu không có trong file
    for (const key of dbKeys) {
      if (!fileKeys.includes(key)) {
        await this.db.config.deleteConfig(key);
        console.log(`🗑️ Đã xóa config không còn dùng trong file: ${key}`);
      }
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
