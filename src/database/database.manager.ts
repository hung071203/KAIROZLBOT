import { DataSource } from "typeorm";
import { AccountService } from "./services/account-service";

export class DatabaseManager {
  private dataSource: DataSource;
  public account: AccountService;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.initializeServices();
  }

  private initializeServices(): void {
    // Khởi tạo các service
    this.account = new AccountService();
    
    // Có thể thêm các service khác ở đây
    // this.post = new PostService();
    // this.comment = new CommentService();
  }

  // Getter để truy cập DataSource nếu cần
  get connection(): DataSource {
    return this.dataSource;
  }

  // Kiểm tra kết nối
  get isConnected(): boolean {
    return this.dataSource.isInitialized;
  }

  // Đóng kết nối
  async close(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}
