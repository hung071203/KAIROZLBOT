import { API, GroupEvent, Message, Reaction, Undo } from "zca-js";
import {
  BotContext,
  CommandModule,
  IAnyEvent,
  NoPrefixModule,
} from "../common/types";
import { HandlerManager } from "./handler.manager";
import { RoleBotEnum, RoleUserEnum } from "../common";

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

  async EventListener(event: GroupEvent) {
    const eventModules = this.handlerManager.getEvents();
    eventModules.forEach((module) => {
      module.handlerEvent(this.api, this.botContext, event);
    });
  }

  async AnyEventListener(event: IAnyEvent) {
    const anyModules = this.handlerManager.getAnyHandlers();
    anyModules.forEach((module) => {
      module.anyHandler(this.api, this.botContext, event);
    });
  }

  async ReplyListener(event: Message) {
    const replyModules = this.handlerManager.getReplies();
    const threadId = event.threadId;
    const content = event.data.content;
    let args: string[] = [];
    if (typeof content == "string") {
      args = content.split(" ").filter((arg: string) => arg.trim() !== "");
    } else if (
      typeof content == "object" &&
      typeof content.title === "string"
    ) {
      args = content.title
        .split(" ")
        .filter((arg: string) => arg.trim() !== "");
    }

    const prefix = this.botContext.appConfig.getConfig("prefix") || "!";
    if (args[0] && args[0].startsWith(prefix)) return;

    const handlerReply = this.botContext.handlerReply.find(
      (reply) =>
        reply.msgId == String(event.data.quote.globalMsgId) &&
        reply.threadId === threadId
    );

    if (handlerReply) {
      const handler = replyModules.get(handlerReply.name);
      if (event.isSelf && handler?.config?.self === false) return;
      handler.handlerReply(
        this.api,
        this.botContext,
        event,
        args,
        handlerReply
      );
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
        .handlerReaction(this.api, this.botContext, event, handlerReaction);
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
        .handlerUndo(this.api, this.botContext, event, handlerUndo);
    }
  }

  async MessageListener(msg: Message) {
    const commandModules = this.handlerManager.getCommands();
    const noPrefixModules = this.handlerManager.getNoPrefix();

    const prefix = this.botContext.appConfig.getConfig("prefix") || "!";
    const threadId = msg.threadId;
    const content = msg.data.content;

    let args: string[] = [];
    if (typeof content === "string") {
      args = content.split(" ").filter((arg) => arg.trim() !== "");
    } else if (
      typeof content === "object" &&
      typeof content.title === "string"
    ) {
      args = content.title.split(" ").filter((arg) => arg.trim() !== "");
    } else {
      return;
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
      await this.executeCommand(module, commandName, args.slice(1), msg, false);
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
    if (msg.isSelf && module?.config?.self === false) return;

    const hasPermission = await this.checkPermissions(module, msg);
    if (!hasPermission) return;

    if (isPrefix && "run" in module) {
      await module.run(this.api, this.botContext, msg, args);
    } else if (!isPrefix && "noPrefix" in module) {
      await module.noPrefix(this.api, this.botContext, msg, args);
    }
  }

  async checkPermissions(
    module: CommandModule | NoPrefixModule,
    event: Message
  ) {
    const admins = this.botContext.appConfig.getConfig("admins");
    const senderId = event.data.uidFrom;
    const { roleUser, roleBot } = module.config;

    // 1. Kiểm tra nếu là DEV
    if (roleUser === RoleUserEnum.DEV && admins.includes(senderId)) return true;
    // 2. Kiểm tra quyền BOT
    const accountRole = await this.botContext.db.account.findOne({
      accountId: this.api.getOwnId(),
    });

    if (!accountRole) {
      this.api.sendMessage(
        {
          msg: "❌ Không tìm thấy thông tin tài khoản bot.",
          quote: event.data,
        },
        event.threadId,
        event.type
      );
      return false;
    }

    const roleHierarchy = {
      [RoleBotEnum.ADMIN]: 3,
      [RoleBotEnum.PRO]: 2,
      [RoleBotEnum.FREE]: 1,
    };

    if(accountRole.expirationDate && new Date(accountRole.expirationDate) < new Date() && accountRole.role !== RoleBotEnum.ADMIN) {
      this.api.sendMessage(
        {
          msg: "❌ Bot đã hết hạn sử dụng. Vui lòng gia hạn để tiếp tục sử dụng bot.",
          quote: event.data,
        },
        event.threadId,
        event.type
      );
      return false;
    }

    if (roleHierarchy[accountRole.role] < roleHierarchy[roleBot]) {
      this.api.sendMessage(
        {
          msg: `❌ Bot cần quyền ${roleBot} để sử dụng lệnh này.`,
          quote: event.data,
        },
        event.threadId,
        event.type
      );
      return false;
    }

    if (accountRole.role !== RoleBotEnum.ADMIN) {
      const expiration = accountRole.expirationDate
        ? new Date(accountRole.expirationDate)
        : null;

      if (expiration && expiration < new Date()) {
        this.api.sendMessage(
          {
            msg: `❌ Bot đã hết hạn sử dụng. Vui lòng gia hạn để tiếp tục sử dụng bot.`,
            quote: event.data,
          },
          event.threadId,
          event.type
        );
        return false;
      }
    }

    // 3. Kiểm tra quyền người dùng
    const roleUserHierarchy = {
      [RoleUserEnum.DEV]: 5,
      [RoleUserEnum.ADMIN]: 4,
      [RoleUserEnum.DEPUTY]: 3,
      [RoleUserEnum.USER]: 2,
      [RoleUserEnum.ALL]: 1,
    };

    // const userRole = await this.botContext.db.account.getUserRole(senderId); // Giả sử async

    // if (roleUserHierarchy[userRole] < roleUserHierarchy[roleUser]) {
    //   this.api.sendMessage(
    //     {
    //       msg: `❌ Bạn cần quyền ${roleUser} để sử dụng lệnh này.`,
    //       quote: event.data,
    //     },
    //     event.threadId,
    //     event.type
    //   );
    //   return false
    // }

    return true;
  }
}
