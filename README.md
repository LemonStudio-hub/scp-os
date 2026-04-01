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

## 🌐 API & Web Scraper

The project includes a Cloudflare Worker that provides real-time SCP information scraping from the SCP Wiki.

### Deployment
- **API Endpoint**: https://api.woodcat.online
- **Platform**: Cloudflare Workers
- **Caching**: 30-minute KV namespace caching
- **Retry Mechanism**: Automatic 3-retry logic for failed requests

### API Endpoints

#### 1. Scrape SCP Information
```
GET /scrape?number={number}
```
Retrieves detailed information about a specific SCP object.

**Example**:
```bash
curl "https://api.woodcat.online/scrape?number=682"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "SCP-682",
    "number": "682",
    "name": "不灭孽蜥",
    "objectClass": "KETER",
    "containment": ["特殊收容措施：..."],
    "description": ["描述：..."],
    "appendix": ["附录：..."],
    "author": "作者：...",
    "url": "https://scp-wiki-cn.wikidot.com/scp-682"
  }
}
```

#### 2. Search SCP Database
```
GET /search?keyword={keyword}
```
Searches for SCP objects matching the keyword.

**Example**:
```bash
curl "https://api.woodcat.online/search?keyword=173"
```

#### 3. Get Formatted Output
```
GET /format?number={number}
```
Returns formatted terminal-style output for an SCP object.

**Example**:
```bash
curl "https://api.woodcat.online/format?number=173"
```

#### 4. Debug Mode
```
GET /debug?number={number}
```
Returns raw HTML content for debugging purposes.

**Example**:
```bash
curl "https://api.woodcat.online/debug?number=173"
```

### Scraper Features

- **Text-Based Parser**: Uses regex patterns optimized for Wikidot syntax
- **Multi-line Matching**: Correctly handles multi-line content using `[\s\S]*?` pattern
- **Format Flexibility**: Supports multiple format variations (Chinese/English punctuation)
- **High Success Rate**: 90%+ success rate for content extraction
- **Object Class Recognition**: Automatically detects SAFE/EUCLID/KETER/THAUMIEL/NEUTRALIZED/PENDING classes

### Technical Implementation

The scraper is implemented in `/worker/index.ts` with the following key components:

- **SCPScraper Class**: Main scraper with caching and retry logic
- **parseContent() Method**: Text-based parser using regex patterns
- **formatForTerminal() Method**: Formats output for terminal display
- **Error Handling**: Comprehensive error handling with fallback mechanisms

### Worker Configuration

Located in `/worker/wrangler.toml`:
- **Compatibility**: Node.js compatibility mode enabled
- **KV Namespace**: SCP_CACHE for 30-minute caching
- **Custom Domain**: api.woodcat.online

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

This project uses a dual licensing model:

### MIT License (Code)

All source code, including but not limited to:
- Application logic and algorithms
- UI/UX components
- Utility functions
- Configuration files

is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

### CC BY-SA 3.0 (SCP Foundation Content)

All SCP Foundation related content, including but not limited to:
- SCP object descriptions and classifications
- SCP Foundation terminology and lore
- Containment procedures and protocols
- Site information and security classifications
- Any references to SCP Foundation entities

is licensed under the Creative Commons Attribution-ShareAlike 3.0 License (CC BY-SA 3.0).

**You are free to:**
- Share — copy and redistribute the material in any medium or format
- Adapt — remix, transform, and build upon the material

**Under the following terms:**
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made
- **ShareAlike** — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original

The SCP Foundation is a collaborative creative writing project. For more information:
- [SCP Foundation Wiki](https://scp-wiki.net/)
- [CC BY-SA 3.0 License](https://creativecommons.org/licenses/by-sa/3.0/)

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