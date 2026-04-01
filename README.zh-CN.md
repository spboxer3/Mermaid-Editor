# Mermaid Editor

[繁體中文](README.zh-TW.md) | **简体中文** | [English](README.md)

桌面版 Mermaid 图表编辑器，支持拖拽、网格吸附、自定义节点颜色。

## 功能

- **Mermaid 渲染** — 输入 Mermaid 语法即时渲染图表（`Ctrl+Enter`）
- **拖拽 + 网格吸附** — 自由拖拽节点，自动吸附至可配置的网格
- **自定义颜色** — 点击节点可自定义背景色、边框色、文字色
- **边线跟随** — 拖拽节点时连接线平滑跟随移动
- **多标签页** — 同时编辑多个图表，双击标签可重命名
- **平移 & 缩放** — 鼠标中键拖拽平移，`Ctrl+滚轮` 缩放
- **导出** — 下载 SVG 或 PNG（2 倍分辨率）
- **可折叠面板** — 隐藏/显示编辑器和属性面板
- **自动保存** — 所有标签、位置、颜色、设置自动保存
- **多语言** — 英文、繁体中文、简体中文

## 开始使用

### 从源码运行

```bash
npm install
npm start
```

### 打包为便携式 .exe

```bash
npm run build
```

输出：`dist/Mermaid Editor 1.0.0.exe`

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Enter` | 渲染图表 |
| `鼠标中键` | 平移画布 |
| `Ctrl+滚轮` | 缩放 |

## 技术栈

- Electron
- Mermaid.js
- interact.js
- electron-builder

## 许可

ISC
