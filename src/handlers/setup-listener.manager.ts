import { API, Message, Reaction, Undo } from "zca-js";
import { BotContext } from "../common/types";
import { HandlerManager } from "./handler.manager";

export class SetupListeners {
  private api: API;
  private botContext: BotContext;
  private handlerManager: HandlerManager;

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
      args = content.split(" ");
    } else if (typeof content == "object") {
      args = content.title.split(" ");
    }

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
    const threadId = msg.threadId;
    const content = msg.data.content;
    let args: string[] = [];
    if (typeof content == "string") {
      args = content.split(" ");
    } else if (typeof content == "object") {
      args = content.title.split(" ");
    }

    if (commandModules.has(args[0])) {
      commandModules
        .get(args[0])
        .run(this.api, this.botContext, msg, args.slice(1));
    }
  }
}
