# KAIROZLBOT

Bot Zalo được xây dựng bằng TypeScript và thư viện ZCA-JS.

## 🚀 Cài đặt

1. Clone dự án và cài đặt dependencies:
```bash
npm install
```

2. Copy file cấu hình:
```bash
copy .env.example .env
```

## 🤖 Sử dụng nhiều tài khoản

Bot hỗ trợ chạy nhiều tài khoản đồng thời với các phương thức đăng nhập khác nhau:

### Các tính năng hỗ trợ:
- ✅ **Nhiều phương thức đăng nhập**: Cookie và QR Code
- ✅ **Proxy riêng biệt**: Mỗi tài khoản có thể sử dụng proxy khác nhau
- ✅ **Cấu hình linh hoạt**: Tùy chỉnh từng bot riêng biệt

### Ví dụ cấu hình:

```typescript
import { MultiAccountBotManager } from "./src/configs";

const botManager = new MultiAccountBotManager();

// Bot 1: Cookie + Không proxy
await botManager.addBot({
  accountId: "bot1",
  loginMethod: "cookie",
  cookie: cookieData,
  imei: "imei_1",
  userAgent: "user_agent_1"
});

// Bot 2: QR + Proxy HTTP
await botManager.addBot({
  accountId: "bot2", 
  loginMethod: "qr",
  proxyConfig: {
    enabled: true,
    url: "http://user:pass@proxy.com:8080"
  }
});

// Bot 3: Cookie + Proxy SOCKS5
await botManager.addBot({
  accountId: "bot3",
  loginMethod: "cookie",
  cookie: cookieData3,
  imei: "imei_3", 
  userAgent: "user_agent_3",
  proxyConfig: {
    enabled: true,
    url: "socks5://user:pass@proxy.com:1080"
  }
});
```

### Các loại proxy hỗ trợ:
- `http://username:password@host:port`
- `https://username:password@host:port`  
- `socks4://username:password@host:port`
- `socks5://username:password@host:port`

## 🔐 Thiết lập đăng nhập

Bot hỗ trợ 2 phương thức đăng nhập:

### Phương thức 1: Đăng nhập bằng QR Code (Khuyến nghị)

Đây là cách đơn giản nhất. Bot sẽ tự động tạo QR code, bạn chỉ cần:

1. Chạy bot:
```bash
npm run dev
```

2. Mở app Zalo trên điện thoại
3. Scan QR code hiển thị trong file `qr.png`
4. Bot sẽ tự động đăng nhập

### Phương thức 2: Đăng nhập bằng Cookie

Phức tạp hơn nhưng ổn định hơn cho việc sử dụng lâu dài:

#### Bước 1: Lấy thông tin cần thiết

1. Mở trình duyệt và đăng nhập vào [Zalo Web](https://chat.zalo.me/)
2. Mở DevTools (F12 hoặc Ctrl+Shift+C)
3. Vào tab Console và lấy IMEI:
   ```javascript
   localStorage.getItem('z_uuid')
   // hoặc
   localStorage.getItem('sh_z_uuid')
   ```
4. Lấy User Agent:
   ```javascript
   navigator.userAgent
   ```
5. Lấy Cookie bằng extension [J2TEAM Cookies](https://chromewebstore.google.com/detail/j2team-cookies/okpidcojinmlaakglciglbpcpajaibco) hoặc [Cookie-Editor](https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)

#### Bước 2: Cấu hình

1. Lưu cookie vào file `cookie.json` trong thư mục gốc
2. Cập nhật file `.env`:
   ```
   ZALO_IMEI=your_imei_here
   ZALO_USER_AGENT=your_user_agent_here
   ```

#### Bước 3: Chạy bot
```bash
npm run dev
```

## 📝 Sử dụng

### Chạy trong môi trường development:
```bash
npm run dev
```

### Chạy với watch mode:
```bash
npm run dev:watch
```

### Build và chạy production:
```bash
npm run build
npm start
```

## 🛠 Tùy chỉnh

### Thêm lệnh mới

Bot được thiết kế với cấu trúc modular. Bạn có thể:

1. Tạo lệnh mới trong thư mục `src/modules/commands/`
2. Thêm event listener trong thư mục `src/modules/events/`
3. Cấu hình constants trong `src/common/constants/`

### Sửa đổi logic xử lý tin nhắn

Chỉnh sửa phương thức `handleMessage()` trong file `src/main.ts`:

```typescript
private async handleMessage(msg: any) {
    // Logic xử lý tin nhắn của bạn ở đây
    if (typeof msg.data.content === "string") {
        const message = msg.data.content.toLowerCase();
        
        if (message.startsWith('/help')) {
            await this.api.sendMessage(
                "🤖 Danh sách lệnh:\n/help - Hiển thị trợ giúp\n/info - Thông tin bot",
                msg.threadId,
                msg.type
            );
        }
        // Thêm các lệnh khác...
    }
}
```

## 📚 API

Bot class `KairoZLBot` cung cấp các phương thức:

- `loginWithCookie(loginData)` - Đăng nhập bằng cookie
- `loginWithQR(options)` - Đăng nhập bằng QR code
- `autoLogin()` - Tự động chọn phương thức đăng nhập
- `setupListeners()` - Thiết lập event listeners
- `start()` - Bắt đầu bot
- `stop()` - Dừng bot
- `getAccountInfo()` - Lấy thông tin tài khoản

## ⚠️ Lưu ý quan trọng

- Việc sử dụng bot có thể vi phạm điều khoản sử dụng của Zalo
- Tài khoản có thể bị khóa nếu sử dụng không đúng cách
- Chỉ sử dụng cho mục đích học tập và thử nghiệm
- Tác giả không chịu trách nhiệm về việc tài khoản bị khóa

## 🔗 Tài liệu tham khảo

- [ZCA-JS Documentation](https://tdung.gitbook.io/zca-js)
- [ZCA-JS GitHub](https://github.com/Khoa31102001/zca-js)

## 📄 License

MIT License