# SCP-OS Local Plugin and App Platform

This document defines the third-party extension model for SCP-OS.

## Support Matrix

| Capability | Status |
| --- | --- |
| Local directory import | v1 |
| Local ZIP import | v1 |
| Command plugins | v1 |
| Sandboxed iframe apps | v1 |
| Remote marketplace | vNext |
| Package signing and review | vNext |
| Theme plugins | vNext |
| Data source plugins | vNext |
| Vue component plugins | vNext |

v1 only installs local packages chosen by the user. Remote URL installation is intentionally not supported.

## Package Layout

Every package must include `scp-app.json` at its root:

```text
my-app/
  scp-app.json
  index.html
  main.js
  styles.css
```

ZIP packages use the same layout. A top-level wrapper directory is allowed.

## Manifest

```json
{
  "schemaVersion": 1,
  "id": "example.notes",
  "name": "Notes",
  "version": "1.0.0",
  "runtime": "iframe-app",
  "entry": "index.html",
  "description": "Local notes app",
  "author": "Example",
  "icon": "code",
  "permissions": ["storage"],
  "sandbox": {
    "allowSameOrigin": false,
    "allowPopups": false
  },
  "window": {
    "width": 900,
    "height": 640,
    "minWidth": 420,
    "minHeight": 320,
    "resizable": true
  }
}
```

Required fields:

- `schemaVersion`: must be `1`.
- `id`: unique app id, using letters, numbers, `.`, `_`, or `-`.
- `name`: display name.
- `version`: package version.
- `runtime`: `iframe-app` or `command-module`.
- `entry`: package-relative entry file.

Optional fields:

- `description`, `author`, `icon`.
- `permissions`: declared permissions. v1.1 enforces permissions for `window.scp` APIs.
- `commands`: command metadata for command modules.
- `window`: default window sizing for iframe apps.
- `sandbox`: optional iframe sandbox capabilities. High-risk capabilities are disabled by default.

## Command Modules

Command packages use `runtime: "command-module"` and export `activate(ctx)` from the entry module.

```json
{
  "schemaVersion": 1,
  "id": "example.hello",
  "name": "Hello Commands",
  "version": "1.0.0",
  "runtime": "command-module",
  "entry": "commands.js",
  "commands": [
    {
      "name": "hello",
      "aliases": ["hi"],
      "description": "Print a greeting",
      "usage": "hello [name]",
      "permissions": ["storage"]
    }
  ]
}
```

```js
export function activate(ctx) {
  ctx.commands.register({
    name: "hello",
    aliases: ["hi"],
    description: "Print a greeting",
    usage: "hello [name]",
    handler(args, write, writeln) {
      writeln(`Hello ${args[0] || "SCP-OS"}`)
    }
  })
}
```

Command names and aliases cannot conflict with built-in commands or other installed plugin commands. Conflicting packages are rejected.

## Iframe Apps

Iframe apps use `runtime: "iframe-app"`. SCP-OS renders the entry HTML in a sandboxed iframe and injects `window.scp`.

```js
await window.scp.storage.set("draft", "hello")
const value = await window.scp.storage.get("draft")
await window.scp.notify("Saved")
```

v1 iframe sandbox:

- Allows scripts, forms, modals, and downloads.
- Does not allow same-origin access to the host.
- Communicates with SCP-OS through `postMessage`.

Browser shells and modern SPA containers may opt into additional sandbox capabilities:

```json
{
  "sandbox": {
    "allowSameOrigin": true,
    "allowPopups": true,
    "allowTopNavigationByUserActivation": false
  }
}
```

`allowSameOrigin` reduces isolation and should only be enabled for trusted local apps that need normal origin behavior.

## Permissions

v1 records permissions in the manifest and displays them during app management. v1.1 enforces permissions for `window.scp` APIs.

Recommended permission names:

- `storage`
- `notifications`
- `network`
- `clipboard`
- `filesystem`
- `terminal`
- `window.control`
- `ui.cursor`
- `theme.read`
- `theme.write`

See `docs/THIRD_PARTY_APP_API.zh-CN.md` for the current runtime API list.

## Import and Uninstall

Users import packages from App Manager using either a local folder or a ZIP file.

Installed package files are copied into the SCP-OS virtual filesystem at:

```text
/home/scp/apps/<appId>
```

Uninstalling removes:

- Registered plugin commands.
- Dynamic app/window registration.
- Desktop shortcut.
- Package files under `/home/scp/apps/<appId>`.
