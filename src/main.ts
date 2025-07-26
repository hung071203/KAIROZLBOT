import { KairoZLBot, MultiAccountBotManager } from "./configs/zalo.config";
import { HandlerManager } from "./handlers/handler.manager";
import botConfig from "./configs/config.json";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

async function startBot() {
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

    // Khởi tạo MultiAccountBotManager
    const botManager = new MultiAccountBotManager();

    for (let account of botConfig.accounts) {
      if (account.qrPath.includes("/") || account.qrPath.includes("\\")) {
        console.error(
          `❌ Ảnh QR không được chứa đường dẫn: ${account.qrPath}, ${account.accountId}`
        );
        return;
      }

      // Thêm bot mới
      await botManager.addBot({
        accountId: account.accountId,
        loginMethod: account.loginMethod as "cookie" | "qr",
        zaloConfig: account?.zaloConfig,
        proxyConfig: account?.proxyConfig,
        // Cookie login data
        cookie: account.cookie,
        imei: account.imei,
        userAgent: account.userAgent,
        // QR login data
        qrPath: cacheDir + `/qr_${account.accountId}.png`,
      });
      console.log(`🤖 Bot ${account.accountId} đã được thêm thành công.`);

      // Khởi tạo HandlerManager cho bot
      const bot = botManager.getBot(account.accountId);

      console.log(`🔍 Lấy ID chuẩn với ID: ${account.accountId}`);
      account.accountId = bot?.getAccountId() as string;
      console.log(`✅ ID chuẩn: ${account.accountId}`);

      if (bot) {
        const handlerManager = new HandlerManager();
        await handlerManager.loadHandlers();
        await handlerManager.loadEvents();

        // Thiết lập các listener cho bot
        const api = bot.getAPI();

        const { listener } = api;

        // Lắng nghe tin nhắn
        listener.on("message", async (msg: any) => {
          console.log(`📩 Tin nhắn mới `, msg);
        });

        // Lắng nghe sự kiện reaction
        listener.on("reaction", (reaction: any) => {});

        // Lắng nghe sự kiện nhóm
        listener.on("group_event", (event: any) => {
          // Xử lý sự kiện nhóm ở đây
        });

        // Lắng nghe sự kiện undo
        listener.on("undo", (undoEvent: any) => {
          // Xử lý thu hồi tin nhắn ở đây
        });

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

startBot();
