import { BaseService } from "./base-service";
import { Config } from "../entities/Config";

export class ConfigService extends BaseService<Config> {
  constructor() {
    super(Config);
  }

  // Lấy giá trị cấu hình theo key
  async getConfig(key: string): Promise<string | null> {
    const config = await this.findOne({ key });
    return config ? config.value : null;
  }

  // Lấy giá trị cấu hình theo key với giá trị mặc định
  async getConfigWithDefault(key: string, defaultValue: string): Promise<string> {
    const value = await this.getConfig(key);
    return value !== null ? value : defaultValue;
  }

  // Đặt giá trị cấu hình
  async setConfig(key: string, value: string): Promise<Config> {
    let config = await this.findOne({ key });
    
    if (config) {
      // Cập nhật nếu đã tồn tại
      config.value = value;
      return await this.save(config);
    } else {
      // Tạo mới nếu chưa tồn tại
      return await this.create({ key, value });
    }
  }

  // Xóa cấu hình
  async deleteConfig(key: string): Promise<void> {
    await this.delete({ key });
  }

  // Lấy tất cả cấu hình
  async getAllConfigs(): Promise<{ [key: string]: string }> {
    const configs = await this.findAll();
    const result: { [key: string]: string } = {};
    
    configs.forEach(config => {
      result[config.key] = config.value;
    });
    
    return result;
  }

  // Lấy cấu hình dạng JSON
  async getJsonConfig<T>(key: string, defaultValue?: T): Promise<T | null> {
    const value = await this.getConfig(key);
    if (value === null) {
      return defaultValue || null;
    }
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error parsing JSON config for key ${key}:`, error);
      return defaultValue || null;
    }
  }

  // Đặt cấu hình dạng JSON
  async setJsonConfig(key: string, value: any): Promise<Config> {
    const jsonString = JSON.stringify(value);
    return await this.setConfig(key, jsonString);
  }
}
