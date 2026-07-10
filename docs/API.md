# API Reference

SCP-OS backend API is deployed on Cloudflare Workers, providing SCP data queries, chat, feedback, user management, and other services.

**Base URL**: `https://api.scpos.site` (Production)

---

## Table of Contents

- [General Information](#general-information)
- [Authentication](#authentication)
- [Search](#search)
- [Statistics](#statistics)
- [Chat](#chat)
- [Feedback](#feedback)
- [Download](#download)
- [Docs (SCP Reader)](#docs-scp-reader)

---

## General Information

### Request Format

- All GET request parameters are passed via URL query strings
- All POST request bodies use JSON format (`Content-Type: application/json`)

### Response Format

All endpoints return a unified JSON format:

```json
{
  "success": true,
  "data": { ... }
}
```

Error response:

```json
{
  "success": false,
  "error": "Error message"
}
```

### Rate Limiting

- Each IP address is limited to **60 requests/minute**
- Chat messages are limited to **10 messages/minute/user**
- Exceeding the limit returns HTTP 429

### CORS

The API supports cross-origin requests. Allowed origins are controlled by the server-side CORS policy.

---

## SCP Data Endpoints

### Scrape SCP Information

Get detailed information for a specified SCP object, supporting both English and Chinese branches.

```
GET /scrape?number={number}&branch={branch}
```

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `number` | string | Yes | SCP number (e.g., `173`, `049`) |
| `branch` | string | No | Branch: `en` (default) or `cn` |

**Response Example**

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

**`cached` field**: Returns `true` when the result is served from KV cache. Cache duration is 30 minutes.

---

### Search SCP

Search SCP objects by keyword.

```
GET /search?keyword={keyword}&branch={branch}&clearance_level={level}
```

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | Yes | Search keyword |
| `branch` | string | No | Branch: `en` (default) or `cn` |
| `clearance_level` | number | No | Clearance level filter (0-5). When specified, uses database search |

**Behavior Notes**

- When `clearance_level` is specified, performs fuzzy search via D1 database (matches by name and tags)
- When not specified, calls SCP Wiki's built-in search functionality

---

### List SCP

Paginated listing of SCP entries from the database.

```
GET /list?limit={limit}&offset={offset}&clearance_level={level}
```

**Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 100 | Items per page |
| `offset` | number | No | 0 | Offset |
| `clearance_level` | number | No | - | Clearance level filter |

**Response Example**

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

### Get Statistics

Get SCP database statistics.

```
GET /stats
```

**Response Example**

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

## Chat Endpoints

### Send Message

Send a chat message, subject to rate limiting (10 messages/minute/user).

```
POST /chat/send
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | string | Yes | User UUID |
| `nickname` | string | No | Nickname (uses stored nickname or auto-generates if not provided) |
| `content` | string | Yes | Message content (max 1000 characters) |
| `room_id` | number | No | Room ID (default 1) |

**Response Example**

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

**Error Codes**

| HTTP Status Code | Description |
|------------------|-------------|
| 429 | Rate limit exceeded |

---

### Get Message List

Get chat messages, supporting room filtering and time cursor pagination.

```
GET /chat/messages?limit={limit}&after={after}&room_id={room_id}
```

**Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 50 | Number of results |
| `after` | string | No | - | ISO timestamp, only returns messages after this time |
| `room_id` | number | No | - | Room ID filter |

---

### Get Chat Room List

```
GET /chat/rooms
```

**Response Example**

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

### Create Chat Room

```
POST /chat/rooms
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Room name (max 50 characters) |
| `description` | string | No | Room description |
| `created_by` | string | Yes | Creator UUID |
| `is_public` | number | No | Whether public (default 1) |

**Limit**: Each user can create up to 5 chat rooms.

---

### Set Nickname

```
POST /chat/nickname
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | string | Yes | User UUID |
| `nickname` | string | Yes | Nickname (max 30 characters) |

---

## Feedback Endpoints

### Submit Feedback

```
POST /feedback/submit
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | string | Yes | User UUID |
| `nickname` | string | No | Nickname |
| `title` | string | Yes | Feedback title |
| `content` | string | Yes | Feedback content |
| `category` | string | No | Category (bug/feature/improvement/other) |

---

### Get Feedback List

```
GET /feedback/list?limit={limit}&offset={offset}&category={category}
```

**Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 50 | Items per page |
| `offset` | number | No | 0 | Offset |
| `category` | string | No | - | Category filter |

---

### Get Feedback List (with Vote Status)

```
GET /feedback/list-with-votes?limit={limit}&offset={offset}&category={category}&user_id={user_id}
```

Additional parameter `user_id` is used to retrieve the user's vote status for each feedback item.

---

### Like Feedback

```
POST /feedback/like
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Feedback ID |

---

### Vote on Feedback

```
POST /feedback/vote
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Feedback ID |
| `user_id` | string | Yes | User UUID |
| `vote` | string | Yes | Vote direction: `up` or `down` |

---

### Submit Feedback Comment

```
POST /feedback/comment
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `feedback_id` | number | Yes | Feedback ID |
| `user_id` | string | Yes | User UUID |
| `nickname` | string | No | Nickname |
| `content` | string | Yes | Comment content |

---

### Get Feedback Comments

```
GET /feedback/comments?feedback_id={feedback_id}
```

---

### Get Feedback Category Statistics

```
GET /feedback/categories
```

---

## User Endpoints

### Register/Update User

```
POST /api/user/register
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | Yes | User UUID |
| `nickname` | string | Yes | Nickname |

---

### Get User Info

```
GET /api/user/{userId}
```

---

### Check Nickname Availability

```
GET /api/user/check-nickname?nickname={nickname}&excludeUserId={excludeUserId}
```

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nickname` | string | Yes | Nickname to check |
| `excludeUserId` | string | No | User ID to exclude (used when updating nickname to exclude self) |

---

## System Endpoints

### Service Info

```
GET /
```

Returns API service information, available endpoints list, and feature descriptions.

---

### Debug Endpoint

```
GET /debug?number={number}
```

Returns the raw HTML of the specified SCP page (for debugging only).

---

## Performance Monitoring Endpoints

### Submit Performance Metrics

```
POST /performance
```

**Request Body**: Arbitrary JSON-formatted performance metric data, stored in KV (auto-expires after 1 hour).

---

### Get Performance Metrics

```
GET /performance?limit={limit}
```

**Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 10 | Number of results |

---

## Docs (SCP Reader)

> Index queries and content retrieval for SCP entries, tales, GOI, and Hubs. Based on D1 database + Cloudflare KV multi-level caching architecture.

Base URL: `https://api.scpos.site`

### GET /docs/items

Get SCP entry list.

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Items per page (max 200) |
| `offset` | number | 0 | Offset |
| `series` | number | - | Filter by series (1-10) |
| `class` | string | - | Filter by object class (Safe/Euclid/Keter/Thaumiel/Neutralized) |
| `search` | string | - | FTS5 full-text search keyword |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "scp_number": "010",
      "title": "Bulletproof",
      "object_class": "Safe",
      "series": 1,
      "rating": 1166,
      "tags": " euclid audio spc talk safe",
      "creator": "Anonymous",
      "created_at": "2008-06-03",
      "clearance_level": 1,
      "has_content": true,
      "content_file": "010.json"
    }
  ],
  "total": 9526,
  "limit": 30,
  "offset": 0
}
```

### GET /docs/item/:number

Get single SCP entry metadata.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "scp_number": "010",
    "title": "Bulletproof",
    "object_class": "Safe",
    "series": 1,
    "rating": 1166,
    "tags": " euclid audio spc talk safe",
    "creator": "Anonymous",
    "created_at": "2008-06-03",
    "clearance_level": 1,
    "has_content": true,
    "content_file": "010.json"
  }
}
```

### GET /docs/content/:number

Get SCP entry content. Prioritizes Cloudflare KV cache; falls back to GitHub Raw API on cache miss and writes to KV.

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `number` | string | SCP number (e.g., `173`, `010`) |

**Response**:
```json
{
  "success": true,
  "data": {
    "scp_number": "173",
    "content": "<div class='scp-container'>...</div>",
    "cached": true,
    "source": "kv"
  }
}
```

`source` values: `"kv"` (KV cache hit, <50ms) or `"github-raw"` (fallback fetch).

### GET /docs/tales

Get tales list.

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Items per page (max 200) |
| `offset` | number | 0 | Offset |
| `year` | number | - | Filter by year |
| `search` | string | - | Search title or tags |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "link": "a-tale-of-two-brothers",
      "title": "A Tale Of Two Brothers",
      "year": 2008,
      "rating": 2677,
      "tags": " tale goi",
      "creator": "admin",
      "created_at": "2008-07-11",
      "content_file": "a-tale-of-two-brothers.json"
    }
  ],
  "total": 6487,
  "limit": 30,
  "offset": 0
}
```

### GET /docs/hubs

Get Hub list.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "link": "science-fiction",
      "title": "Science Fiction",
      "references_json": "...",
      "tags": " hub"
    }
  ]
}
```

---

## Type Definitions

### ObjectClass

SCP object class enumeration:

| Value | Description |
|-------|-------------|
| `SAFE` | Fully understood, reliably containable |
| `EUCLID` | Not fully understood, containment unreliable |
| `KETER` | Difficult to reliably contain, high containment cost |
| `THAUMIEL` | Used to contain or counteract other SCPs |
| `NEUTRALIZED` | No longer anomalous due to various reasons |
| `PENDING` | Not yet classified |
| `UNKNOWN` | Class cannot be determined |

### SCPWikiData

```typescript
interface SCPWikiData {
  id: string           // e.g., "SCP-173"
  name: string         // SCP name
  objectClass: ObjectClass
  containment: string[]  // Containment procedure paragraphs
  description: string[]  // Description paragraphs
  appendix: string[]     // Appendix paragraphs
  author?: string        // Author
  url: string           // Wiki page URL
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
