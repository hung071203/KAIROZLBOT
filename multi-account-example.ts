import { MultiAccountBotManager } from "./src/configs";

// Ví dụ sử dụng nhiều tài khoản với các phương thức đăng nhập khác nhau
async function multiAccountExample() {
  const botManager = new MultiAccountBotManager();

  try {
    // Bot 1: Đăng nhập bằng Cookie (không proxy)
    await botManager.addBot({
      accountId: "bot_cookie",
      loginMethod: "cookie",
      cookie: require("./cookie_bot1.json"), // Load cookie từ file
      imei: "your_imei_1",
      userAgent: "your_user_agent_1",
      zaloConfig: {
        selfListen: false,
        logging: true
      }
    });

    // Bot 2: Đăng nhập bằng QR (có proxy)
    await botManager.addBot({
      accountId: "bot_qr_proxy",
      loginMethod: "qr",
      qrPath: "./qr_bot2.png",
      proxyConfig: {
        enabled: true,
        url: "http://username:password@proxy-server.com:8080"
      },
      zaloConfig: {
        selfListen: false,
        logging: true
      }
    });

    // Bot 3: Đăng nhập bằng Cookie + Proxy
    await botManager.addBot({
      accountId: "bot_cookie_proxy",
      loginMethod: "cookie",
      cookie: require("./cookie_bot3.json"),
      imei: "your_imei_3",
      userAgent: "your_user_agent_3",
      proxyConfig: {
        enabled: true,
        url: "socks5://username:password@socks-proxy.com:1080"
      },
      zaloConfig: {
        selfListen: false,
        logging: true
      }
    });

    console.log(`🎉 Đã khởi tạo ${botManager.getBotCount()} bot thành công!`);

    // Xử lý tắt bot gracefully
    process.on('SIGINT', () => {
      console.log("\n🛑 Đang tắt tất cả bot...");
      botManager.stopAllBots();
      process.exit(0);
    });

    // Giữ chương trình chạy
    console.log("🚀 Tất cả bot đang hoạt động...");
    
  } catch (error) {
    console.error("❌ Lỗi khởi tạo bot:", error);
    process.exit(1);
  }
}

// Chạy ví dụ
if (require.main === module) {
  multiAccountExample();
}

export { multiAccountExample };
