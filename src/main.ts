import { KairoZLBot, MultiAccountBotManager } from "./configs/zalo.config";
import { HandlerManager } from "./handlers/handler.manager";
import botConfig from "./configs/config.json";
import * as dotenv from "dotenv";

dotenv.config();

async function startBot() {
  try {
    // Khởi tạo MultiAccountBotManager
    const botManager = new MultiAccountBotManager();

    botConfig.accounts.forEach(async (account) => {
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
        qrPath: `./common/assets/login/qr_${account.accountId}.png`,
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
        listener.on("reaction", (reaction: any) => {
         
        });

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
    });
  } catch (error) {
    console.error("❌ Lỗi khởi động bot:", error);
    process.exit(1);
  }
}

startBot();
