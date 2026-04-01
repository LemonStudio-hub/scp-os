import { errorHandler, ErrorType, ErrorSeverity } from '../utils/errorHandler'
import type { CommandHandler } from '../types/command'

export function withCommandErrorHandler(
  commandName: string,
  handler: CommandHandler
): CommandHandler {
  return (args, write, writeln) => {
    try {
      return handler(args, write, writeln)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // 使用错误处理器记录错误
      errorHandler.handleError({
        type: ErrorType.COMMAND_EXECUTION_FAILED,
        severity: ErrorSeverity.MEDIUM,
        message: `命令执行失败: ${commandName}`,
        details: errorMessage,
        logToConsole: true,
      })

      // 在终端显示错误
      writeln(`\r\n`)
      writeln(`[错误] 命令执行失败: ${commandName}`)
      writeln(`[详情] ${errorMessage}`)
      writeln(`[提示] 请检查命令参数或联系系统管理员`)
      writeln(`\r\n`)
    }
  }
}

export function createSafeCommandHandler(
  commandName: string,
  handler: CommandHandler
): CommandHandler {
  return withCommandErrorHandler(commandName, handler)
}