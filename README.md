# Mermaid Editor

[繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | **English**

A desktop Mermaid diagram editor with drag-and-drop, grid snapping, and custom node colors.

## Features

- **Mermaid Rendering** — Write Mermaid syntax and render diagrams instantly (`Ctrl+Enter`)
- **Drag & Drop with Grid Snap** — Drag nodes freely, auto-snapping to a configurable grid
- **Custom Colors** — Click any node to customize its fill, border, and text color
- **Edge Following** — Connecting lines move smoothly when nodes are dragged
- **Multi-Tab** — Work on multiple diagrams simultaneously, double-click tab to rename
- **Pan & Zoom** — Middle-mouse drag to pan, `Ctrl+Scroll` to zoom
- **Export** — Download diagrams as SVG or PNG (2x resolution)
- **Collapsible Panels** — Hide/show the editor and properties panels
- **Auto-Save** — All tabs, positions, colors, and settings are persisted automatically
- **i18n** — English, Traditional Chinese, Simplified Chinese

## Getting Started

### Run from Source

```bash
npm install
npm start
```

### Build Portable .exe

```bash
npm run build
```

Output: `dist/Mermaid Editor 1.0.0.exe`

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Render diagram |
| `Middle Mouse` | Pan canvas |
| `Ctrl+Scroll` | Zoom in/out |

## Tech Stack

- Electron
- Mermaid.js
- interact.js
- electron-builder

## License

ISC
