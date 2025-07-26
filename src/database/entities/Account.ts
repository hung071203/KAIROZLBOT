import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
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

  // QR login data
  @Column({ nullable: true })
  qrPath: string; // Đường dẫn lưu QR code

  @Column({ default: true })
  isActive: boolean; // Trạng thái hoạt động

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
