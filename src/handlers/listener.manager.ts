import { KairoZLBot, MultiAccountBotManager } from "../configs/zalo.config";
import { HandlerManager } from "./handler.manager";
import { BotContext } from "../common/types";
import { GroupEvent, Message, Reaction, Undo } from "zca-js";
import { SetupListeners } from "./setup-listener.manager";
import { DatabaseManager } from "../database";
import { AnyEventTypeEnum } from "../common";
import { AppConfig } from "../configs/app.config";
import { Logger } from "../utils/logger.util";

export class ListenerManager {
  private bot: KairoZLBot;
  private handlerManager: HandlerManager;
  private botContext: BotContext;

  constructor(bot: KairoZLBot, database?: DatabaseManager, config?: AppConfig, botManager?: MultiAccountBotManager) {
    this.bot = bot;
    this.handlerManager = new HandlerManager();

    // Khởi tạo BotContext với database
    this.botContext = {
      db: database,
      appConfig: config,
      botManager,
      handlerReply: [],
      handlerReaction: [],
      handlerUndo: [],
    };
  }

  public async initialize(): Promise<void> {
    // Load handlers và events
    await this.handlerManager.loadGroupCommands();
    await this.handlerManager.loadGroupEvents();

    // Thiết lập listeners
    this.setupListeners();
  }

  public setupListeners(): void {
    const api = this.bot.getAPI();
    const { listener } = api;

    this.botContext.handlerManager = this.handlerManager;
    const setupListeners = new SetupListeners(api, this.botContext);
    setupListeners.OnLoad();

    // Lắng nghe tin nhắn
    listener.on("message", async (msg: Message) => {
      if (msg.data.quote) {
        setupListeners.ReplyListener(msg);
      }
      setupListeners.MessageListener(msg);
      setupListeners.AnyEventListener({type: AnyEventTypeEnum.MESSAGE, data: msg});
    });

    // Lắng nghe sự kiện reaction
    listener.on("reaction", (reaction: Reaction) => {
      Logger.info(JSON.stringify(reaction, null, 2));
      setupListeners.ReactionListener(reaction);
      setupListeners.AnyEventListener({type: AnyEventTypeEnum.REACTION, data: reaction});
    });

    // Lắng nghe sự kiện nhóm
    listener.on("group_event", (event: GroupEvent) => {
      setupListeners.EventListener(event);
      setupListeners.AnyEventListener({type: AnyEventTypeEnum.GROUP_EVENT, data: event});
    });

    // Lắng nghe sự kiện undo
    listener.on("undo", (undoEvent: Undo) => {
      setupListeners.UndoListener(undoEvent);
      setupListeners.AnyEventListener({type: AnyEventTypeEnum.UNDO, data: undoEvent});
    });

    Logger.info(`✅ Đã thiết lập listeners cho bot ${this.bot.getAccountId()}`);
  }
}
