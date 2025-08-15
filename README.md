# KAIROZLBOT 🤖

Bot Zalo thông minh được xây dựng bằng TypeScript với thư viện ZCA-JS, hỗ trợ AI tích hợp và quản lý nhiều tài khoản.

## ✨ Tính năng chính

- 🤖 **AI Chat tích hợp**: Gemini AI với khả năng xử lý thông minh
- � **Quản lý nhiều tài khoản**: Chạy đồng thời nhiều bot
- 🔐 **Đăng nhập linh hoạt**: Cookie và QR Code
- 🌐 **Hỗ trợ Proxy**: HTTP, HTTPS, SOCKS4, SOCKS5
- 🗄️ **Database SQLite**: Lưu trữ cấu hình và dữ liệu
- 📊 **Hệ thống quyền**: FREE, PRO, ADMIN
- 🎨 **Canvas Processing**: Xử lý hình ảnh
- 📝 **Command System**: Cấu trúc modular dễ mở rộng

## �🚀 Cài đặt

1. **Clone dự án**:
```bash
git clone https://github.com/hung071203/KAIROZLBOT.git
cd KAIROZLBOT
```

2. **Cài đặt dependencies**:
```bash
npm install
```

3. **Cấu hình môi trường**:
```bash
copy configs/config.json.example configs/config.json
copy configs/account.json.example configs/account.json
```

## 🤖 Quản lý tài khoản

### Các tính năng hỗ trợ:
- ✅ **Nhiều phương thức đăng nhập**: Cookie và QR Code
- ✅ **Proxy riêng biệt**: Mỗi tài khoản có thể sử dụng proxy khác nhau
- ✅ **Database quản lý**: SQLite với TypeORM
- ✅ **CLI quản lý**: Tool dòng lệnh để quản lý tài khoản

### Sử dụng Account CLI:
```bash
# Quản lý tài khoản qua CLI
npm run acc-cli

# Hoặc trong bot chat
/acc add     # Thêm tài khoản mới
/acc list    # Xem danh sách tài khoản
/acc runner  # Xem bot đang chạy
/acc stop <id>  # Dừng bot theo ID
```

### Các loại proxy hỗ trợ:
- `http://username:password@host:port`
- `https://username:password@host:port`  
- `socks4://username:password@host:port`
- `socks5://username:password@host:port`

## 🔐 Thiết lập đăng nhập

Bot hỗ trợ 2 phương thức đăng nhập:

### Phương thức 1: Đăng nhập bằng QR Code (Khuyến nghị)

1. **Chạy bot**:
```bash
npm run dev
```

2. **Sử dụng lệnh trong chat**:
```
/acc add
```

3. **Quét QR code** được gửi từ bot
4. Bot sẽ tự động đăng nhập và lưu thông tin

### Phương thức 2: Đăng nhập bằng Cookie

#### Bước 1: Lấy thông tin cần thiết

1. Mở trình duyệt và đăng nhập vào [Zalo Web](https://chat.zalo.me/)
2. Mở DevTools (F12) và vào tab Console
3. Lấy IMEI:
   ```javascript
   localStorage.getItem('z_uuid') || localStorage.getItem('sh_z_uuid')
   ```
4. Lấy User Agent:
   ```javascript
   navigator.userAgent
   ```
5. Export cookie bằng extension [J2TEAM Cookies](https://chromewebstore.google.com/detail/j2team-cookies/okpidcojinmlaakglciglbpcpajaibco)

#### Bước 2: Cấu hình database

1. Thêm tài khoản vào database qua CLI:
```bash
npm run acc-cli
```

2. Hoặc cập nhật trực tiếp trong file `configs/account.json`

## 📝 Sử dụng

### Development:
```bash
npm run dev        # Chạy với ts-node
npm run dev:w      # Watch mode với ts-node-dev
```

### Production:
```bash
npm run build      # Build TypeScript
npm start          # Chạy file đã build
```

### Quản lý tài khoản:
```bash
npm run acc-cli    # CLI tool quản lý tài khoản
```

## 🎯 Danh sách lệnh

### 🤖 AI Commands
- `/ai <câu hỏi>` - Chat với Gemini AI
- `/agent <yêu cầu>` - AI Agent thông minh với khả năng thực thi API và truy vấn database

### 🖼️ Image Commands  
- `/4k` - Upscale hình ảnh (đang phát triển)

### ⚙️ System Commands
- `/menu` - Hiển thị danh sách lệnh
- `/reload <handler_name>` - Reload handler cụ thể

### 👥 Account Management
- `/acc add` - Thêm tài khoản mới bằng QR
- `/acc list` - Hiển thị danh sách tài khoản
- `/acc runner` - Xem bot đang chạy
- `/acc stop <id>` - Dừng bot theo ID
- `/acc stopall` - Dừng tất cả bot
- `/acc delete <id>` - Xóa tài khoản
- `/acc extend <id> <days>` - Gia hạn tài khoản
- `/acc role <id> <role>` - Thiết lập quyền (FREE/PRO/ADMIN)
- `/acc help` - Hướng dẫn sử dụng

## 🛠 Cấu trúc dự án

```
src/
├── main.ts                 # Entry point
├── account-cli.ts          # CLI tool quản lý tài khoản
├── common/                 # Shared utilities
│   ├── constants/          # Hằng số
│   ├── enums/             # Enums
│   ├── helpers/           # Helper functions
│   ├── services/          # Services (AI, Chat)
│   └── types/             # TypeScript types
├── configs/               # Cấu hình
│   ├── app.config.ts      # App configuration
│   ├── database.config.ts # Database setup
│   └── zalo.config.ts     # Zalo bot configuration
├── database/              # Database layer
│   ├── entities/          # TypeORM entities
│   └── services/          # Database services
├── handlers/              # Event và command handlers
├── modules/               # Bot modules
│   ├── commands/          # Lệnh bot
│   └── events/            # Event listeners
└── utils/                 # Utilities
```

## 🔧 Tùy chỉnh

### Thêm lệnh mới

1. **Tạo file lệnh** trong `src/modules/commands/`:

```typescript
import { API, Message } from "zca-js";
import { BotContext, CommandModule } from "../../common/types";
import { RoleBotEnum, RoleUserEnum } from "../../common";

export default {
  config: {
    name: "tenlệnh",
    version: "1.0.0",
    credits: "Your Name",
    description: "Mô tả lệnh",
    tag: "Category",
    usage: "cách sử dụng",
    countDown: 5, // Cooldown giây
    roleUser: RoleUserEnum.ALL,
    roleBot: RoleBotEnum.FREE,
    self: true,
  },

  run: async (api: API, context: BotContext, event: Message, args: string[]) => {
    // Logic xử lý lệnh
    api.sendMessage("Hello World!", event.threadId);
  },
} as CommandModule;
```

2. **Bot sẽ tự động load** lệnh mới khi khởi động

### Thêm event listener

1. **Tạo file event** trong `src/modules/events/`:

```typescript
import { API } from "zca-js";
import { BotContext, GroupEvents } from "../../common/types";

export default {
  config: {
    name: "eventname",
    version: "1.0.0",
    credits: "Your Name",
    description: "Event description",
    tag: "core",
  },

  handlerEvent: async (api: API, context: BotContext, event: any) => {
    // Xử lý event
  },
} as GroupEvents;
```
```

## 📚 API Classes

### KairoZLBot
Bot chính với các phương thức:
- `loginWithCookie(loginData)` - Đăng nhập bằng cookie
- `loginWithQR(options)` - Đăng nhập bằng QR code  
- `autoLogin()` - Tự động chọn phương thức đăng nhập
- `setupListeners()` - Thiết lập event listeners
- `start()` - Bắt đầu bot
- `stop()` - Dừng bot
- `getAccountInfo()` - Lấy thông tin tài khoản

### MultiAccountBotManager
Quản lý nhiều bot:
- `addBot(config)` - Thêm bot mới
- `removeBot(accountId)` - Xóa bot
- `getAllBots()` - Lấy danh sách bot
- `stopAll()` - Dừng tất cả bot

### DatabaseManager
Quản lý database SQLite:
- `account` - Service quản lý tài khoản
- `isConnected` - Kiểm tra kết nối

## 🔌 Dependencies chính

- **zca-js**: Thư viện Zalo Chat API
- **@google/generative-ai**: Gemini AI integration
- **typeorm**: ORM cho SQLite
- **canvas**: Xử lý hình ảnh
- **axios**: HTTP client
- **chalk**: Terminal styling

## ⚠️ Lưu ý quan trọng

- ⚠️ **Tuân thủ ToS**: Việc sử dụng bot có thể vi phạm điều khoản sử dụng của Zalo
- 🔒 **Bảo mật tài khoản**: Tài khoản có thể bị khóa nếu sử dụng không đúng cách
- 🎓 **Mục đích**: Chỉ sử dụng cho mục đích học tập và thử nghiệm
- 📋 **Trách nhiệm**: Tác giả không chịu trách nhiệm về việc tài khoản bị khóa

## 🔗 Tài liệu tham khảo

- [ZCA-JS Documentation](https://tdung.gitbook.io/zca-js)
- [ZCA-JS GitHub](https://github.com/Khoa31102001/zca-js)
- [TypeORM Documentation](https://typeorm.io/)
- [Gemini AI Documentation](https://ai.google.dev/)

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 👤 Tác giả

- **Hung071203** - *Initial work* - [GitHub](https://github.com/hung071203)

---

> ⭐ Nếu dự án hữu ích, hãy cho một star nhé!