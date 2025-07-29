import { API, GroupEvent, Message, Reaction, TGroupMessage, ThreadType, TMessage, Undo } from "zca-js";
import { AnyEventTypeEnum, RoleEnum } from "../enums";
import { HandlerManager } from "../../handlers/handler.manager";
import { DatabaseManager } from "../../database";
import { MultiAccountBotManager } from "../../configs";
import { AppConfig } from "../../configs/app.config";

export interface BaseConfig {
  name: string;
  version: string;
  credits: string;
  description: string;
}

export interface CommandConfig extends BaseConfig {
  tag: string;
  usage: string;
  countDown: number;
  role: RoleEnum;
  self: boolean;
}

export interface HandlerConfig {
  name: string;
  msgId: string;
  threadType: ThreadType;
  threadId: string;
  ttl: number; // Thời gian sống của handler
  quote?: TMessage | TGroupMessage;
  data?: any;
}

export interface BotContext {
  db?: DatabaseManager;
  appConfig: AppConfig;
  botManager?: MultiAccountBotManager;
  handlerManager?: HandlerManager;
  handlerReply?: HandlerConfig[];
  handlerReaction?: HandlerConfig[];
  handlerUndo?: HandlerConfig[];
}

export interface IMessageEvent {
  type: AnyEventTypeEnum.MESSAGE;
  data: Message;
}

export interface IReactionEvent {
  type: AnyEventTypeEnum.REACTION;
  data: Reaction;
}

export interface IGroupEvent {
  type: AnyEventTypeEnum.GROUP_EVENT;
  data: GroupEvent; // Thông tin sự kiện nhóm
}

export interface IUndoEvent {
  type: AnyEventTypeEnum.UNDO;
  data: Undo; // Thông tin sự kiện undo
}

export type IAnyEvent =
  | IMessageEvent
  | IReactionEvent
  | IGroupEvent
  | IUndoEvent;

export type CommandHandler = (
  api: API,
  context: BotContext,
  event: Message,
  args: string[]
) => Promise<void>;

export type ReplyHandler = (
  api: API,
  context: BotContext,
  event: Message,
  args: string[],
  handler: HandlerConfig
) => Promise<void>;

export type SimpleHandler<T> = (
  api: API,
  context: BotContext,
  event: T
) => Promise<void>;

export type ActionHandler<T> = (
  api: API,
  context: BotContext,
  event: T,
  handler: HandlerConfig
) => Promise<void>;

export interface CommandModule {
  config: CommandConfig;
  run: CommandHandler;
}

export interface ReplyModule {
  config: CommandConfig;
  handlerReply: ReplyHandler;
}

export interface ReactionModule {
  config: CommandConfig;
  handlerReaction: ActionHandler<Reaction>;
}

export interface UndoModule {
  config: CommandConfig;
  handlerUndo: ActionHandler<Undo>;
}

export interface EventModule {
  config: BaseConfig;
  handlerEvent: SimpleHandler<GroupEvent>;
}

export interface OnLoadModule {
  config: BaseConfig;
  onLoad: (api: API, context: BotContext) => Promise<void>;
}

export interface AnyModule {
  config: { name: string };
  anyHandler: SimpleHandler<IAnyEvent>;
}

export interface NoPrefixModule {
  config: CommandConfig;
  noPrefix: CommandHandler;
}

export interface GroupCommands {
  config: CommandConfig;
  run?: CommandHandler;
  handlerReply?: ReplyHandler;
  handlerReaction?: ActionHandler<Reaction>;
  handlerUndo?: ActionHandler<Undo>;
  noPrefix?: CommandHandler;
  onLoad?: (api: API, context: BotContext) => Promise<void>;
  anyHandler?: SimpleHandler<IAnyEvent>;
}

export interface GroupEvents {
  config: BaseConfig;
  handlerEvent?: SimpleHandler<GroupEvent>;
  onLoad?: (api: API, context: BotContext) => Promise<void>;
  anyHandler?: SimpleHandler<IAnyEvent>;
}
