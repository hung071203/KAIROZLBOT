import { API, Message } from "zca-js";
import { BotContext } from "../types";
import { DeepAiChatStyleEnum, DeepAiModelEnum, DeepAiChatRole } from "../enums";
import { chatDeepAi } from "./chat-ai.service";
import { AccountService, ConfigService } from "../../database/services";
import { IChatDeepAiHistory } from "../types/ai.type";
import removeMarkdown from "remove-markdown";

export interface AgentAction {
  type: "api_call" | "database_query" | "response";
  function?: string;
  parameters?: any;
  description?: string;
}

export interface AgentResponse {
  message: string;
  actions?: AgentAction[];
  needsConfirmation?: boolean;
}

/**
 * Service xử lý logic thông minh cho Agent
 */
export class AgentService {
  private api: API;
  private context: BotContext;
  private event: Message;

  constructor(api: API, context: BotContext, event: Message) {
    this.api = api;
    this.context = context;
    this.event = event;
  }

  /**
   * Phân tích yêu cầu của người dùng và xác định hành động cần thực hiện
   */
  async analyzeUserRequest(userInput: string): Promise<AgentResponse> {
    // Tạo system prompt với cấu hình agent
    const systemPrompt = `Bạn là Agent thông minh của KAIROZLBOT - một trợ lý AI có thể thực hiện các hành động tự động trên Zalo.

🔧 CÁC API ZALO CÓ SẴN (với signature chi tiết):
     ZCA-JS API Documentation

 1. FRIEND MANAGEMENT
// Quản lý bạn bè
api.acceptFriendRequest(userId: string): Promise<"">
api.sendFriendRequest(userId: string, message?: string): Promise<SendFriendRequestResponse>
api.removeFriend(userId: string): Promise<"">
api.blockUser(userId: string): Promise<"">
api.unblockUser(userId: string): Promise<"">
api.changeFriendAlias(alias: string, friendId: string): Promise<"">
api.removeFriendAlias(friendId: string): Promise<"">
api.getAllFriends(count?: number, page?: number): Promise<GetAllFriendsResponse>
// GetAllFriendsResponse: Array<{userId, username, displayName, zaloName, avatar, gender, phoneNumber, status}>


 2. GROUP MANAGEMENT
// Quản lý nhóm
api.createGroup(options: CreateGroupOptions): Promise<CreateGroupResponse>
// CreateGroupOptions: {name?: string, members: string[], avatarSource?: AttachmentSource}
// CreateGroupResponse: {threadId, sucessMembers, errorMembers, error_data}
api.addUserToGroup(memberId: string | string[], threadId: string): Promise<AddUserToGroupResponse>
api.removeUserFromGroup(memberId: string | string[], threadId: string): Promise<"">
api.changeGroupName(name: string, threadId: string): Promise<ChangeGroupNameResponse>
api.changeGroupAvatar(avatarSource: AttachmentSource, threadId: string): Promise<"">
api.changeGroupOwner(memberId: string, threadId: string): Promise<ChangeGroupOwnerResponse>
api.addGroupDeputy(memberId: string | string[], threadId: string): Promise<"">
api.removeGroupDeputy(memberId: string | string[], threadId: string): Promise<"">
api.leaveGroup(threadId: string): Promise<"">
api.disperseGroup(threadId: string): Promise<"">


 3. MESSAGE APIS
// Gửi tin nhắn
api.sendMessage(message: MessageContent | string, threadId: string, type?: ThreadType): Promise<SendMessageResponse>
// MessageContent object:
{
  msg: string,                           // Nội dung tin nhắn (bắt buộc)
  styles?: Style[],                      // Định dạng text
  urgency?: Urgency,                     // Mức độ ưu tiên (0: Default, 1: Important, 2: Urgent)
  quote?: SendMessageQuote,              // Trả lời tin nhắn
  mentions?: Mention[],                  // Tag người dùng
  attachments?: AttachmentSource[],      // File đính kèm
  ttl?: number                          // Tự xóa (milliseconds)
}

// Style object: {start: number, len: number, st: TextStyle}
// TextStyle: "b"(Bold), "i"(Italic), "u"(Underline), "s"(StrikeThrough), "c_db342e"(Red), "c_f27806"(Orange), "c_f7b503"(Yellow), "c_15a85f"(Green), "f_13"(Small), "f_18"(Big)

// Mention object: {pos: number, uid: string, len: number}

// SendMessageQuote: {content: string, msgType: number, uidFrom: string, msgId: string, cliMsgId: string, ts: number, ttl: number}

// AttachmentSource: string (file path) | {data: Buffer, filename: string, metadata: {totalSize: number, width?: number, height?: number}}

// Các API tin nhắn khác
api.sendSticker(sticker: StickerDetail, threadId: string, type?: ThreadType): Promise<SendStickerResponse>
api.sendVideo(options: SendVideoOptions, threadId: string, type?: ThreadType): Promise<SendVideoResponse>
// SendVideoOptions: {msg?: string, videoUrl: string, thumbnailUrl: string, duration?: number, width?: number, height?: number}

api.sendVoice(options: SendVoiceOptions, threadId: string, type?: ThreadType): Promise<SendVoiceResponse>
// SendVoiceOptions: {voiceUrl: string, ttl?: number}

api.forwardMessage(params: ForwardMessageParams): Promise<ForwardMessageResponse>
// ForwardMessageParams: {message: string, threadIds: string[], ttl?: number, reference?: object}

api.deleteMessage(messageId: string, threadId: string, type?: ThreadType): Promise<"">


4. REACTION & CHAT MANAGEMENT
// Reaction
api.addReaction(icon: Reactions | CustomReaction, dest: AddReactionDestination): Promise<AddReactionResponse>
// AddReactionDestination: {data: {msgId: string, cliMsgId: string}, threadId: string, type: ThreadType}

// Quản lý chat
api.deleteChat(threadId: string, type?: ThreadType): Promise<"">
api.setMute(isMute: boolean, threadId: string, type?: ThreadType): Promise<"">
api.addUnreadMark(threadId: string, type?: ThreadType): Promise<AddUnreadMarkResponse>
api.removeUnreadMark(threadId: string, type?: ThreadType): Promise<"">


5. ACCOUNT & USER INFO
// Thông tin tài khoản
api.fetchAccountInfo(): Promise<AccountInfo>
api.getUserInfo(userId: string | string[]): Promise<ProfileInfo[]>
// ProfileInfo: {displayName, avatar, gender, phoneNumber, ...}

api.changeAccountAvatar(avatarSource: AttachmentSource): Promise<"">
api.updateProfile(profileData: ProfileUpdateData): Promise<"">
// ProfileUpdateData: {displayName?: string, status?: string, ...}
api.getOwnId(): Promise<string>
api.findUser(keyword: string): Promise<FindUserResponse>


6. UTILITIES
// Tiện ích
api.uploadAttachment(attachment: AttachmentSource, threadId: string, type?: ThreadType): Promise<UploadResponse>
api.keepAlive(): Promise<"">

// Tin nhắn nhanh
api.addQuickMessage(payload: AddQuickMessagePayload): Promise<AddQuickMessageResponse>
// AddQuickMessagePayload: {keyword: string, title: string}
api.getQuickMessage(): Promise<QuickMessageResponse>
api.updateQuickMessage(id: string, payload: UpdateQuickMessagePayload): Promise<"">
// UpdateQuickMessagePayload: {keyword: string, title: string}
api.removeQuickMessage(id: string): Promise<"">

// Lời nhắc
api.createReminder(reminderData: CreateReminderData): Promise<CreateReminderResponse>
// CreateReminderData: {content: string, time: number, threadId: string}
api.getReminder(reminderId: string): Promise<ReminderInfo>
api.removeReminder(reminderId: string): Promise<"">

// Bình chọn
api.createPoll(pollData: CreatePollData, threadId: string): Promise<CreatePollResponse>
// CreatePollData: {question: string, options: string[]}
api.getPollDetail(pollId: string): Promise<PollDetailResponse>
api.lockPoll(pollId: string): Promise<"">


7. EVENTS & STATUS
// Sự kiện cuộc trò chuyện
api.sendDeliveredEvent(messageId: string, threadId: string): Promise<"">
api.sendSeenEvent(messageId: string, threadId: string): Promise<"">
api.sendTypingEvent(threadId: string, isTyping: boolean): Promise<"">

// Cài đặt
api.updateSettings(settings: SettingsData): Promise<"">
// SettingsData: {
//   notification?: boolean,   // Bật/tắt thông báo
//   sound?: boolean,          // Bật/tắt âm thanh
//   theme?: string,           // Giao diện ("light", "dark", ...)
//   language?: string,        // Ngôn ngữ giao diện
//   privacyMode?: boolean,    // Ẩn trạng thái hoạt động
//   autoDownload?: boolean,   // Tự động tải file
//   [key: string]: any        // Các trường mở rộng khác
// }
api.updateLang(language: string): Promise<"">

// Sticker
api.getStickers(): Promise<StickersResponse>
api.getStickersDetail(stickerId: string): Promise<StickerDetail>


ENUMS & TYPES
// ThreadType
ThreadType.USER = "USER"           // Chat 1-1
ThreadType.GROUP = "GROUP"         // Chat nhóm

// Urgency
Urgency.Default = 0                // Tin nhắn bình thường
Urgency.Important = 1              // Tin nhắn quan trọng
Urgency.Urgent = 2                 // Tin nhắn khẩn cấp


VÍ DỤ SỬ DỤNG NHANH
// Gửi tin nhắn đơn giản
await api.sendMessage("Hello", "threadId", ThreadType.GROUP);

// Gửi tin nhắn phức tạp
await api.sendMessage({
  msg: "Hello @user, đây là tin nhắn quan trọng!",
  styles: [{start: 0, len: 5, st: "b"}],
  urgency: 1,
  mentions: [{pos: 6, uid: "userId", len: 5}],
  attachments: ["/path/file.jpg"],
  ttl: 3600000
}, "threadId", ThreadType.GROUP);

// Quản lý nhóm
await api.createGroup({
  name: "Nhóm mới",
  members: ["user1", "user2"]
});

// Upload và gửi file
const result = await api.uploadAttachment("/path/image.jpg", "threadId");

LƯU Ý: EVENT tôi gửi threadId sẽ là ID của nhóm hiện tại, bạn có thể lấy từ event.threadId.

📊 CƠ SỞ DỮ LIỆU:
- accounts: Quản lý tài khoản bot
- configs: Cấu hình hệ thống

📋 PHÂN TÍCH YÊU CẦU:
Hãy phân tích yêu cầu người dùng và trả về JSON với format:
{
  "intent": "ý định chính",
  "actions": [
    {
      "type": "api_call|database_query|response",
      "function": "tên_hàm_api",
      "parameters": { "param1": "value1" },
      "description": "mô tả hành động"
    }
  ],
  "response": "phản hồi cho người dùng",
  "needsConfirmation": true/false
}

Hãy phân tích yêu cầu người dùng và đưa ra hành động phù hợp. Ví dụ:
- "thông tin nhóm này" → getGroupInfo
- "thêm [user] vào nhóm" → addUserToGroup  
- "tạo nhóm [tên]" → createGroup
- "đổi tên nhóm thành [tên]" → changeGroupName
- "ai online" → getAllFriends + getUserInfo
- "tạo poll [câu hỏi]" → createPoll`;

    // Tạo lịch sử mẫu để AI hiểu vai trò
    const agentHistory: IChatDeepAiHistory[] = [
      {
        role: DeepAiChatRole.USER,
        content: systemPrompt,
      },
      {
        role: DeepAiChatRole.ASSISTANT,
        content: `{
  "intent": "nothing",
  "actions": [
    {
      "type": "",
      "function": "",
      "parameters": {
      },
      "description": ""
    }
  ],
  "response": "Tôi đã hiểu yêu cầu của bạn. Bạn có thể hỏi tôi bất kỳ câu hỏi nào liên quan đến Zalo hoặc yêu cầu thực hiện các hành động tự động.",
  "needsConfirmation": false
}`,
      },
      {
        role: DeepAiChatRole.USER,
        content:
          "Tôi sẽ gửi cho bạn các sự kiện liên quan đến tin nhắn. Nhiệm vụ của bạn là phân tích nội dung và phản hồi lại dưới dạng JSON theo đúng cấu trúc mà tôi đã cấu hình trước đó. Lưu ý quan trọng: bạn phải trả về kết quả dưới dạng JSON hợp lệ, không được sử dụng văn bản mô tả trong phản hồi.",
      },
      {
        role: DeepAiChatRole.ASSISTANT,
        content: `{
  "intent": "gửi tin nhắn",
  "actions": [
    {
      "type": "api_call",
      "function": "sendMessage",
      "parameters": {
        "content": "Hello",
        "threadId": null,
        "type": 1
      },
      "description": "Vâng ngài"
    }
  ],
  "response": "vâng ngài",
  "needsConfirmation": false
}`,
      },
    ];

    try {
      const aiResponse = await chatDeepAi({
        style: DeepAiChatStyleEnum.CHAT,
        content: `${userInput}`,
        model: DeepAiModelEnum.STANDARD,
        history: agentHistory,
      });

      console.log("AI Response:", aiResponse);

      // Parse JSON response từ AI
      let analysisResult;
      try {
        const removeMarkdownContent = removeMarkdown(aiResponse.content);
        console.log("Remove Markdown Content:", removeMarkdownContent);

        analysisResult = JSON.parse(removeMarkdownContent);
      } catch (parseError) {
        // Nếu không parse được JSON, trả về response thông thường
        return {
          message: aiResponse.content,
          actions: [
            {
              type: "response",
              description: "Phản hồi thông thường",
            },
          ],
        };
      }

      return {
        message: analysisResult.response || "Đã phân tích yêu cầu",
        actions: analysisResult.actions || [],
        needsConfirmation: analysisResult.needsConfirmation || false,
      };
    } catch (error: any) {
      console.error("Error analyzing user request:", error);
      return {
        message: `❌ Lỗi khi phân tích yêu cầu: ${error.message}`,
        actions: [],
      };
    }
  }

  /**
   * Thực thi các hành động đã được phân tích
   */
  async executeActions(actions: AgentAction[]): Promise<string[]> {
    const results: string[] = [];

    for (const action of actions) {
      try {
        let result = "";

        switch (action.type) {
          case "api_call":
            result = await this.executeApiCall(action);
            break;
          case "database_query":
            result = await this.executeDatabaseQuery(action);
            break;
          case "response":
            result = action.description || "Đã thực hiện hành động";
            break;
        }

        results.push(result);
      } catch (error: any) {
        results.push(`❌ Lỗi thực thi ${action.function}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Thực thi API call
   */
  private async executeApiCall(action: AgentAction): Promise<string> {
    const { function: fnName, parameters = {} } = action;

    try {
      switch (fnName) {
        // THÔNG TIN NGƯỜI DÙNG & NHÓM
        case "getUserInfo":
          const userInfo = await this.api.getUserInfo(parameters.userId);
          const profile = userInfo.changed_profiles?.[parameters.userId];
          return profile
            ? `👤 ${profile.displayName || profile.username} (${
                profile.userId
              })`
            : `❌ Không tìm thấy thông tin user ${parameters.userId}`;

        case "getGroupInfo":
          const groupResponse = await this.api.getGroupInfo(
            parameters.threadId || this.event.threadId
          );
          const groupInfo =
            groupResponse.gridInfoMap?.[
              parameters.threadId || this.event.threadId
            ];
          return groupInfo
            ? `👥 Nhóm: ${groupInfo.name}\n👨‍👩‍👧‍👦 Thành viên: ${
                groupInfo.totalMember
              }\n👑 Admin: ${groupInfo.adminIds?.length || 0} người`
            : `❌ Không tìm thấy thông tin nhóm`;

        case "findUser":
          const foundUser = await this.api.findUser(parameters.phoneNumber);
          return `🔍 Tìm thấy: ${foundUser.display_name} (${foundUser.uid})`;

        case "fetchAccountInfo":
          const accountInfo = await this.api.fetchAccountInfo();
          return `📱 Thông tin tài khoản bot đã được lấy`;

        case "getOwnId":
          const ownId = await this.api.getOwnId();
          return `🤖 Bot ID: ${ownId}`;

        case "getGroupMembersInfo":
          const membersInfo = await this.api.getGroupMembersInfo(
            parameters.threadId || this.event.threadId
          );
          const memberCount = Object.keys(membersInfo.profiles || {}).length;
          return `👥 Có ${memberCount} thành viên trong nhóm`;

        case "getAllFriends":
          const friends = await this.api.getAllFriends(
            parameters.count,
            parameters.page
          );
          const friendCount = Array.isArray(friends) ? friends.length : 0;
          return `👫 Bạn có ${friendCount} bạn bè`;

        case "getAllGroups":
          const groups = await this.api.getAllGroups();
          const groupCount = groups.gridInfoMap
            ? Object.keys(groups.gridInfoMap).length
            : 0;
          return `👥 Bạn tham gia ${groupCount} nhóm`;

        // GỬI TIN NHẮN & NỘI DUNG
        case "sendMessage":
          const messageContent =
            typeof parameters.content === "string"
              ? parameters.content
              : {
                  msg: parameters.content || parameters.message,
                  styles: parameters.styles,
                  urgency: parameters.urgency,
                  mentions: parameters.mentions,
                  attachments: parameters.attachments,
                  ttl: parameters.ttl,
                };

          await this.api.sendMessage(
            messageContent,
            parameters.threadId || this.event.threadId,
            parameters.type || (this.event.type === 0 ? 0 : 1)
          );
          return `✅ Đã gửi tin nhắn`;

        case "sendCard":
          await this.api.sendCard(
            {
              userId: parameters.userId,
              phoneNumber: parameters.phoneNumber,
              ttl: parameters.ttl,
            },
            parameters.threadId || this.event.threadId,
            parameters.type || (this.event.type === 0 ? 0 : 1)
          );
          return `✅ Đã gửi card người dùng`;

        case "sendLink":
          await this.api.sendLink(
            {
              msg: parameters.msg,
              link: parameters.link,
              ttl: parameters.ttl,
            },
            parameters.threadId || this.event.threadId,
            parameters.type || (this.event.type === 0 ? 0 : 1)
          );
          return `✅ Đã gửi link`;

        case "sendVideo":
          await this.api.sendVideo(
            {
              msg: parameters.msg,
              videoUrl: parameters.videoUrl,
              thumbnailUrl: parameters.thumbnailUrl,
              duration: parameters.duration,
              width: parameters.width,
              height: parameters.height,
              ttl: parameters.ttl,
            },
            parameters.threadId || this.event.threadId,
            parameters.type || (this.event.type === 0 ? 0 : 1)
          );
          return `✅ Đã gửi video`;

        case "sendVoice":
          await this.api.sendVoice(
            {
              voiceUrl: parameters.voiceUrl,
              ttl: parameters.ttl,
            },
            parameters.threadId || this.event.threadId,
            parameters.type || (this.event.type === 0 ? 0 : 1)
          );
          return `✅ Đã gửi voice message`;

        case "forwardMessage":
          const forwardResult = await this.api.forwardMessage(
            {
              message: parameters.message,
              threadIds: parameters.threadIds || [this.event.threadId],
              ttl: parameters.ttl,
              reference: parameters.reference,
            },
            parameters.type || (this.event.type === 0 ? 0 : 1)
          );
          return `✅ Đã forward tin nhắn tới ${forwardResult.success.length} cuộc trò chuyện`;

        case "uploadAttachment":
          const uploadResult = await this.api.uploadAttachment(
            parameters.attachment,
            parameters.threadId || this.event.threadId,
            parameters.type || (this.event.type === 0 ? 0 : 1)
          );
          return `✅ Đã upload attachment`;

        // QUẢN LÝ NHÓM NÂNG CAO
        case "createGroup":
          const newGroup = await this.api.createGroup({
            name: parameters.name,
            members: parameters.members || [],
            avatarSource: parameters.avatarSource,
          });
          return `✅ Đã tạo nhóm: ${parameters.name} (ID: ${newGroup.groupId})`;

        case "changeGroupName":
          await this.api.changeGroupName(
            parameters.name,
            parameters.threadId || this.event.threadId
          );
          return `✅ Đã đổi tên nhóm thành: ${parameters.name}`;

        case "changeGroupAvatar":
          await this.api.changeGroupAvatar(
            parameters.avatarSource,
            parameters.threadId || this.event.threadId
          );
          return `✅ Đã đổi avatar nhóm`;

        case "addUserToGroup":
          const addResult = await this.api.addUserToGroup(
            parameters.userId,
            parameters.threadId || this.event.threadId
          );
          if (addResult.errorMembers && addResult.errorMembers.length > 0) {
            return `⚠️ Có lỗi khi thêm một số thành viên: ${addResult.errorMembers.join(
              ", "
            )}`;
          }
          return `✅ Đã thêm người dùng vào nhóm`;

        case "removeUserFromGroup":
          await this.api.removeUserFromGroup(
            parameters.userId,
            parameters.threadId || this.event.threadId
          );
          return `✅ Đã xóa người dùng khỏi nhóm`;

        case "changeGroupOwner":
          const ownerResult = await this.api.changeGroupOwner(
            parameters.memberId,
            parameters.threadId || this.event.threadId
          );
          return `✅ Đã chuyển quyền admin chính`;

        case "addGroupDeputy":
          await this.api.addGroupDeputy(
            parameters.userId,
            parameters.threadId || this.event.threadId
          );
          return `✅ Đã thêm phó admin`;

        case "removeGroupDeputy":
          await this.api.removeGroupDeputy(
            parameters.userId,
            parameters.threadId || this.event.threadId
          );
          return `✅ Đã xóa phó admin`;

        case "leaveGroup":
          const leaveResult = await this.api.leaveGroup(
            parameters.threadId || this.event.threadId,
            parameters.silent || false
          );
          return `✅ Đã rời khỏi nhóm`;

        case "disperseGroup":
          await this.api.disperseGroup(
            parameters.threadId || this.event.threadId
          );
          return `✅ Đã giải tán nhóm`;

        case "inviteUserToGroups":
          const inviteResult = await this.api.inviteUserToGroups(
            parameters.memberId,
            parameters.threadId || this.event.threadId
          );
          return `✅ Đã mời người dùng vào nhóm`;

        case "joinGroup":
          await this.api.joinGroup(parameters.link);
          return `✅ Đã tham gia nhóm từ link`;

        case "enableGroupLink":
          await this.api.enableGroupLink(
            parameters.threadId || this.event.threadId
          );
          return `✅ Đã bật link mời nhóm`;

        case "disableGroupLink":
          await this.api.disableGroupLink(
            parameters.threadId || this.event.threadId
          );
          return `✅ Đã tắt link mời nhóm`;

        // BẠN BÈ & KẾT NỐI NÂNG CAO
        case "sendFriendRequest":
          await this.api.sendFriendRequest(
            parameters.message || "Xin chào!",
            parameters.userId
          );
          return `✅ Đã gửi lời mời kết bạn`;

        case "acceptFriendRequest":
          await this.api.acceptFriendRequest(parameters.userId);
          return `✅ Đã chấp nhận lời mời kết bạn`;

        case "removeFriend":
          await this.api.removeFriend(parameters.friendId);
          return `✅ Đã xóa bạn`;

        case "blockUser":
          await this.api.blockUser(parameters.userId);
          return `✅ Đã chặn người dùng`;

        case "unblockUser":
          await this.api.unblockUser(parameters.userId);
          return `✅ Đã bỏ chặn người dùng`;

        case "changeFriendAlias":
          await this.api.changeFriendAlias(
            parameters.alias,
            parameters.friendId
          );
          return `✅ Đã đổi tên hiển thị bạn bè thành: ${parameters.alias}`;

        case "getReceivedFriendRequests":
          const receivedRequests = await this.api.getReceivedFriendRequests();
          return `📨 Có lời mời kết bạn đã nhận`;

        case "getSentFriendRequest":
          const sentRequests = await this.api.getSentFriendRequest();
          return `📤 Có lời mời kết bạn đã gửi`;

        case "undoFriendRequest":
          await this.api.undoFriendRequest(parameters.userId);
          return `✅ Đã hủy lời mời kết bạn`;

        // TIN NHẮN & TƯƠNG TÁC NÂNG CAO
        case "addReaction":
          // addReaction cần AddReactionDestination object
          const reactionDest = {
            data: {
              msgId: parameters.messageId || parameters.msgId,
              cliMsgId: parameters.cliMsgId || parameters.messageId,
            },
            threadId: parameters.threadId || this.event.threadId,
            type: parameters.type || (this.event.type === 0 ? 0 : 1),
          };
          await this.api.addReaction(parameters.reaction || "👍", reactionDest);
          return `✅ Đã thả cảm xúc`;

        case "deleteMessage":
          // deleteMessage cần DeleteMessageDestination object
          const deleteDest = {
            data: {
              cliMsgId: parameters.cliMsgId || parameters.messageId,
              msgId: parameters.messageId || parameters.msgId,
              uidFrom: parameters.uidFrom || this.event.data.uidFrom,
            },
            threadId: parameters.threadId || this.event.threadId,
            type: parameters.type || (this.event.type === 0 ? 0 : 1),
          };
          await this.api.deleteMessage(deleteDest, parameters.onlyMe || false);
          return `✅ Đã xóa tin nhắn`;

        case "undo":
          await this.api.undo(
            {
              msgId: parameters.msgId,
              cliMsgId: parameters.cliMsgId,
            },
            parameters.threadId || this.event.threadId,
            parameters.type || (this.event.type === 0 ? 0 : 1)
          );
          return `✅ Đã hoàn tác tin nhắn`;

        case "sendTypingEvent":
          await this.api.sendTypingEvent(
            parameters.threadId || this.event.threadId,
            parameters.type || (this.event.type === 0 ? 0 : 1),
            parameters.destType
          );
          return `✅ Đã hiển thị đang gõ`;

        // POLL & BÌNH CHỌN
        case "createPoll":
          const pollResult = await this.api.createPoll(
            {
              question: parameters.question,
              options: parameters.options || ["Có", "Không"],
              expiredTime: parameters.expiredTime,
              allowMultiChoices: parameters.allowMultiChoices,
              allowAddNewOption: parameters.allowAddNewOption,
              hideVotePreview: parameters.hideVotePreview,
              isAnonymous: parameters.isAnonymous,
            },
            parameters.threadId || this.event.threadId
          );
          return `✅ Đã tạo poll: ${parameters.question}`;

        case "getPollDetail":
          const pollDetail = await this.api.getPollDetail(parameters.pollId);
          return `📊 Poll: ${pollDetail.question} (${pollDetail.options.length} lựa chọn)`;

        case "lockPoll":
          await this.api.lockPoll(parameters.pollId);
          return `🔒 Đã khóa poll`;

        // NHẮC NHỞ
        case "createReminder":
          await this.api.createReminder(
            {
              title: parameters.title,
              emoji: parameters.emoji,
              startTime: parameters.startTime || Date.now() + 3600000,
              repeat: parameters.repeat,
            },
            parameters.threadId || this.event.threadId
          );
          return `⏰ Đã tạo nhắc nhở: ${parameters.title}`;

        case "getListReminder":
          const reminders = await this.api.getListReminder(
            { page: parameters.page || 1, count: parameters.count || 10 },
            parameters.threadId || this.event.threadId,
            parameters.type || (this.event.type === 0 ? 0 : 1)
          );
          return `📋 Đã lấy danh sách nhắc nhở`;

        case "editReminder":
          await this.api.editReminder(
            parameters.reminderId,
            parameters.options
          );
          return `✅ Đã sửa nhắc nhở`;

        case "removeReminder":
          await this.api.removeReminder(
            parameters.reminderId,
            parameters.threadId || this.event.threadId,
            parameters.type || (this.event.type === 0 ? 0 : 1)
          );
          return `✅ Đã xóa nhắc nhở`;

        // CÀI ĐẶT & QUẢN LÝ
        case "updateProfile":
          await this.api.updateProfile(
            parameters.name,
            parameters.dateOfBirth || "1990-01-01",
            parameters.gender || 1
          );
          return `✅ Đã cập nhật thông tin cá nhân`;

        case "changeAccountAvatar":
          await this.api.changeAccountAvatar(parameters.avatarSource);
          return `✅ Đã đổi avatar tài khoản`;

        case "setMute":
          await this.api.setMute(
            parameters.threadId || this.event.threadId,
            parameters.muteInfo
          );
          return `🔇 Đã tắt thông báo`;

        case "getMute":
          const muteList = await this.api.getMute();
          return `🔇 Đã lấy danh sách tắt thông báo`;

        case "setPinnedConversations":
          await this.api.setPinnedConversations(
            parameters.pinned !== false,
            parameters.threadIds || parameters.threadId || this.event.threadId,
            parameters.type || (this.event.type === 0 ? 0 : 1)
          );
          return `📌 Đã ghim cuộc trò chuyện`;

        case "getPinConversations":
          const pinnedList = await this.api.getPinConversations();
          return `📌 Đã lấy danh sách cuộc trò chuyện đã ghim`;

        case "setHiddenConversations":
          await this.api.setHiddenConversations(
            parameters.hidden !== false,
            parameters.threadId || this.event.threadId,
            parameters.type || (this.event.type === 0 ? 0 : 1)
          );
          return `✅ Đã ẩn cuộc trò chuyện`;

        case "getHiddenConversations":
          const hiddenList = await this.api.getHiddenConversations();
          return `🙈 Đã lấy danh sách cuộc trò chuyện đã ẩn`;

        // TIỆN ÍCH & KHÁC
        case "parseLink":
          const linkInfo = await this.api.parseLink(parameters.url);
          return `🔗 Đã phân tích link`;

        case "getStickers":
          const stickerList = await this.api.getStickers(
            parameters.keyword || ""
          );
          return `😄 Đã lấy danh sách sticker`;

        case "getStickersDetail":
          const stickerDetails = await this.api.getStickersDetail(
            parameters.stickerIds
          );
          return `😄 Đã lấy chi tiết ${stickerDetails.length} sticker`;

        case "keepAlive":
          await this.api.keepAlive();
          return `💓 Đã duy trì kết nối`;

        case "lastOnline":
          const lastOnlineInfo = await this.api.lastOnline(parameters.userId);
          return `🕐 Đã kiểm tra lần online cuối`;

        case "custom":
          const customResult = await this.api.custom(
            parameters.apiName,
            parameters.params
          );
          return `🔧 Đã thực thi API tùy chỉnh: ${parameters.apiName}`;

        default:
          throw new Error(`❌ Không tìm thấy API: ${fnName}`);
      }
    } catch (error) {
      console.error(`❌ Lỗi khi thực thi API ${fnName}:`, error);
      throw error;
    }
  }

  /**
   * Thực thi database query
   */
  private async executeDatabaseQuery(action: AgentAction): Promise<string> {
    if (!this.context.db) {
      throw new Error("Database không khả dụng");
    }

    const { function: query, parameters = {} } = action;

    try {
      switch (query) {
        case "get_accounts":
          const accountService = new AccountService();
          const accounts = await accountService.getActiveAccounts();
          return `📊 Có ${accounts.length} tài khoản đang hoạt động`;

        case "get_account_info":
          const accountService2 = new AccountService();
          const account = await accountService2.getAccountById(
            parameters.accountId
          );
          return account
            ? `📱 Tài khoản: ${account.accountId} (${account.loginMethod})`
            : `❌ Không tìm thấy tài khoản`;

        case "get_configs":
          const configService = new ConfigService();
          const configs = await configService.getAllConfigs();
          return `⚙️ Có ${Object.keys(configs).length} cấu hình trong hệ thống`;

        default:
          throw new Error(`Không hỗ trợ database query: ${query}`);
      }
    } catch (error: any) {
      throw new Error(`Lỗi database ${query}: ${error.message}`);
    }
  }

  /**
   * Xử lý yêu cầu chính
   */
  async processRequest(userInput: string): Promise<string> {
    try {
      // Kiểm tra nếu là lệnh xác nhận
      if (this.isConfirmationCommand(userInput)) {
        return this.handleConfirmation();
      }

      // Phân tích yêu cầu
      const analysis = await this.analyzeUserRequest(userInput);

      // Nếu cần xác nhận, hỏi người dùng trước
      if (
        analysis.needsConfirmation &&
        analysis.actions &&
        analysis.actions.length > 0
      ) {
        // Lưu pending actions vào context để xử lý sau
        this.storePendingActions(analysis.actions);

        const actionDescriptions = analysis.actions
          .map(
            (action) =>
              `🔸 ${action.function || action.type}: ${
                action.description || "Thực hiện hành động"
              }`
          )
          .join("\n");

        return `🤔 Tôi sẽ thực hiện các hành động sau:\n${actionDescriptions}\n\n❓ Bạn có muốn tiếp tục không? (Trả lời "có", "yes", "đồng ý" để xác nhận)`;
      }

      // Thực thi các hành động
      if (analysis.actions && analysis.actions.length > 0) {
        const results = await this.executeActions(analysis.actions);
        const combinedResults = results.join("\n");

        return `${analysis.message}\n\n📋 Kết quả thực thi:\n${combinedResults}`;
      }

      return analysis.message;
    } catch (error: any) {
      console.error("Error processing request:", error);
      return `❌ Lỗi xử lý yêu cầu: ${error.message}`;
    }
  }

  /**
   * Kiểm tra xem có phải lệnh xác nhận không
   */
  private isConfirmationCommand(input: string): boolean {
    const confirmationWords = [
      "có",
      "yes",
      "ok",
      "đồng ý",
      "xác nhận",
      "tiếp tục",
      "được",
      "go",
    ];
    return confirmationWords.some(
      (word) =>
        input.toLowerCase().trim() === word ||
        input.toLowerCase().includes(word)
    );
  }

  /**
   * Lưu pending actions (giả lập - trong thực tế cần lưu vào database hoặc cache)
   */
  private storePendingActions(actions: AgentAction[]): void {
    // Trong thực tế, bạn có thể lưu vào database với userId và threadId
    // Ở đây chúng ta chỉ log để demo
    console.log("Pending actions stored:", actions);
  }

  /**
   * Xử lý xác nhận (giả lập)
   */
  private async handleConfirmation(): Promise<string> {
    // Trong thực tế, lấy pending actions từ database
    return "✅ Tính năng xác nhận đang được phát triển. Hiện tại các hành động sẽ được thực thi ngay lập tức.";
  }
}
