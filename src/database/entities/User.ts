import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  zaloId: string; // ID người dùng Zalo

  @Column({ nullable: true })
  name: string; // Tên người dùng

  @Column({ nullable: true })
  avatar: string; // Avatar URL

  @Column({ default: true })
  isActive: boolean; // Trạng thái hoạt động

  @Column({ type: "text", nullable: true })
  lastMessage: string; // Tin nhắn cuối cùng

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
