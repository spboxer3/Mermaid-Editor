# Mermaid Editor

**繁體中文** | [简体中文](README.zh-CN.md) | [English](README.md)

桌面版 Mermaid 圖表編輯器，支援拖曳、網格吸附、自訂節點顏色。

## 功能

- **Mermaid 渲染** — 輸入 Mermaid 語法即時渲染圖表（`Ctrl+Enter`）
- **拖曳 + 網格吸附** — 自由拖曳節點，自動吸附至可設定的網格
- **自訂顏色** — 點擊節點可自訂背景色、邊框色、文字色
- **邊線跟隨** — 拖曳節點時連接線平滑跟隨移動
- **多分頁** — 同時編輯多個圖表，雙擊分頁可重新命名
- **平移 & 縮放** — 滑鼠中鍵拖曳平移，`Ctrl+滾輪` 縮放
- **匯出** — 下載 SVG 或 PNG（2 倍解析度）
- **可收合面板** — 隱藏/顯示編輯器和屬性面板
- **自動儲存** — 所有分頁、位置、顏色、設定自動保存
- **多語系** — 英文、繁體中文、簡體中文

## 開始使用

### 從原始碼執行

```bash
npm install
npm start
```

### 打包為可攜式 .exe

```bash
npm run build
```

輸出：`dist/Mermaid Editor 1.0.0.exe`

## 快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `Ctrl+Enter` | 渲染圖表 |
| `滑鼠中鍵` | 平移畫布 |
| `Ctrl+滾輪` | 縮放 |

## 技術棧

- Electron
- Mermaid.js
- interact.js
- electron-builder

## 授權

ISC
