import {
  API,
  LoginQRCallbackEvent,
  LoginQRCallbackEventType,
  Message,
} from "zca-js";
import { BotContext, CommandModule, GroupCommands } from "../../common/types";
import { CACHEDIR, RoleBotEnum, RoleUserEnum } from "../../common";
import { createBot } from "../../main";
import { safeBase64 } from "../../utils/download.util";
import * as fs from "fs";
import { Account } from "../../database";
import { waiting } from "../../utils/other.util";
import { renderTextImage } from "../../common/helpers";
import path from "path";

export default {
  config: {
    name: "acc",
    version: "1.0.0",
    credits: "Hung dep trai",
    description: "Upscale hình ảnh",
    tag: "AI",
    usage: "4k rep hình muốn upscale",
    countDown: 1,
    roleUser: RoleUserEnum.ALL,
    roleBot: RoleBotEnum.FREE,
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
          process.exit(0);
        }
        case "reload": {
          await reload(api, context, event, args[1]);
          break;
        }
        case "delete": {
          await deleteAcc(api, context, event, args[1]);
          break;
        }
        case "extend": {
          await extendAcc(api, context, event, args.slice(1));
          break;
        }
        case "role": {
          await setRole(api, context, event, args.slice(1));
          break;
        }
        case "help": {
          api.sendMessage(
            `📜 Danh sách lệnh:\n\n` +
              `- \`add\`: Tạo tài khoản mới bằng QR.\n` +
              `- \`list\`: Hiển thị danh sách tài khoản.\n` +
              `- \`runner\`: Hiển thị danh sách bot đang chạy.\n` +
              `- \`stop <id>\`: Dừng bot theo ID.\n` +
              `- \`stopall\`: Dừng tất cả bot và thoát chương trình.\n` +
              `- \`reload <id|all>\`: Tải lại bot theo ID hoặc tất cả bot.\n` +
              `- \`delete <id>\`: Xóa tài khoản theo ID.\n` +
              `- \`extend <id> <days|inf>\`: Gia hạn tài khoản theo ID và số ngày (hoặc 'inf' cho không giới hạn).\n` +
              `- \`role <id> <role>\`: Cập nhật vai trò của tài khoản theo ID và vai trò mới.`,
            event.threadId,
            event.type
          );
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

  const { handlerReaction, handlerReply, handlerUndo, ...addContext } = context;

  // Thêm tài khoản mới
  await createBot(account, addContext, CACHEDIR, (e: LoginQRCallbackEvent) => {
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
  });
}

async function listAcc(api: API, context: BotContext, event: Message) {
  const accounts = await context.db.account.findAll();
  if (accounts.length === 0) {
    api.sendMessage(
      "📃 Hiện tại không có tài khoản nào trong hệ thống.",
      event.threadId,
      event.type
    );
  } else {
    const accountListText = accounts
      .map((acc, index) => {
        const expired =
          acc.role === RoleBotEnum.ADMIN
            ? "🕒 HSD: Vĩnh viễn"
            : acc.expirationDate
            ? `🕒 HSD: ${acc.expirationDate.toLocaleString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })}`
            : "🕒 HSD: Không có";

        return [
          `🔹 Tài khoản #${index + 1}`,
          `• ID: ${acc.id}`,
          `• ZaloID: ${acc.accountId}${
            api.getOwnId() === acc.accountId ? " (Bot hiện tại)" : ""
          }`,
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

    const outputPath = path.join(
      CACHEDIR,
      `account_list_${Date.now()}.png`
    );

    await renderTextImage(accountListText, outputPath, {
      font: "24px Arial",
      lineHeight: 36,
      padding: 20,
      textColor: "#000",
      backgroundColor: "#fff",
    });

    api.sendMessage(
      {
        msg: "📃 Danh sách tài khoản đã được tạo thành công.",
        quote: event.data,
        attachments: outputPath,
      },
      event.threadId,
      event.type
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
      event.threadId,
      event.type
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
      event.threadId,
      event.type
    );
    return;
  }

  context.botManager.removeBot(id);
}

async function reload(
  api: API,
  context: BotContext,
  event: Message,
  handlerName: string
) {
  if (!handlerName) {
    api.sendMessage(
      {
        msg: "❌ Vui lòng cung cấp id bot cần tải lại.",
        quote: event.data,
      },
      event.threadId,
      event.type
    );
    return;
  }

  await api.sendMessage(
    {
      msg: `🔄 Đang tải lại bot ${handlerName}, hãy đợi 3 đến 5s để có hiệu lực!`,
      quote: event.data,
    },
    event.threadId,
    event.type
  );

  await waiting(1000); // Đợi 1 giây để đảm bảo tất cả bot đã dừng
  try {
    const { handlerReaction, handlerReply, handlerUndo, ...addContext } =
      context;

    if (handlerName === "all") {
      context.botManager.removeAllBots();

      const validAcc = await context.db.account.getActiveAccounts();
      for (const account of validAcc) {
        await createBot(account, addContext, CACHEDIR);
      }
    } else {
      const bot = context.botManager.getBot(handlerName);
      if (!bot) {
        api.sendMessage(
          {
            msg: `❌ Không tìm thấy bot với ID ${handlerName}.`,
            quote: event.data,
          },
          event.threadId,
          event.type
        );
        return;
      }

      const account = await context.db.account.findOne({
        accountId: handlerName,
      });
      if (!account) {
        api.sendMessage(
          {
            msg: `❌ Không tìm thấy tài khoản với ID ${handlerName}.`,
            quote: event.data,
          },
          event.threadId,
          event.type
        );
        return;
      }

      // Dừng bot hiện tại
      context.botManager.removeBot(handlerName);

      await createBot(account, addContext, CACHEDIR);
    }
  } catch (error) {
    console.error("Lỗi khi tải lại handler:", error);
    api.sendMessage(
      {
        msg: `❌ Lỗi khi tải lại bot ${handlerName}: ${error.message}`,
        quote: event.data,
      },
      event.threadId,
      event.type
    );
  }
}

async function deleteAcc(
  api: API,
  context: BotContext,
  event: Message,
  accountId: string
) {
  if (!accountId) {
    api.sendMessage(
      {
        msg: "❌ Vui lòng cung cấp ID tài khoản cần xóa.",
        quote: event.data,
      },
      event.threadId,
      event.type
    );
    return;
  }

  const account = await context.db.account.findOne({ accountId });
  if (!account) {
    api.sendMessage(
      {
        msg: `❌ Không tìm thấy tài khoản với ID ${accountId}.`,
        quote: event.data,
      },
      event.threadId,
      event.type
    );
    return;
  }

  // Xóa bot nếu đang chạy
  try {
    context.botManager.removeBot(accountId);
  } catch (error: any) {
    console.error(`Lỗi khi xóa bot ${accountId}:`, error);
  }

  // Xóa tài khoản khỏi database
  await context.db.account.delete({ accountId });

  api.sendMessage(
    {
      msg: `✅ Tài khoản ${accountId} đã được xóa thành công.`,
      quote: event.data,
    },
    event.threadId,
    event.type
  );
}

async function extendAcc(
  api: API,
  context: BotContext,
  event: Message,
  args: string[]
) {
  if (args.length < 2) {
    api.sendMessage(
      {
        msg: "❌ Vui lòng cung cấp ID tài khoản và thời gian gia hạn (ngày).",
        quote: event.data,
      },
      event.threadId,
      event.type
    );
    return;
  }

  const accountId = args[0];
  let daysToAdd: any;
  if (args[1] == "inf") {
    daysToAdd = null; // Không giới hạn thời gian
  } else {
    daysToAdd = parseInt(args[1]);
    if (isNaN(daysToAdd) || daysToAdd <= 0) {
      api.sendMessage(
        {
          msg: "❌ Vui lòng cung cấp số ngày hợp lệ để gia hạn.",
          quote: event.data,
        },
        event.threadId,
        event.type
      );
      return;
    }
    daysToAdd = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  const account = await context.db.account.findOne({ accountId });
  if (!account) {
    api.sendMessage(
      {
        msg: `❌ Không tìm thấy tài khoản với ID ${accountId}.`,
        quote: event.data,
      },
      event.threadId,
      event.type
    );
    return;
  }

  // Cập nhật ngày hết hạn
  account.expirationDate = daysToAdd;
  await context.db.account.update(
    { accountId },
    { expirationDate: account.expirationDate }
  );

  api.sendMessage(
    {
      msg: `✅ Tài khoản ${accountId} đã được gia hạn thành công. HSD mới: ${
        daysToAdd ? daysToAdd.toLocaleDateString("vi-VN") : "Không giới hạn"
      }`,
      quote: event.data,
    },
    event.threadId,
    event.type
  );
}

async function setRole(
  api: API,
  context: BotContext,
  event: Message,
  args: string[]
) {
  if (args.length < 2) {
    api.sendMessage(
      {
        msg: "❌ Vui lòng cung cấp ID tài khoản và vai trò mới.",
        quote: event.data,
      },
      event.threadId,
      event.type
    );
    return;
  }

  const accountId = args[0];
  const newRole = args[1].toUpperCase();

  if (!Object.values(RoleBotEnum).includes(newRole as RoleBotEnum)) {
    api.sendMessage(
      {
        msg: `❌ Vai trò không hợp lệ. Các vai trò hợp lệ: ${Object.values(
          RoleBotEnum
        ).join(", ")}`,
        quote: event.data,
      },
      event.threadId,
      event.type
    );
    return;
  }

  const account = await context.db.account.findOne({ accountId });
  if (!account) {
    api.sendMessage(
      {
        msg: `❌ Không tìm thấy tài khoản với ID ${accountId}.`,
        quote: event.data,
      },
      event.threadId,
      event.type
    );
    return;
  }

  // Cập nhật vai trò
  account.role = newRole as RoleBotEnum;
  await context.db.account.update({ accountId }, { role: account.role });

  api.sendMessage(
    {
      msg: `✅ Vai trò của tài khoản ${accountId} đã được cập nhật thành ${newRole}.`,
      quote: event.data,
    },
    event.threadId,
    event.type
  );
}
