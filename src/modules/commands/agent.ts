import { API, Message } from "zca-js";
import { BotContext, CommandModule, NoPrefixModule } from "../../common/types";
import { DeepAiChatStyleEnum, DeepAiModelEnum, RoleEnum } from "../../common";
import { chatDeepAi, AgentService } from "../../common/services";

export default {
  config: {
    name: "agent",
    version: "2.0.0",
    credits: "Hung dep trai",
    description: "AI Agent thông minh có thể tự động thực thi API Zalo và truy vấn database",
    tag: "AI",
    usage: "Gửi yêu cầu tự nhiên cho AI để thực hiện các hành động tự động: thông tin nhóm, quản lý thành viên, tạo poll, v.v.",
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
      api.sendMessage("Vui lòng nhập câu hỏi hoặc yêu cầu để AI có thể hỗ trợ bạn.\n\nVí dụ:\n• 'thông tin nhóm này'\n• 'thêm [userId] vào nhóm'\n• 'tạo poll về [chủ đề]'\n• 'ai online'\n• 'đổi tên nhóm thành [tên mới]'", event.threadId);
      return;
    }

    try {
      // Khởi tạo Agent Service
      const agentService = new AgentService(api, context);
      
      // Xử lý yêu cầu thông minh
      const response = await agentService.processRequest(JSON.stringify(event));
      
      // Gửi phản hồi
      api.sendMessage(response, event.threadId);
      
    } catch (error: any) {
      console.error("Agent error:", error);
      api.sendMessage(`❌ Lỗi khi xử lý yêu cầu: ${error.message}`, event.threadId);
      return;
    }
  },
} as NoPrefixModule;
