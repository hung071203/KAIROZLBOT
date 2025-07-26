import { API, Message } from "zca-js";
import { RoleEnum } from "../enums";

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

export interface BotContext {
  db?: any; // connection hoặc ORM
  handlerReply?: any[]; // biến lưu tạm
  handlerReaction?: any[]; // biến lưu tạm
  handlerUndo?: any[]; // biến lưu tạm
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
  handlerReaction: (api: API, context: BotContext, event: any) => Promise<void>;
}

export interface UndoModule {
  handlerUndo: (api: API, context: BotContext, event: any) => Promise<void>;
}
