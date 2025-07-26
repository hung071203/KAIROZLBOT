import { KairoZLBot } from "../configs/zalo.config";
import { HandlerManager } from "./handler.manager";
import { BotContext } from "../common/types";
import { GroupEvent, Message, Reaction, Undo } from "zca-js";
import { SetupListeners } from "./setup-listener.manager";

export class ListenerManager {
  private bot: KairoZLBot;
  private handlerManager: HandlerManager;
  private botContext: BotContext;

  constructor(bot: KairoZLBot, database?: any, config?: any) {
    this.bot = bot;
    this.handlerManager = new HandlerManager();

    // Khởi tạo BotContext với database
    this.botContext = {
      db: database,
      config,
      handlerReply: [],
      handlerReaction: [],
      handlerUndo: [],
    };
  }

  public async initialize(): Promise<void> {
    // Load handlers và events
    await this.handlerManager.loadHandlers();
    await this.handlerManager.loadEvents();

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
      setupListeners.EventListener(msg);
    });

    // Lắng nghe sự kiện reaction
    listener.on("reaction", (reaction: Reaction) => {
      console.log(JSON.stringify(reaction, null, 2));
      setupListeners.ReactionListener(reaction);
      setupListeners.EventListener(reaction);
    });

    // Lắng nghe sự kiện nhóm
    listener.on("group_event", (event: GroupEvent) => {
      setupListeners.EventListener(event);
    });

    // Lắng nghe sự kiện undo
    listener.on("undo", (undoEvent: Undo) => {
      setupListeners.UndoListener(undoEvent);
      setupListeners.EventListener(undoEvent);
    });

    console.log(`✅ Đã thiết lập listeners cho bot ${this.bot.getAccountId()}`);
  }
}
