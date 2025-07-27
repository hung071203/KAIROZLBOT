import { DataSource } from "typeorm";
import { join } from "path";
import { DatabaseManager } from "../database/database.manager";
import { Logger } from "../utils/logger.util";

// Cấu hình TypeORM với SQLite
export const appDataSource = new DataSource({
  type: "sqlite",
  database: join(process.cwd(), "src", "database", "bot.sqlite"), // File database sẽ được tạo trong thư mục database/
  synchronize: true, // Tự động đồng bộ schema (chỉ dùng trong development)
  logging: false, // Bật logging để debug (có thể set thành true khi cần)
  entities: [
    join(__dirname, "../database/entities/*.{ts,js}"), // Đường dẫn đến các entity
  ],
});

// Database Manager instance
let databaseManager: DatabaseManager | null = null;

// Khởi tạo kết nối database và trả về DatabaseManager
export const initializeDatabase = async (): Promise<DatabaseManager> => {
  try {
    if (!appDataSource.isInitialized) {
      await appDataSource.initialize();
      Logger.info("✅ Database connection established successfully");
    }
    
    // Khởi tạo DatabaseManager nếu chưa có
    if (!databaseManager) {
      databaseManager = new DatabaseManager(appDataSource);
    }
    
    return databaseManager;
  } catch (error) {
    Logger.error("❌ Error during database initialization:", error);
    process.exit(1);
  }
};

// Lấy DatabaseManager instance
export const getDatabaseManager = (): DatabaseManager | null => {
  return databaseManager;
};

// Đóng kết nối database
export const closeDatabase = async (): Promise<void> => {
  try {
    if (databaseManager) {
      await databaseManager.close();
      databaseManager = null;
      Logger.info("✅ Database connection closed successfully");
    }
  } catch (error) {
    Logger.error("❌ Error closing database connection:", error);
  }
};

export default appDataSource;
