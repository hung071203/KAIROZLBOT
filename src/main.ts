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

dotenv.config();

async function startBot() {
  Logger.info("🚀 Bắt đầu khởi động bot...");
  try {
    // Kiểm tra và tạo thư mục lưu trữ QR nếu chưa tồn tại
    const cacheDir = path.join(
      process.cwd(),
      "src",
      "common",
      "assets",
      "cache"
    );
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
      console.log(`📁 Đã tạo thư mục cache: ${cacheDir}`);
    } else {
      console.log(
        `📁 Thư mục cache đã tồn tại: ${cacheDir}, tiến hành xóa tất cả file bên trong`
      );

      const files = fs.readdirSync(cacheDir);
      for (const file of files) {
        const filePath = path.join(cacheDir, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile()) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Đã xóa file: ${filePath}`);
        } else if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
          console.log(`🗑️ Đã xóa thư mục con: ${filePath}`);
        }
      }
    }

    //Khởi tạo database
    console.log("🗄️ Đang khởi tạo database connection...");
    const db: DatabaseManager = await initializeDatabase();

    if (db.isConnected) {
      console.log("✅ Database đã được khởi tạo thành công");
    } else {
      console.log("⚠️ Database chưa được cấu hình, sử dụng chế độ no-database");
    }

    // Khởi tạo AppConfig
    const botConfig = new AppConfig(db);
    await botConfig.initialize();
    console.log("✅ AppConfig đã được khởi tạo thành công");
    // Lấy tất cả cấu hình từ AppConfig
    const allConfigs = await botConfig.getAllConfigs();
    console.log("📄 Đã lấy tất cả cấu hình:", allConfigs);

    // Khởi tạo MultiAccountBotManager
    const botManager = new MultiAccountBotManager(db);

    const accounts = await db.account.getActiveAccounts();

    for (let account of accounts) {
      let cookie: any
      if (account.loginMethod === "cookie") {
        try {
          cookie = JSON.parse(account.cookie);
        } catch (error) {
          console.error(
            `❌ Lỗi khi kiểm tra cookie cho tài khoản ${account.accountId}, tiến hành bỏ qua:`,
            error
          );
          continue;
        }
      }

      // Thêm bot mới
      await botManager.addBot({
        accountId: account.accountId,
        loginMethod: account.loginMethod as "cookie" | "qr",
        zaloConfig: JSON.parse(account.zaloConfig || undefined),
        proxyConfig: JSON.parse(account.proxyConfig || undefined),
        // Cookie login data
        cookie,
        imei: account.imei,
        userAgent: account.userAgent,
        // QR login data
        qrPath: cacheDir + `/qr_${account.accountId}.png`,
      });
      console.log(`🤖 Bot ${account.accountId} đã được thêm thành công.`);

      // Khởi tạo HandlerManager cho bot
      const bot = botManager.getBot(account.accountId);

      if (bot) {
        // Khởi tạo và thiết lập ListenerManager với database context
        const listenerManager = new ListenerManager(bot, db, allConfigs);
        await listenerManager.initialize();

        console.log(
          `🔗 Bot context đã được tạo với database cho ${account.accountId}`
        );

        // Bắt đầu bot
        bot.start();

        console.log(`✅ Bot ${account.accountId} đã sẵn sàng.`);
      } else {
        console.error(`❌ Không tìm thấy bot với ID ${account.accountId}`);
      }
    }
  } catch (error) {
    console.error("❌ Lỗi khởi động bot:", error);
    process.exit(1);
  }
}

// Xử lý thoát ứng dụng
process.on("SIGINT", async () => {
  console.log("\n🛑 Đang thoát ứng dụng...");
  await closeDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Đang thoát ứng dụng...");
  await closeDatabase();
  process.exit(0);
});

startBot();
