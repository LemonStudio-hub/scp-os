# API 参考文档

SCP-OS 后端 API 基于 Cloudflare Workers 部署，提供 SCP 数据查询、聊天、反馈、用户管理等功能。

**基础 URL**：`https://api.scpos.site`（生产环境）

---

## 目录

- [通用说明](#通用说明)
- [SCP 数据接口](#scp-数据接口)
- [聊天接口](#聊天接口)
- [反馈接口](#反馈接口)
- [用户接口](#用户接口)
- [系统接口](#系统接口)
- [性能监控接口](#性能监控接口)
- [类型定义](#类型定义)

---

## 通用说明

### 请求格式

- 所有 GET 请求参数通过 URL 查询字符串传递
- 所有 POST 请求体使用 JSON 格式（`Content-Type: application/json`）

### 响应格式

所有接口统一返回 JSON 格式：

```json
{
  "success": true,
  "data": { ... }
}
```

错误响应：

```json
{
  "success": false,
  "error": "Error message"
}
```

### 速率限制

- 每个 IP 地址限制为 **60 次/分钟**
- 聊天消息限制为 **10 条/分钟/用户**
- 超出限制返回 HTTP 429

### CORS

API 支持跨域请求，允许的 Origin 由服务端 CORS 策略控制。

---

## SCP 数据接口

### 爬取 SCP 信息

获取指定 SCP 对象的详细信息，支持英文和中文分部。

```
GET /scrape?number={number}&branch={branch}
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `number` | string | 是 | SCP 编号（如 `173`、`049`） |
| `branch` | string | 否 | 分部：`en`（默认）或 `cn` |

**响应示例**

```json
{
  "success": true,
  "data": {
    "id": "SCP-173",
    "name": "SCP-173",
    "objectClass": "EUCLID",
    "containment": [
      "SCP-173 is to be kept in a locked container..."
    ],
    "description": [
      "Moved to Site-19 in 1993..."
    ],
    "appendix": [],
    "author": "Moto42",
    "url": "https://scp-wiki.wikidot.com/scp-173"
  },
  "cached": false
}
```

**`cached` 字段**：当结果从 KV 缓存返回时为 `true`，缓存有效期为 30 分钟。

---

### 搜索 SCP

通过关键词搜索 SCP 对象。

```
GET /search?keyword={keyword}&branch={branch}&clearance_level={level}
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keyword` | string | 是 | 搜索关键词 |
| `branch` | string | 否 | 分部：`en`（默认）或 `cn` |
| `clearance_level` | number | 否 | 权限等级筛选（0-5），指定后使用数据库搜索 |

**行为说明**

- 指定 `clearance_level` 时，使用 D1 数据库进行模糊搜索（按名称和标签匹配）
- 未指定时，使用 SCP Wiki 网站搜索功能

---

### 列出 SCP

分页列出数据库中的 SCP 索引。

```
GET /list?limit={limit}&offset={offset}&clearance_level={level}
```

**参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `limit` | number | 否 | 100 | 每页条数 |
| `offset` | number | 否 | 0 | 偏移量 |
| `clearance_level` | number | 否 | - | 权限等级筛选 |

**响应示例**

```json
{
  "success": true,
  "data": [
    {
      "scp_id": "SCP-001",
      "name": "SCP-001",
      "object_class": "KETER",
      "tags": "keter, scp-001",
      "clearance_level": 5,
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 7000
}
```

---

### 获取统计信息

获取 SCP 数据库的统计信息。

```
GET /stats
```

**响应示例**

```json
{
  "success": true,
  "stats": {
    "total": 7000,
    "byClass": {
      "SAFE": 2000,
      "EUCLID": 3000,
      "KETER": 1500,
      "THAUMIEL": 50,
      "NEUTRALIZED": 300,
      "PENDING": 100,
      "UNKNOWN": 50
    },
    "byClearance": {
      "0": 1000,
      "1": 2000,
      "2": 1500,
      "3": 1000,
      "4": 500,
      "5": 1000
    }
  }
}
```

---

## 聊天接口

### 发送消息

发送聊天消息，带频率限制（10 条/分钟/用户）。

```
POST /chat/send
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `user_id` | string | 是 | 用户 UUID |
| `nickname` | string | 否 | 昵称（未提供则使用存储的昵称或自动生成） |
| `content` | string | 是 | 消息内容（最长 1000 字符） |
| `room_id` | number | 否 | 房间 ID（默认 1） |

**响应示例**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "user_id": "abc-def-123",
    "username": "Agent-Smith",
    "content": "Hello, Foundation!",
    "room_id": 1,
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

**错误码**

| HTTP 状态码 | 说明 |
|-------------|------|
| 429 | 频率限制超出 |

---

### 获取消息列表

获取聊天消息，支持按房间过滤和时间游标。

```
GET /chat/messages?limit={limit}&after={after}&room_id={room_id}
```

**参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `limit` | number | 否 | 50 | 返回条数 |
| `after` | string | 否 | - | ISO 时间戳，仅返回此时间之后的消息 |
| `room_id` | number | 否 | - | 房间 ID 过滤 |

---

### 获取聊天室列表

```
GET /chat/rooms
```

**响应示例**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "General",
      "description": "General discussion",
      "created_by": "user-uuid",
      "is_public": 1,
      "message_count": 1500,
      "member_count": 42,
      "last_message": "Hello!",
      "last_message_sender": "Agent-Smith",
      "last_message_time": "2024-01-01T12:00:00Z"
    }
  ]
}
```

---

### 创建聊天室

```
POST /chat/rooms
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 房间名称（最长 50 字符） |
| `description` | string | 否 | 房间描述 |
| `created_by` | string | 是 | 创建者 UUID |
| `is_public` | number | 否 | 是否公开（默认 1） |

**限制**：每个用户最多创建 5 个聊天室。

---

### 设置昵称

```
POST /chat/nickname
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `user_id` | string | 是 | 用户 UUID |
| `nickname` | string | 是 | 昵称（最长 30 字符） |

---

## 反馈接口

### 提交反馈

```
POST /feedback/submit
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `user_id` | string | 是 | 用户 UUID |
| `nickname` | string | 否 | 昵称 |
| `title` | string | 是 | 反馈标题 |
| `content` | string | 是 | 反馈内容 |
| `category` | string | 否 | 分类（bug/feature/improvement/other） |

---

### 获取反馈列表

```
GET /feedback/list?limit={limit}&offset={offset}&category={category}
```

**参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `limit` | number | 否 | 50 | 每页条数 |
| `offset` | number | 否 | 0 | 偏移量 |
| `category` | string | 否 | - | 分类筛选 |

---

### 获取反馈列表（带投票状态）

```
GET /feedback/list-with-votes?limit={limit}&offset={offset}&category={category}&user_id={user_id}
```

额外参数 `user_id` 用于获取该用户对每条反馈的投票状态。

---

### 点赞反馈

```
POST /feedback/like
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 反馈 ID |

---

### 投票反馈

```
POST /feedback/vote
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 反馈 ID |
| `user_id` | string | 是 | 用户 UUID |
| `vote` | string | 是 | 投票方向：`up` 或 `down` |

---

### 提交反馈评论

```
POST /feedback/comment
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `feedback_id` | number | 是 | 反馈 ID |
| `user_id` | string | 是 | 用户 UUID |
| `nickname` | string | 否 | 昵称 |
| `content` | string | 是 | 评论内容 |

---

### 获取反馈评论

```
GET /feedback/comments?feedback_id={feedback_id}
```

---

### 获取反馈分类统计

```
GET /feedback/categories
```

---

## 用户接口

### 注册/更新用户

```
POST /api/user/register
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | 是 | 用户 UUID |
| `nickname` | string | 是 | 昵称 |

---

### 获取用户信息

```
GET /api/user/{userId}
```

---

### 检查昵称可用性

```
GET /api/user/check-nickname?nickname={nickname}&excludeUserId={excludeUserId}
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `nickname` | string | 是 | 要检查的昵称 |
| `excludeUserId` | string | 否 | 排除的用户 ID（用于更新昵称时排除自身） |

---

## 系统接口

### 服务信息

```
GET /
```

返回 API 服务信息、可用端点列表和功能特性。

---

### 调试接口

```
GET /debug?number={number}
```

返回指定 SCP 页面的原始 HTML（仅用于调试）。

---

## 性能监控接口

### 提交性能指标

```
POST /performance
```

**请求体**：任意 JSON 格式的性能指标数据，存储到 KV（1 小时过期）。

---

### 获取性能指标

```
GET /performance?limit={limit}
```

**参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `limit` | number | 否 | 10 | 返回条数 |

---

## 类型定义

### ObjectClass

SCP 项目等级枚举：

| 值 | 中文名 | 说明 |
|----|--------|------|
| `SAFE` | 安全 | 已完全理解，可可靠收容 |
| `EUCLID` | 欧几里得 | 未能完全理解，收容不可靠 |
| `KETER` | 克特 | 难以可靠收容，收容成本高 |
| `THAUMIEL` | 赛米尔 | 可用于收容或对抗其他 SCP |
| `NEUTRALIZED` | 已无效化 | 因各种原因不再异常 |
| `PENDING` | 待定 | 尚未分类 |
| `UNKNOWN` | 未知 | 无法确定等级 |

### SCPWikiData

```typescript
interface SCPWikiData {
  id: string           // 如 "SCP-173"
  name: string         // SCP 名称
  objectClass: ObjectClass
  containment: string[]  // 收容程序段落
  description: string[]  // 描述段落
  appendix: string[]     // 附录段落
  author?: string        // 作者
  url: string           // Wiki 页面 URL
}
```

### ChatMessage

```typescript
interface ChatMessage {
  id: number
  user_id: string
  username: string
  content: string
  room_id: number
  created_at: string
  is_broadcast: number
  broadcast_count: number
}
```

### ChatRoom

```typescript
interface ChatRoom {
  id: number
  name: string
  description: string
  created_by: string
  is_public: number
  message_count: number
  member_count: number
  last_message: string | null
  last_message_sender: string | null
  last_message_time: string | null
}
```
