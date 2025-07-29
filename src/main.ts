import "reflect-metadata";
import { KairoZLBot, MultiAccountBotManager } from "./configs/zalo.config";
import { initializeDatabase, closeDatabase } from "./configs/database.config";
import { DatabaseManager } from "./database/database.manager";
import { ListenerManager } from "./handlers/listener.manager";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { AppConfig } from "./configs/app.config";
import { Logger } from "./utils/logger.util";
import { Account } from "./database";
import { CACHEDIR } from "./common";
import { LoginQRCallbackEvent } from "zca-js";

dotenv.config();

async function startBot() {
  try {
    // Kiểm tra và tạo thư mục lưu trữ QR nếu chưa tồn tại
    const cacheDir = CACHEDIR
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
      Logger.info(`📁 Đã tạo thư mục cache: ${cacheDir}`);
    } else {
      Logger.info(
        `📁 Thư mục cache đã tồn tại: ${cacheDir}, tiến hành xóa tất cả file bên trong`
      );

      const files = fs.readdirSync(cacheDir);
      for (const file of files) {
        const filePath = path.join(cacheDir, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile()) {
          fs.unlinkSync(filePath);
          Logger.info(`🗑️ Đã xóa file: ${filePath}`);
        } else if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
          Logger.info(`🗑️ Đã xóa thư mục con: ${filePath}`);
        }
      }
    }

    //Khởi tạo database
    Logger.info("🗄️ Đang khởi tạo database connection...");
    const db: DatabaseManager = await initializeDatabase();

    if (db.isConnected) {
      Logger.info("✅ Database đã được khởi tạo thành công");
    } else {
      Logger.info("⚠️ Database chưa được cấu hình, sử dụng chế độ no-database");
    }

    // Khởi tạo AppConfig
    const botConfig = new AppConfig();
    await botConfig.initialize();
    Logger.info("✅ AppConfig đã được khởi tạo thành công");

    // Kiểu tra bộ nhớ đã dùng
    const logMemoryUsage = botConfig.getConfig("logMemoryUsage");
    if (logMemoryUsage?.enabled) {
      setInterval(() => {
        const used = process.memoryUsage();
        Logger.info("Memory Usage:");
        Logger.info(`  RSS       : ${(used.rss / 1024 / 1024).toFixed(2)} MB`);
        Logger.info(
          `  Heap Total: ${(used.heapTotal / 1024 / 1024).toFixed(2)} MB`
        );
        Logger.info(
          `  Heap Used : ${(used.heapUsed / 1024 / 1024).toFixed(2)} MB`
        );
        Logger.info(
          `  External  : ${(used.external / 1024 / 1024).toFixed(2)} MB`
        );
      }, logMemoryUsage?.interval || 60000); // Kiểm tra mỗi 10 giây
    } else {
      Logger.info("ℹ️ Tính năng logMemoryUsage đã bị tắt trong cấu hình.");
    }

    // Khởi tạo MultiAccountBotManager
    const botManager = new MultiAccountBotManager(db);
    const accounts = await db.account.getActiveAccounts();

    for (let account of accounts) {
      await createBot(account, botManager, cacheDir, db, botConfig);
    }
  } catch (error) {
    Logger.error("❌ Lỗi khởi động bot:", error);
    process.exit(1);
  }
}

export async function createBot(
  account: Partial<Account>,
  botManager: MultiAccountBotManager,
  cacheDir: string,
  db: DatabaseManager,
  botConfig: AppConfig,
  callback?: (event: LoginQRCallbackEvent) => void
) {
  let cookie: any;
  if (account.loginMethod === "cookie") {
    try {
      cookie = JSON.parse(account.cookie);
    } catch (error) {
      Logger.error(
        `❌ Lỗi khi kiểm tra cookie cho tài khoản ${account.accountId}, tiến hành bỏ qua:`,
        error
      );
      return;
    }
  }
  // Thêm bot mới
  await botManager.addBot({
    accountId: account.accountId,
    loginMethod: account.loginMethod as "cookie" | "qr",
    zaloConfig: account.zaloConfig && JSON.parse(account.zaloConfig),
    proxyConfig: account.proxyConfig && JSON.parse(account.proxyConfig),
    // Cookie login data
    cookie,
    imei: account.imei,
    userAgent: account.userAgent,
    // QR login data
    qrPath: cacheDir + `/qr_${account.accountId}.png`,
  }, callback);
  Logger.info(`🤖 Bot ${account.accountId} đã được thêm thành công.`);

  // Khởi tạo HandlerManager cho bot
  const bot = botManager.getBot(account.accountId);

  if (bot) {
    // Khởi tạo và thiết lập ListenerManager với database context
    const listenerManager = new ListenerManager(bot, db, botConfig, botManager);
    await listenerManager.initialize();

    Logger.info(
      `🔗 Bot context đã được tạo với database cho ${account.accountId}`
    );

    // Bắt đầu bot
    bot.start();

    Logger.info(`✅ Bot ${account.accountId} đã sẵn sàng.`);
  } else {
    Logger.error(`❌ Không tìm thấy bot với ID ${account.accountId}`);
  }
}

// Xử lý thoát ứng dụng
process.on("SIGINT", async () => {
  Logger.info("\n🛑 Đang thoát ứng dụng...");
  await closeDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  Logger.info("\n🛑 Đang thoát ứng dụng...");
  await closeDatabase();
  process.exit(0);
});

startBot();
