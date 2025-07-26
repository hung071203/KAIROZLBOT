import { API, Message } from "zca-js";
import { BotContext } from "../../common/types";

export default {
  config: {
    name: "4k",
    version: "1.0.0",
    credits: "Hung dep trai",
    description: "Upscale hình ảnh",
    tag: "AI",
    usage: "4k rep hình muốn upscale",
    countDown: 700,
    role: 3,
    self: true, // Chỉ dành cho bot cá nhân
  },

  run: async (api: API, context: BotContext, event: Message, args: string[]) => {
    console.log(event);
  },
};
