# Frequently Asked Questions (FAQ)

---

## Table of Contents

- [General Questions](#general-questions)
- [Installation & Running](#installation--running)
- [Terminal Usage](#terminal-usage)
- [SCP Data Queries](#scp-data-queries)
- [GUI & Interface](#gui--interface)
- [Desktop](#desktop)
- [Worker Backend](#worker-backend)
- [Development](#development)

---

## General Questions

### What is SCP-OS?

SCP-OS is an SCP Foundation-themed Web Operating System that provides a complete desktop environment in the browser. It includes a command-line terminal, file manager, code editor, real-time chat, performance dashboard, feedback system, and more. It supports seamless desktop and mobile responsive adaptation.

### Is SCP-OS an official product?

No. SCP-OS is a community-driven open-source project for educational and entertainment purposes only. Use of SCP Foundation content follows the [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) license.

### What platforms are supported?

- **Web**: Any modern browser (Chrome, Firefox, Safari, Edge)
- **Desktop**: Windows, macOS, Linux (via Tauri)
- **Mobile**: Via browser access, responsive adaptation for phones and tablets

### Is an internet connection required?

Most features work offline (terminal commands, virtual file system, local settings, etc.). SCP data queries, chat functionality, and the Docs reader require an internet connection. The Docs reader supports offline reading — cached article content is stored in IndexedDB and can be read without a network.

### Is the Docs reader paid?

No. The Docs reader is built using Cloudflare's free tier: D1 database (500MB free storage), KV cache (1GB free storage), Worker (100,000 free requests/day). Normal usage is completely free.

### How often is Docs content updated?

Currently, Docs uses a KV preload script that writes in batches daily (900 entries/day). It takes approximately 8-10 days to write all 9526+ entries to KV. GitHub Raw always remains available as a fallback source.

---

## Installation & Running

### What to do if `pnpm install` fails?

1. Confirm Node.js version >= 18.0.0: `node -v`
2. Confirm pnpm version >= 8.0.0: `pnpm -v`
3. Try clearing the cache: `pnpm store prune`
4. Delete `node_modules` and lockfile, then reinstall:
   ```bash
   rm -rf node_modules packages/*/node_modules pnpm-lock.yaml
   pnpm install
   ```

### Development server fails to start?

1. Check if port 5173 is already in use
2. Check if `.env.development` file exists and is configured correctly
3. Check terminal error messages. Common issues:
   - Dependencies not installed: Run `pnpm install`
   - TypeScript errors: Run `pnpm typecheck` for details

### Build fails?

1. Run `pnpm typecheck` to check for type errors
2. Run `pnpm lint:check` to check code standards
3. Ensure all dependencies are installed: `pnpm install`
4. Clear build cache: Delete the `dist/` directory and rebuild

---

## Terminal Usage

### Commands not working?

- Confirm command spelling is correct (type `help` to see all available commands)
- Commands are case-sensitive
- Some commands require arguments, e.g., `info 173` not just `info`

### How to query Chinese branch SCPs?

Use the `CN-` prefix:

```bash
info CN-173
```

Search also supports Chinese keywords:

```bash
search 雕像
```

### Terminal displays garbled text?

- Confirm the browser supports UTF-8 encoding
- Try adjusting terminal font size (Settings → Terminal Configuration)
- Mobile devices may need landscape mode to view long text

### Command history lost?

Command history is stored in memory and will be lost when the page is refreshed. Tab state is persisted via IndexedDB and will be automatically restored after refresh.

---

## SCP Data Queries

### SCP query returns errors?

Possible causes:

1. **Network issues**: Run the `network` command to test connectivity to the Wiki
2. **Number doesn't exist**: Confirm the SCP number is valid (0-9999)
3. **Wiki page format changed**: The scraper may need updating to adapt to new page structures
4. **API timeout**: Retry or try again later

### Search results are inaccurate?

- Search functionality is based on SCP Wiki's site search; results depend on the Wiki's search engine
- Try using more specific keywords
- Use `scp-list` to browse the known SCP list
- Use `info <number>` to directly query a specific SCP

### Cache data expired?

Cache duration is 30 minutes. To get the latest data:
- Wait for the cache to expire, then query again
- Or clear the browser cache and query again

---

## GUI & Interface

### Window cannot be dragged?

- Confirm you are dragging the window title bar area
- Dragging requires more than 5px of movement to trigger
- Mobile does not support window dragging (uses fullscreen mode)

### Window resize is abnormal?

- Drag from the window edge or corner to resize
- Confirm the window is not in maximized state
- Each tool has minimum size limits

### Theme switching not taking effect?

- Refresh the page and try again
- Check if the browser supports CSS custom properties
- Some browser extensions may override styles

### Wallpaper upload fails?

- Supports common image formats (PNG, JPG, WebP)
- Image size limit depends on browser IndexedDB storage
- Try compressing the image before uploading

### Mobile layout is abnormal?

- Confirm the browser viewport is set correctly
- Try rotating the device to trigger layout recalculation
- Some browsers may require adding to home screen for the best experience

---

## Desktop

### Tauri build fails?

**Linux**:
- Confirm all system dependencies are installed (see [Installation Guide](INSTALLATION.md#linux-dependencies))
- Check Rust version: `rustc --version` (requires stable)

**Windows**:
- Install Visual Studio C++ Build Tools
- Install WebView2 Runtime (usually built-in on Windows 10/11)

**macOS**:
- Install Xcode Command Line Tools: `xcode-select --install`

### Desktop cannot connect to API?

- Check if CSP configuration allows connecting to the API domain
- Confirm `tauri.conf.json` `security.csp.connect-src` includes the API URL
- Check network proxy settings

### Desktop window size is abnormal?

- Default window size is 1200x800, minimum 800x600
- Can be modified in `tauri.conf.json`
- Delete locally stored window state and restart

---

## Worker Backend

### Worker local development errors?

1. Confirm Wrangler is installed: `wrangler --version`
2. Check `wrangler.toml` configuration
3. Confirm D1 databases and KV namespaces have been created
4. Run database migrations

### D1 database migration fails?

```bash
# Check if database exists
wrangler d1 list

# View database info
wrangler d1 info scp-reader-db

# Re-run migration
wrangler d1 execute scp-reader-db --file=migrations/0009_scp_reader_tables.sql --remote
```

### Worker deployment fails?

1. Confirm Cloudflare account is logged in: `wrangler whoami`
2. Check if `database_id` and KV `id` in `wrangler.toml` are correct
3. Confirm the route configuration domain is managed by Cloudflare

### API rate limit triggered?

- Each IP is limited to 60 requests/minute
- Chat messages limited to 10 messages/minute/user
- Wait for the cooldown period and retry
- Development environment can adjust limits in `rateLimiter.ts`

---

## Development

### How to add a new terminal command?

1. Register the command in `src/constants/commands.ts`
2. Implement command handling logic in `src/commands/`
3. Add corresponding type definitions
4. Write tests

### How to add a new GUI tool?

Refer to the detailed steps in [Contributing Guide](CONTRIBUTING.md#adding-a-new-tool).

### How to debug the Worker?

```bash
# Local development mode (with hot reload)
cd packages/worker
pnpm dev

# View real-time logs
pnpm worker:tail

# Use /debug endpoint to get raw HTML
curl "http://localhost:8787/debug?number=173"
```

### How to run specific tests?

```bash
# Run a single test file
pnpm --filter @scp-os/app vitest run src/gui/composables/__tests__/useDraggable.test.ts

# Run tests matching a pattern
pnpm --filter @scp-os/app vitest run --grep "window manager"

# Watch mode
pnpm --filter @scp-os/app vitest watch
```

### How to view test coverage?

```bash
pnpm test:coverage
```

Coverage reports are generated in the `coverage/` directory. Open `coverage/index.html` to view the detailed report.

### How to clear IndexedDB data?

Open browser Developer Tools → Application → IndexedDB → Delete the `scp-os-db` database.

### How to add a new plugin type?

1. Add a new type in `src/platform/plugins/plugin.interface.ts`
2. Update validation logic in `src/platform/plugins/plugin-manager.ts`
3. Register extension points in `src/platform/extensions/extension-point.ts`
4. Write tests

### How to modify design tokens?

Edit `src/gui/design-tokens.ts`. After modification, calling `injectGUITokens()` will automatically update all CSS variables. All components consume token values via `var(--gui-*)`.

---

## More Help

If your question is not answered in this list, you can:

1. Search [GitHub Issues](https://github.com/LemonStudio-hub/scp-os/issues)
2. Submit a new Issue
3. Chat with other users in the chat system
