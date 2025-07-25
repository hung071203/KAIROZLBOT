import { Zalo, API } from "zca-js";
import { HttpProxyAgent } from "http-proxy-agent";
import nodefetch from "node-fetch";
import { config } from "dotenv";
import {
  LoginWithCookie,
  LoginWithQR,
  ZaloConfig,
  AccountConfig,
} from "../common";

config();

export class KairoZLBot {
  private zalo: Zalo;
  private api!: API; // Sẽ được khởi tạo khi đăng nhập
  private accountId: string;

  constructor(
    config: ZaloConfig = {},
    accountId: string = "default",
    proxyConfig?: {
      enabled: boolean;
      url: string; // Format: "http(s)://user:pass@host:port"
    }
  ) {
    this.accountId = accountId;

    // Cấu hình proxy nếu có
    const zaloConfig: any = {
      selfListen: config.selfListen || false,
      checkUpdate: config.checkUpdate || true,
      logging: config.logging || true,
    };

    if (proxyConfig?.enabled && proxyConfig.url) {
      try {
        zaloConfig.agent = new HttpProxyAgent(proxyConfig.url);
        // @ts-ignore
        zaloConfig.polyfill = nodefetch;
        console.log(
          `🌐 [${this.accountId}] Sử dụng proxy: ${proxyConfig.url.replace(
            /\/\/.*:.*@/,
            "//***:***@"
          )}`
        );
      } catch (error) {
        console.error(`❌ [${this.accountId}] Lỗi cấu hình proxy:`, error);
      }
    }

    // Override config nếu có agent và polyfill từ config truyền vào
    if (config.agent) zaloConfig.agent = config.agent;
    if (config.polyfill) zaloConfig.polyfill = config.polyfill;

    this.zalo = new Zalo(zaloConfig);
  }

  /**
   * Đăng nhập bằng Cookie
   * Cần chuẩn bị trước:
   * 1. Lấy IMEI từ localStorage: localStorage.getItem('z_uuid') hoặc localStorage.getItem('sh_z_uuid')
   * 2. Lấy UserAgent: navigator.userAgent
   * 3. Lưu cookie vào file cookie.json
   */
  async loginWithCookie(loginData: LoginWithCookie) {
    try {
      console.log(`🔐 [${this.accountId}] Đang đăng nhập bằng Cookie...`);

      this.api = await this.zalo.login({
        cookie: loginData.cookie,
        imei: loginData.imei,
        userAgent: loginData.userAgent,
      });

      this.accountId = this.api.getOwnId();

      console.log(`✅ [${this.accountId}] Đăng nhập thành công bằng Cookie!`);
      return this.api;
    } catch (error) {
      console.error(`❌ [${this.accountId}] Lỗi đăng nhập bằng Cookie:`, error);
      throw error;
    }
  }

  /**
   * Đăng nhập bằng QR Code
   * Đơn giản hơn, chỉ cần scan QR code
   */
  async loginWithQR(options: LoginWithQR = {}) {
    try {
      console.log(`📱 [${this.accountId}] Đang tạo QR Code để đăng nhập...`);

      this.api = await this.zalo.loginQR(
        {
          userAgent: options.userAgent || "",
          qrPath: options.qrPath || `./qr_${this.accountId}.png`,
        },
        (qrPath) => {
          console.log(
            `📱 [${this.accountId}] Quét mã QR tại ${qrPath} để đăng nhập`
          );
        }
      );

      this.accountId = this.api.getOwnId();

      console.log(`✅ [${this.accountId}] Đăng nhập thành công bằng QR Code!`);
      return this.api;
    } catch (error) {
      console.error(
        `❌ [${this.accountId}] Lỗi đăng nhập bằng QR Code:`,
        error
      );
      throw error;
    }
  }

  /**
   * Tự động chọn phương thức đăng nhập từ cấu hình account
   */
  async autoLoginFromConfig(accountConfig: AccountConfig) {
    try {
      if (accountConfig.loginMethod === "cookie") {
        if (
          !accountConfig.cookie ||
          !accountConfig.imei ||
          !accountConfig.userAgent
        ) {
          throw new Error(
            `[${this.accountId}] Thiếu thông tin cookie/imei/userAgent`
          );
        }

        await this.loginWithCookie({
          cookie: accountConfig.cookie,
          imei: accountConfig.imei,
          userAgent: accountConfig.userAgent,
        });
      } else {
        await this.loginWithQR({
          userAgent: accountConfig.userAgent || "",
          qrPath: accountConfig.qrPath || `./qr_${accountConfig.id}.png`,
        });
      }

      this.accountId = this.api.getOwnId();

      return this.api;
    } catch (error) {
      console.error(`❌ [${this.accountId}] Lỗi đăng nhập tự động:`, error);
      throw error;
    }
  }

  /**
   * Bắt đầu lắng nghe
   */
  start() {
    if (!this.api) {
      throw new Error("Chưa đăng nhập! Hãy gọi phương thức login trước.");
    }

    this.api.listener.start();
    console.log(`🚀 [${this.accountId}] Bot đã bắt đầu hoạt động!`);
  }

  /**
   * Dừng bot
   */
  stop() {
    if (this.api && this.api.listener) {
      this.api.listener.stop();
      console.log(`⏹️ [${this.accountId}] Bot đã dừng hoạt động!`);
    }
  }

  /**
   * Lấy API instance
   */
  getAPI(): API {
    if (!this.api) {
      throw new Error("Chưa đăng nhập!");
    }
    return this.api;
  }

  /**
   * Thiết lập các listener cho bot
   */
  setupListeners() {
    if (!this.api) {
      throw new Error("Chưa đăng nhập! Hãy gọi phương thức login trước.");
    }

    const { listener } = this.api;

    // Lắng nghe tin nhắn
    listener.on("message", async (msg: any) => {
      try {
        console.log(`📩 [${this.accountId}] Nhận tin nhắn:`, {
          threadId: msg.threadId,
          type: msg.type,
          content: msg.data.content,
        });

        // Xử lý tin nhắn ở đây
        await this.handleMessage(msg);
      } catch (error) {
        console.error(`❌ [${this.accountId}] Lỗi xử lý tin nhắn:`, error);
      }
    });

    // Lắng nghe sự kiện reaction
    listener.on("reaction", (reaction: any) => {
      console.log(`👍 [${this.accountId}] Nhận reaction:`, reaction);
      // Xử lý reaction ở đây
    });

    // Lắng nghe sự kiện nhóm
    listener.on("group_event", (event: any) => {
      console.log(`👥 [${this.accountId}] Sự kiện nhóm:`, event);
      // Xử lý sự kiện nhóm ở đây
    });

    // Lắng nghe sự kiện undo
    listener.on("undo", (undoEvent: any) => {
      console.log(`↩️ [${this.accountId}] Tin nhắn bị thu hồi:`, undoEvent);
      // Xử lý thu hồi tin nhắn ở đây
    });

    console.log(`🎧 [${this.accountId}] Đã thiết lập các listener`);
  }

  /**
   * Xử lý tin nhắn
   */
  private async handleMessage(msg: any) {
    // Ví dụ: Bot echo (nhại lại tin nhắn)
    if (typeof msg.data.content === "string") {
      // Tránh loop vô hạn bằng cách không phản hồi tin nhắn của chính bot
      if (msg.isSelf) return;

      // Gửi lại tin nhắn với ID tài khoản
      await this.api.sendMessage(
        `[${this.accountId}] Echo: ${msg.data.content}`,
        msg.threadId,
        msg.type
      );
    }
  }
}

// Multi-account bot manager
export class MultiAccountBotManager {
  private bots: Map<string, KairoZLBot> = new Map();

  /**
   * Thêm bot mới
   */
  async addBot(config: {
    accountId: string;
    loginMethod: "cookie" | "qr";
    zaloConfig?: ZaloConfig;
    proxyConfig?: {
      enabled: boolean;
      url: string;
    };
    // Cookie login data
    cookie?: any;
    imei?: string;
    userAgent?: string;
    // QR login data
    qrPath?: string;
  }) {
    if (this.bots.has(config.accountId)) {
      throw new Error(`Bot với ID ${config.accountId} đã tồn tại`);
    }

    console.log(`🤖 Khởi tạo bot ${config.accountId}...`);

    const bot = new KairoZLBot(
      config.zaloConfig || {},
      config.accountId,
      config.proxyConfig
    );

    // Đăng nhập theo phương thức được chọn
    if (config.loginMethod === "cookie") {
      if (!config.cookie || !config.imei || !config.userAgent) {
        throw new Error(
          `Bot ${config.accountId}: Thiếu thông tin cookie/imei/userAgent`
        );
      }

      await bot.loginWithCookie({
        cookie: config.cookie,
        imei: config.imei,
        userAgent: config.userAgent,
      });
    } else {
      await bot.loginWithQR({
        userAgent: config.userAgent || "",
        qrPath: config.qrPath || `./qr_${config.accountId}.png`,
      });
    }

    // Thiết lập listeners
    bot.setupListeners();

    // Bắt đầu bot
    bot.start();

    this.bots.set(config.accountId, bot);
    console.log(`✅ Bot ${config.accountId} đã sẵn sàng`);

    return bot;
  }

  /**
   * Lấy bot theo ID
   */
  getBot(accountId: string): KairoZLBot | undefined {
    return this.bots.get(accountId);
  }

  /**
   * Lấy tất cả bot
   */
  getAllBots(): KairoZLBot[] {
    return Array.from(this.bots.values());
  }

  /**
   * Xóa bot
   */
  removeBot(accountId: string) {
    const bot = this.bots.get(accountId);
    if (bot) {
      bot.stop();
      this.bots.delete(accountId);
      console.log(`✅ Đã xóa bot ${accountId}`);
    }
  }

  /**
   * Dừng tất cả bot
   */
  stopAllBots() {
    console.log("🛑 Đang dừng tất cả bot...");

    for (const [id, bot] of this.bots) {
      try {
        bot.stop();
      } catch (error) {
        console.error(`❌ Lỗi dừng bot ${id}:`, error);
      }
    }

    this.bots.clear();
    console.log("✅ Đã dừng tất cả bot");
  }

  /**
   * Lấy số lượng bot đang hoạt động
   */
  getBotCount(): number {
    return this.bots.size;
  }
}
