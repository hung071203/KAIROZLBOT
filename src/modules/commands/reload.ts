import { API, Message } from "zca-js";
import { BotContext, CommandModule, GroupCommands } from "../../common/types";
import { RoleBotEnum, RoleUserEnum } from "../../common";

export default {
  config: {
    name: "reload",
    version: "1.0.0",
    credits: "Hung dep trai",
    description: "Upscale hình ảnh",
    tag: "AI",
    usage: "4k rep hình muốn upscale",
    countDown: 1,
    roleUser: RoleUserEnum.ALL,
    roleBot: RoleBotEnum.FREE,
    self: true, // Chỉ dành cho bot cá nhân
  },

  run: async (
    api: API,
    context: BotContext,
    event: Message,
    args: string[]
  ) => {
    await context.handlerManager.reloadHandlers();
    api.sendMessage(
      {
        msg: "✅ Đã tải lại tất cả các lệnh thành công!!",
        quote: event.data,
      },
      event.threadId,
      event.type
    );
  },
} as GroupCommands;
