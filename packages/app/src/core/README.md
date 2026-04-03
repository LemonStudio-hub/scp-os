# DIContainer - 依赖注入容器

## 概述

DIContainer 是 SCP-OS 平台的核心依赖注入系统，提供轻量级、高性能的服务注册和解析功能。支持三种生命周期（单例、瞬时、作用域），并具备循环依赖检测、作用域管理等高级特性。

## 快速开始

### 基本使用

```typescript
import { DIContainer, ServiceLifetime } from '@/core/container'

// 创建容器实例
const container = new DIContainer()

// 注册服务
container.register('Logger', () => new Logger(), {
  lifetime: ServiceLifetime.SINGLETON
})

// 解析服务
const logger = container.resolve<Logger>('Logger')
logger.log('Hello, World!')
```

### 使用全局容器

```typescript
import { registerGlobal, resolveGlobal } from '@/core/container'

// 注册服务到全局容器
registerGlobal('ConfigService', () => new ConfigService(), {
  lifetime: ServiceLifetime.SINGLETON
})

// 从全局容器解析服务
const config = resolveGlobal<ConfigService>('ConfigService')
```

## 生命周期

### Singleton（单例）

整个应用程序生命周期内只创建一个实例。

```typescript
container.register('Database', () => new Database(), {
  lifetime: ServiceLifetime.SINGLETON
})

const db1 = container.resolve<Database>('Database')
const db2 = container.resolve<Database>('Database')

console.log(db1 === db2) // true
```

### Transient（瞬时）

每次解析都创建一个新的实例。

```typescript
container.register('RequestContext', () => new RequestContext(), {
  lifetime: ServiceLifetime.TRANSIENT
})

const ctx1 = container.resolve<RequestContext>('RequestContext')
const ctx2 = container.resolve<RequestContext>('RequestContext')

console.log(ctx1 === ctx2) // false
```

### Scoped（作用域）

在同一个作用域内返回同一个实例，不同作用域返回不同实例。

```typescript
container.register('UserService', () => new UserService(), {
  lifetime: ServiceLifetime.SCOPED
})

// 创建作用域
const scope1 = container.createScope('request1')
const user1 = container.resolve<UserService>('UserService')

container.exitScope()

const scope2 = container.createScope('request2')
const user2 = container.resolve<UserService>('UserService')

console.log(user1 === user2) // false

container.exitScope()
```

## 依赖注入

### 自动解析依赖

```typescript
// 注册依赖服务
container.register('Logger', () => new Logger(), {
  lifetime: ServiceLifetime.SINGLETON
})

// 注册依赖服务
container.register('Database', () => new Database(), {
  lifetime: ServiceLifetime.SINGLETON
})

// 注册依赖于其他服务的服务
container.register('UserService', (c) => {
  const logger = c.resolve<Logger>('Logger')
  const db = c.resolve<Database>('Database')
  return new UserService(logger, db)
}, {
  lifetime: ServiceLifetime.SINGLETON
})

// 解析服务，自动注入依赖
const userService = container.resolve<UserService>('UserService')
```

### 声明依赖关系

```typescript
container.register('Repository', (c) => new Repository(c), {
  lifetime: ServiceLifetime.SINGLETON,
  dependencies: ['Database', 'Logger']
})
```

## 作用域管理

### 创建和销毁作用域

```typescript
// 创建作用域
const scope = container.createScope('http-request-123')

// 在作用域内解析服务
const service = container.resolve<Service>('ScopedService')

// 退出作用域
container.exitScope()

// 销毁作用域（清理所有实例）
container.destroyScope('http-request-123')
```

### 嵌套作用域

```typescript
// 创建父作用域
const parentScope = container.createScope('parent')

// 创建子作用域
container.enterScope('parent')
const childScope = container.createScope('child')

// 子作用域可以访问父作用域的实例
container.exitScope()
container.exitScope()
```

## 配置选项

```typescript
const container = new DIContainer({
  debug: true, // 启用调试模式
  autoRegister: false, // 禁用自动注册
  detectCircularDependencies: true, // 启用循环依赖检测
  defaultLifetime: ServiceLifetime.SINGLETON // 默认生命周期
})
```

### 调试模式

启用调试模式后，容器会输出详细的注册和解析日志：

```typescript
const container = new DIContainer({ debug: true })

// 输出: [DIContainer] Container initialized { debug: true, ... }
// 输出: [DIContainer] Registered service: Logger { lifetime: 'singleton', ... }
```

### 循环依赖检测

```typescript
const container = new DIContainer({ detectCircularDependencies: true })

container.register('ServiceA', (c) => {
  c.resolve('ServiceB')
  return {}
})

container.register('ServiceB', (c) => {
  c.resolve('ServiceA')
  return {}
})

// 抛出错误: Circular dependency detected: ServiceA -> ServiceB -> ServiceA
container.resolve('ServiceA')
```

## 批量注册

```typescript
container.registerMultiple([
  {
    token: 'Logger',
    factory: () => new Logger(),
    options: { lifetime: ServiceLifetime.SINGLETON }
  },
  {
    token: 'Database',
    factory: () => new Database(),
    options: { lifetime: ServiceLifetime.SINGLETON }
  },
  {
    token: 'Cache',
    factory: () => new Cache(),
    options: { lifetime: ServiceLifetime.TRANSIENT }
  }
])
```

## 服务管理

### 检查服务是否已注册

```typescript
if (container.has('Logger')) {
  console.log('Logger service is registered')
}
```

### 注销服务

```typescript
container.unregister('Logger')
```

### 清空容器

```typescript
container.clear()
```

### 获取所有已注册的服务

```typescript
const tokens = container.getRegisteredTokens()
console.log('Registered services:', tokens)
```

## 预实例化服务

可以在注册时提供预实例化的服务：

```typescript
const logger = new Logger()

container.register('Logger', () => logger, {
  lifetime: ServiceLifetime.SINGLETON,
  instance: logger
})
```

## 最佳实践

### 1. 使用接口作为服务令牌

```typescript
// 推荐
container.register('ILogger', () => new LoggerImpl(), {
  lifetime: ServiceLifetime.SINGLETON
})

// 不推荐
container.register('Logger', () => new Logger(), {
  lifetime: ServiceLifetime.SINGLETON
})
```

### 2. 优先使用单例生命周期

```typescript
// 推荐 - 配置服务应该全局唯一
container.register('ConfigService', () => new ConfigService(), {
  lifetime: ServiceLifetime.SINGLETON
})

// 推荐 - 数据库连接应该全局唯一
container.register('Database', () => new Database(), {
  lifetime: ServiceLifetime.SINGLETON
})
```

### 3. 为请求相关服务使用作用域生命周期

```typescript
// 推荐 - 每个请求一个用户上下文
container.register('UserContext', () => new UserContext(), {
  lifetime: ServiceLifetime.SCOPED
})
```

### 4. 为轻量级服务使用瞬时生命周期

```typescript
// 推荐 - 每次创建新的 DTO 实例
container.register('UserDTO', () => new UserDTO(), {
  lifetime: ServiceLifetime.TRANSIENT
})
```

### 5. 在应用启动时注册所有服务

```typescript
// main.ts
import { getGlobalContainer } from '@/core/container'

const container = getGlobalContainer()

// 注册所有核心服务
registerCoreServices(container)

// 注册所有插件服务
registerPluginServices(container)

// 启动应用
app.mount('#app')
```

## 类型安全

### 泛型支持

```typescript
interface ILogger {
  log(message: string): void
}

class Logger implements ILogger {
  log(message: string) {
    console.log(message)
  }
}

container.register<ILogger>('ILogger', () => new Logger(), {
  lifetime: ServiceLifetime.SINGLETON
})

const logger = container.resolve<ILogger>('ILogger')
logger.log('Hello') // 类型安全
```

### 工厂函数类型

```typescript
import type { ServiceFactory } from '@/core/types'

const factory: ServiceFactory<Logger> = (container) => {
  const config = container.resolve('Config')
  return new Logger(config)
}

container.register('Logger', factory)
```

## 错误处理

### 服务未找到

```typescript
try {
  const service = container.resolve('NonExistentService')
} catch (error) {
  console.error('Service not found:', error.message)
  // 输出: Service not found: NonExistentService
}
```

### 循环依赖

```typescript
try {
  container.resolve('ServiceWithCircularDependency')
} catch (error) {
  console.error('Circular dependency detected:', error.message)
  // 输出: Circular dependency detected: ServiceA -> ServiceB -> ServiceA
}
```

### 作用域不存在

```typescript
try {
  container.enterScope('non-existent-scope')
} catch (error) {
  console.error('Scope not found:', error.message)
  // 输出: Scope not found: non-existent-scope
}
```

## 性能考虑

1. **单例服务**：首次解析后缓存，后续解析性能极高
2. **瞬时服务**：每次创建新实例，适合轻量级对象
3. **作用域服务**：在作用域内缓存，适合请求级别服务
4. **依赖注入**：容器自动解析依赖，避免手动创建

## 完整示例

```typescript
import { DIContainer, ServiceLifetime } from '@/core/container'

// 定义服务接口
interface ILogger {
  log(message: string): void
}

interface IDatabase {
  query(sql: string): Promise<any[]>
}

interface IUserService {
  getUser(id: string): Promise<User>
}

// 实现服务类
class Logger implements ILogger {
  log(message: string) {
    console.log(`[LOG] ${message}`)
  }
}

class Database implements IDatabase {
  async query(sql: string) {
    // 实现数据库查询
    return []
  }
}

class UserService implements IUserService {
  constructor(
    private logger: ILogger,
    private db: IDatabase
  ) {}

  async getUser(id: string) {
    this.logger.log(`Getting user ${id}`)
    const users = await this.db.query(`SELECT * FROM users WHERE id = ${id}`)
    return users[0]
  }
}

// 创建容器
const container = new DIContainer({ debug: true })

// 注册服务
container.register<ILogger>('ILogger', () => new Logger(), {
  lifetime: ServiceLifetime.SINGLETON
})

container.register<IDatabase>('IDatabase', () => new Database(), {
  lifetime: ServiceLifetime.SINGLETON
})

container.register<IUserService>('IUserService', (c) => {
  const logger = c.resolve<ILogger>('ILogger')
  const db = c.resolve<IDatabase>('IDatabase')
  return new UserService(logger, db)
}, {
  lifetime: ServiceLifetime.SINGLETON,
  dependencies: ['ILogger', 'IDatabase']
})

// 使用服务
const userService = container.resolve<IUserService>('IUserService')
const user = await userService.getUser('123')
```

## API 参考

### DIContainer

#### 构造函数

```typescript
constructor(config?: ContainerConfig)
```

#### 方法

- `register<T>(token: string, factory: ServiceFactory<T>, options?: ServiceRegistrationOptions<T>): void`
- `registerMultiple(services: Array<{token: string, factory: ServiceFactory, options?: ServiceRegistrationOptions}>): void`
- `resolve<T>(token: string): T`
- `has(token: string): boolean`
- `unregister(token: string): void`
- `clear(): void`
- `createScope(id?: string): ContainerScope`
- `enterScope(id: string): void`
- `exitScope(): void`
- `destroyScope(id: string): void`
- `getRegisteredTokens(): string[]`
- `getConfig(): Required<ContainerConfig>`

### 全局函数

- `getGlobalContainer(config?: ContainerConfig): DIContainer`
- `resetGlobalContainer(): void`
- `registerGlobal<T>(token: string, factory: ServiceFactory<T>, options?: ServiceRegistrationOptions<T>): void`
- `resolveGlobal<T>(token: string): T`

## 许可证

MIT