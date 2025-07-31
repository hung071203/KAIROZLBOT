import {
  Zalo,
  API,
  LoginQRCallbackEvent,
  LoginQRCallbackEventType,
} from "zca-js";
import { HttpProxyAgent } from "http-proxy-agent";
import nodefetch from "node-fetch";
import { config } from "dotenv";
import {
  LoginWithCookie,
  LoginWithQR,
  ZaloConfig,
  AccountConfig,
} from "../common/types";
import { safeBase64 } from "../utils/download.util";
import { DatabaseManager } from "../database";
import { Logger } from "../utils/logger.util";

config();

export class KairoZLBot {
  private zalo: Zalo;
  private api!: API; // Sẽ được khởi tạo khi đăng nhập
  private accountId: string;
  private db: DatabaseManager;

  constructor(
    db: DatabaseManager,
    config: ZaloConfig = {},
    accountId: string = "default",
    proxyConfig?: {
      enabled: boolean;
      url: string; // Format: "http(s)://user:pass@host:port"
    }
  ) {
    this.accountId = accountId;
    this.db = db;

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
        Logger.info(
          `🌐 [${this.accountId}] Sử dụng proxy: ${proxyConfig.url.replace(
            /\/\/.*:.*@/,
            "//***:***@"
          )}`
        );
      } catch (error) {
        Logger.error(
          `❌ [${this.accountId}] Lỗi cấu hình proxy, tiến hành đăng nhập không dùng proxy:`,
          error
        );
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
      Logger.info(`🔐 [${this.accountId}] Đang đăng nhập bằng Cookie...`);

      this.api = await this.zalo.login({
        cookie: loginData.cookie,
        imei: loginData.imei,
        userAgent: loginData.userAgent,
      });

      const realAccId = this.api.getOwnId();
      if (realAccId && realAccId !== this.accountId) {
        Logger.info(
          `Cập nhật ID tài khoản từ ${this.accountId} thành ${realAccId}`
        );

        await this.db.account.update(
          { accountId: this.accountId },
          { accountId: realAccId }
        );
        this.accountId = realAccId;
      }

      Logger.info(`✅ [${this.accountId}] Đăng nhập thành công bằng Cookie!`);
      return this.api;
    } catch (error) {
      Logger.error(`❌ [${this.accountId}] Lỗi đăng nhập bằng Cookie:`, error);
      throw error;
    }
  }

  /**
   * Đăng nhập bằng QR Code
   * Đơn giản hơn, chỉ cần scan QR code
   */
  /**
   * Đăng nhập bằng QR Code (callback để xử lý từng trạng thái)
   * @param options
   * @param callback Callback nhận event QR code (QRCodeGenerated, Scanned, Success, ...)
   */
  async loginWithQR(
    options: LoginWithQR = {},
    callback?: (event: LoginQRCallbackEvent) => void
  ) {
    try {
      Logger.info(`📱 [${this.accountId}] Đang tạo QR Code để đăng nhập...`);

      this.api = await this.zalo.loginQR(
        {
          userAgent: options.userAgent || "",
          qrPath: options.qrPath || `./qr_${this.accountId}.png`,
        },
        (event: LoginQRCallbackEvent) => {
          if (callback) {
            callback(event);
            return;
          }
          // Nếu không có callback, xử lý mặc định như cũ
          if (event?.type == LoginQRCallbackEventType.QRCodeGenerated) {
            safeBase64(
              options.qrPath,
              `data:image/png;base64,${event.data["image"]}`
            );
          } else if (event?.type == LoginQRCallbackEventType.QRCodeScanned) {
            Logger.info(
              `${event.data["display_name"]} đã quét QR Code, đang đợi xác nhận...`
            );
          } else if (event?.type == 4) {
            Logger.info(`Đăng nhập thành công, đang lưu dữ liệu vào db...`);
            this.db.account.update(
              { accountId: this.accountId },
              {
                cookie: JSON.stringify(event.data["cookie"]),
                imei: event.data["imei"],
                userAgent: event.data["userAgent"],
                loginMethod: "cookie",
              }
            );
          } else if (event?.type == LoginQRCallbackEventType.QRCodeExpired) {
            Logger.warn(`QR Code đã hết hạn, hãy quét lại để đăng nhập tiếp!`);
          }
        }
      );
      const realAccId = this.api.getOwnId();
      if (realAccId && realAccId !== this.accountId) {
        Logger.info(
          `Cập nhật ID tài khoản từ ${this.accountId} thành ${realAccId}`
        );
        await this.db.account.update(
          { accountId: this.accountId },
          { accountId: realAccId }
        );
        this.accountId = realAccId;
      }

      Logger.info(`✅ [${this.accountId}] Đăng nhập thành công bằng QR Code!`);
      return this.api;
    } catch (error) {
      Logger.error(`❌ [${this.accountId}] Lỗi đăng nhập bằng QR Code:`, error);
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
      Logger.error(`❌ [${this.accountId}] Lỗi đăng nhập tự động:`, error);
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
    Logger.info(`🚀 [${this.accountId}] Bot đã bắt đầu lắng nghe!`);
  }

  /**
   * Dừng bot
   */
  stop() {
    if (this.api && this.api.listener) {
      this.api.listener.stop();
      Logger.info(`⏹️ [${this.accountId}] Bot đã dừng lắng nghe!`);
    }
  }

  getAccountId(): string {
    return this.accountId;
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
}

// Multi-account bot manager
export class MultiAccountBotManager {
  private bots: Map<string, KairoZLBot> = new Map();
  private db: DatabaseManager;

  constructor(databaseManager: DatabaseManager) {
    this.db = databaseManager;
  }
  /**
   * Thêm bot mới
   */
  async addBot(
    config: {
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
    },
    callback?: (event: LoginQRCallbackEvent) => void
  ) {
    if (this.bots.has(config.accountId)) {
      throw new Error(`Bot với ID ${config.accountId} đã tồn tại`);
    }

    Logger.info(`🤖 Khởi tạo bot ${config.accountId}...`);

    const bot = new KairoZLBot(
      this.db,
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
      await bot.loginWithQR(
        {
          userAgent: config.userAgent || "",
          qrPath: config.qrPath || `./qr_${config.accountId}.png`,
        },
        callback
      );
    }

    this.bots.set(config.accountId, bot);

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
    if (!bot) throw new Error(`Không tìm thấy bot với ID ${accountId}`);

    bot.stop();
    this.bots.delete(accountId);
    Logger.info(`✅ Đã xóa bot ${accountId}`);
  }

  removeAllBots() {
    Logger.info("🗑️ Đang xóa tất cả bot...");
    for (const [id, bot] of this.bots) {
      try {
        this.removeBot(id);
      } catch (error) {
        Logger.error(`❌ Lỗi dừng bot ${id}:`, error);
      }
    }
  }

  /**
   * Dừng tất cả bot
   */
  stopAllBots() {
    Logger.info("🛑 Đang dừng tất cả bot...");

    for (const [id, bot] of this.bots) {
      try {
        bot.stop();
      } catch (error) {
        Logger.error(`❌ Lỗi dừng bot ${id}:`, error);
      }
    }

    this.bots.clear();
    Logger.info("✅ Đã dừng tất cả bot");
  }

  /**
   * Lấy số lượng bot đang hoạt động
   */
  getBotCount(): number {
    return this.bots.size;
  }
}
