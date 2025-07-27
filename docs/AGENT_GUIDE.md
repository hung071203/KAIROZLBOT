# AI Agent - Hướng dẫn sử dụng

## Tổng quan
AI Agent là một lệnh thông minh có thể hiểu yêu cầu tự nhiên của người dùng và tự động thực thi các API Zalo cũng như truy vấn cơ sở dữ liệu.

## Cách sử dụng
Chỉ cần gửi yêu cầu bằng ngôn ngữ tự nhiên, AI sẽ phân tích và thực hiện hành động phù hợp.

## Các tính năng chính

### 1. THÔNG TIN NGƯỜI DÙNG & NHÓM
```
Ví dụ:
- "thông tin nhóm này"
- "ai là admin nhóm"
- "có bao nhiêu thành viên"
- "danh sách bạn bè"
- "thông tin user [userId]"
```

### 2. QUẢN LÝ NHÓM
```
Ví dụ:
- "tạo nhóm tên [tên nhóm]"
- "đổi tên nhóm thành [tên mới]"
- "thêm [userId] vào nhóm"
- "xóa [userId] khỏi nhóm"
- "thêm admin [userId]"
- "rời khỏi nhóm"
```

### 3. GỬI TIN NHẮN & NỘI DUNG
```
Ví dụ:
- "gửi tin nhắn [nội dung] tới [threadId]"
- "gửi sticker [stickerId]"
- "thả cảm xúc cho tin nhắn [messageId]"
- "xóa tin nhắn [messageId]"
```

### 4. BẠN BÈ & KẾT BẠN
```
Ví dụ:
- "gửi lời mời kết bạn tới [userId]"
- "chấp nhận lời mời từ [userId]"
- "chặn user [userId]"
- "bỏ chặn user [userId]"
```

### 5. POLL & BÌNH CHỌN
```
Ví dụ:
- "tạo poll về [chủ đề]"
- "tạo poll [câu hỏi] với lựa chọn [A, B, C]"
- "xem chi tiết poll [pollId]"
```

### 6. NHẮC NHỞ
```
Ví dụ:
- "tạo nhắc nhở [tiêu đề]"
- "nhắc tôi [việc cần làm] sau 1 tiếng"
```

### 7. TRUY VẤN DATABASE
```
Ví dụ:
- "có bao nhiêu tài khoản"
- "thông tin cấu hình hệ thống"
- "danh sách tài khoản đang hoạt động"
```

## Các từ khóa thông dụng

### Thông tin:
- "thông tin", "info", "chi tiết", "xem"

### Tạo/Thêm:
- "tạo", "thêm", "add", "create"

### Xóa/Hủy:
- "xóa", "hủy", "remove", "delete"

### Đổi/Sửa:
- "đổi", "sửa", "thay", "change", "edit"

### Gửi:
- "gửi", "send", "post"

## Lưu ý quan trọng

1. **Quyền hạn**: Một số hành động cần quyền admin nhóm
2. **Xác nhận**: Các hành động nhạy cảm sẽ yêu cầu xác nhận
3. **Lỗi**: Nếu có lỗi, AI sẽ thông báo chi tiết
4. **Thread ID**: Nếu không chỉ định, sẽ sử dụng nhóm/cuộc trò chuyện hiện tại

## API được hỗ trợ với Signature chính xác

### Zalo API:

#### Thông tin:
- `getUserInfo(userId)` - Lấy thông tin người dùng
- `getGroupInfo(groupId)` - Lấy thông tin nhóm  
- `getGroupMembersInfo(groupId)` - Lấy danh sách thành viên
- `getAllFriends(count?, page?)` - Lấy danh sách bạn bè
- `getAllGroups()` - Lấy danh sách nhóm

#### Gửi tin nhắn:
- `sendMessage(messageContent|string, threadId, type?)` 
  - messageContent có thể chứa: msg, styles, urgency, mentions, attachments, ttl
- `sendCard(cardInfo, threadId)` - Gửi card
- `forwardMessage(messageId, threadId)` - Forward tin nhắn

#### Quản lý nhóm:
- `createGroup({name, members, avatarSource?})` - Tạo nhóm
- `changeGroupName(name, groupId)` - Đổi tên nhóm
- `addUserToGroup(userId|userId[], groupId)` - Thêm thành viên
- `removeUserFromGroup(userId, groupId)` - Xóa thành viên
- `addGroupDeputy(userId, groupId)` - Thêm phó admin
- `removeGroupDeputy(userId, groupId)` - Xóa phó admin

#### Bạn bè:
- `sendFriendRequest(message, userId)` - Gửi lời mời kết bạn
- `acceptFriendRequest(userId)` - Chấp nhận lời mời
- `blockUser(userId)` - Chặn người dùng
- `unblockUser(userId)` - Bỏ chặn

#### Tương tác tin nhắn:
- `addReaction(reaction, destination)` - Thả cảm xúc
  - destination: `{data: {msgId, cliMsgId}, threadId, type}`
- `deleteMessage(destination, onlyMe?)` - Xóa tin nhắn
  - destination: `{data: {msgId, cliMsgId, uidFrom}, threadId, type}`

#### Poll & Nhắc nhở:
- `createPoll(pollOptions, groupId)` - Tạo poll
  - pollOptions: `{question, options, expiredTime?, allowMultiChoices?, etc}`
- `createReminder(reminderOptions, threadId, type?)` - Tạo nhắc nhở
  - reminderOptions: `{title, emoji?, startTime?, repeat?}`

### Database:
- accounts: Quản lý tài khoản bot
- configs: Cấu hình hệ thống

## Lưu ý quan trọng về API

1. **ThreadType**: 0 = User, 1 = Group
2. **Message Destination**: Nhiều API cần object phức tạp chứa msgId, cliMsgId, threadId, type
3. **Message Content**: sendMessage hỗ trợ rich formatting với styles, mentions, attachments
4. **Error Handling**: Một số API trả về errorMembers để báo cáo lỗi từng phần
5. **Permissions**: Nhiều API cần quyền admin hoặc đặc biệt

## Ví dụ sử dụng thực tế

### Quản lý nhóm:
```
User: "thông tin nhóm này"
AI: 👥 Nhóm: [Tên nhóm]
    👨‍👩‍👧‍👦 Thành viên: 25
    👑 Admin: 3 người

User: "thêm 123456789 vào nhóm"
AI: ✅ Đã thêm người dùng vào nhóm
```

### Tạo poll:
```
User: "tạo poll về việc đi du lịch"
AI: ✅ Đã tạo poll: việc đi du lịch
```

### Truy vấn thông tin:
```
User: "ai online"
AI: 👫 Bạn có 150 bạn bè
    📊 Kết quả thực thi:
    ✅ Đã lấy danh sách bạn bè
```

Hệ thống này giúp tự động hóa nhiều tác vụ quản lý và tương tác trên Zalo một cách thông minh và tiện lợi!
