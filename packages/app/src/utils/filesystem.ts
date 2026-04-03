import { indexedDBService } from './indexedDB'

// 文件系统节点类型
export type FileSystemNodeType = 'file' | 'directory'

// 文件权限接口
export interface FilePermissions {
  user: {
    read: boolean
    write: boolean
    execute: boolean
  }
  group: {
    read: boolean
    write: boolean
    execute: boolean
  }
  others: {
    read: boolean
    write: boolean
    execute: boolean
  }
}

// 文件系统节点接口
export interface FileSystemNode {
  name: string
  type: FileSystemNodeType
  permissions: FilePermissions
  owner: string
  group: string
  size: number
  mtime: number
  content?: string // 仅文件有
  children?: Record<string, FileSystemNode> // 仅目录有
}

// 文件系统类
export class FileSystem {
  private root: FileSystemNode
  private currentPath: string[] = ['']
  private isInitialized = false

  constructor() {
    // 初始化根目录
    this.root = this.createDefaultFilesystem()
    this.loadFromStorage()
  }

  // 创建默认文件系统
  private createDefaultFilesystem(): FileSystemNode {
    return {
      name: '',
      type: 'directory',
      permissions: {
        user: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        others: { read: true, write: false, execute: true }
      },
      owner: 'root',
      group: 'root',
      size: 0,
      mtime: Date.now(),
      children: {
        home: {
          name: 'home',
          type: 'directory',
          permissions: {
            user: { read: true, write: true, execute: true },
            group: { read: true, write: false, execute: true },
            others: { read: true, write: false, execute: true }
          },
          owner: 'root',
          group: 'root',
          size: 0,
          mtime: Date.now(),
          children: {
            scp: {
              name: 'scp',
              type: 'directory',
              permissions: {
                user: { read: true, write: true, execute: true },
                group: { read: true, write: true, execute: true },
                others: { read: true, write: false, execute: true }
              },
              owner: 'scp',
              group: 'foundation',
              size: 0,
              mtime: Date.now(),
              children: {
                documents: {
                  name: 'documents',
                  type: 'directory',
                  permissions: {
                    user: { read: true, write: true, execute: true },
                    group: { read: true, write: true, execute: true },
                    others: { read: true, write: false, execute: true }
                  },
                  owner: 'scp',
                  group: 'foundation',
                  size: 0,
                  mtime: Date.now(),
                  children: {}
                },
                logs: {
                  name: 'logs',
                  type: 'directory',
                  permissions: {
                    user: { read: true, write: true, execute: true },
                    group: { read: true, write: true, execute: true },
                    others: { read: false, write: false, execute: false }
                  },
                  owner: 'scp',
                  group: 'foundation',
                  size: 0,
                  mtime: Date.now(),
                  children: {}
                }
              }
            }
          }
        },
        etc: {
          name: 'etc',
          type: 'directory',
          permissions: {
            user: { read: true, write: true, execute: true },
            group: { read: true, write: false, execute: true },
            others: { read: true, write: false, execute: false }
          },
          owner: 'root',
          group: 'root',
          size: 0,
          mtime: Date.now(),
          children: {
            passwd: {
              name: 'passwd',
              type: 'file',
              permissions: {
                user: { read: true, write: true, execute: false },
                group: { read: true, write: false, execute: false },
                others: { read: true, write: false, execute: false }
              },
              owner: 'root',
              group: 'root',
              size: 120,
              mtime: Date.now(),
              content: 'root:x:0:0:root:/root:/bin/bash\nscp:x:1000:1000:SCP Foundation:/home/scp:/bin/bash\n'
            },
            hosts: {
              name: 'hosts',
              type: 'file',
              permissions: {
                user: { read: true, write: true, execute: false },
                group: { read: true, write: false, execute: false },
                others: { read: true, write: false, execute: false }
              },
              owner: 'root',
              group: 'root',
              size: 80,
              mtime: Date.now(),
              content: '127.0.0.1 localhost\n127.0.1.1 scp-terminal\n'
            }
          }
        },
        var: {
          name: 'var',
          type: 'directory',
          permissions: {
            user: { read: true, write: true, execute: true },
            group: { read: true, write: true, execute: true },
            others: { read: true, write: false, execute: true }
          },
          owner: 'root',
          group: 'root',
          size: 0,
          mtime: Date.now(),
          children: {
            log: {
              name: 'log',
              type: 'directory',
              permissions: {
                user: { read: true, write: true, execute: true },
                group: { read: true, write: true, execute: true },
                others: { read: false, write: false, execute: false }
              },
              owner: 'root',
              group: 'root',
              size: 0,
              mtime: Date.now(),
              children: {
                'system.log': {
                  name: 'system.log',
                  type: 'file',
                  permissions: {
                    user: { read: true, write: true, execute: false },
                    group: { read: true, write: false, execute: false },
                    others: { read: false, write: false, execute: false }
                  },
                  owner: 'root',
                  group: 'root',
                  size: 200,
                  mtime: Date.now(),
                  content: '2026-04-03 00:00:00 [INFO] System started\n2026-04-03 00:00:01 [INFO] Terminal initialized\n2026-04-03 00:00:02 [INFO] File system mounted\n'
                }
              }
            }
          }
        }
      }
    }
  }

  // 从存储加载文件系统
  private async loadFromStorage(): Promise<void> {
    try {
      const data = await indexedDBService.loadFilesystem()
      if (data) {
        this.root = data.root
        this.currentPath = data.currentPath
      }
      this.isInitialized = true
    } catch (error) {
      console.error('[Filesystem] Failed to load from storage:', error)
      this.isInitialized = true
    }
  }

  // 保存到存储
  private async saveToStorage(): Promise<void> {
    if (!this.isInitialized) return
    try {
      await indexedDBService.saveFilesystem(this.root, this.currentPath)
    } catch (error) {
      console.error('[Filesystem] Failed to save to storage:', error)
    }
  }

  // 获取当前工作目录
  getCurrentDirectory(): string {
    return this.currentPath.join('/') || '/'
  }

  // 更改当前目录
  changeDirectory(path: string): boolean {
    if (path === '~') {
      this.currentPath = ['', 'home', 'scp']
      this.saveToStorage()
      return true
    }

    let newPath: string[]
    if (path.startsWith('/')) {
      newPath = ['']
      path = path.substring(1)
    } else {
      newPath = [...this.currentPath]
    }

    const parts = path.split('/').filter(p => p !== '')

    for (const part of parts) {
      if (part === '..') {
        if (newPath.length > 1) {
          newPath.pop()
        }
      } else if (part === '.') {
        // 当前目录，跳过
      } else {
        const node = this.getNode(newPath)
        if (node && node.type === 'directory' && node.children && part in node.children) {
          newPath.push(part)
        } else {
          return false // 目录不存在
        }
      }
    }

    this.currentPath = newPath
    this.saveToStorage()
    return true
  }

  // 获取指定路径的节点
  private getNode(path: string[]): FileSystemNode | null {
    let current = this.root
    for (let i = 1; i < path.length; i++) {
      const part = path[i]
      if (current.type === 'directory' && current.children && part in current.children) {
        current = current.children[part]
      } else {
        return null
      }
    }
    return current
  }

  // 根据路径字符串获取节点
  getNodeByPath(path: string): FileSystemNode | null {
    let targetPath: string[]
    if (path.startsWith('/')) {
      targetPath = ['']
      path = path.substring(1)
    } else {
      targetPath = [...this.currentPath]
    }

    const parts = path.split('/').filter(p => p !== '')
    for (const part of parts) {
      if (part === '..') {
        if (targetPath.length > 1) {
          targetPath.pop()
        }
      } else if (part === '.') {
        // 当前目录，跳过
      } else {
        const node = this.getNode(targetPath)
        if (node && node.type === 'directory' && node.children && part in node.children) {
          targetPath.push(part)
        } else {
          return null
        }
      }
    }

    return this.getNode(targetPath)
  }

  // 列出目录内容
  listDirectory(path?: string): FileSystemNode[] {
    const targetPath = path ? this.resolvePath(path) : this.currentPath
    const node = this.getNode(targetPath)
    
    if (!node || node.type !== 'directory' || !node.children) {
      return []
    }

    return Object.values(node.children)
  }

  // 解析路径
  private resolvePath(path: string): string[] {
    let resolvedPath: string[]
    if (path.startsWith('/')) {
      resolvedPath = ['']
      path = path.substring(1)
    } else {
      resolvedPath = [...this.currentPath]
    }

    const parts = path.split('/').filter(p => p !== '')
    for (const part of parts) {
      if (part === '..') {
        if (resolvedPath.length > 1) {
          resolvedPath.pop()
        }
      } else if (part === '.') {
        // 当前目录，跳过
      } else {
        resolvedPath.push(part)
      }
    }

    return resolvedPath
  }

  // 创建目录
  createDirectory(path: string): boolean {
    const parts = this.resolvePath(path)
    const dirName = parts.pop()
    if (!dirName) return false

    const parentPath = parts
    const parentNode = this.getNode(parentPath)

    if (!parentNode || parentNode.type !== 'directory' || !parentNode.children) {
      return false
    }

    // 检查父目录的写入权限
    if (!this.hasWritePermission(parentNode)) {
      console.warn(`[Filesystem] Permission denied: cannot create directory '${path}'`)
      return false
    }

    if (dirName in parentNode.children) {
      return false // 目录已存在
    }

    parentNode.children[dirName] = {
      name: dirName,
      type: 'directory',
      permissions: {
        user: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        others: { read: true, write: false, execute: true }
      },
      owner: 'scp',
      group: 'foundation',
      size: 0,
      mtime: Date.now(),
      children: {}
    }

    parentNode.mtime = Date.now()
    this.saveToStorage()
    return true
  }

  // 创建文件
  createFile(path: string, content: string = ''): boolean {
    const parts = this.resolvePath(path)
    const fileName = parts.pop()
    if (!fileName) return false

    const parentPath = parts
    const parentNode = this.getNode(parentPath)

    if (!parentNode || parentNode.type !== 'directory' || !parentNode.children) {
      return false
    }

    // 检查父目录的写入权限
    if (!this.hasWritePermission(parentNode)) {
      console.warn(`[Filesystem] Permission denied: cannot create file '${path}'`)
      return false
    }

    parentNode.children[fileName] = {
      name: fileName,
      type: 'file',
      permissions: {
        user: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        others: { read: true, write: false, execute: false }
      },
      owner: 'scp',
      group: 'foundation',
      size: content.length,
      mtime: Date.now(),
      content
    }

    parentNode.mtime = Date.now()
    this.saveToStorage()
    return true
  }

  // 删除文件或目录
  deleteNode(path: string): boolean {
    const parts = this.resolvePath(path)
    const nodeName = parts.pop()
    if (!nodeName) return false

    const parentPath = parts
    const parentNode = this.getNode(parentPath)

    if (!parentNode || parentNode.type !== 'directory' || !parentNode.children) {
      return false
    }

    if (!(nodeName in parentNode.children)) {
      return false // 节点不存在
    }

    // 检查父目录的写入权限（需要父目录的写入权限才能删除子项）
    if (!this.hasWritePermission(parentNode)) {
      console.warn(`[Filesystem] Permission denied: cannot delete '${path}'`)
      return false
    }

    delete parentNode.children[nodeName]
    parentNode.mtime = Date.now()
    this.saveToStorage()
    return true
  }

  // 检查读取权限
  private hasReadPermission(node: FileSystemNode): boolean {
    // 简化的权限检查，假设当前用户是 scp
    return node.permissions.user.read || node.permissions.group.read || node.permissions.others.read
  }

  // 检查写入权限
  private hasWritePermission(node: FileSystemNode): boolean {
    // 简化的权限检查，假设当前用户是 scp
    return node.permissions.user.write || node.permissions.group.write || node.permissions.others.write
  }



  // 读取文件内容
  readFile(path: string): string | null {
    const node = this.getNodeByPath(path)
    if (!node || node.type !== 'file') {
      return null
    }
    
    // 检查读取权限
    if (!this.hasReadPermission(node)) {
      console.warn(`[Filesystem] Permission denied: cannot read '${path}'`)
      return null
    }
    
    return node.content || ''
  }

  // 写入文件内容
  writeFile(path: string, content: string): boolean {
    const node = this.getNodeByPath(path)
    if (!node || node.type !== 'file') {
      return false
    }

    // 检查写入权限
    if (!this.hasWritePermission(node)) {
      console.warn(`[Filesystem] Permission denied: cannot write '${path}'`)
      return false
    }

    node.content = content
    node.size = content.length
    node.mtime = Date.now()

    // 更新父目录的修改时间
    const parts = this.resolvePath(path)
    parts.pop() // 移除文件名
    let current = this.root
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i]
      if (current.type === 'directory' && current.children && part in current.children) {
        current = current.children[part]
        current.mtime = Date.now()
      }
    }

    this.saveToStorage()
    return true
  }

  // 复制文件或目录
  copyNode(sourcePath: string, destinationPath: string): boolean {
    const sourceNode = this.getNodeByPath(sourcePath)
    if (!sourceNode) return false

    // 检查源文件的读取权限
    if (!this.hasReadPermission(sourceNode)) {
      console.warn(`[Filesystem] Permission denied: cannot read source '${sourcePath}'`)
      return false
    }

    const destParts = this.resolvePath(destinationPath)
    const destName = destParts.pop()
    if (!destName) return false

    const destParentPath = destParts
    const destParentNode = this.getNode(destParentPath)

    if (!destParentNode || destParentNode.type !== 'directory' || !destParentNode.children) {
      return false
    }

    // 检查目标父目录的写入权限
    if (!this.hasWritePermission(destParentNode)) {
      console.warn(`[Filesystem] Permission denied: cannot write to destination '${destinationPath}'`)
      return false
    }

    if (destName in destParentNode.children) {
      return false // 目标已存在
    }

    // 递归复制
    const copyNode = (node: FileSystemNode): FileSystemNode => {
      const newNode: FileSystemNode = {
        ...node,
        mtime: Date.now()
      }

      if (node.type === 'directory' && node.children) {
        newNode.children = {}
        for (const [name, child] of Object.entries(node.children)) {
          newNode.children[name] = copyNode(child)
        }
      }

      return newNode
    }

    destParentNode.children[destName] = copyNode(sourceNode)
    destParentNode.mtime = Date.now()
    this.saveToStorage()
    return true
  }

  // 移动文件或目录
  moveNode(sourcePath: string, destinationPath: string): boolean {
    const sourceNode = this.getNodeByPath(sourcePath)
    if (!sourceNode) return false

    // 检查源文件的读取权限
    if (!this.hasReadPermission(sourceNode)) {
      console.warn(`[Filesystem] Permission denied: cannot read source '${sourcePath}'`)
      return false
    }

    // 获取源文件的父目录
    const sourceParts = this.resolvePath(sourcePath)
    sourceParts.pop()
    const sourceParentNode = this.getNode(sourceParts)
    
    // 检查源父目录的写入权限（需要写入权限才能删除）
    if (sourceParentNode && !this.hasWritePermission(sourceParentNode)) {
      console.warn(`[Filesystem] Permission denied: cannot delete source '${sourcePath}'`)
      return false
    }

    // 先复制
    if (!this.copyNode(sourcePath, destinationPath)) {
      return false
    }

    // 再删除原文件
    return this.deleteNode(sourcePath)
  }

  // 更改文件权限
  changePermissions(path: string, permissions: FilePermissions): boolean {
    const node = this.getNodeByPath(path)
    if (!node) return false

    // 检查是否有权限修改权限（简化为检查写入权限）
    if (!this.hasWritePermission(node)) {
      console.warn(`[Filesystem] Permission denied: cannot change permissions of '${path}'`)
      return false
    }

    node.permissions = permissions
    node.mtime = Date.now()
    this.saveToStorage()
    return true
  }

  // 更改文件所有者
  changeOwner(path: string, owner: string, group: string): boolean {
    const node = this.getNodeByPath(path)
    if (!node) return false

    // 检查是否有权限修改所有者（简化为检查写入权限）
    if (!this.hasWritePermission(node)) {
      console.warn(`[Filesystem] Permission denied: cannot change owner of '${path}'`)
      return false
    }

    node.owner = owner
    node.group = group
    node.mtime = Date.now()
    this.saveToStorage()
    return true
  }

  // 查找文件
  findFiles(pattern: string, startPath: string = ''): string[] {
    const results: string[] = []
    const startNode = this.getNodeByPath(startPath) || this.root

    const search = (node: FileSystemNode, currentPath: string) => {
      if (node.type === 'file' && node.name.match(pattern)) {
        results.push(currentPath)
      }

      if (node.type === 'directory' && node.children) {
        for (const [name, child] of Object.entries(node.children)) {
          search(child, currentPath ? `${currentPath}/${name}` : name)
        }
      }
    }

    search(startNode, startPath || '')
    return results
  }

  // 搜索文件内容
  grepContent(pattern: string, files: string[]): { file: string, lines: string[] }[] {
    const results: { file: string, lines: string[] }[] = []

    for (const file of files) {
      const node = this.getNodeByPath(file)
      if (node && node.type === 'file' && node.content) {
        const lines = node.content.split('\n')
        const matchingLines = lines.filter(line => line.match(pattern))
        if (matchingLines.length > 0) {
          results.push({ file, lines: matchingLines })
        }
      }
    }

    return results
  }
}

// 导出单例实例
export const filesystem = new FileSystem()
