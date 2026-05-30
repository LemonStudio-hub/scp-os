interface FileSystemSyncAccessHandle {
  read(buffer: BufferSource, options?: { at: number }): number
  write(buffer: BufferSource, options?: { at: number }): number
  truncate(size: number): void
  getSize(): number
  flush(): void
  close(): void
}

interface FileSystemFileHandle {
  createSyncAccessHandle(): Promise<FileSystemSyncAccessHandle>
}

interface FileSystemCreateWritableOptions {
  keepExistingData?: boolean
}

interface FileSystemFileHandle {
  createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>
}

interface FileSystemGetFileOptions {
  create?: boolean
}

interface FileSystemGetDirectoryOptions {
  create?: boolean
}

interface FileSystemRemoveOptions {
  recursive?: boolean
}

interface FileSystemDirectoryHandle {
  getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle>
  getDirectoryHandle(
    name: string,
    options?: FileSystemGetDirectoryOptions
  ): Promise<FileSystemDirectoryHandle>
  removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void>
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>
  keys(): AsyncIterableIterator<string>
  values(): AsyncIterableIterator<FileSystemHandle>
  [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>
}

interface StorageManager {
  getDirectory(): Promise<FileSystemDirectoryHandle>
  estimate(): Promise<StorageEstimate>
}

interface StorageEstimate {
  usage?: number
  quota?: number
}

interface Navigator {
  storage: StorageManager
}
