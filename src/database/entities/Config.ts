import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Config {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string; // Key cấu hình (ví dụ: "prefix", "adminIds", "welcomeMessage", ...)

  @Column({ type: "text" })
  value: string; // Giá trị cấu hình (có thể là JSON string)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
