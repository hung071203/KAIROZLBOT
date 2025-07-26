import { API, Message } from "zca-js";
import { BotContext, EventModule } from "../../common/types";

export default {
  config: {
    name: "message",
    version: "1.0.0",
    credits: "Hung dep trai",
    description: "Xử lý tin nhắn mới",
    tag: "core",
  },

  handlerEvent: async (api: API, context: BotContext, event: any) => {},
};
