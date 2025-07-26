import { Repository, EntityTarget, FindOptionsWhere, FindManyOptions, DeepPartial } from "typeorm";
import { appDataSource } from "../../configs/database.config";

export abstract class BaseService<T> {
  protected repository: Repository<T>;

  constructor(entity: EntityTarget<T>) {
    this.repository = appDataSource.getRepository(entity);
  }

  // Tạo mới
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  // Tìm một record
  async findOne(where: FindOptionsWhere<T>): Promise<T | null> {
    return await this.repository.findOne({ where });
  }

  // Tìm nhiều records
  async find(options?: FindManyOptions<T>): Promise<T[]> {
    return await this.repository.find(options);
  }

  // Tìm tất cả
  async findAll(): Promise<T[]> {
    return await this.repository.find();
  }

  // Cập nhật
  async update(where: FindOptionsWhere<T>, data: any): Promise<void> {
    await this.repository.update(where, data);
  }

  // Lưu (create hoặc update)
  async save(entity: DeepPartial<T>): Promise<T> {
    return await this.repository.save(entity);
  }

  // Xóa
  async delete(where: FindOptionsWhere<T>): Promise<void> {
    await this.repository.delete(where);
  }

  // Đếm
  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return await this.repository.count({ where });
  }

  // Kiểm tra tồn tại
  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({ where });
    return count > 0;
  }
}
