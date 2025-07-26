import { BaseService } from "./base-service";
import { User } from "../entities/User";

export class UserService extends BaseService<User> {
  constructor() {
    super(User);
  }

  // Tạo hoặc cập nhật user
  async createOrUpdateUser(zaloId: string, name?: string, avatar?: string): Promise<User> {
    let user = await this.findOne({ zaloId });
    
    if (user) {
      // Cập nhật thông tin nếu user đã tồn tại
      if (name) user.name = name;
      if (avatar) user.avatar = avatar;
      user.isActive = true;
      return await this.save(user);
    } else {
      // Tạo user mới
      return await this.create({
        zaloId,
        name,
        avatar,
        isActive: true,
      });
    }
  }

  // Lấy user theo Zalo ID
  async getUserByZaloId(zaloId: string): Promise<User | null> {
    return await this.findOne({ zaloId });
  }

  // Lấy users đang hoạt động
  async getActiveUsers(): Promise<User[]> {
    return await this.find({ where: { isActive: true } });
  }

  // Cập nhật tin nhắn cuối cùng
  async updateLastMessage(zaloId: string, message: string): Promise<void> {
    await this.update({ zaloId }, { lastMessage: message });
  }

  // Đếm users đang hoạt động
  async countActiveUsers(): Promise<number> {
    return await this.count({ isActive: true });
  }
}
