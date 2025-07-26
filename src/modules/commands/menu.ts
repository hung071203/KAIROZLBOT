import { API, Message } from "zca-js";
import { BotContext, CommandModule } from "../../common/types";
import { RoleEnum } from "../../common";

export default {
  config: {
    name: "menu",
    version: "1.0.0",
    credits: "Hung dep trai",
    description: "Hiển thị danh sách các lệnh có sẵn",
    tag: "Utility",
    usage: "menu",
    countDown: 10,
    role: RoleEnum.ALL,
    self: true,
  },

  run: async (api: API, context: BotContext, event: Message, args: string[]) => {
      // Lấy danh sách commands từ handlerManager trong context
      const commands = context.handlerManager?.getCommands();
      
      if (!commands || commands.size === 0) {
        api.sendMessage("Không tìm thấy lệnh nào trong hệ thống.", event.threadId);
        return;
      }

      let menuMessage = "📋 DANH SÁCH CÁC LỆNH:\n\n";
      
      // Duyệt qua tất cả commands đã load
      for (const [commandName, command] of commands) {
        const { name, description, usage, tag } = command.config;
        menuMessage += `🔹 Tên: ${name}\n`;
        menuMessage += `📝 Mô tả: ${description}\n`;
        menuMessage += `💡 Cách dùng: ${usage}\n`;
        menuMessage += `🏷️ Danh mục: ${tag}\n`;
        menuMessage += "─────────────────\n";
      }

      menuMessage += "\n💬 Sử dụng các lệnh theo cú pháp được chỉ định ở trên.";

      api.sendMessage(menuMessage, event.threadId);
  },
} as CommandModule;
