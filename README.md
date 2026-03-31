# SCP-OS - SCP Foundation Terminal System

A web-based terminal application themed around the SCP Foundation, featuring a professional command-line interface with advanced mobile support.

## 🌟 Features

### Core Functionality
- **Professional Terminal Interface**: Built with xterm.js for authentic terminal experience
- **Gesture Controls**: Multi-touch gestures for mobile and desktop (powered by Hammer.js)
- **Command System**: 13 built-in SCP-themed commands
- **Command History**: Navigate through previous commands
- **Tab Autocomplete**: Intelligent command completion
- **Boot Animation**: Simulated Linux boot log with SCP-themed content

### Mobile Support
- **Responsive Design**: Automatically adapts to any screen size
- **Dynamic Font Scaling**: 4 breakpoints for optimal readability
- **Touch-Optimized**: Enhanced touch targets and gestures
- **Virtual Keyboard Support**: Optimized for mobile keyboard interaction
- **PWA Ready**: Progressive Web App support with meta tags

### Theme & Design
- **SCP Foundation Theme**: Authentic SCP color scheme and styling
- **Full-Screen Mode**: Immersive terminal experience
- **ANSI Color Support**: Rich colored output
- **Custom Scrollbar**: Themed scrollbar for consistency

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:5173
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `help` | Display all available commands |
| `status` | Show system status and information |
| `clear` / `cls` | Clear the terminal screen |
| `containment` | Display containment protocol information |
| `scp-list` | List known SCP objects |
| `info [number]` | Show detailed information about specific SCP (e.g., `info 173`) |
| `protocol` | Display security protocols |
| `emergency` | Show emergency contact information |
| `version` | Display system version |
| `about` | Show system information |
| `search [keyword]` | Search SCP database |
| `logout` | Secure logout |

## 🎮 Gesture Controls

### Mobile Gestures
- **Three Finger Swipe Up** - Clear screen
- **Two Finger Swipe Left** - Previous command in history
- **Two Finger Swipe Right** - Next command in history
- **Two Finger Swipe Down** - Scroll to bottom
- **Long Press** - Clear screen
- **Double Tap** - Autocomplete current command

### Desktop Gestures
- **Single Finger Swipe Up** - Scroll to top
- **Single Finger Swipe Down** - Scroll to bottom
- **Tap** - Focus terminal

## 🏗️ Project Structure

```
src/
├── commands/           # Command handlers
├── composables/        # Vue composables
│   ├── useTerminal.ts      # Terminal logic
│   ├── useCommandHistory.ts # Command history management
│   └── useGestures.ts      # Gesture handling
├── constants/          # Constants and configurations
│   ├── commands.ts          # Command definitions
│   ├── theme.ts             # Theme configuration
│   └── scpDatabase.ts       # SCP data
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── components/         # Vue components
    └── SCPTerminal.vue     # Main terminal component
```

## 🛠️ Tech Stack

- **Frontend Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Language**: TypeScript
- **Terminal Library**: xterm.js
- **Gesture Library**: Hammer.js
- **Terminal Fit Addon**: xterm-addon-fit

## 📱 Responsive Breakpoints

- **≥1200px**: Large desktop (16px font)
- **≥768px**: Desktop/Tablet (14px font)
- **≥480px**: Mobile large (12px font)
- **<480px**: Mobile small (10px font)

## 🔒 Security Features

- No sensitive data storage
- No external API calls
- Pure client-side application
- Input sanitization

## 📄 License

This project is for educational and entertainment purposes only.

## 🙏 Acknowledgments

- [SCP Foundation](https://scp-wiki.net/) - Source of inspiration
- [xterm.js](https://xtermjs.org/) - Terminal emulator library
- [Hammer.js](https://hammerjs.github.io/) - Touch gesture library
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [Vite](https://vitejs.dev/) - Next generation frontend tooling

## 📞 Contact

For questions or feedback, please open an issue in the repository.

---

**Secure • Contain • Protect**