import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { AccountService } from './database/services/account-service';
import { initializeDatabase } from './configs/database.config';
import { DatabaseManager } from './database';

interface AccountData {
  accountId: string;
  loginMethod: "cookie" | "qr";
  qrPath?: string;
  zaloConfig?: {
    selfListen?: boolean;
    checkUpdate?: boolean;
    logging?: boolean;
  };
  proxyConfig?: {
    enabled: boolean;
    url: string;
  };
  cookie?: any[];
  imei?: string;
  userAgent?: string;
  isActive?: boolean;
}

class AccountCLI {
  private rl: readline.Interface;
  private accountService: AccountService;
  private accountsFilePath: string;
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.db = db;
    this.accountService = this.db.account;
    this.accountsFilePath = path.join(process.cwd(), "src", 'configs', 'account.json');
  }

  // Đọc dữ liệu từ file account.json
  private readAccountsFromFile(): AccountData[] {
    try {
      if (fs.existsSync(this.accountsFilePath)) {
        const data = fs.readFileSync(this.accountsFilePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ Lỗi khi đọc file account.json:', error);
    }
    return [];
  }

  // Ghi dữ liệu vào file account.json
  private writeAccountsToFile(accounts: AccountData[]): void {
    try {
      const dir = path.dirname(this.accountsFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.accountsFilePath, JSON.stringify(accounts, null, 2), 'utf8');
    } catch (error) {
      console.error('❌ Lỗi khi ghi file account.json:', error);
    }
  }

  // Hiển thị menu chính
  private showMenu(): void {
    console.log('\n=== QUẢN LÝ TÀI KHOẢN ZALO BOT ===');
    console.log('1. Tạo file mẫu'); 
    console.log('2. Xem tất cả tài khoản'); 
    console.log('3. Thêm/Cập nhật tài khoản');
    console.log('4. Xóa tài khoản');
    console.log('5. Bật/Tắt tài khoản');
    console.log('6. Đồng bộ file → database');
    console.log('7. Đồng bộ database → file');
    console.log('0. Thoát');
    console.log('================================');
  }

  // Nhập dữ liệu từ người dùng
  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  // Tạo file mẫu
  async createSampleFile(): Promise<void> {
    console.log('\n=== TẠO FILE MẪU ===');
    
    const sampleAccounts: AccountData[] = [
      {
        accountId: "bot_sample_01",
        loginMethod: "cookie",
        qrPath: "qr_bot_sample_01.png",
        isActive: true,
        zaloConfig: {
          selfListen: true,
          checkUpdate: false,
          logging: false
        },
        proxyConfig: {
          enabled: false,
          url: "http://proxy.example.com:8080"
        },
        cookie: [],
        imei: "sample-imei-device-id",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
      },
      {
        accountId: "bot_sample_02",
        loginMethod: "qr",
        qrPath: "qr_bot_sample_02.png",
        isActive: false,
        zaloConfig: {
          selfListen: false,
          checkUpdate: true,
          logging: true
        },
        proxyConfig: {
          enabled: true,
          url: "http://another-proxy.example.com:3128"
        },
        imei: "sample-imei-device-id-2",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
      }
    ];

    // Kiểm tra file đã tồn tại
    if (fs.existsSync(this.accountsFilePath)) {
      const confirm = await this.question('File account.json đã tồn tại. Bạn có muốn ghi đè? (y/n): ');
      if (confirm.toLowerCase() !== 'y') {
        console.log('❌ Hủy tạo file mẫu.');
        return;
      }
    }

    try {
      this.writeAccountsToFile(sampleAccounts);
      console.log('✅ Tạo file mẫu thành công!');
      console.log(`📁 File được tạo tại: ${this.accountsFilePath}`);
      console.log('📋 File chứa 2 tài khoản mẫu:');
      console.log('   • bot_sample_01 (cookie, active)');
      console.log('   • bot_sample_02 (qr, inactive)');
      console.log('💡 Bạn có thể chỉnh sửa file này hoặc sử dụng các chức năng khác trong menu.');
    } catch (error) {
      console.error('❌ Lỗi khi tạo file mẫu:', error);
    }
  }

  // Xem tất cả tài khoản (mặc định từ database và lưu vào file)
  async showAllAccounts(): Promise<void> {
    try {
      console.log('\n=== XEM TẤT CẢ TÀI KHOẢN ===');
      console.log('🔄 Đang lấy dữ liệu từ database...');
      
      // Lấy tất cả tài khoản từ database
      const dbAccounts = await this.accountService.find();
      
      if (dbAccounts.length === 0) {
        console.log('📋 Không có tài khoản nào trong database.');
        console.log('💡 Bạn có thể tạo file mẫu (chọn 1) hoặc thêm tài khoản mới (chọn 3).');
        return;
      }

      // Chuyển đổi từ database entities sang AccountData format và lưu vào file
      const accountsData: AccountData[] = dbAccounts.map(account => {
        const accountData: AccountData = {
          accountId: account.accountId,
          loginMethod: account.loginMethod,
          isActive: account.isActive
        };

        if (account.imei) {
          accountData.imei = account.imei;
        }

        if (account.userAgent) {
          accountData.userAgent = account.userAgent;
        }

        if (account.zaloConfig) {
          try {
            accountData.zaloConfig = JSON.parse(account.zaloConfig);
          } catch (e) {
            console.warn(`⚠️ Lỗi parse zaloConfig cho account ${account.accountId}`);
          }
        }

        if (account.proxyConfig) {
          try {
            accountData.proxyConfig = JSON.parse(account.proxyConfig);
          } catch (e) {
            console.warn(`⚠️ Lỗi parse proxyConfig cho account ${account.accountId}`);
          }
        }

        if (account.cookie) {
          try {
            accountData.cookie = JSON.parse(account.cookie);
          } catch (e) {
            console.warn(`⚠️ Lỗi parse cookie cho account ${account.accountId}`);
          }
        }

        return accountData;
      });

      // Lưu vào file
      this.writeAccountsToFile(accountsData);
      console.log(`💾 Đã cập nhật file: ${this.accountsFilePath}`);

      // Hiển thị danh sách
      console.log('\n=== DANH SÁCH TÀI KHOẢN ===');
      accountsData.forEach((account, index) => {
        console.log(`\n${index + 1}. Account ID: ${account.accountId}`);
        console.log(`   Phương thức: ${account.loginMethod}`);
        console.log(`   Trạng thái: ${account.isActive !== false ? '🟢 Hoạt động' : '🔴 Tắt'}`);
        console.log(`   QR Path: ${account.qrPath || 'N/A'}`);
        console.log(`   IMEI: ${account.imei || 'N/A'}`);
        
        if (account.zaloConfig) {
          console.log(`   Zalo Config: selfListen=${account.zaloConfig.selfListen}, checkUpdate=${account.zaloConfig.checkUpdate}, logging=${account.zaloConfig.logging}`);
        }
        
        if (account.proxyConfig) {
          console.log(`   Proxy: ${account.proxyConfig.enabled ? 'Bật' : 'Tắt'} - ${account.proxyConfig.url || 'N/A'}`);
        }
      });

      console.log(`\n📊 Tổng cộng: ${accountsData.length} tài khoản`);
      
    } catch (error) {
      console.error('❌ Lỗi khi lấy dữ liệu từ database:', error);
      console.log('🔄 Đang thử đọc từ file backup...');
      
      // Fallback: đọc từ file nếu database lỗi
      const accounts = this.readAccountsFromFile();
      if (accounts.length === 0) {
        console.log('📋 Không có dữ liệu backup trong file.');
        return;
      }

      console.log('\n=== DANH SÁCH TÀI KHOẢN (TỪ FILE BACKUP) ===');
      accounts.forEach((account, index) => {
        console.log(`\n${index + 1}. Account ID: ${account.accountId}`);
        console.log(`   Phương thức: ${account.loginMethod}`);
        console.log(`   Trạng thái: ${account.isActive !== false ? '🟢 Hoạt động' : '🔴 Tắt'}`);
        console.log(`   QR Path: ${account.qrPath || 'N/A'}`);
        console.log(`   IMEI: ${account.imei || 'N/A'}`);
        if (account.zaloConfig) {
          console.log(`   Zalo Config: selfListen=${account.zaloConfig.selfListen}, checkUpdate=${account.zaloConfig.checkUpdate}, logging=${account.zaloConfig.logging}`);
        }
        if (account.proxyConfig) {
          console.log(`   Proxy: ${account.proxyConfig.enabled ? 'Bật' : 'Tắt'} - ${account.proxyConfig.url || 'N/A'}`);
        }
      });
    }
  }

  // Thêm/Cập nhật tài khoản (đọc từ file account.json và lưu vào database)
  async addAccount(): Promise<void> {
    try {
      console.log('\n=== THÊM/CẬP NHẬT TÀI KHOẢN ===');
      console.log('🔄 Đang đọc dữ liệu từ file account.json...');
      
      // Đọc tài khoản từ file
      const accounts = this.readAccountsFromFile();
      
      if (accounts.length === 0) {
        console.log('📋 Không có tài khoản nào trong file account.json.');
        console.log('💡 Bạn có thể tạo file mẫu (chọn 1) trước khi thêm tài khoản.');
        return;
      }

      // Lấy danh sách tài khoản đã có trong database
      const dbAccounts = await this.accountService.find();
      const existingAccountIds = dbAccounts.map(acc => acc.accountId);

      let addedCount = 0;
      let updatedCount = 0;
      
      console.log('\n🔄 Đang xử lý từng tài khoản...');
      
      for (const accountData of accounts) {
        try {
          // Kiểm tra tài khoản đã tồn tại trong database chưa
          if (existingAccountIds.includes(accountData.accountId)) {
            console.log(`🔄 Cập nhật tài khoản "${accountData.accountId}"`);
            updatedCount++;
          } else {
            console.log(`➕ Thêm mới tài khoản "${accountData.accountId}"`);
            addedCount++;
          }

          // Thêm/Cập nhật tài khoản vào database (AccountService sẽ tự stringify)
          await this.accountService.createOrUpdateAccount({
            accountId: accountData.accountId,
            loginMethod: accountData.loginMethod,
            zaloConfig: accountData.zaloConfig,
            proxyConfig: accountData.proxyConfig,
            cookie: accountData.cookie,
            imei: accountData.imei,
            userAgent: accountData.userAgent,
            qrPath: accountData.qrPath
          });
          
          // Cập nhật trạng thái active
          if (accountData.isActive === false) {
            await this.accountService.deactivateAccount(accountData.accountId);
          } else {
            await this.accountService.activateAccount(accountData.accountId);
          }
          
          console.log(`✅ Xử lý thành công: "${accountData.accountId}"`);
          
        } catch (error) {
          console.error(`❌ Lỗi khi xử lý tài khoản "${accountData.accountId}":`, error);
        }
      }
      
      console.log('\n=== KẾT QUẢ XỬ LÝ TÀI KHOẢN ===');
      console.log(`➕ Đã thêm mới: ${addedCount} tài khoản`);
      console.log(`🔄 Đã cập nhật: ${updatedCount} tài khoản`);
      console.log(`📊 Tổng xử lý: ${addedCount + updatedCount}/${accounts.length} tài khoản`);
      
      if (addedCount > 0 || updatedCount > 0) {
        console.log('💾 Tất cả tài khoản đã được đồng bộ vào database.');
      }
      
    } catch (error) {
      console.error('❌ Lỗi khi thêm/cập nhật tài khoản:', error);
    }
  }

  // Xóa tài khoản (đọc từ database và xóa trong database)
  async deleteAccount(): Promise<void> {
    try {
      console.log('\n=== XÓA TÀI KHOẢN ===');
      console.log('🔄 Đang lấy dữ liệu từ database...');
      
      // Lấy tất cả tài khoản từ database
      const dbAccounts = await this.accountService.find();
      
      if (dbAccounts.length === 0) {
        console.log('📋 Không có tài khoản nào trong database để xóa.');
        console.log('💡 Bạn có thể tạo file mẫu (chọn 1) hoặc thêm tài khoản mới (chọn 3).');
        return;
      }

      // Hiển thị danh sách tài khoản từ database
      console.log('\n=== DANH SÁCH TÀI KHOẢN ===');
      dbAccounts.forEach((account, index) => {
        console.log(`${index + 1}. Account ID: ${account.accountId} - Trạng thái: ${account.isActive ? '🟢 Hoạt động' : '🔴 Tắt'}`);
      });
      
      const indexStr = await this.question('\nChọn số thứ tự tài khoản cần xóa: ');
      const index = parseInt(indexStr) - 1;
      
      if (index < 0 || index >= dbAccounts.length) {
        console.log('❌ Số thứ tự không hợp lệ!');
        return;
      }

      const account = dbAccounts[index];
      const confirm = await this.question(`Bạn có chắc muốn xóa tài khoản "${account.accountId}" khỏi database? (y/n): `);
      
      if (confirm.toLowerCase() === 'y') {
        // Xóa trong database
        await this.accountService.deleteAccount(account.accountId);
        console.log('✅ Xóa tài khoản khỏi database thành công!');
        
        // Đồng bộ database về file để backup
        console.log('🔄 Đang đồng bộ database về file...');
        await this.syncDatabaseToFile();
      } else {
        console.log('❌ Hủy xóa tài khoản.');
      }
      
    } catch (error) {
      console.error('❌ Lỗi khi xóa tài khoản:', error);
    }
  }

  // Bật/Tắt tài khoản (đọc từ database và lưu vào database)
  async toggleAccount(): Promise<void> {
    try {
      console.log('\n=== BẬT/TẮT TÀI KHOẢN ===');
      console.log('🔄 Đang lấy dữ liệu từ database...');
      
      // Lấy tất cả tài khoản từ database
      const dbAccounts = await this.accountService.find();
      
      if (dbAccounts.length === 0) {
        console.log('📋 Không có tài khoản nào trong database để thay đổi trạng thái.');
        console.log('💡 Bạn có thể tạo file mẫu (chọn 1) hoặc thêm tài khoản mới (chọn 3).');
        return;
      }

      // Hiển thị danh sách tài khoản từ database
      console.log('\n=== DANH SÁCH TÀI KHOẢN ===');
      dbAccounts.forEach((account, index) => {
        console.log(`${index + 1}. Account ID: ${account.accountId} - Trạng thái: ${account.isActive ? '🟢 Hoạt động' : '🔴 Tắt'}`);
      });
      
      const indexStr = await this.question('\nChọn số thứ tự tài khoản cần thay đổi trạng thái: ');
      const index = parseInt(indexStr) - 1;
      
      if (index < 0 || index >= dbAccounts.length) {
        console.log('❌ Số thứ tự không hợp lệ!');
        return;
      }

      const account = dbAccounts[index];
      const currentStatus = account.isActive;
      const newStatus = !currentStatus;
      
      // Cập nhật trạng thái trong database
      if (newStatus) {
        await this.accountService.activateAccount(account.accountId);
      } else {
        await this.accountService.deactivateAccount(account.accountId);
      }
      
      console.log(`✅ Đã ${newStatus ? 'bật' : 'tắt'} tài khoản "${account.accountId}" trong database`);
      
      // Đồng bộ database về file để backup
      console.log('🔄 Đang đồng bộ database về file...');
      await this.syncDatabaseToFile();
      
    } catch (error) {
      console.error('❌ Lỗi khi thay đổi trạng thái tài khoản:', error);
    }
  }

  // Đồng bộ với database (file → database)
  async syncFileToDatabase(): Promise<void> {
    try {
      console.log('\n=== ĐỒNG BỘ FILE → DATABASE ===');
      
      const accounts = this.readAccountsFromFile();
      let syncCount = 0;
      
      for (const accountData of accounts) {
        try {
          await this.accountService.createOrUpdateAccount({
            accountId: accountData.accountId,
            loginMethod: accountData.loginMethod,
            zaloConfig: accountData.zaloConfig,
            proxyConfig: accountData.proxyConfig,
            cookie: accountData.cookie,
            imei: accountData.imei,
            userAgent: accountData.userAgent,
            qrPath: accountData.qrPath
          });
          
          // Cập nhật trạng thái active
          if (accountData.isActive === false) {
            await this.accountService.deactivateAccount(accountData.accountId);
          } else {
            await this.accountService.activateAccount(accountData.accountId);
          }
          
          syncCount++;
        } catch (error) {
          console.error(`❌ Lỗi đồng bộ tài khoản ${accountData.accountId}:`, error);
        }
      }
      
      console.log(`✅ Đồng bộ thành công ${syncCount}/${accounts.length} tài khoản từ file vào database.`);
    } catch (error) {
      console.error('❌ Lỗi kết nối database:', error);
    }
  }

  // Đồng bộ từ database về file
  async syncDatabaseToFile(): Promise<void> {
    try {
      console.log('\n=== ĐỒNG BỘ DATABASE → FILE ===');
      
      // Lấy tất cả tài khoản từ database
      const dbAccounts = await this.accountService.find();
      
      if (dbAccounts.length === 0) {
        console.log('📋 Không có tài khoản nào trong database để đồng bộ.');
        return;
      }

      // Chuyển đổi từ database entities sang AccountData format
      const accountsData: AccountData[] = dbAccounts.map(account => {
        const accountData: AccountData = {
          accountId: account.accountId,
          loginMethod: account.loginMethod,
          isActive: account.isActive
        };

        if (account.imei) {
          accountData.imei = account.imei;
        }

        if (account.userAgent) {
          accountData.userAgent = account.userAgent;
        }

        if (account.zaloConfig) {
          try {
            accountData.zaloConfig = JSON.parse(account.zaloConfig);
          } catch (e) {
            console.warn(`⚠️ Lỗi parse zaloConfig cho account ${account.accountId}`);
          }
        }

        if (account.proxyConfig) {
          try {
            accountData.proxyConfig = JSON.parse(account.proxyConfig);
          } catch (e) {
            console.warn(`⚠️ Lỗi parse proxyConfig cho account ${account.accountId}`);
          }
        }

        if (account.cookie) {
          try {
            accountData.cookie = JSON.parse(account.cookie);
          } catch (e) {
            console.warn(`⚠️ Lỗi parse cookie cho account ${account.accountId}`);
          }
        }

        return accountData;
      });

      // Ghi vào file
      this.writeAccountsToFile(accountsData);
      
      console.log(`✅ Đồng bộ thành công ${accountsData.length} tài khoản từ database vào file.`);
      console.log(`📁 File đã được cập nhật: ${this.accountsFilePath}`);
    } catch (error) {
      console.error('❌ Lỗi khi đồng bộ từ database:', error);
    }
  }

  // Chạy CLI
  async run(): Promise<void> {
    console.log('🚀 Khởi động Account CLI...');
    
    while (true) {
      this.showMenu();
      const choice = await this.question('Chọn chức năng (0-7): ');
      
      switch (choice.trim()) {
        case '1':
          await this.createSampleFile();
          break;
        case '2':
          await this.showAllAccounts();
          break;
        case '3':
          await this.addAccount();
          break;
        case '4':
          await this.deleteAccount();
          break;
        case '5':
          await this.toggleAccount();
          break;
        case '6':
          await this.syncFileToDatabase();
          break;
        case '7':
          await this.syncDatabaseToFile();
          break;
        case '0':
          console.log('👋 Tạm biệt!');
          this.rl.close();
          return;
        default:
          console.log('❌ Lựa chọn không hợp lệ!');
      }
      
      // Tạm dừng trước khi hiển thị menu tiếp theo
      await this.question('\nNhấn Enter để tiếp tục...');
    }
  }
}

// Chạy CLI nếu file được thực thi trực tiếp
if (require.main === module) {
  (async () => {
    const db: DatabaseManager = await initializeDatabase();
    const cli = new AccountCLI(db);
    await cli.run();
  })().catch(console.error);
}


export { AccountCLI };