# Mermaid Editor

[繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | **English**

A desktop Mermaid diagram editor with visual drag-and-drop editing, connection drawing, grid snapping, and custom node colors.

## Features

### Code Mode
- **Mermaid Rendering** — Write Mermaid syntax and render diagrams instantly (`Ctrl+Enter`)
- **Drag & Drop with Grid Snap** — Drag nodes freely, auto-snapping to a configurable grid
- **Custom Colors** — Click any node to customize its fill, border, and text color
- **Edge Following** — Connecting lines move smoothly when nodes are dragged

### Visual Mode
- **Drag-and-Drop Toolbox** — Drag flowchart elements (Process, Decision, Terminal, I/O, Subroutine, Database) from the toolbox onto the canvas
- **Shift+Drag to Connect** — Hold Shift and drag from one node to another to draw a connection line
- **Click Edge to Select** — Click on any connection line to select it (wide hit area for easy selection)
- **Double-Click Edge to Edit Label** — A floating editor appears at the click position
- **Delete Key** — Remove selected nodes or edges
- **Double-Click Node to Rename** — Edit node labels directly on the canvas
- **Real-Time Code Sync** — Visual changes instantly update the Mermaid code editor
- **Direction Control** — Switch between Top→Down and Left→Right layouts
- **Node & Edge Lists** — Left panel shows all nodes and edges with inline editing and deletion

### General
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
| `Shift+Drag Node` | Draw connection (Visual mode) |
| `Delete` | Delete selected node or edge (Visual mode) |
| `Escape` | Cancel connection drawing |

## Tech Stack

- Electron
- Mermaid.js
- interact.js
- electron-builder

## License

ISC
