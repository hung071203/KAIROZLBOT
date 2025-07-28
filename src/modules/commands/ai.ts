import { API, Message } from "zca-js";
import { BotContext, CommandModule } from "../../common/types";
import { RoleEnum } from "../../common";
import { chat } from "../../common/services/gemini.service";

export default {
  config: {
    name: "ai",
    version: "1.0.0",
    credits: "Hung dep trai",
    description: "",
    tag: "AI",
    usage: "",
    countDown: 1,
    role: RoleEnum.ALL,
    self: true, // Chỉ dành cho bot cá nhân
  },

  run: async (
    api: API,
    context: BotContext,
    event: Message,
    args: string[]
  ) => {
    const res = await chat({
      content: args.join(" "),
      his: [],
    });
    if (res.text) {
      console.log(res);

      api.sendMessage(res.text, event.threadId);
    } else {
      api.sendMessage("Không có phản hồi từ AI.", event.threadId);
    }
  },
} as CommandModule;
