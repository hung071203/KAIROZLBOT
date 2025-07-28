import { API, Message } from "zca-js";
import { BotContext } from "../types";
import {
  DeepAiChatStyleEnum,
  DeepAiModelEnum,
  DeepAiChatRole,
  RoleEnum,
} from "../enums";
import { chatDeepAi } from "./chat-ai.service";
import { AccountService, ConfigService } from "../../database/services";
import { IChatDeepAiHistory } from "../types/ai.type";
import removeMarkdown from "remove-markdown";
import { chat } from "./gemini.service";
import { text } from "stream/consumers";

export interface AgentAction {
  type: "api_call" | "database_query" | "response";
  function?: string;
  parameters?: any;
  description?: string;
}

export interface AgentResponse {
  response: string;
  code: string;
}

/**
 * Service xử lý logic thông minh cho Agent
 */
export class AgentService {
  private api: API;
  private context: BotContext;
  private event: Message;

  private basePromt = `sau đây tôi sẽ gửi bạn sự kiện, đọc kỹ event cho tôi(mọi thông tin bạn cần đều có đủ) nếu nội dung tôi muốn nhắn cho bạn ở trong của sự kiện, 
đọc và phản hồi theo những cấu hình từ phía trên tôi dạy bạn.
đây là thông tin về sự kiện này:
{event}`;

  getEventInfo(event) {
    return this.basePromt.replace("{event}", event);
  }

  constructor(api: API, context: BotContext) {
    this.api = api;
    this.context = context;
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
  "code": hàm hành động để tôi thực hiện hoặc để trống nếu không cần thực hiện API,
  "response": "phản hồi cho người dùng( đinh dạng string)",
}

LƯU Ý QUAN TRỌNG:
- Nếu bạn cần thực hiện code, hãy trả về đoạn code trong trường "code", phản hồi ng dùng truyền vào response(nếu cần).
- Nếu không cần thực hiện API, chỉ cần trả về phản hồi trong trường "response", "code" để "".
-BẮT BUỘC RESPONSE PHẢI TRẢ VỀ DƯỚI DẠNG JSON, NGOÀI RA KHÔNG ĐƯỢC CÓ KÈM GIẢI THÍCH BÊN NGOÀI JSON
- CODE PHẢI DÙNG JAVA SCRIPT, KHÔNG ĐƯỢC DÙNG CÁC NGÔN NGỮ KHÁC, TÔI CHẠY BACKEND BẰNG NODEJS,DÙNG EVAL ĐỂ CHẠY CODE BẠN GỬI 
MUỐN GỬI PHẢN HỒI TỪ CODE PHẢI DÙNG api.sendMessage
- phản hồi như kiểu nói chuyện bạn bè, không đọc lại câu hỏi của người dùng, chỉ cần trả lời theo yêu cầu của người dùng.
`
    const baseHis = [
      {
        role: "user",
        parts: [
          {
            text: systemPrompt,
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: `{"code": "", "response": "Tôi đã sẵn sàng để phân tích yêu cầu của bạn."}`,
          },
        ],
      },
      {
        role: "user",
        parts: [
          {
            text: 'gửi tin nhắn "chào" để tôi thử xem bạn hiểu không',
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: `{"code": "api.sendMessage({msg: 'chào'}, "00000000000")", "response": "tôi đã làm theo yêu cầu của bạn"}`,
          },
        ],
      },
    ];

    try {
      console.log("Analyzing user request:", userInput);

      const aiResponse = await chat({
        content: this.getEventInfo(userInput),
        his: baseHis,
      });

      // Parse JSON response từ AI
      let analysisResult;
      try {
        const removeMarkdownContent = removeMarkdown(aiResponse.text);

        analysisResult = JSON.parse(removeMarkdownContent);
      } catch (parseError) {
        // Nếu không parse được JSON, trả về response thông thường
        return {
          response: aiResponse.text,
          code: "",
        };
      }

      return {
        response: analysisResult.response || "Không có phản hồi",
        code: analysisResult.code || "",
      };
    } catch (error: any) {
      console.error("Error analyzing user request:", error);
      return {
        response: `❌ Lỗi khi phân tích yêu cầu: ${error.message}`,
        code: "",
      };
    }
  }

  /**
   * Xử lý yêu cầu chính
   */
  async processRequest(userInput: string) {
    try {
      // Phân tích yêu cầu
      const analysis = await this.analyzeUserRequest(userInput);
      console.log("Analysis result:", analysis);

      if (analysis.code && analysis.code.trim() !== "") {
        const asyncFunction = new Function(
          "api",
          "context",
          "event",
          `return (async () => { ${analysis.code} })();`
        );
        asyncFunction(this.api, this.context, JSON.parse(userInput));
      }
      return analysis.response || "Không có phản hồi từ AI.";
    } catch (error: any) {
      console.error("Error processing request:", error);
      return `❌ Lỗi xử lý yêu cầu: ${error.message}`;
    }
  }
}
