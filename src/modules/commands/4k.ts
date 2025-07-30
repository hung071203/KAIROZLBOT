import { API, Message } from "zca-js";
import { BotContext, CommandModule, GroupCommands } from "../../common/types";
import { RoleBotEnum, RoleUserEnum } from "../../common";

export default {
  config: {
    name: "4k",
    version: "1.0.0",
    credits: "Hung dep trai",
    description: "Upscale hình ảnh",
    tag: "AI",
    usage: "4k rep hình muốn upscale",
    countDown: 1,
    roleUser: RoleUserEnum.ALL,
    roleBot: RoleBotEnum.PRO,
    self: true, // Chỉ dành cho bot cá nhân
  },

  run: async (
    api: API,
    context: BotContext,
    event: Message,
    args: string[]
  ) => {
    api.sendMessage(
      "Chức năng này hiện đang được phát triển. Vui lòng thử lại sau.",
      event.threadId
    );
  },
} as GroupCommands;
