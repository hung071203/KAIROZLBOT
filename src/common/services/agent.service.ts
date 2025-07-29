import { API, Message } from "zca-js";
import { BotContext } from "../types";
import { chat } from "./gemini.service";
import { Content } from "@google/generative-ai";
import { Logger } from "../../utils/logger.util";

export interface AgentResponse {
  history?: Content[]; // Lịch sử trò chuyện, nếu cần
  data: {
    response: string;
    code: string;
  };
}

/**
 * Service xử lý logic thông minh cho Agent
 */
export class AgentService {
  private api: API;
  private context: BotContext;
  private agentName: string;
  private history: Content[] = [];

  private basePrompt = `Tôi sẽ gửi bạn một sự kiện (event). Hãy đọc kỹ và phản hồi đúng theo nội dung sự kiện.

⚠️ Lưu ý quan trọng:
- MỌI THÔNG TIN BẠN CẦN đều đã có trong event.
- ĐỪNG BAO GIỜ yêu cầu thêm thông tin ngoài event.
- Nếu nội dung tôi muốn nhắn cho bạn nằm trong event, bạn phải phản hồi chính xác theo nội dung đó.
- có code bắt bộc phải dùng await nếu có gọi bất đông bộ, kể cả không cần trả về dữ liệu từ nó.

Bạn phải phản hồi dựa trên các cấu hình mà tôi đã hướng dẫn trước đó.

Dưới đây là thông tin về sự kiện:
{event}`;

  getEventInfo(event) {
    return this.basePrompt.replace("{event}", event);
  }

  constructor(
    api: API,
    context: BotContext,
    agentName: string,
    history?: Content[]
  ) {
    this.api = api;
    this.context = context;
    this.agentName = agentName;

    if (history && Array.isArray(history)) {
      this.history = history;
    }
  }

  /**
   * Phân tích yêu cầu của người dùng và xác định hành động cần thực hiện
   */
  async analyzeUserRequest(userInput: string): Promise<AgentResponse> {
    // Tạo system prompt với cấu hình agent
    const systemPrompt = `Bạn tên là ${this.agentName}, 1 người quản lý nhóm thông minh của KAIROZLBOT - một trợ lý có thể thực hiện tất cả các hành động tự động trên Zalo.

🔧 CÁC API ZALO CÓ SẴN (với signature chi tiết, tất cả đều dùng async):
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
// ✅ Tạo nhóm chat mới với tên, thành viên và ảnh đại diện tùy chọn

api.addUserToGroup(memberId: string | string[], threadId: string): Promise<AddUserToGroupResponse> 
// ➕ Thêm một hoặc nhiều thành viên vào nhóm đã tồn tại

api.removeUserFromGroup(memberId: string | string[], threadId: string): Promise<""> 
// ➖ Xoá một hoặc nhiều thành viên khỏi nhóm

api.changeGroupName(name: string, threadId: string): Promise<ChangeGroupNameResponse> 
// ✏️ Đổi tên nhóm

api.changeGroupAvatar(avatarSource: AttachmentSource, threadId: string): Promise<""> 
// 🖼️ Đổi ảnh đại diện của nhóm

api.changeGroupOwner(memberId: string, threadId: string): Promise<ChangeGroupOwnerResponse> 
// 👑 Chuyển quyền trưởng nhóm cho một thành viên khác

api.addGroupDeputy(memberId: string | string[], threadId: string): Promise<""> 
// 🎖️ Thêm một hoặc nhiều thành viên làm phó nhóm

api.removeGroupDeputy(memberId: string | string[], threadId: string): Promise<""> 
// ❌ Gỡ quyền phó nhóm của một hoặc nhiều thành viên

api.leaveGroup(threadId: string): Promise<""> 
// 🚪 Rời khỏi nhóm (dành cho chính mình)

api.disperseGroup(threadId: string): Promise<""> 
// 💥 Giải tán nhóm (chỉ trưởng nhóm mới có quyền)

 3. MESSAGE APIS
// Gửi tin nhắn
api.sendMessage(message: MessageContent | string, threadId: string, type?: ThreadType): Promise<SendMessageResponse>
// MessageContent object:
{
  msg: string,                           // Nội dung tin nhắn (bắt buộc)
  styles?: Style[],                      // Định dạng text
  urgency?: Urgency,                     // Mức độ ưu tiên (0: Default, 1: Important, 2: Urgent)
  quote?: SendMessageQuote,              // Rep tin nhắn khác
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

api.deleteMessage(dest: { data: { cliMsgId: string, msgId: string, uidFrom: string }, threadId: string, type?: ThreadType }, onlyMe?: boolean): Promise<{ status: number }>


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


// Tiện ích
api.uploadAttachment(sources: AttachmentSource | AttachmentSource[], threadId: string, type?: ThreadType): Promise<UploadAttachmentType[]>
// AttachmentSource = string | {
    data: Buffer;
    filename: \${string}.\${string};
    metadata: {
        totalSize: number;
        width?: number;
        height?: number;
    };
};
// export type UploadAttachmentType = ImageResponse | VideoResponse | FileResponse;
// type ImageResponse = {
    normalUrl: string;
    photoId: string;
    finished: number;
    hdUrl: string;
    thumbUrl: string;
    clientFileId: string;
    chunkId: number;
    fileType: "image";
    width: number;
    height: number;
    totalSize: number;
    hdSize: number;
};
type VideoResponse = {
    finished: number;
    clientFileId: number;
    chunkId: number;
    fileType: "video";
    fileUrl: string;
    fileId: string;
    checksum: string;
    totalSize: number;
    fileName: string;
};
type FileResponse = {
    finished: number;
    clientFileId: number;
    chunkId: number;
    fileType: "others";
    fileUrl: string;
    fileId: string;
    checksum: string;
    totalSize: number;
    fileName: string;
};

api.keepAlive(): Promise<{config_vesion: number;}>

// Tin nhắn nhanh
api.addQuickMessage(payload: AddQuickMessagePayload): Promise<AddQuickMessageResponse>
// AddQuickMessagePayload: {keyword: string, title: string}
//AddQuickMessageResponse = { items: QuickMessage[]; version: number};
// QuickMessage = {
    id: number;
    keyword: string;
    type: number;
    createdTime: number;
    lastModified: number;
    message: {
        title: string;
        params: string | null;
    };
    media: null;
};

api.getQuickMessage(): Promise<QuickMessageResponse>
//GetQuickMessageResponse = {
    cursor: number;
    version: number;
    items: {
        id: number;
        keyword: string;
        type: number;
        createdTime: number;
        lastModified: number;
        message: {
            title: string;
            params: string | null;
        };
        media: {
            items: QuickMessageMediaItem[];
        } | null;
    }[];
};
//QuickMessageMediaItem = {
    type: number;
    photoId: number;
    title: string;
    width: number;
    height: number;
    previewThumb: string;
    rawUrl: string;
    thumbUrl: string;
    normalUrl: string;
    hdUrl: string;
};

api.updateQuickMessage(updatePayload: UpdateQuickMessagePayload, itemId: number): Promise<UpdateQuickMessageResponse>
//UpdateQuickMessageResponse = {
    items: QuickMessage[];
    version: number;
};
//QuickMessage = {
    id: number;
    keyword: string;
    type: number;
    createdTime: number;
    lastModified: number;
    message: {
        title: string;
        params: string | null;
    };
    media: null;
};
//UpdateQuickMessagePayload = {
    keyword: string;
    title: string;
};

api.removeQuickMessage(itemIds: number | number[]): Promise<RemoveQuickMessageResponse>
//RemoveQuickMessageResponse = {
    itemIds: number[];
    version: number;
}

// Lời nhắc
api.createReminder(reminderData: CreateReminderData): Promise<CreateReminderResponse>
// CreateReminderData: {content: string, time: number, threadId: string}
api.getReminder(reminderId: string): Promise<ReminderInfo>
api.removeReminder(reminderId: string): Promise<"">

// Bình chọn
api.createPoll(options: CreatePollOptions, threadId: string): Promise<CreatePollResponse>
// CreatePollOptions = {
    /**
     * Question for the poll.
     */
    question: string;
    /**
     * List of options for the poll.
     */
    options: string[];
    /**
     * Poll expiration time in milliseconds (0 = no expiration).
     */
    expiredTime?: number;
    /**
     * Allows multiple choices in the poll.
     */
    allowMultiChoices?: boolean;
    /**
     * Allows members to add new options to the poll.
     */
    allowAddNewOption?: boolean;
    /**
     * Hides voting results until the user has voted.
     */
    hideVotePreview?: boolean;
    /**
     * Hides poll voters (anonymous poll).
     */
    isAnonymous?: boolean;
};
//CreatePollResponse = {
    creator: string;
    question: string;
    options: {
        content: string;
        votes: number;
        voted: boolean;
        voters: string[];
        option_id: number;
    }[];
    joined: boolean;
    closed: boolean;
    poll_id: string;
    allow_multi_choices: boolean;
    allow_add_new_option: boolean;
    is_anonymous: boolean;
    poll_type: number;
    created_time: number;
    updated_time: number;
    expired_time: number;
    is_hide_vote_preview: boolean;
    num_vote: number;
};

api.getPollDetail(pollId: string): Promise<PollDetail>
//PollDetail = {
    creator: string;
    question: string;
    options: PollOptions[];
    joined: boolean;
    closed: boolean;
    poll_id: number;
    allow_multi_choices: boolean;
    allow_add_new_option: boolean;
    is_anonymous: boolean;
    poll_type: number;
    created_time: number;
    updated_time: number;
    expired_time: number;
    is_hide_vote_preview: boolean;
    num_vote: number;
};

api.lockPoll(pollId: number): Promise<"">


7. EVENTS & STATUS
// Sự kiện cuộc trò chuyện
api.sendDeliveredEvent(isSeen: boolean, messages: SendDeliveredEventMessageParams | SendDeliveredEventMessageParams[], type?: ThreadType): Promise<SendDeliveredEventResponse>
// SendDeliveredEventMessageParams: { msgId: string, cliMsgId: string, uidFrom: string, idTo: string, msgType: string, st: number, at: number, cmd: number, ts: string | number }
api.sendSeenEvent(messages: SendSeenEventMessageParams | SendSeenEventMessageParams[], type?: ThreadType): Promise<SendSeenEventResponse>
// SendSeenEventMessageParams: { msgId: string, cliMsgId: string, uidFrom: string, idTo: string, msgType: string, st: number, at: number, cmd: number, ts: string | number }
api.sendTypingEvent(threadId: string, type?: ThreadType, destType?: DestType): Promise<{status: number;}>
//enum DestType { User = 3, Page = 5}

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
api.updateLang(language: UpdateLangAvailableLanguages): Promise<"">
// UpdateLangAvailableLanguages:  VI, EN

// Sticker
api.getStickers(): Promise<StickersResponse>
api.getStickersDetail(stickerIds: number | number[]): Promise<StickerDetailResponse>
// StickerDetailResponse: StickerDetail[]
// StickerDetail = {
    id: number;
    cateId: number;
    type: number;
    text: string;
    uri: string;
    fkey: number;
    status: number;
    stickerUrl: string;
    stickerSpriteUrl: string;
    stickerWebpUrl: any;
    totalFrames: number;
    duration: number;
    effectId: number;
    checksum: string;
    ext: number;
    source: number;
    fss: any;
    fssInfo: any;
    version: number;
    extInfo: any;
}


ENUMS & TYPES
// ThreadType
USER = 0           // Chat 1-1
GROUP = 1         // Chat nhóm

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
  "continue": true/false (nếu true thì )
}

LƯU Ý QUAN TRỌNG:
- Bạn có toàn quyền dùng các api trên để trò chuyện với cá nhân hay là quản lý nhóm zalo.
- MUỐN GỬI PHẢN HỒI TỪ CODE cho tôi PHẢI DÙNG api.sendMessage
- Nếu bạn cần thực hiện code, hãy trả về đoạn code trong trường "code", phản hồi ng dùng truyền vào response(nếu cần).
- Nếu không cần thực hiện API, chỉ cần trả về phản hồi trong trường "response", "code" để "".
- BẮT BUỘC RESPONSE PHẢI TRẢ VỀ DƯỚI DẠNG JSON, NGOÀI RA KHÔNG ĐƯỢC CÓ KÈM GIẢI THÍCH BÊN NGOÀI JSON


- CODE PHẢI DÙNG JAVA SCRIPT, KHÔNG ĐƯỢC DÙNG CÁC NGÔN NGỮ KHÁC, TÔI CHẠY BACKEND BẰNG NODEJS,DÙNG EVAL ĐỂ CHẠY CODE BẠN GỬI
- CODE DÙNG ASYNC AWAIT, NẾU BẠN CÓ HÀNH ĐỘNG BẤT ĐỒNG BỘ, TUYỆT ĐỐI KHÔNG DÙNG THEN CATCH, CHỈ DÙNG ASYNC AWAIT

- phản hồi như kiểu nói chuyện bạn bè, không đọc lại câu hỏi của người dùng, chỉ cần trả lời theo yêu cầu của người dùng.
- Đề nghị trả về code nếu bạn cảm thấy cần(hoặc những tác vụ mà bạn không làm dc trực tiếp), kể cả khi đơn giản.
- QUAN TRỌNG NHẤT, HÃY ĐỌC KỸ CÁCH DÙNG HÀM api.sendMessage, CÁCH TRUYỀN CÁC THAM SỐ VÀO HÀM TẠI VÌ BẠN SẼ DÙNG NÓ NHIỀU và nếu bảo bạn gửi tin nhắn, tùy trường hợp nhưng có thể bạn không cần tin nhắn phản hồi trong response đâu.

- đối với các enum khi dùng trong code chỉ truyền giá trị thôi chứ k truyền enum vào
`;
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
            text: `{"code": "api.sendMessage({msg: 'chào'}, "00000000000", 0)", "response": "tôi đã làm theo yêu cầu của bạn"}`,
          },
        ],
      },
    ];

    try {
      const aiResponse = await chat({
        content: this.getEventInfo(userInput),
        his: this.history.length > 0 ? this.history : baseHis,
      });
      Logger.debug("AI response:", aiResponse);

      let res = aiResponse.text;
      // Extract the JSON part from the text
      if (!aiResponse.text.startsWith("{")) {
        const jsonStringMatch = res.match(/```json\n([\s\S]*?)\n```/);
        if (!jsonStringMatch) {
          throw new Error("Không tìm thấy JSON hợp lệ trong văn bản.");
        }
        res = jsonStringMatch[1].trim();
      }

      const json = JSON.parse(res);

      return {
        history: aiResponse.his,
        data: {
          response: json.response || "Không có phản hồi từ AI.",
          code: json.code || "",
        },
      };
    } catch (error: any) {
      Logger.error("Error analyzing user request:", error);
      return {
        history: baseHis,
        data: {
          response: `❌ Lỗi phân tích yêu cầu: ${error.message}`,
          code: "",
        },
      };
    }
  }

  /**
   * Xử lý yêu cầu chính
   */
  async processRequest(userInput: string) {
    try {
      // Phân tích yêu cầu
      const res = await this.analyzeUserRequest(userInput);
      const analysis = res.data;
      Logger.debug("Analysis result:", analysis);

      if (analysis.code && analysis.code.trim() !== "") {
        const functionBody = `
            return (async () => {
                try {
                ${analysis.code}
                } catch (err) {
                Logger.error("❌ Lỗi trong code:", err);
                api.sendMessage?.({ msg: '❌ Đã xảy ra lỗi khi thực thi lệnh.' }, event.threadId, event.type);
                }
            })();
            `;

        const asyncFunction = new Function(
          "api",
          "context",
          "event",
          functionBody
        );
        asyncFunction(this.api, this.context, JSON.parse(userInput)).catch(
          (err: any) => {
            this.api.sendMessage(
              {
                msg: `❌ Đã xảy ra lỗi khi thực thi lệnh: ${err.message}`,
                quote: JSON.parse(userInput).data,
              },
              JSON.parse(userInput).threadId,
              JSON.parse(userInput).type
            );
          }
        );
      }
      return {
        success: true,
        response: analysis.response || "Không có phản hồi từ AI.",
        history: res.history,
      };
    } catch (error: any) {
      Logger.error("Error processing request:", error);
      return {
        success: false,
        response: `❌ Lỗi khi xử lý yêu cầu: ${error.message}`,
        history: [],
      };
    }
  }
}
