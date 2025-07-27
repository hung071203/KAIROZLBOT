import { API, Message } from "zca-js";
import { BotContext, CommandModule, NoPrefixModule } from "../../common/types";
import { DeepAiChatStyleEnum, DeepAiModelEnum, RoleEnum } from "../../common";
import { chatDeepAi } from "../../common/services/chat-ai.service";

export default {
  config: {
    name: "agent",
    version: "1.0.0",
    credits: "Hung dep trai",
    description: "agent",
    tag: "AI",
    usage: "nhắn 'agent' để bot tự động trả lời",
    countDown: 1,
    role: RoleEnum.ALL,
    self: false, // Chỉ dành cho bot cá nhân
  },

  noPrefix: async (
    api: API,
    context: BotContext,
    event: Message,
    args: string[]
  ) => {
    if (args.length === 0) {
      api.sendMessage("Vui lòng nhập câu hỏi hoặc truy vấn để trò chuyện với AI.", event.threadId);
      return;
    }
    try {
      const res = await chatDeepAi({
        style: DeepAiChatStyleEnum.CHAT,
        content: args.join(" "),
        model: DeepAiModelEnum.STANDARD,
        history: [],
      });
      api.sendMessage(res.content, event.threadId);
    } catch (error: any) {
      api.sendMessage(`❌ Lỗi khi gọi AI: ${error.message}`, event.threadId);
      return;
    }
  },
} as NoPrefixModule;
