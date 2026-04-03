# Repository Size Fix Report

## Problem
团队开发成员反馈克隆仓库体积过大（**2.7GB**），导致克隆困难。

## Root Cause
Rust/Tauri 编译产物（`packages/desktop/target` 目录）被错误地提交到 Git 中：
- **1225 个编译文件**被跟踪
- 包括 `.rlib`, `.so`, `.d` 等编译中间文件
- 最大的单个文件：**79MB**（libgtk-*.rlib）

## Solution

### 1. 更新 `.gitignore`
添加了 Rust/Tauri 相关忽略规则：
```
# Rust/Tauri
**/target
**/*.rs.bk
*.rlib
*.so
*.pdb

# Tauri
**/gen/schemas
```

### 2. 从 Git 历史中移除大文件
使用 `git filter-branch` 重写历史，完全移除 target 目录：
```bash
git filter-branch --force --index-filter \
  'git rm -r --cached --ignore-unmatch packages/desktop/target' \
  --prune-empty --tag-name-filter cat -- --all
```

### 3. 清理和垃圾回收
```bash
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## Results

### Before Fix
- **仓库总大小**: 2.7 GB
- **.git 目录**: 412 MB
- **跟踪的编译文件**: 1225 个

### After Fix
- **远程仓库大小**: ~337 MB（GitHub 显示）
- **本地 .git 目录**: 1.9 MB
- **浅克隆 .git**: 1.4 MB
- **减少比例**: **~87%**

### 克隆测试
```bash
# 浅克隆（推荐用于开发）
git clone --depth 1 https://github.com/LemonStudio-hub/scp-os.git
# .git 大小: 1.4 MB

# 完整克隆
git clone https://github.com/LemonStudio-hub/scp-os.git
# .git 大小: 约 2 MB
```

## Recommendations for Team

### 克隆仓库
```bash
# 快速克隆（推荐）
git clone --depth 1 https://github.com/LemonStudio-hub/scp-os.git

# 完整历史克隆
git clone https://github.com/LemonStudio-hub/scp-os.git
```

### 编译 Tauri 桌面应用
克隆后需要本地编译：
```bash
cd packages/desktop
cargo build  # 或 cargo tauri build
```

### 防止再次提交编译产物
`.gitignore` 已配置，但请确保：
1. 不要使用 `git add -f` 强制添加 target 目录
2. 定期检查 `git status` 确认没有误提交

## Commit History
- Commit: `0844ead` - 移除 Rust/Tauri 编译产物
- 所有标签已更新到新的提交 hash
