import { API, Message, ThreadType } from "zca-js";
import { RoleEnum } from "../enums";
import { HandlerManager } from "../../handlers/handler.manager";
import { DatabaseManager } from "../../database";

export interface CommandConfig {
  name: string;
  version: string;
  credits: string;
  description: string;
  tag: string;
  usage: string;
  countDown: number;
  role: RoleEnum;
  self: boolean; // lệnh chạy khi bot nhắn
}

export interface EventConfig {
  name: string;
  version: string;
  credits: string;
  description: string;
  tag: string;
}

export interface HandlerConfig {
  name: string;
  msgId: string; // ID của tin nhắn đã gửi
  threadType: ThreadType;
  threadId: string; // ID của nhóm hoặc cá nhân
  quote?: Message; // Tin nhắn gốc nếu có
  data?: any; // Dữ liệu bổ sung nếu cần
}

export interface BotContext {
  db?: DatabaseManager; // connection hoặc ORM
  config?: any; // cấu hình bot
  handlerManager?: HandlerManager; // Quản lý các handler
  handlerReply?: HandlerConfig[]; // biến lưu tạm
  handlerReaction?: HandlerConfig[]; // biến lưu tạm
  handlerUndo?: HandlerConfig[]; // biến lưu tạm
}

export interface CommandModule {
  config: CommandConfig;
  run: (
    api: API,
    context: BotContext,
    event: Message,
    args: string[]
  ) => Promise<void>;
}

export interface ReplyModule {
  config: CommandConfig;
  handlerReply: (
    api: API,
    context: BotContext,
    event: Message,
    args: string[]
  ) => Promise<void>;
}

export interface EventModule {
  config: EventConfig;
  handlerEvent: (api: API, context: BotContext, event: any) => Promise<void>;
}

export interface ReactionModule {
  config: CommandConfig;
  handlerReaction: (api: API, context: BotContext, event: any) => Promise<void>;
}

export interface UndoModule {
  config: CommandConfig;
  handlerUndo: (api: API, context: BotContext, event: any) => Promise<void>;
}

export interface OnLoadModule {
  config: EventConfig;
  onLoad: (api: API, context: BotContext) => Promise<void>;
}

export interface NoPrefixModule {
  config: CommandConfig;
  noPrefix: (
    api: API,
    context: BotContext,
    event: Message,
    args: string[]
  ) => Promise<void>;
}
