import { API, Message } from "zca-js";
import {
  BotContext,
  CommandModule,
  GroupCommands,
  HandlerConfig,
  IAnyEvent,
  NoPrefixModule,
} from "../../common/types";
import {
  AnyEventTypeEnum,
  DeepAiChatStyleEnum,
  DeepAiModelEnum,
  RoleBotEnum,
  RoleUserEnum,
} from "../../common";
import { chatDeepAi, AgentService } from "../../common/services";
import { getContent } from "../../common/helpers";
const agentName = "agent";

export default {
  config: {
    name: agentName,
    version: "2.0.0",
    credits: "Hung dep trai",
    description:
      "AI Agent thông minh có thể tự động thực thi API Zalo và truy vấn database",
    tag: "AI",
    usage:
      "Gửi yêu cầu tự nhiên cho AI để thực hiện các hành động tự động: thông tin nhóm, quản lý thành viên, tạo poll, v.v.",
    countDown: 1,
    roleUser: RoleUserEnum.ADMIN,
    roleBot: RoleBotEnum.ADMIN,
    self: false, // Chỉ dành cho bot cá nhân
  },

  anyHandler: async (api: API, context: BotContext, event: IAnyEvent) => {
    if (event.type !== AnyEventTypeEnum.MESSAGE) return;
    const eventData = event.data as Message;

    if (eventData.isSelf) return; // Bỏ qua tin nhắn của chính bot

    const msg = getContent(eventData.data.content);

    if (!msg || !msg.includes(agentName)) return;

    try {
      // Khởi tạo Agent Service
      const agentService = new AgentService(api, context, agentName);

      // Xử lý yêu cầu thông minh
      const response = await agentService.processRequest(JSON.stringify(event));

      // Gửi phản hồi
      const sendData = await api.sendMessage(
        { msg: response.response, quote: eventData.data },
        eventData.threadId,
        eventData.type
      );

      if (response.success) {
        context.handlerReply.set(
          `${eventData.threadId}_${String(sendData.message.msgId)}`,
          {
            name: agentName,
            msgId: String(sendData.message.msgId),
            threadType: eventData.type,
            threadId: eventData.threadId,
            quote: eventData.data,
            data: {
              history: response.history || [],
            },
          }
        );
      }
    } catch (error: any) {
      console.error("Agent error:", error);
      api.sendMessage(
        `❌ Lỗi khi xử lý yêu cầu: ${error.message}`,
        eventData.threadId,
        eventData.type
      );
      return;
    }
  },

  handlerReply: async (
    api: API,
    context: BotContext,
    event: Message,
    args: string[],
    handler: HandlerConfig
  ) => {
    try {
      const content = getContent(event.data.content);
      if (!content || content.includes(agentName)) return;

      const agentService = new AgentService(
        api,
        context,
        agentName,
        handler.data?.history || []
      );

      const response = await agentService.processRequest(JSON.stringify(event));

      // Gửi phản hồi
      const sendData = await api.sendMessage(
        { msg: response.response, quote: event.data },
        event.threadId,
        event.type
      );

      if (response.success) {
        context.handlerReply.set(
          `${event.threadId}_${sendData.message.msgId}`,
          {
            name: agentName,
            msgId: String(sendData.message.msgId),
            threadType: event.type,
            threadId: event.threadId,
            quote: event.data,
            data: {
              history: response.history || [],
            },
          }
        );
      }
    } catch (error: any) {
      console.error("Agent reply error:", error);
      api.sendMessage(
        {
          msg: `❌ Lỗi khi xử lý yêu cầu: ${error.message}`,
          quote: event.data,
        },
        event.threadId,
        event.type
      );
      return;
    }
  },
} as GroupCommands;
