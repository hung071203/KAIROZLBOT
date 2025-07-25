import { API, Message } from "zca-js";

export interface CommandConfig {
  name: string;
  version: string;
  credits: string;
  description: string;
  tag: string;
  usage: string;
  countDown: number;
  role: number; // 0: all, 1: user, 2: admin, 3: owner
}

export interface EventConfig {
  name: string;
  version: string;
  credits: string;
  description: string;
  tag: string;
}

export interface BotContext {
  db: any; // connection hoặc ORM
  tempStorage: Map<string, any>; // biến lưu tạm
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
