const LOCALES = {
  'en': {
    // Tab bar
    addTab: 'New tab',
    // Editor panel
    editorTitle: 'MERMAID EDITOR',
    render: 'Render',
    relayout: 'Re-layout',
    grid: 'Grid:',
    showGrid: 'Show grid',
    snapGrid: 'Snap to grid',
    // Props panel
    propsTitle: 'PROPERTIES',
    selectedNode: 'Selected node',
    noSelection: 'None',
    colorBg: 'Fill',
    colorBorder: 'Border',
    colorText: 'Text',
    resetColor: 'Reset color',
    exportTitle: 'Export',
    exportSvg: 'Download SVG',
    exportPng: 'Download PNG',
    // Toggle buttons
    toggleEditor: 'Toggle editor',
    toggleProps: 'Toggle properties',
    // Tab
    tabRename: 'Double-click to rename',
    tabClose: 'Close tab',
    defaultTabName: 'Diagram',
    // Language
    langLabel: 'Lang:',
    // Visual editor
    modeCode: 'Code',
    modeVisual: 'Visual',
    toolboxTitle: 'ELEMENTS',
    toolProcess: 'Process',
    toolDecision: 'Decision',
    toolTerminal: 'Terminal',
    toolIO: 'I/O',
    toolSubroutine: 'Subroutine',
    toolDatabase: 'Database',
    toolboxHint: 'Drag elements to the canvas',
    connectShiftHint: 'Shift + drag node to connect',
    connectHint: 'Drag to target node to connect',
    connectCancel: 'Cancel',
    edgeLabelPrompt: 'Edge label (optional):',
    nodeEditPrompt: 'Node label:',
    deleteNode: 'Delete',
    deleteEdge: 'Delete connection',
    edgeListTitle: 'Connections',
    nodeListTitle: 'Nodes',
    edgeLabelPlaceholder: 'Double-click to edit label',
    btnConnect: 'Connect',
    visualDirection: 'Direction:',
    dirTD: 'Top→Down',
    dirLR: 'Left→Right',
    // Default code
    defaultCode: `flowchart TD
    A[Start] --> B{Decide}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E`,
  },

  'zh-TW': {
    addTab: '新增分頁',
    editorTitle: 'MERMAID 編輯器',
    render: '渲染',
    relayout: '重新排版',
    grid: '網格:',
    showGrid: '顯示網格',
    snapGrid: '吸附網格',
    propsTitle: '屬性',
    selectedNode: '選取的節點',
    noSelection: '未選取',
    colorBg: '背景',
    colorBorder: '邊框',
    colorText: '文字',
    resetColor: '重設顏色',
    exportTitle: '匯出',
    exportSvg: '下載 SVG',
    exportPng: '下載 PNG',
    toggleEditor: '收合/展開編輯器',
    toggleProps: '收合/展開屬性',
    tabRename: '雙擊重新命名',
    tabClose: '關閉分頁',
    defaultTabName: '圖表',
    langLabel: '語言:',
    modeCode: '程式碼',
    modeVisual: '視覺化',
    toolboxTitle: '元素',
    toolProcess: '處理',
    toolDecision: '判斷',
    toolTerminal: '終端',
    toolIO: '輸入/輸出',
    toolSubroutine: '子程序',
    toolDatabase: '資料庫',
    toolboxHint: '拖曳元素至畫布',
    connectShiftHint: 'Shift + 拖曳節點以建立連線',
    connectHint: '拖曳至目標節點完成連線',
    connectCancel: '取消',
    edgeLabelPrompt: '連線標籤（選填）：',
    nodeEditPrompt: '節點標籤：',
    deleteNode: '刪除',
    deleteEdge: '刪除連線',
    edgeListTitle: '連線列表',
    nodeListTitle: '節點列表',
    edgeLabelPlaceholder: '雙擊編輯標籤',
    btnConnect: '連線',
    visualDirection: '方向：',
    dirTD: '上→下',
    dirLR: '左→右',
    defaultCode: `flowchart TD
    A[開始] --> B{判斷}
    B -->|是| C[處理 A]
    B -->|否| D[處理 B]
    C --> E[結束]
    D --> E`,
  },

  'zh-CN': {
    addTab: '新建标签',
    editorTitle: 'MERMAID 编辑器',
    render: '渲染',
    relayout: '重新排版',
    grid: '网格:',
    showGrid: '显示网格',
    snapGrid: '吸附网格',
    propsTitle: '属性',
    selectedNode: '选中的节点',
    noSelection: '未选中',
    colorBg: '背景',
    colorBorder: '边框',
    colorText: '文字',
    resetColor: '重置颜色',
    exportTitle: '导出',
    exportSvg: '下载 SVG',
    exportPng: '下载 PNG',
    toggleEditor: '折叠/展开编辑器',
    toggleProps: '折叠/展开属性',
    tabRename: '双击重命名',
    tabClose: '关闭标签',
    defaultTabName: '图表',
    langLabel: '语言:',
    modeCode: '代码',
    modeVisual: '可视化',
    toolboxTitle: '元素',
    toolProcess: '处理',
    toolDecision: '判断',
    toolTerminal: '终端',
    toolIO: '输入/输出',
    toolSubroutine: '子程序',
    toolDatabase: '数据库',
    toolboxHint: '拖拽元素到画布',
    connectShiftHint: 'Shift + 拖拽节点以建立连线',
    connectHint: '拖拽至目标节点完成连线',
    connectCancel: '取消',
    edgeLabelPrompt: '连线标签（选填）：',
    nodeEditPrompt: '节点标签：',
    deleteNode: '删除',
    deleteEdge: '删除连线',
    edgeListTitle: '连线列表',
    nodeListTitle: '节点列表',
    edgeLabelPlaceholder: '双击编辑标签',
    btnConnect: '连线',
    visualDirection: '方向：',
    dirTD: '上→下',
    dirLR: '左→右',
    defaultCode: `flowchart TD
    A[开始] --> B{判断}
    B -->|是| C[处理 A]
    B -->|否| D[处理 B]
    C --> E[结束]
    D --> E`,
  },
};

let currentLang = 'zh-TW';

function t(key) {
  return LOCALES[currentLang]?.[key] || LOCALES['en'][key] || key;
}

function setLang(lang) {
  if (!LOCALES[lang]) return;
  currentLang = lang;
  applyI18n();
}

function applyI18n() {
  // All elements with data-i18n get their textContent replaced
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  // Elements with data-i18n-title get their title replaced
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });
  // Elements with data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  // Update document title
  document.title = 'Mermaid Editor';
  // Update html lang
  document.documentElement.lang = currentLang === 'zh-TW' ? 'zh-TW' : currentLang === 'zh-CN' ? 'zh-CN' : 'en';
}

if (typeof module !== 'undefined') {
  module.exports = { LOCALES, t, setLang, applyI18n, getCurrentLang: () => currentLang, setCurrentLang: (l) => { currentLang = l; } };
}
