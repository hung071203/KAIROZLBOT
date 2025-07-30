import { BaseService } from "./base-service";
import { Account } from "../entities/Account";
import { ZaloConfig } from "../../common/types";
import { RoleBotEnum } from "../../common";
import { parseDate } from "../../common/helpers/app.helper";

export class AccountService extends BaseService<Account> {
  constructor() {
    super(Account);
  }

  // Tạo hoặc cập nhật account
  async createOrUpdateAccount(accountData: {
    accountId: string;
    loginMethod: "cookie" | "qr";
    zaloConfig?: any;
    proxyConfig?: {
      enabled: boolean;
      url: string;
    };
    cookie?: any;
    imei?: string;
    userAgent?: string;
    role?: RoleBotEnum;
    expirationDate?: Date;
    isActive?: boolean;
  }): Promise<Account> {
    let account = await this.findOne({ accountId: accountData.accountId });

    if (account) {
      // Cập nhật account đã tồn tại
      account.loginMethod = accountData.loginMethod;
      account.zaloConfig = accountData.zaloConfig
        ? JSON.stringify(accountData.zaloConfig)
        : null;
      account.proxyConfig = accountData.proxyConfig
        ? JSON.stringify(accountData.proxyConfig)
        : null;
      account.cookie = accountData.cookie
        ? JSON.stringify(accountData.cookie)
        : null;
      account.imei = accountData.imei || null;
      account.userAgent = accountData.userAgent || null;
      account.isActive =
        accountData.isActive !== undefined ? accountData.isActive : true;
      account.role = accountData.role || RoleBotEnum.FREE;
      account.expirationDate = parseDate(accountData.expirationDate);

      return await this.save(account);
    } else {
      // Tạo account mới
      return await this.create({
        accountId: accountData.accountId,
        loginMethod: accountData.loginMethod,
        zaloConfig: accountData.zaloConfig
          ? JSON.stringify(accountData.zaloConfig)
          : null,
        proxyConfig: accountData.proxyConfig
          ? JSON.stringify(accountData.proxyConfig)
          : null,
        cookie: accountData.cookie ? JSON.stringify(accountData.cookie) : null,
        imei: accountData.imei || null,
        userAgent: accountData.userAgent || null,
        role: accountData.role || RoleBotEnum.FREE,
        expirationDate: parseDate(accountData.expirationDate),
        isActive: true,
      });
    }
  }

  // Lấy account theo accountId
  async getAccountById(accountId: string): Promise<Account | null> {
    return await this.findOne({ accountId });
  }

  // Lấy tất cả accounts đang hoạt động
  async getActiveAccounts(): Promise<Account[]> {
    return await this.find({ where: { isActive: true } });
  }

  // Lấy accounts theo phương thức đăng nhập
  async getAccountsByLoginMethod(
    loginMethod: "cookie" | "qr"
  ): Promise<Account[]> {
    return await this.find({ where: { loginMethod } });
  }

  // Parse JSON data từ account
  parseAccountData(account: Account): {
    accountId: string;
    loginMethod: "cookie" | "qr";
    zaloConfig?: any;
    proxyConfig?: {
      enabled: boolean;
      url: string;
    };
    cookie?: any;
    imei?: string;
    userAgent?: string;
    qrPath?: string;
  } {
    return {
      accountId: account.accountId,
      loginMethod: account.loginMethod,
      zaloConfig: account.zaloConfig
        ? JSON.parse(account.zaloConfig)
        : undefined,
      proxyConfig: account.proxyConfig
        ? JSON.parse(account.proxyConfig)
        : undefined,
      cookie: account.cookie ? JSON.parse(account.cookie) : undefined,
      imei: account.imei || undefined,
      userAgent: account.userAgent || undefined,
    };
  }

  // Vô hiệu hóa account
  async deactivateAccount(accountId: string): Promise<void> {
    await this.update({ accountId }, { isActive: false });
  }

  // Kích hoạt account
  async activateAccount(accountId: string): Promise<void> {
    await this.update({ accountId }, { isActive: true });
  }

  // Xóa account
  async deleteAccount(accountId: string): Promise<void> {
    await this.delete({ accountId });
  }

  // Đếm accounts đang hoạt động
  async countActiveAccounts(): Promise<number> {
    return await this.count({ isActive: true });
  }
}
