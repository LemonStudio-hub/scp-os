# Cloudflare Worker 部署指南

## 前置要求

1. 安装 Wrangler CLI
```bash
npm install -g wrangler
```

2. 登录 Cloudflare
```bash
wrangler login
```

## 部署步骤

### 1. 验证配置

检查 `wrangler.toml` 配置：

```toml
name = "scp-scraper-worker"
main = "index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[kv_namespaces]]
binding = "SCP_CACHE"
id = "40f0d23a05e14f7484232bc1960e217f"
```

### 2. 本地测试

启动本地开发服务器：

```bash
cd worker
wrangler dev
```

测试端点：

- `http://localhost:8787/` - API 信息
- `http://localhost:8787/scrape?number=173` - 爬取 SCP-173
- `http://localhost:8787/search?keyword=173` - 搜索 SCP
- `http://localhost:8787/debug?number=173` - 调试模式

### 3. 部署到 Cloudflare

```bash
cd worker
wrangler deploy
```

### 4. 验证部署

部署成功后，访问：

```
https://api.scpos.site/
```

## 环境变量

如需配置环境变量，在 `wrangler.toml` 中添加：

```toml
[vars]
ENVIRONMENT = "production"
```

或使用命令行：

```bash
wrangler secret put ENVIRONMENT
```

## KV 命名空间

### 创建 KV 命名空间

```bash
wrangler kv:namespace create "SCP_CACHE"
```

更新 `wrangler.toml` 中的 `id`。

### 本地开发 KV

```bash
wrangler kv:key put "scp-173" --path=/path/to/data.json --namespace-id=YOUR_NAMESPACE_ID
```

## 监控

### 查看日志

```bash
wrangler tail
```

### 查看分析

访问 Cloudflare Dashboard → Workers → Your Worker → Analytics

## 性能优化

### 启用 Durable Objects（如需要）

```toml
[[durable_objects.bindings]]
name = "CACHE"
class_name = "CacheWorker"
```

### 配置缓存策略

在代码中已配置 30 分钟缓存，可根据需要调整：

```typescript
cacheDuration: 30 * 60 * 1000, // 30 分钟
```

## 回滚

如果部署出现问题：

```bash
wrangler rollback
```

## 故障排查

### 常见问题

1. **部署失败**
   - 检查 `wrangler.toml` 配置
   - 验证 KV 命名空间 ID
   - 确认依赖已安装

2. **速率限制**
   - 检查 `RateLimiter` 配置
   - 验证 IP 地址获取

3. **CORS 错误**
   - 检查 `CORSManager` 配置
   - 验证允许的来源列表

## 安全最佳实践

1. 定期更新依赖
2. 监控异常请求
3. 设置合理的速率限制
4. 使用环境变量管理敏感信息
5. 定期审查日志

## 成本估算

- Workers 免费套餐：每天 100,000 次请求
- KV 存储：免费 1GB
- 超出后按使用量计费

## 支持

- Cloudflare Workers 文档: https://developers.cloudflare.com/workers/
- Wrangler CLI 文档: https://developers.cloudflare.com/workers/wrangler/