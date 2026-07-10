# Usage Guide

This tutorial will guide you through using the SCP-OS system from scratch, covering desktop operations, command-line terminal, SCP data queries, GUI tools, theme personalization, and other core feature modules.

---

## Table of Contents

- [First Launch](#first-launch)
- [Terminal Operations](#terminal-operations)
- [SCP Data Queries](#scp-data-queries)
- [File System Operations](#file-system-operations)
- [GUI Tools](#gui-tools)
- [Docs](#docs)
- [Themes & Personalization](#themes--personalization)
- [Chat System](#chat-system)
- [Feedback System](#feedback-system)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Mobile Operations](#mobile-operations)

---

## First Launch

### Login

1. After launching the application, you will see an SCP Foundation-style loading screen
2. After loading completes, you will enter the login screen
3. Enter your nickname (2-30 characters, must be globally unique)
4. Click login — the system will automatically assign you a UUID and sync it to the server

> **Desktop**: The login screen displays the SCP Foundation logo and an input field
> **Mobile**: The login screen uses a fullscreen design with a bottom input area

### System Initialization

After entering the system for the first time, the terminal will display boot logs and welcome messages. You can enter the `start` command to complete first-time system initialization.

---

## Terminal Operations

### Basic Commands

```bash
# View available commands
help

# View system status
status

# Clear screen
clear

# View version
version

# View system information
about
```

### Command History

- Press `↑` to browse the previous command
- Press `↓` to browse the next command
- Command history is automatically deduplicated, with a maximum of 500 entries

### Command Auto-Completion

- Enter a command prefix and press `Tab` to trigger auto-completion
- Supports fuzzy matching (subsequence matching)
- When there are multiple matches, press `Tab` repeatedly to cycle through options
- Enter `info ` and press `Tab` to auto-complete SCP numbers

### Command Format

```
SCP-OS:~$ <command> [arguments]
```

- Green text indicates a valid command
- White text indicates invalid input
- Red prompt indicates special attention needed

---

## SCP Data Queries

### Query SCP Information

```bash
# Query English branch SCP
info 173

# Query Chinese branch SCP
info CN-173
```

Query results include:

- **Object Number**: e.g., SCP-173
- **Object Class**: Safe / Euclid / Keter / Thaumiel / Neutralized / Pending / Unknown
- **Containment Procedures**: Detailed special containment procedures
- **Description**: SCP object description
- **Appendix**: Additional documentation, experiment logs, interview records, etc.

### Search SCP

```bash
# Search by keyword
search 雕像
search statue

# Search results return the most matching SCP objects
```

### List SCP

```bash
# List known SCP objects
scp-list
```

### Containment Protocols

```bash
# View containment protocol categories
containment

# View security protocols and task forces
protocol

# View emergency contact information
emergency
```

### Object Class Descriptions

| Class | Color | Description |
|-------|-------|-------------|
| Safe | 🟢 Green | Fully understood, reliably containable |
| Euclid | 🟡 Yellow | Not fully understood, containment unreliable |
| Keter | 🔴 Red | Difficult to reliably contain, high containment cost |
| Thaumiel | 🟣 Purple | Used to contain or counteract other SCPs |
| Neutralized | ⚪ Gray | No longer anomalous due to various reasons |
| Pending | 🔵 Blue | Not yet classified |
| Unknown | ⚫ Dark | Class cannot be determined |

---

## File System Operations

SCP-OS includes a Linux-style virtual file system with the following default directory structure:

```
/
├── home/
│   └── scp/          # User home directory
│       ├── documents/
│       └── reports/
├── etc/              # System configuration
├── var/
│   └── log/          # System logs
├── tmp/              # Temporary files
└── scp/              # SCP-related files
    ├── containment/
    └── classified/
```

### Basic Operations

```bash
# View current directory
pwd

# List directory contents
ls
ls /home/scp
ls -la

# Change directory
cd /home/scp
cd ..
cd ~

# Create directory
mkdir reports
mkdir -p /home/scp/documents/classified

# Create file
touch report.txt

# Write content
echo "SCP-173 Containment Report" > report.txt
echo "Append content" >> report.txt

# View file contents
cat report.txt

# Copy file
cp report.txt backup.txt

# Move/rename
mv backup.txt archive.txt
mv archive.txt /home/scp/documents/

# Delete file
rm report.txt

# Find files
find /home -name "*.txt"

# Search file contents
grep "containment" report.txt
```

### Permission Management

```bash
# Change permissions
chmod 755 script.sh

# Change ownership
chown scp:staff report.txt
```

The file system supports user/group/others three-level permission checks.

---

## GUI Tools

### Opening Tools

**Desktop**:
- Double-click a desktop icon
- Click taskbar → Start menu → Select tool
- Use keyboard shortcuts (e.g., `Ctrl+Shift+T` opens terminal)

**Mobile**:
- Tap app icon on home screen
- Bottom Dock quick access

### Terminal

- Multi-tab management with create/switch/close/lock/rename support
- Command auto-completion and history navigation
- Responsive font size
- SCP theme color scheme

### File Manager

- Graphical file browsing
- Supports multiple file previews:
  - 📷 Image viewer
  - 🎵 Audio player
  - 🎬 Video player
  - 📝 Text editor
- Right-click context menu
- Breadcrumb navigation

### Code Editor

- Based on CodeMirror 6
- Supports syntax highlighting: CSS, HTML, JavaScript, JSON, Markdown, Python, SQL
- Code search functionality
- Line number display

### Settings

- Theme switching (8 accent colors)
- Wallpaper management
- Terminal configuration
- System information

### Performance Dashboard

- Performance score
- Metric cards
- Issue list
- Optimization suggestions

### Chat

- Multi-room chat
- Nickname display
- Message history
- Rate limiting (10 messages/minute)

### Feedback

- Submit feedback (Bug/Feature/Improvement/Other)
- Upvote/downvote
- Comments
- Category filtering

### SCP Reader (Docs)

Docs is SCP-OS's built-in offline reader, providing a complete SCP Foundation document reading experience.

**Open Docs**: Double-click the "Docs" desktop icon (book-shaped icon).

**Desktop**:
- Left sidebar: SCP entry list with search, series filter, and class filter
- Right content area: Article content rendering, table of contents navigation, font/theme adjustment
- Click an entry to load content, with reading progress memory

**Mobile**:
- Card list view, tap to enter fullscreen reading
- Swipe left gesture to return to list
- Bottom toolbar: Table of contents, font size adjustment, return to top
- Pull down to refresh the list

**Offline Reading**:
- Loaded article content is automatically stored in IndexedDB, readable offline
- Cache status indicator shows whether the current entry is from local cache

**Content Source**:
- Prioritizes loading from Cloudflare KV cache (<50ms)
- Falls back to GitHub Raw API on KV miss, then writes to KV cache

---

## Window Management (Desktop)

### Basic Operations

| Operation | Method |
|-----------|--------|
| Open window | Double-click desktop icon / Start menu |
| Close window | Click close button / `Ctrl+W` |
| Minimize | Click minimize button |
| Maximize | Click maximize button / Double-click title bar |
| Restore | Double-click title bar again |
| Move window | Drag title bar |
| Resize | Drag window edge or corner (supports 8 directions) |
| Focus window | Click anywhere on the window |

### Window Stacking

- Clicking a window brings it to the front
- z-index is automatically managed to ensure correct window stacking order
- Minimized windows are hidden from the desktop and can be restored via the taskbar

### Taskbar

- Displays all open windows
- Click to switch/minimize/restore windows
- System tray area shows time and system status

### Start Menu

- Lists all available tools
- Click to launch the corresponding tool

### Context Menu

- Right-click on the desktop to show a context menu
- Options include: New folder, View switching, Sort order, Personalization settings

---

## Themes & Personalization

### Theme Switching

1. Open the **Settings** tool
2. Select an accent color in the theme area
3. Available colors: Red, Orange, Yellow, Green, Blue, Purple, Pink, Gray

Theme switching synchronously affects:
- GUI component accent colors
- Terminal cursor color
- Window border highlights
- Buttons and interactive elements

### Wallpaper Settings

1. Open the **Settings** tool
2. Enter wallpaper management
3. Select a preset wallpaper or upload a custom image
4. Wallpaper is automatically saved to IndexedDB

---

## Chat System

### Sending Messages

1. Open the **Chat** tool
2. Select a chat room
3. Type your message in the input field
4. Press Enter to send

### Rate Limiting

- Maximum 10 messages per minute
- Exceeding the limit will show a prompt; wait for the cooldown

### Nickname

- The nickname set during first login is automatically used for chat
- Nickname can be changed in settings
- Maximum 30 characters

### Chat Rooms

- A public chat room is provided by default
- Users can create custom chat rooms (maximum 5 per person)
- Supports public/private rooms

---

## Feedback System

### Submitting Feedback

1. Open the **Feedback** tool
2. Click "New Feedback"
3. Fill in the title, content, and select a category
4. Submit

### Feedback Categories

| Category | Description |
|----------|-------------|
| Bug | Report a defect |
| Feature | Feature suggestion |
| Improvement | Improvement suggestion |
| Other | Other |

### Interaction

- **Like**: Upvote valuable feedback
- **Vote**: Support up/down voting
- **Comment**: Leave comments on feedback

---

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Function |
|----------|----------|
| `Ctrl+Shift+T` | Open new terminal window |
| `Ctrl+W` | Close current window |
| `Ctrl+Shift+P` | Toggle performance panel |
| `F11` | Toggle fullscreen |

### Terminal Shortcuts

| Shortcut | Function |
|----------|----------|
| `Enter` | Execute command |
| `↑` / `↓` | Browse command history |
| `Tab` | Auto-completion |
| `Ctrl+C` | Cancel current input |
| `Backspace` | Delete previous character |

> **Mac Users**: The `Ctrl` key corresponds to the `Cmd` key (system auto-adapts)

---

## Mobile Operations

### Gestures

| Gesture | Action |
|---------|--------|
| Tap | Open app |
| Long press | Context menu |
| Swipe left/right | Switch tabs |
| Pull down | Refresh |

### Haptic Feedback

- Triggers a slight vibration (15ms) when tapping app icons
- Requires device support for the Vibration API

### Safe Areas

- Automatically adapts to notch screens and bottom safe areas
- Automatically adjusts layout on portrait/landscape rotation

### Bottom Dock

- Fixed quick access bar at the bottom
- Displays frequently used tools

### Home Indicator

- Bottom bar indicator
- Tap to return to home screen
