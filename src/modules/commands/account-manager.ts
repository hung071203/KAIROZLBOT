import {
  API,
  LoginQRCallbackEvent,
  LoginQRCallbackEventType,
  Message,
} from "zca-js";
import { BotContext, CommandModule, GroupCommands } from "../../common/types";
import { CACHEDIR, RoleEnum } from "../../common";
import { createBot } from "../../main";
import { safeBase64 } from "../../utils/download.util";
import * as fs from "fs";
import { Account } from "../../database";

export default {
  config: {
    name: "account",
    version: "1.0.0",
    credits: "Hung dep trai",
    description: "Upscale hình ảnh",
    tag: "AI",
    usage: "4k rep hình muốn upscale",
    countDown: 1,
    role: RoleEnum.ALL,
    self: true, // Chỉ dành cho bot cá nhân
  },

  run: async (
    api: API,
    context: BotContext,
    event: Message,
    args: string[]
  ) => {
    try {
      // Kiểm tra xem có tham số nào không
      if (args.length === 0) {
        api.sendMessage(
          "❌ Vui lòng cung cấp tham số cho lệnh account.",
          event.threadId
        );
        return;
      }

      // Xử lý lệnh account
      const command = args[0].toLowerCase();
      switch (command) {
        case "add": {
          await addAcc(api, context, event);
          break;
        }
        case "list": {
          await listAcc(api, context, event);
          break;
        }
        case "runner": {
          await runner(api, context, event);
          break;
        }
        case "stop": {
          await stop(api, context, event, args[1]);
          break;
        }
        case "stopall": {
          await stopAll(api, context, event);
          break;
        }
        default:
          api.sendMessage(
            {
              msg: `❌ Lệnh không hợp lệ.`,
              quote: event.data,
            },
            event.threadId,
            event.type
          );
      }
    } catch (error: any) {
      console.error("Lỗi khi thực thi lệnh account:", error);
      api.sendMessage(
        {
          msg: `❌ Lỗi khi thực thi lệnh account: ${error.message}`,
          quote: event.data,
        },
        event.threadId,
        event.type
      );
      return;
    }
  },
} as GroupCommands;

async function addAcc(api: API, context: BotContext, event: Message) {
  await api.sendMessage(
    {
      msg: `📦 Tiến hành tạo tài khoản bằng QR.`,
      quote: event.data,
    },
    event.threadId,
    event.type
  );

  const account: Partial<Account> = {
    accountId: Date.now().toString(), // Tạo ID ngẫu nhiên
    loginMethod: "qr", // Hoặc "cookie" tùy vào yêu cầu
    cookie: "",
    imei: "1234567890", // Thay đổi theo yêu cầu
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
  };

  // Tạo tài khoản mẫu
  await context.db.account.create(account);

  // Thêm tài khoản mới
  await createBot(
    account,
    context.botManager,
    CACHEDIR,
    context.db,
    context.appConfig,
    (e: LoginQRCallbackEvent) => {
      const type = e.type;

      console.log(e);

      switch (type) {
        case LoginQRCallbackEventType.QRCodeGenerated: {
          const qrPath = CACHEDIR + `/qr_${account.accountId}.png`;
          safeBase64(qrPath, `data:image/png;base64,${e.data.image}`);

          const buffer = fs.readFileSync(qrPath); // Đọc file ảnh đồng bộ
          const stats = fs.statSync(qrPath); // Lấy thông tin file

          api.sendMessage(
            {
              msg: `📸 Vui lòng quét mã QR để đăng nhập.`,
              quote: event.data,
              attachments: [
                {
                  data: buffer,
                  filename: `qr_${account.accountId}.png`,
                  metadata: {
                    totalSize: stats.size,
                  },
                },
              ],
            },
            event.threadId,
            event.type
          );

          break;
        }
        case LoginQRCallbackEventType.QRCodeDeclined: {
          api.sendMessage(
            {
              msg: `❌ Bạn đã từ chối mã QR. Vui lòng thử lại.`,
              quote: event.data,
            },
            event.threadId,
            event.type
          );
          context.db.account.delete({
            accountId: account.accountId,
          });
          break;
        }
        case LoginQRCallbackEventType.QRCodeScanned: {
          api.sendMessage(
            {
              msg: `✅ Mã QR đã được quét bởi tài khoản có tên ${e.data.display_name}. Vui lòng chờ đăng nhập.`,
              quote: event.data,
            },
            event.threadId,
            event.type
          );
          break;
        }
        case LoginQRCallbackEventType.QRCodeExpired: {
          api.sendMessage(
            {
              msg: `❌ Mã QR đã hết hạn. Vui lòng thử lại.`,
              quote: event.data,
            },
            event.threadId,
            event.type
          );
          context.db.account.delete({
            accountId: account.accountId,
          });
          break;
        }
        case LoginQRCallbackEventType.GotLoginInfo: {
          api.sendMessage(
            {
              msg: `✅ Đăng nhập thành công với tài khoản ${e.data.imei}.`,
              quote: event.data,
            },
            event.threadId,
            event.type
          );
          // Cập nhật thông tin tài khoản
          context.db.account.update(
            {
              accountId: account.accountId,
            },
            {
              cookie: JSON.stringify(e.data.cookie),
              imei: e.data.imei,
              userAgent: e.data.userAgent,
              loginMethod: "cookie", // Cập nhật phương thức đăng nhập
            }
          );
          break;
        }
        default:
          break;
      }
    }
  );
}

async function listAcc(api: API, context: BotContext, event: Message) {
  const accounts = await context.db.account.findAll();
  if (accounts.length === 0) {
    api.sendMessage(
      "📃 Hiện tại không có tài khoản nào trong hệ thống.",
      event.threadId
    );
  } else {
    const accountList = accounts
      .map((acc, index) => {
        const expired = acc.expirationDate
          ? `🕒 HSD: ${acc.expirationDate.toLocaleDateString("vi-VN")}`
          : "🕒 HSD: Không có";
        return [
          `🔹 Tài khoản #${index + 1}`,
          `• ID: ${acc.id}`,
          `• ZaloID: ${acc.accountId}`,
          `• Đăng nhập: ${acc.loginMethod.toUpperCase()}`,
          `• Trạng thái: ${
            acc.isActive ? "✅ Hoạt động" : "❌ Không hoạt động"
          }`,
          `• Vai trò: ${acc.role}`,
          `• ${expired}`,
          `• Tạo lúc: ${acc.createdAt.toLocaleString("vi-VN")}`,
        ].join("\n");
      })
      .join("\n\n");

    api.sendMessage(
      `📃 Danh sách tài khoản:\n\n${accountList}`,
      event.threadId
    );
  }
}

async function runner(api: API, context: BotContext, event: Message) {
  const multiAcc = context.botManager.getAllBots();
  if (multiAcc.length === 0) {
    api.sendMessage("📃 Hiện tại không có bot nào đang chạy.", event.threadId);
    return;
  }
  // console.log(multiAcc);
  const msg = multiAcc
    .map((bot, index) => {
      return [`🔹 Bot #${index + 1}`, `• ID: ${bot.getAccountId()}`].join("\n");
    })
    .join("\n\n");

  api.sendMessage(
    {
      msg,
      quote: event.data,
    },
    event.threadId,
    event.type
  );
}

async function stop(api: API, context: BotContext, event: Message, id: string) {
  if (!id) {
    api.sendMessage(
      {
        msg: "❌ Vui lòng cung cấp ID bot cần dừng.",
        quote: event.data,
      },
      event.threadId
    );
    return;
  }

  const bot = context.botManager.getBot(id);
  if (!bot) {
    api.sendMessage(
      {
        msg: `❌ Không tìm thấy bot với ID ${id}.`,
        quote: event.data,
      },
      event.threadId
    );
    return;
  }

  context.botManager.removeBot(id);
}

async function stopAll(api: API, context: BotContext, event: Message) {
  context.botManager.stopAllBots();
}
