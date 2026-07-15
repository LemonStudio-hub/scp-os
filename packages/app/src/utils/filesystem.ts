import logger from './logger'
import {
  createStorageAdapter,
  migrateToOPFS,
  type FilesystemStorageAdapter,
} from './filesystemAdapter'

export type FileSystemNodeType = 'file' | 'directory'

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

export interface FileSystemNode {
  name: string
  type: FileSystemNodeType
  permissions: FilePermissions
  owner: string
  group: string
  size: number
  mtime: number
  content?: string
  children?: Record<string, FileSystemNode>
}

export class FileSystem {
  private root: FileSystemNode
  private currentPath: string[] = ['']
  private isInitialized = false
  private storageAdapter: FilesystemStorageAdapter

  constructor() {
    this.root = this.createDefaultFilesystem()
    this.storageAdapter = createStorageAdapter()
  }

  async init(): Promise<void> {
    await migrateToOPFS()
    this.storageAdapter = createStorageAdapter()
    await this.loadFromStorage()
  }

  private createDefaultFilesystem(): FileSystemNode {
    return {
      name: '',
      type: 'directory',
      permissions: {
        user: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        others: { read: true, write: false, execute: true },
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
            others: { read: true, write: false, execute: true },
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
                others: { read: true, write: false, execute: true },
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
                    others: { read: true, write: false, execute: true },
                  },
                  owner: 'scp',
                  group: 'foundation',
                  size: 0,
                  mtime: Date.now(),
                  children: {},
                },
                desktop: {
                  name: 'desktop',
                  type: 'directory',
                  permissions: {
                    user: { read: true, write: true, execute: true },
                    group: { read: true, write: true, execute: true },
                    others: { read: true, write: false, execute: true },
                  },
                  owner: 'scp',
                  group: 'foundation',
                  size: 0,
                  mtime: Date.now(),
                  children: {
                    'terminal.desktop': {
                      name: 'terminal.desktop',
                      type: 'file',
                      permissions: {
                        user: { read: true, write: true, execute: false },
                        group: { read: true, write: false, execute: false },
                        others: { read: true, write: false, execute: false },
                      },
                      owner: 'scp',
                      group: 'foundation',
                      size: 70,
                      mtime: Date.now(),
                      content:
                        '[Desktop Entry]\nName=Terminal\nType=Application\nTool=terminal\nIcon=terminal\nX=50\nY=50',
                    },
                    'files.desktop': {
                      name: 'files.desktop',
                      type: 'file',
                      permissions: {
                        user: { read: true, write: true, execute: false },
                        group: { read: true, write: false, execute: false },
                        others: { read: true, write: false, execute: false },
                      },
                      owner: 'scp',
                      group: 'foundation',
                      size: 62,
                      mtime: Date.now(),
                      content:
                        '[Desktop Entry]\nName=Files\nType=Application\nTool=filemanager\nIcon=folder\nX=180\nY=50',
                    },
                    'chat.desktop': {
                      name: 'chat.desktop',
                      type: 'file',
                      permissions: {
                        user: { read: true, write: true, execute: false },
                        group: { read: true, write: false, execute: false },
                        others: { read: true, write: false, execute: false },
                      },
                      owner: 'scp',
                      group: 'foundation',
                      size: 58,
                      mtime: Date.now(),
                      content:
                        '[Desktop Entry]\nName=Chat\nType=Application\nTool=chat\nIcon=chat\nX=310\nY=50',
                    },
                    'dash.desktop': {
                      name: 'dash.desktop',
                      type: 'file',
                      permissions: {
                        user: { read: true, write: true, execute: false },
                        group: { read: true, write: false, execute: false },
                        others: { read: true, write: false, execute: false },
                      },
                      owner: 'scp',
                      group: 'foundation',
                      size: 58,
                      mtime: Date.now(),
                      content:
                        '[Desktop Entry]\nName=Dash\nType=Application\nTool=dash\nIcon=grid\nX=50\nY=180',
                    },
                    'feedback.desktop': {
                      name: 'feedback.desktop',
                      type: 'file',
                      permissions: {
                        user: { read: true, write: true, execute: false },
                        group: { read: true, write: false, execute: false },
                        others: { read: true, write: false, execute: false },
                      },
                      owner: 'scp',
                      group: 'foundation',
                      size: 70,
                      mtime: Date.now(),
                      content:
                        '[Desktop Entry]\nName=Feedback\nType=Application\nTool=feedback\nIcon=feedback\nX=180\nY=180',
                    },
                    'docs.desktop': {
                      name: 'docs.desktop',
                      type: 'file',
                      permissions: {
                        user: { read: true, write: true, execute: false },
                        group: { read: true, write: false, execute: false },
                        others: { read: true, write: false, execute: false },
                      },
                      owner: 'scp',
                      group: 'foundation',
                      size: 58,
                      mtime: Date.now(),
                      content:
                        '[Desktop Entry]\nName=Docs\nType=Application\nTool=docs\nIcon=document\nX=310\nY=180',
                    },
                    'settings.desktop': {
                      name: 'settings.desktop',
                      type: 'file',
                      permissions: {
                        user: { read: true, write: true, execute: false },
                        group: { read: true, write: false, execute: false },
                        others: { read: true, write: false, execute: false },
                      },
                      owner: 'scp',
                      group: 'foundation',
                      size: 72,
                      mtime: Date.now(),
                      content:
                        '[Desktop Entry]\nName=Settings\nType=Application\nTool=settings\nIcon=settings\nX=50\nY=310',
                    },
                    'appmanager.desktop': {
                      name: 'appmanager.desktop',
                      type: 'file',
                      permissions: {
                        user: { read: true, write: true, execute: false },
                        group: { read: true, write: false, execute: false },
                        others: { read: true, write: false, execute: false },
                      },
                      owner: 'scp',
                      group: 'foundation',
                      size: 78,
                      mtime: Date.now(),
                      content:
                        '[Desktop Entry]\nName=App Manager\nType=Application\nTool=appmanager\nIcon=grid\nX=180\nY=310',
                    },
                    'editor.desktop': {
                      name: 'editor.desktop',
                      type: 'file',
                      permissions: {
                        user: { read: true, write: true, execute: false },
                        group: { read: true, write: false, execute: false },
                        others: { read: true, write: false, execute: false },
                      },
                      owner: 'scp',
                      group: 'foundation',
                      size: 62,
                      mtime: Date.now(),
                      content:
                        '[Desktop Entry]\nName=Editor\nType=Application\nTool=editor\nIcon=edit\nX=310\nY=310',
                    },
                  },
                },
                downloads: {
                  name: 'downloads',
                  type: 'directory',
                  permissions: {
                    user: { read: true, write: true, execute: true },
                    group: { read: true, write: true, execute: true },
                    others: { read: true, write: false, execute: true },
                  },
                  owner: 'scp',
                  group: 'foundation',
                  size: 0,
                  mtime: Date.now(),
                  children: {},
                },
                logs: {
                  name: 'logs',
                  type: 'directory',
                  permissions: {
                    user: { read: true, write: true, execute: true },
                    group: { read: true, write: true, execute: true },
                    others: { read: false, write: false, execute: false },
                  },
                  owner: 'scp',
                  group: 'foundation',
                  size: 0,
                  mtime: Date.now(),
                  children: {},
                },
              },
            },
          },
        },
        etc: {
          name: 'etc',
          type: 'directory',
          permissions: {
            user: { read: true, write: true, execute: true },
            group: { read: true, write: false, execute: true },
            others: { read: true, write: false, execute: false },
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
                others: { read: true, write: false, execute: false },
              },
              owner: 'root',
              group: 'root',
              size: 120,
              mtime: Date.now(),
              content:
                'root:x:0:0:root:/root:/bin/bash\nscp:x:1000:1000:SCP Foundation:/home/scp:/bin/bash\n',
            },
            hosts: {
              name: 'hosts',
              type: 'file',
              permissions: {
                user: { read: true, write: true, execute: false },
                group: { read: true, write: false, execute: false },
                others: { read: true, write: false, execute: false },
              },
              owner: 'root',
              group: 'root',
              size: 80,
              mtime: Date.now(),
              content: '127.0.0.1 localhost\n127.0.1.1 scp-terminal\n',
            },
          },
        },
        var: {
          name: 'var',
          type: 'directory',
          permissions: {
            user: { read: true, write: true, execute: true },
            group: { read: true, write: true, execute: true },
            others: { read: true, write: false, execute: true },
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
                others: { read: false, write: false, execute: false },
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
                    others: { read: false, write: false, execute: false },
                  },
                  owner: 'root',
                  group: 'root',
                  size: 200,
                  mtime: Date.now(),
                  content:
                    '2026-04-03 00:00:00 [INFO] System started\n2026-04-03 00:00:01 [INFO] Terminal initialized\n2026-04-03 00:00:02 [INFO] File system mounted\n',
                },
              },
            },
          },
        },
        tmp: {
          name: 'tmp',
          type: 'directory',
          permissions: {
            user: { read: true, write: true, execute: true },
            group: { read: true, write: true, execute: true },
            others: { read: true, write: true, execute: true },
          },
          owner: 'root',
          group: 'root',
          size: 0,
          mtime: Date.now(),
          children: {},
        },
      },
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const data = await this.storageAdapter.load()
      if (data) {
        this.root = data.root as FileSystemNode
        this.currentPath = data.currentPath
        this.ensureDefaultDirs()
        logger.info(`[Filesystem] Loaded from ${this.storageAdapter.getBackendName()}`)
      }
      this.isInitialized = true
    } catch (error) {
      logger.error('[Filesystem] Failed to load from storage:', error)
      this.isInitialized = true
    }
  }

  private async saveToStorage(): Promise<void> {
    if (!this.isInitialized) return
    try {
      await this.storageAdapter.save({
        root: this.root,
        currentPath: this.currentPath,
      })
    } catch (error) {
      logger.error('[Filesystem] Failed to save to storage:', error)
    }
  }

  private ensureDefaultDirs(): void {
    const defaults = this.createDefaultFilesystem()

    const ensureNode = (path: string[], template: FileSystemNode) => {
      const parent = this.getNode(path.slice(0, -1))
      const name = path[path.length - 1]
      if (!parent || parent.type !== 'directory' || !parent.children) return
      if (!(name in parent.children)) {
        parent.children[name] = JSON.parse(JSON.stringify(template))
      } else if (template.type === 'directory' && template.children) {
        for (const [childName, childTemplate] of Object.entries(template.children)) {
          ensureNode([...path, childName], childTemplate)
        }
      }
    }

    if (defaults.children) {
      for (const [name, template] of Object.entries(defaults.children)) {
        ensureNode(['', name], template)
      }
    }

    const home = defaults.children?.home?.children?.scp
    if (home?.children) {
      for (const [name, template] of Object.entries(home.children)) {
        ensureNode(['', 'home', 'scp', name], template)
      }
    }

    this.saveToStorage()
  }

  getCurrentDirectory(): string {
    return this.currentPath.join('/') || '/'
  }

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

    const parts = path.split('/').filter((p) => p !== '')

    for (const part of parts) {
      if (part === '..') {
        if (newPath.length > 1) {
          newPath.pop()
        }
      } else if (part === '.') {
        // current dir, skip
      } else {
        const node = this.getNode(newPath)
        if (node && node.type === 'directory' && node.children && part in node.children) {
          newPath.push(part)
        } else {
          return false
        }
      }
    }

    this.currentPath = newPath
    this.saveToStorage()
    return true
  }

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

  getNodeByPath(path: string): FileSystemNode | null {
    let targetPath: string[]
    if (path.startsWith('/')) {
      targetPath = ['']
      path = path.substring(1)
    } else {
      targetPath = [...this.currentPath]
    }

    const parts = path.split('/').filter((p) => p !== '')
    for (const part of parts) {
      if (part === '..') {
        if (targetPath.length > 1) {
          targetPath.pop()
        }
      } else if (part === '.') {
        // current dir, skip
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

  listDirectory(path?: string): FileSystemNode[] {
    const targetPath = path ? this.resolvePath(path) : this.currentPath
    const node = this.getNode(targetPath)

    if (!node || node.type !== 'directory' || !node.children) {
      return []
    }

    return Object.values(node.children)
  }

  private resolvePath(path: string): string[] {
    let resolvedPath: string[]
    if (path.startsWith('/')) {
      resolvedPath = ['']
      path = path.substring(1)
    } else {
      resolvedPath = [...this.currentPath]
    }

    const parts = path.split('/').filter((p) => p !== '')
    for (const part of parts) {
      if (part === '..') {
        if (resolvedPath.length > 1) {
          resolvedPath.pop()
        }
      } else if (part === '.') {
        // current dir, skip
      } else {
        resolvedPath.push(part)
      }
    }

    return resolvedPath
  }

  createDirectory(path: string): boolean {
    const parts = this.resolvePath(path)
    const dirName = parts.pop()
    if (!dirName) return false

    const parentNode = this.getNode(parts)

    if (!parentNode || parentNode.type !== 'directory' || !parentNode.children) {
      return false
    }

    if (!this.hasWritePermission(parentNode)) {
      logger.warn(`[Filesystem] Permission denied: cannot create directory '${path}'`)
      return false
    }

    if (dirName in parentNode.children) {
      return false
    }

    parentNode.children[dirName] = {
      name: dirName,
      type: 'directory',
      permissions: {
        user: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        others: { read: true, write: false, execute: true },
      },
      owner: 'scp',
      group: 'foundation',
      size: 0,
      mtime: Date.now(),
      children: {},
    }

    parentNode.mtime = Date.now()
    this.saveToStorage()
    return true
  }

  createFile(path: string, content: string = ''): boolean {
    const parts = this.resolvePath(path)
    const fileName = parts.pop()
    if (!fileName) return false

    const parentNode = this.getNode(parts)

    if (!parentNode || parentNode.type !== 'directory' || !parentNode.children) {
      return false
    }

    if (!this.hasWritePermission(parentNode)) {
      logger.warn(`[Filesystem] Permission denied: cannot create file '${path}'`)
      return false
    }

    parentNode.children[fileName] = {
      name: fileName,
      type: 'file',
      permissions: {
        user: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        others: { read: true, write: false, execute: false },
      },
      owner: 'scp',
      group: 'foundation',
      size: content.length,
      mtime: Date.now(),
      content,
    }

    parentNode.mtime = Date.now()
    this.saveToStorage()
    return true
  }

  deleteNode(path: string): boolean {
    const parts = this.resolvePath(path)
    const nodeName = parts.pop()
    if (!nodeName) return false

    const parentNode = this.getNode(parts)

    if (!parentNode || parentNode.type !== 'directory' || !parentNode.children) {
      return false
    }

    if (!(nodeName in parentNode.children)) {
      return false
    }

    if (!this.hasWritePermission(parentNode)) {
      logger.warn(`[Filesystem] Permission denied: cannot delete '${path}'`)
      return false
    }

    delete parentNode.children[nodeName]
    parentNode.mtime = Date.now()
    this.saveToStorage()
    return true
  }

  remove(path: string): boolean {
    return this.deleteNode(path)
  }

  rename(oldPath: string, newPath: string): boolean {
    return this.moveNode(oldPath, newPath)
  }

  private hasReadPermission(node: FileSystemNode): boolean {
    return node.permissions.user.read || node.permissions.group.read || node.permissions.others.read
  }

  private hasWritePermission(node: FileSystemNode): boolean {
    return (
      node.permissions.user.write || node.permissions.group.write || node.permissions.others.write
    )
  }

  readFile(path: string): string | null {
    const node = this.getNodeByPath(path)
    if (!node || node.type !== 'file') {
      return null
    }

    if (!this.hasReadPermission(node)) {
      logger.warn(`[Filesystem] Permission denied: cannot read '${path}'`)
      return null
    }

    return node.content || ''
  }

  writeFile(path: string, content: string): boolean {
    const node = this.getNodeByPath(path)
    if (!node || node.type !== 'file') {
      return false
    }

    if (!this.hasWritePermission(node)) {
      logger.warn(`[Filesystem] Permission denied: cannot write '${path}'`)
      return false
    }

    node.content = content
    node.size = content.length
    node.mtime = Date.now()

    const parts = this.resolvePath(path)
    parts.pop()
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

  copyNode(sourcePath: string, destinationPath: string): boolean {
    const sourceNode = this.getNodeByPath(sourcePath)
    if (!sourceNode) return false

    if (!this.hasReadPermission(sourceNode)) {
      logger.warn(`[Filesystem] Permission denied: cannot read source '${sourcePath}'`)
      return false
    }

    const destParts = this.resolvePath(destinationPath)
    const destName = destParts.pop()
    if (!destName) return false

    const destParentNode = this.getNode(destParts)

    if (!destParentNode || destParentNode.type !== 'directory' || !destParentNode.children) {
      return false
    }

    if (!this.hasWritePermission(destParentNode)) {
      logger.warn(
        `[Filesystem] Permission denied: cannot write to destination '${destinationPath}'`
      )
      return false
    }

    if (destName in destParentNode.children) {
      return false
    }

    const copyNodeRecursive = (node: FileSystemNode): FileSystemNode => {
      const newNode: FileSystemNode = {
        ...node,
        mtime: Date.now(),
      }

      if (node.type === 'directory' && node.children) {
        newNode.children = {}
        for (const [name, child] of Object.entries(node.children)) {
          newNode.children[name] = copyNodeRecursive(child)
        }
      }

      return newNode
    }

    destParentNode.children[destName] = copyNodeRecursive(sourceNode)
    destParentNode.mtime = Date.now()
    this.saveToStorage()
    return true
  }

  moveNode(sourcePath: string, destinationPath: string): boolean {
    const sourceNode = this.getNodeByPath(sourcePath)
    if (!sourceNode) return false

    if (!this.hasReadPermission(sourceNode)) {
      logger.warn(`[Filesystem] Permission denied: cannot read source '${sourcePath}'`)
      return false
    }

    const sourceParts = this.resolvePath(sourcePath)
    sourceParts.pop()
    const sourceParentNode = this.getNode(sourceParts)

    if (sourceParentNode && !this.hasWritePermission(sourceParentNode)) {
      logger.warn(`[Filesystem] Permission denied: cannot delete source '${sourcePath}'`)
      return false
    }

    if (!this.copyNode(sourcePath, destinationPath)) {
      return false
    }

    return this.deleteNode(sourcePath)
  }

  changePermissions(path: string, permissions: FilePermissions): boolean {
    const node = this.getNodeByPath(path)
    if (!node) return false

    if (!this.hasWritePermission(node)) {
      logger.warn(`[Filesystem] Permission denied: cannot change permissions of '${path}'`)
      return false
    }

    node.permissions = permissions
    node.mtime = Date.now()
    this.saveToStorage()
    return true
  }

  changeOwner(path: string, owner: string, group: string): boolean {
    const node = this.getNodeByPath(path)
    if (!node) return false

    if (!this.hasWritePermission(node)) {
      logger.warn(`[Filesystem] Permission denied: cannot change owner of '${path}'`)
      return false
    }

    node.owner = owner
    node.group = group
    node.mtime = Date.now()
    this.saveToStorage()
    return true
  }

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

  grepContent(pattern: string, files: string[]): { file: string; lines: string[] }[] {
    const results: { file: string; lines: string[] }[] = []

    for (const file of files) {
      const node = this.getNodeByPath(file)
      if (node && node.type === 'file' && node.content) {
        const lines = node.content.split('\n')
        const matchingLines = lines.filter((line) => line.match(pattern))
        if (matchingLines.length > 0) {
          results.push({ file, lines: matchingLines })
        }
      }
    }

    return results
  }

  getStorageBackend(): string {
    return this.storageAdapter.getBackendName()
  }

  async forceFlush(): Promise<void> {
    const opfsStorage = (await import('./opfsStorage')).default
    await opfsStorage.forceFlush()
  }
}

export const filesystem = new FileSystem()
