import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { RoleBotEnum } from "../../common";

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  accountId: string; // ID tài khoản Zalo

  @Column()
  loginMethod: "cookie" | "qr"; // Phương thức đăng nhập

  @Column({ type: "text", nullable: true })
  zaloConfig: string; // ZaloConfig dạng JSON string

  @Column({ type: "text", nullable: true })
  proxyConfig: string; // ProxyConfig dạng JSON string

  // Cookie login data
  @Column({ type: "text", nullable: true })
  cookie: string; // Cookie dạng JSON string

  @Column({ nullable: true })
  imei: string; // IMEI của thiết bị

  @Column({ type: "text", nullable: true })
  userAgent: string; // User Agent

  @Column({ default: true })
  isActive: boolean; // Trạng thái hoạt động

  @Column({ type: "date", nullable: true })
  expirationDate: Date; // Ngày hết hạn đăng nhập

  @Column({ enum: RoleBotEnum, default: RoleBotEnum.FREE })
  role: RoleBotEnum; // Vai trò của bot

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
