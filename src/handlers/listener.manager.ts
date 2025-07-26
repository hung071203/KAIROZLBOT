import { KairoZLBot } from "../configs/zalo.config";
import { HandlerManager } from "./handler.manager";

export class ListenerManager {
  private bot: KairoZLBot;
  private handlerManager: HandlerManager;

  constructor(bot: KairoZLBot) {
    this.bot = bot;
    this.handlerManager = new HandlerManager();
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

    // Lắng nghe tin nhắn
    listener.on("message", async (msg: any) => {
      console.log(`📩 Tin nhắn mới `, msg);
      api.sendMessage({
            msg: "ok",
            quote: msg.data
        }, msg.threadId, msg.type);
    });

    // Lắng nghe sự kiện reaction
    listener.on("reaction", (reaction: any) => {
      // TODO: Xử lý reaction với handlers đã load
    });

    // Lắng nghe sự kiện nhóm
    listener.on("group_event", (event: any) => {
      // Xử lý sự kiện nhóm ở đây
      // TODO: Xử lý group event với handlers đã load
    });

    // Lắng nghe sự kiện undo
    listener.on("undo", (undoEvent: any) => {
      // Xử lý thu hồi tin nhắn ở đây
      // TODO: Xử lý undo với handlers đã load
    });

    console.log(`✅ Đã thiết lập listeners cho bot ${this.bot.getAccountId()}`);
  }

  // Getter methods để truy cập handlers
  public getHandlerManager(): HandlerManager {
    return this.handlerManager;
  }
}