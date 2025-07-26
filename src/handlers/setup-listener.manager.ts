import { API, Message, Reaction, Undo } from "zca-js";
import { BotContext, CommandModule, NoPrefixModule } from "../common/types";
import { HandlerManager } from "./handler.manager";

export class SetupListeners {
  private api: API;
  private botContext: BotContext;
  private handlerManager: HandlerManager;
  private cooldownMap: Map<string, number> = new Map();

  constructor(api: API, botContext: BotContext) {
    this.api = api;
    this.botContext = botContext;
    this.handlerManager = botContext.handlerManager;
  }

  async OnLoad() {
    const onLoadModules = this.handlerManager.getOnLoads();
    onLoadModules.forEach((module) => {
      module.onLoad(this.api, this.botContext);
    });
  }

  async EventListener(event: any) {
    const eventModules = this.handlerManager.getEvents();
    eventModules.forEach((module) => {
      module.handlerEvent(this.api, this.botContext, event);
    });
  }

  async ReplyListener(event: Message) {
    const replyModules = this.handlerManager.getReplies();
    const threadId = event.threadId;
    const content = event.data.content;
    let args: string[] = [];
    if (typeof content == "string") {
      args = content.split(" ").filter((arg: string) => arg.trim() !== "");
    } else if (typeof content == "object") {
      args = content.title
        .split(" ")
        .filter((arg: string) => arg.trim() !== "");
    }

    const prefix = this.botContext.config?.prefix || "!";
    if(args[0] && args[0].startsWith(prefix)) return;

    const handlerReply = this.botContext.handlerReply.find(
      (reply) =>
        reply.msgId == String(event.data.quote.globalMsgId) &&
        reply.threadId === threadId
    );

    if (handlerReply && replyModules.has(handlerReply.name)) {
      replyModules
        .get(handlerReply.name)
        .handlerReply(this.api, this.botContext, event, args);
    }
  }

  async ReactionListener(event: Reaction) {
    const reactionModules = this.handlerManager.getReactions();
    const handlerReaction = this.botContext.handlerReaction.find(
      (reaction) => reaction.msgId == String(event.data.content.rMsg[0].gMsgID)
    );

    if (handlerReaction && reactionModules.has(handlerReaction.name)) {
      reactionModules
        .get(handlerReaction.name)
        .handlerReaction(this.api, this.botContext, event);
    }
  }

  async UndoListener(event: Undo) {
    const undoModules = this.handlerManager.getUndos();
    const handlerUndo = this.botContext.handlerUndo.find(
      (undo) => undo.msgId == String(event.data.content.globalMsgId)
    );

    if (handlerUndo && undoModules.has(handlerUndo.name)) {
      undoModules
        .get(handlerUndo.name)
        .handlerUndo(this.api, this.botContext, event);
    }
  }

  async MessageListener(msg: Message) {
    const commandModules = this.handlerManager.getCommands();
    const noPrefixModules = this.handlerManager.getNoPrefix();

    const prefix = this.botContext.config?.prefix || "!";
    const threadId = msg.threadId;
    const content = msg.data.content;

    let args: string[] = [];
    if (typeof content === "string") {
      args = content.split(/\s+/).filter((arg) => arg.trim() !== "");
    } else if (
      typeof content === "object" &&
      typeof content.title === "string"
    ) {
      args = content.title.split(/\s+/).filter((arg) => arg.trim() !== "");
    }

    if (args.length === 0) return;

    if (args.length === 1 && args[0] === prefix) {
      this.api.sendMessage(
        `❌ Bạn chưa nhập tên lệnh sau dấu "${prefix}"`,
        msg.threadId
      );
      return;
    }

    const firstWord = args[0];
    const commandName = firstWord.startsWith(prefix)
      ? firstWord.slice(prefix.length)
      : firstWord;

    const isPrefixCommand =
      firstWord.startsWith(prefix) && commandModules.has(commandName);
    const isNoPrefixCommand =
      !firstWord.startsWith(prefix) && noPrefixModules.has(commandName);

    if (isPrefixCommand) {
      const module = commandModules.get(commandName)!;
      await this.executeCommand(module, commandName, args.slice(1), msg, true);
    } else if (isNoPrefixCommand) {
      const module = noPrefixModules.get(commandName)!;
      await this.executeCommand(module, commandName, args, msg, false);
    }
  }

  private async executeCommand(
    module: CommandModule | NoPrefixModule,
    commandName: string,
    args: string[],
    msg: Message,
    isPrefix: boolean
  ) {
    const threadId = msg.threadId;
    const now = Date.now();
    const cooldownKey = `${commandName}`;

    const lastUsed = this.cooldownMap.get(cooldownKey) || 0;
    const remaining = module.config.countDown * 1000 - (now - lastUsed);
    if (remaining > 0) {
      const seconds = Math.ceil(remaining / 1000);
      this.api.sendMessage(
        `⏳ Vui lòng chờ ${seconds}s trước khi dùng lại lệnh "${commandName}"`,
        threadId
      );
      return;
    }

    this.cooldownMap.set(cooldownKey, now);

    if (isPrefix && "run" in module) {
      await module.run(this.api, this.botContext, msg, args);
    } else if (!isPrefix && "noPrefix" in module) {
      await module.noPrefix(this.api, this.botContext, msg, args);
    }
  }
}
