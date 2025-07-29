import { API, Message } from "zca-js";
import { BotContext, EventModule, GroupEvents } from "../../common/types";
import { Logger } from "../../utils/logger.util";

export default {
  config: {
    name: "message",
    version: "1.0.0",
    credits: "Hung dep trai",
    description: "Xử lý tin nhắn mới",
    tag: "core",
  },

  handlerEvent: async (api: API, context: BotContext, event: any) => {},
  anyHandler: async (api: API, context: BotContext, event: any) => {
    Logger.debug("Received any event:", JSON.stringify(event));
  }
}as GroupEvents;
