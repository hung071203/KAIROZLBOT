import { DeepAiChatRole, DeepAiChatStyleEnum, DeepAiModelEnum } from "../enums";

export interface IChatDeepAi {
  /** Ai sử dụng để trò chuyện */
  style?: DeepAiChatStyleEnum;

  /** Câu hỏi hoặc truy vấn để trò chuyện với AI */
  content: string;

  /** model sử dụng để trò chuyện với AI */
  model?: DeepAiModelEnum;

  /** Lịch sử trò chuyện với AI */
  history?: IChatDeepAiHistory[];

  /** link ảnh muốn hỏi */
  url?: string;
}

export interface IChatDeepAiHistory {
  /** role của người dùng */
  role: DeepAiChatRole;

  /** Nội dung của tin nhắn */
  content: string;
}