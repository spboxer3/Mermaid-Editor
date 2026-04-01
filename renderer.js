const mermaid = require('mermaid');
const interact = require('interactjs');

// --- DOM References ---
const editor = document.getElementById('editor');
const canvas = document.getElementById('canvas');
const btnRender = document.getElementById('btn-render');
const btnRelayout = document.getElementById('btn-relayout');
const gridSizeInput = document.getElementById('grid-size');
const showGridCheckbox = document.getElementById('show-grid');
const snapEnabledCheckbox = document.getElementById('snap-enabled');
const selectedNodeName = document.getElementById('selected-node-name');
const colorControls = document.getElementById('color-controls');
const colorBg = document.getElementById('color-bg');
const colorBorder = document.getElementById('color-border');
const colorText = document.getElementById('color-text');
const hexBg = document.getElementById('hex-bg');
const hexBorder = document.getElementById('hex-border');
const hexText = document.getElementById('hex-text');
const btnResetColor = document.getElementById('btn-reset-color');
const btnExportSvg = document.getElementById('btn-export-svg');
const btnExportPng = document.getElementById('btn-export-png');
const tabsContainer = document.getElementById('tabs-container');
const btnAddTab = document.getElementById('btn-add-tab');

// --- Tab System ---
const langSelect = document.getElementById('lang-select');

function getDefaultCode() {
  return t('defaultCode');
}

let tabs = [];
let activeTabId = null;
let tabCounter = 0;

function createTabState(name, code) {
  tabCounter++;
  return {
    id: tabCounter,
    name: name || `${t('defaultTabName')} ${tabCounter}`,
    code: code || getDefaultCode(),
    nodeColors: new Map(),
    nodePositions: new Map(),
    selectedNodeLabel: null,
    edgeMap: [],
    renderCounter: 0,
  };
}

function getActiveTab() {
  return tabs.find((t) => t.id === activeTabId);
}

function saveCurrentTabState() {
  const tab = getActiveTab();
  if (!tab) return;
  tab.code = editor.value;
}

function renderTabBar() {
  tabsContainer.innerHTML = '';
  tabs.forEach((tab) => {
    const el = document.createElement('div');
    el.className = 'tab' + (tab.id === activeTabId ? ' active' : '');
    el.dataset.tabId = tab.id;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'tab-name';
    nameSpan.textContent = tab.name;
    nameSpan.title = t('tabRename');
    el.appendChild(nameSpan);

    // Double-click to rename
    nameSpan.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      nameSpan.contentEditable = 'true';
      nameSpan.focus();
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(nameSpan);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    nameSpan.addEventListener('blur', () => {
      nameSpan.contentEditable = 'false';
      const newName = nameSpan.textContent.trim();
      if (newName) tab.name = newName;
      else nameSpan.textContent = tab.name;
      scheduleSave();
    });

    nameSpan.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        nameSpan.blur();
      }
    });

    // Close button (only if more than 1 tab)
    if (tabs.length > 1) {
      const closeBtn = document.createElement('span');
      closeBtn.className = 'tab-close';
      closeBtn.textContent = '\u00d7';
      closeBtn.title = t('tabClose');
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(tab.id);
      });
      el.appendChild(closeBtn);
    }

    // Click to switch
    el.addEventListener('click', () => switchTab(tab.id));

    tabsContainer.appendChild(el);
  });
}

function switchTab(tabId) {
  if (tabId === activeTabId) return;
  saveCurrentTabState();
  activeTabId = tabId;
  const tab = getActiveTab();
  editor.value = tab.code;
  deselectNode();
  renderTabBar();
  renderDiagram(true);
  scheduleSave();
}

function addTab(name, code) {
  saveCurrentTabState();
  const tab = createTabState(name, code);
  tabs.push(tab);
  activeTabId = tab.id;
  editor.value = tab.code;
  deselectNode();
  renderTabBar();
  renderDiagram(false);
  scheduleSave();
}

function closeTab(tabId) {
  if (tabs.length <= 1) return;
  const idx = tabs.findIndex((t) => t.id === tabId);
  if (idx === -1) return;
  tabs.splice(idx, 1);
  if (activeTabId === tabId) {
    activeTabId = tabs[Math.min(idx, tabs.length - 1)].id;
    const tab = getActiveTab();
    editor.value = tab.code;
    deselectNode();
    renderDiagram(true);
  }
  renderTabBar();
  scheduleSave();
}

// --- Mermaid Init ---
mermaid.default.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#FDF8F0',
    primaryBorderColor: '#C96442',
    primaryTextColor: '#3D3929',
    secondaryColor: '#F5F0E8',
    secondaryBorderColor: '#D4956A',
    secondaryTextColor: '#3D3929',
    tertiaryColor: '#EDE6D9',
    tertiaryBorderColor: '#9B917D',
    tertiaryTextColor: '#3D3929',
    lineColor: '#9B917D',
    textColor: '#3D3929',
    mainBkg: '#FDF8F0',
    nodeBorder: '#C96442',
    clusterBkg: '#F5F0E8',
    clusterBorder: '#D9CFC0',
    labelBackground: '#FDFBF7',
    edgeLabelBackground: '#FDFBF7',
    noteBkgColor: '#F5F0E8',
    noteTextColor: '#3D3929',
    noteBorderColor: '#D9CFC0',
    fontFamily: "'Segoe UI', -apple-system, sans-serif",
    fontSize: '14px',
  },
  flowchart: { useMaxWidth: false, curve: 'basis' },
});

// --- Mermaid Rendering ---

async function renderDiagram(preservePositions = true) {
  const tab = getActiveTab();
  if (!tab) return;
  const code = editor.value.trim();
  if (!code) return;

  tab.renderCounter++;
  const id = `mermaid-${tab.id}-${tab.renderCounter}`;

  try {
    const { svg } = await mermaid.default.render(id, code);
    canvas.innerHTML = svg;
    buildEdgeMap();
    if (preservePositions) restoreNodePositions();
    applyColorOverrides();
    attachDragToNodes();
    attachClickToNodes();
    if (tab.selectedNodeLabel) highlightSelectedNode();
  } catch (err) {
    const errPre = document.createElement('pre');
    errPre.className = 'error';
    errPre.textContent = err.message;
    canvas.innerHTML = '';
    canvas.appendChild(errPre);
  }
}

// --- Node Helpers ---

function getNodeLabel(nodeEl) {
  const id = nodeEl.id || '';
  const match = id.match(/flowchart-(.+?)-\d+$/);
  return match ? match[1] : id;
}

function findNodeByLabel(label) {
  for (const node of canvas.querySelectorAll('.node')) {
    if (getNodeLabel(node) === label) return node;
  }
  return null;
}

function getSvgScale() {
  const svgEl = canvas.querySelector('svg');
  if (!svgEl) return 1;
  const bbox = svgEl.getBoundingClientRect();
  const viewBox = svgEl.viewBox?.baseVal;
  if (!viewBox || !viewBox.width || !bbox.width) return 1;
  // Account for both SVG viewBox scaling and our canvas zoom
  return viewBox.width / bbox.width;
}

function parseTranslate(el) {
  const transform = el.getAttribute('transform') || '';
  const match = transform.match(/translate\s*\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/);
  return { x: parseFloat(match?.[1] || 0), y: parseFloat(match?.[2] || 0) };
}

function setTranslate(el, x, y) {
  el.setAttribute('transform', `translate(${x}, ${y})`);
}

// --- Edge Connectivity ---

function getNodeSvgCenter(nodeEl) {
  const pos = parseTranslate(nodeEl);
  const shape = nodeEl.querySelector('rect, polygon, circle, .basic');
  if (!shape) return pos;
  if (shape.tagName === 'rect') {
    const x = parseFloat(shape.getAttribute('x') || 0);
    const y = parseFloat(shape.getAttribute('y') || 0);
    const w = parseFloat(shape.getAttribute('width') || 0);
    const h = parseFloat(shape.getAttribute('height') || 0);
    return { x: pos.x + x + w / 2, y: pos.y + y + h / 2 };
  }
  if (shape.tagName === 'circle') {
    return { x: pos.x + parseFloat(shape.getAttribute('cx') || 0), y: pos.y + parseFloat(shape.getAttribute('cy') || 0) };
  }
  if (shape.tagName === 'polygon') {
    // Calculate centroid from polygon points
    const pointsAttr = shape.getAttribute('points') || '';
    const pts = pointsAttr.trim().split(/[\s,]+/).map(Number);
    if (pts.length >= 4) {
      let cx = 0, cy = 0, count = 0;
      for (let i = 0; i < pts.length - 1; i += 2) {
        cx += pts[i]; cy += pts[i + 1]; count++;
      }
      return { x: pos.x + cx / count, y: pos.y + cy / count };
    }
  }
  // Fallback: use getBBox if available
  try {
    const bbox = shape.getBBox();
    return { x: pos.x + bbox.x + bbox.width / 2, y: pos.y + bbox.y + bbox.height / 2 };
  } catch (e) {}
  return pos;
}

function extractCoords(d) {
  const nums = [];
  const re = /[-+]?\d*\.?\d+/g;
  let m;
  while ((m = re.exec(d)) !== null) nums.push(parseFloat(m[0]));
  const coords = [];
  for (let i = 0; i < nums.length - 1; i += 2) coords.push({ x: nums[i], y: nums[i + 1] });
  return coords;
}

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function findNearest(nodeInfos, pt) {
  let best = null, bestDist = Infinity;
  for (const info of nodeInfos) {
    const d = dist(info.center, pt);
    if (d < bestDist) { bestDist = d; best = info; }
  }
  return best;
}

function buildEdgeMap() {
  const tab = getActiveTab();
  if (!tab) return;
  tab.edgeMap = [];

  const nodeInfos = [];
  canvas.querySelectorAll('.node').forEach((node) => {
    nodeInfos.push({ label: getNodeLabel(node), center: getNodeSvgCenter(node) });
  });
  if (nodeInfos.length === 0) return;

  // Edge paths are direct path elements with class .flowchart-link inside the edgePaths group
  const edgePaths = canvas.querySelectorAll('path.flowchart-link');
  const edgeLabelGroups = canvas.querySelectorAll('.edgeLabel');

  edgePaths.forEach((pathEl, idx) => {
    const d = pathEl.getAttribute('d');
    if (!d) return;
    const coords = extractCoords(d);
    if (coords.length < 2) return;

    const source = findNearest(nodeInfos, coords[0]);
    const target = findNearest(nodeInfos, coords[coords.length - 1]);

    if (source && target) {
      const edgeLabelEl = edgeLabelGroups[idx] || null;
      tab.edgeMap.push({
        pathEl,
        sourceLabel: source.label,
        targetLabel: target.label,
        originalCoords: coords,
        edgeLabelEl,
        originalLabelPos: edgeLabelEl ? parseTranslate(edgeLabelEl) : null,
      });
    }
  });
}

function buildPathString(coords) {
  if (coords.length === 0) return '';
  let d = `M${coords[0].x},${coords[0].y}`;
  let i = 1;
  while (i + 2 < coords.length) {
    d += `C${coords[i].x},${coords[i].y},${coords[i + 1].x},${coords[i + 1].y},${coords[i + 2].x},${coords[i + 2].y}`;
    i += 3;
  }
  while (i < coords.length) { d += `L${coords[i].x},${coords[i].y}`; i++; }
  return d;
}

function updateEdgesForNode(label, dx, dy) {
  const tab = getActiveTab();
  if (!tab) return;

  for (const edge of tab.edgeMap) {
    const isSource = edge.sourceLabel === label;
    const isTarget = edge.targetLabel === label;
    if (!isSource && !isTarget) continue;

    const coords = edge.originalCoords;
    const totalPts = coords.length;
    if (totalPts < 2) continue;

    const srcPos = tab.nodePositions.get(edge.sourceLabel) || { dx: 0, dy: 0 };
    const tgtPos = tab.nodePositions.get(edge.targetLabel) || { dx: 0, dy: 0 };
    const srcDx = edge.sourceLabel === label ? srcPos.dx + dx : srcPos.dx;
    const srcDy = edge.sourceLabel === label ? srcPos.dy + dy : srcPos.dy;
    const tgtDx = edge.targetLabel === label ? tgtPos.dx + dx : tgtPos.dx;
    const tgtDy = edge.targetLabel === label ? tgtPos.dy + dy : tgtPos.dy;

    const newCoords = coords.map((pt, i) => {
      const t = totalPts > 1 ? i / (totalPts - 1) : 0.5;
      return { x: pt.x + srcDx * (1 - t) + tgtDx * t, y: pt.y + srcDy * (1 - t) + tgtDy * t };
    });

    edge.pathEl.setAttribute('d', buildPathString(newCoords));

    if (edge.edgeLabelEl && edge.originalLabelPos) {
      setTranslate(edge.edgeLabelEl, edge.originalLabelPos.x + (srcDx + tgtDx) / 2, edge.originalLabelPos.y + (srcDy + tgtDy) / 2);
    }
  }
}

function updateAllEdges() {
  const tab = getActiveTab();
  if (!tab) return;

  for (const edge of tab.edgeMap) {
    const coords = edge.originalCoords;
    const totalPts = coords.length;
    if (totalPts < 2) continue;

    const srcPos = tab.nodePositions.get(edge.sourceLabel) || { dx: 0, dy: 0 };
    const tgtPos = tab.nodePositions.get(edge.targetLabel) || { dx: 0, dy: 0 };

    const newCoords = coords.map((pt, i) => {
      const t = totalPts > 1 ? i / (totalPts - 1) : 0.5;
      return { x: pt.x + srcPos.dx * (1 - t) + tgtPos.dx * t, y: pt.y + srcPos.dy * (1 - t) + tgtPos.dy * t };
    });

    edge.pathEl.setAttribute('d', buildPathString(newCoords));

    if (edge.edgeLabelEl && edge.originalLabelPos) {
      setTranslate(edge.edgeLabelEl, edge.originalLabelPos.x + (srcPos.dx + tgtPos.dx) / 2, edge.originalLabelPos.y + (srcPos.dy + tgtPos.dy) / 2);
    }
  }
}

// originalCoords and originalLabelPos are NEVER updated after drag — they stay
// as Mermaid's initial render baseline. nodePositions holds cumulative deltas.

// --- Drag and Drop ---

function attachDragToNodes() {
  try { interact.default('.node').unset(); } catch (e) {}

  const gridSize = parseInt(gridSizeInput.value) || 20;
  const snapEnabled = snapEnabledCheckbox.checked;
  const modifiers = [];
  if (snapEnabled) {
    // Scale grid snap to match visual grid at current zoom level
    const scaledGrid = gridSize * viewTransform.scale;
    modifiers.push(interact.default.modifiers.snap({
      targets: [interact.default.snappers.grid({ x: scaledGrid, y: scaledGrid })],
      range: Infinity,
      relativePoints: [{ x: 0, y: 0 }],
    }));
  }

  interact.default('.node').draggable({
    modifiers,
    listeners: {
      start(event) {
        const el = event.target;
        el.classList.add('dragging');
        const pos = parseTranslate(el);
        el.dataset.startX = pos.x;
        el.dataset.startY = pos.y;
        el.dataset.dx = '0';
        el.dataset.dy = '0';
      },
      move(event) {
        const el = event.target;
        const scale = getSvgScale();
        const dx = parseFloat(el.dataset.dx) + event.dx * scale;
        const dy = parseFloat(el.dataset.dy) + event.dy * scale;
        el.dataset.dx = dx;
        el.dataset.dy = dy;
        setTranslate(el, parseFloat(el.dataset.startX) + dx, parseFloat(el.dataset.startY) + dy);
        updateEdgesForNode(getNodeLabel(el), dx, dy);
      },
      end(event) {
        const el = event.target;
        el.classList.remove('dragging');
        const label = getNodeLabel(el);
        const totalDx = parseFloat(el.dataset.dx);
        const totalDy = parseFloat(el.dataset.dy);
        const tab = getActiveTab();
        if (tab) {
          const prev = tab.nodePositions.get(label) || { dx: 0, dy: 0 };
          tab.nodePositions.set(label, { dx: prev.dx + totalDx, dy: prev.dy + totalDy });
        }
        if (Math.abs(totalDx) < 5 && Math.abs(totalDy) < 5) selectNode(el);
        scheduleSave();
      },
    },
  });
}

// --- Position Persistence ---

function restoreNodePositions() {
  const tab = getActiveTab();
  if (!tab) return;
  for (const [label, delta] of tab.nodePositions) {
    const node = findNodeByLabel(label);
    if (!node) continue;
    const pos = parseTranslate(node);
    setTranslate(node, pos.x + delta.dx, pos.y + delta.dy);
  }
  updateAllEdges();
}

// --- Node Selection ---

// Use event delegation on canvas — set up once, never duplicates
let canvasClickBound = false;
function attachClickToNodes() {
  if (canvasClickBound) return;
  canvasClickBound = true;
  canvas.addEventListener('click', (e) => {
    const nodeEl = e.target.closest('.node');
    if (nodeEl) {
      e.stopPropagation();
      selectNode(nodeEl);
    } else {
      deselectNode();
    }
  });
}

function selectNode(nodeEl) {
  const prev = canvas.querySelector('.node.selected');
  if (prev) prev.classList.remove('selected');
  nodeEl.classList.add('selected');
  const label = getNodeLabel(nodeEl);
  const tab = getActiveTab();
  if (tab) tab.selectedNodeLabel = label;

  selectedNodeName.textContent = label;
  selectedNodeName.classList.remove('no-selection');
  colorControls.classList.add('active');

  const colors = (tab && tab.nodeColors.get(label)) || readNodeColors(nodeEl);
  colorBg.value = colors.background;
  colorBorder.value = colors.border;
  colorText.value = colors.text;
  hexBg.textContent = colors.background;
  hexBorder.textContent = colors.border;
  hexText.textContent = colors.text;
}

function deselectNode() {
  const prev = canvas.querySelector('.node.selected');
  if (prev) prev.classList.remove('selected');
  const tab = getActiveTab();
  if (tab) tab.selectedNodeLabel = null;
  selectedNodeName.textContent = t('noSelection');
  selectedNodeName.classList.add('no-selection');
  colorControls.classList.remove('active');
}

function highlightSelectedNode() {
  const tab = getActiveTab();
  if (!tab || !tab.selectedNodeLabel) return;
  const node = findNodeByLabel(tab.selectedNodeLabel);
  if (node) node.classList.add('selected');
}

// --- Color Management ---

function readNodeColors(nodeEl) {
  const shape = nodeEl.querySelector('rect, polygon, circle, path.basic, .basic');
  let background = '#FDF8F0', border = '#C96442';
  if (shape) {
    const fill = shape.getAttribute('fill') || shape.style.fill;
    const stroke = shape.getAttribute('stroke') || shape.style.stroke;
    if (fill) background = normalizeColor(fill);
    if (stroke) border = normalizeColor(stroke);
  }
  let text = '#3D3929';
  const textEl = nodeEl.querySelector('.nodeLabel, span, text');
  if (textEl) {
    const c = textEl.style.color || getComputedStyle(textEl).color;
    if (c) text = normalizeColor(c);
  }
  return { background, border, text };
}

function normalizeColor(color) {
  if (!color) return '#000000';
  if (color.startsWith('#') && color.length === 7) return color;
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return '#' + [match[1], match[2], match[3]].map((v) => parseInt(v).toString(16).padStart(2, '0')).join('');
  }
  const tmp = document.createElement('div');
  tmp.style.color = color;
  document.body.appendChild(tmp);
  const computed = getComputedStyle(tmp).color;
  document.body.removeChild(tmp);
  const m2 = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m2) return '#' + [m2[1], m2[2], m2[3]].map((v) => parseInt(v).toString(16).padStart(2, '0')).join('');
  return color;
}

function applyColorToNode(nodeEl, colors) {
  const shape = nodeEl.querySelector('rect, polygon, circle, path.basic, .basic');
  if (shape) {
    if (colors.background) { shape.setAttribute('fill', colors.background); shape.style.fill = colors.background; }
    if (colors.border) { shape.setAttribute('stroke', colors.border); shape.style.stroke = colors.border; }
  }
  if (colors.text) {
    nodeEl.querySelectorAll('.nodeLabel, span, text').forEach((t) => {
      t.style.color = colors.text;
      t.setAttribute('fill', colors.text);
    });
  }
}

function applyColorOverrides() {
  const tab = getActiveTab();
  if (!tab) return;
  for (const [label, colors] of tab.nodeColors) {
    const node = findNodeByLabel(label);
    if (node) applyColorToNode(node, colors);
  }
}

function onColorChange(type, value) {
  const tab = getActiveTab();
  if (!tab || !tab.selectedNodeLabel) return;
  const label = tab.selectedNodeLabel;
  const colors = tab.nodeColors.get(label) || { background: '#FDF8F0', border: '#C96442', text: '#3D3929' };
  colors[type] = value;
  tab.nodeColors.set(label, colors);
  const node = findNodeByLabel(label);
  if (node) applyColorToNode(node, colors);
  scheduleSave();
}

// --- Export SVG & PNG ---

function exportSvg() {
  const svgEl = canvas.querySelector('svg');
  if (!svgEl) return;
  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const blob = new Blob([clone.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, getExportFilename('svg'));
}

function exportPng() {
  const svgEl = canvas.querySelector('svg');
  if (!svgEl) return;

  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Inline foreignObject styles for correct rendering
  clone.querySelectorAll('foreignObject *').forEach((el) => {
    const computed = getComputedStyle(el);
    el.style.fontFamily = computed.fontFamily;
    el.style.fontSize = computed.fontSize;
    el.style.color = computed.color;
  });

  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const viewBox = svgEl.viewBox?.baseVal;
  const width = viewBox?.width || svgEl.getBoundingClientRect().width;
  const height = viewBox?.height || svgEl.getBoundingClientRect().height;
  const scale = 2; // 2x for high DPI

  const img = new Image();
  img.onerror = () => { URL.revokeObjectURL(url); console.error('PNG export: failed to load SVG image'); };
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = width * scale;
    c.height = height * scale;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#FDFBF7';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    c.toBlob((blob) => {
      if (blob) downloadBlob(blob, getExportFilename('png'));
    }, 'image/png');
  };
  img.src = url;
}

function getExportFilename(ext) {
  const tab = getActiveTab();
  const name = tab ? tab.name.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_') : 'diagram';
  return `${name}.${ext}`;
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 100);
}

// --- Canvas Pan & Zoom ---

const canvasPanel = document.getElementById('canvas-panel');
let viewTransform = { x: 0, y: 0, scale: 1 };
let isPanning = false;
let panStart = { x: 0, y: 0 };

function applyViewTransform() {
  const { x, y, scale } = viewTransform;
  canvas.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  canvas.style.transformOrigin = '0 0';
}

function resetViewTransform() {
  viewTransform = { x: 0, y: 0, scale: 1 };
  applyViewTransform();
}

// Middle mouse button pan
canvasPanel.addEventListener('mousedown', (e) => {
  if (e.button === 1) { // middle click
    e.preventDefault();
    isPanning = true;
    panStart = { x: e.clientX - viewTransform.x, y: e.clientY - viewTransform.y };
    canvasPanel.classList.add('panning');
  }
});

window.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  viewTransform.x = e.clientX - panStart.x;
  viewTransform.y = e.clientY - panStart.y;
  applyViewTransform();
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 1 && isPanning) {
    isPanning = false;
    canvasPanel.classList.remove('panning');
  }
});

// Prevent default middle-click auto-scroll
canvasPanel.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });

// Ctrl + scroll to zoom
canvasPanel.addEventListener('wheel', (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();

  const rect = canvasPanel.getBoundingClientRect();
  // Mouse position relative to canvas panel
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const oldScale = viewTransform.scale;
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.min(5, Math.max(0.1, oldScale * delta));

  // Zoom toward mouse position
  viewTransform.x = mx - (mx - viewTransform.x) * (newScale / oldScale);
  viewTransform.y = my - (my - viewTransform.y) * (newScale / oldScale);
  viewTransform.scale = newScale;

  applyViewTransform();
}, { passive: false });

// --- Grid Controls ---

function updateGrid() {
  const size = parseInt(gridSizeInput.value) || 20;
  const show = showGridCheckbox.checked;
  canvasPanel.style.backgroundImage = show ? `radial-gradient(circle, #D9CFC0 1px, transparent 1px)` : 'none';
  canvasPanel.style.backgroundSize = `${size}px ${size}px`;
  attachDragToNodes();
}

// --- Event Listeners ---

btnRender.addEventListener('click', () => { saveCurrentTabState(); renderDiagram(true); });
btnRelayout.addEventListener('click', () => {
  const tab = getActiveTab();
  if (tab) tab.nodePositions.clear();
  resetViewTransform();
  renderDiagram(false);
});

gridSizeInput.addEventListener('change', updateGrid);
showGridCheckbox.addEventListener('change', updateGrid);
snapEnabledCheckbox.addEventListener('change', () => attachDragToNodes());

colorBg.addEventListener('input', (e) => { hexBg.textContent = e.target.value; onColorChange('background', e.target.value); });
colorBorder.addEventListener('input', (e) => { hexBorder.textContent = e.target.value; onColorChange('border', e.target.value); });
colorText.addEventListener('input', (e) => { hexText.textContent = e.target.value; onColorChange('text', e.target.value); });

btnResetColor.addEventListener('click', () => {
  const tab = getActiveTab();
  if (!tab || !tab.selectedNodeLabel) return;
  tab.nodeColors.delete(tab.selectedNodeLabel);
  renderDiagram(true);
});

btnExportSvg.addEventListener('click', exportSvg);
btnExportPng.addEventListener('click', exportPng);
btnAddTab.addEventListener('click', () => addTab());

editor.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); saveCurrentTabState(); renderDiagram(true); }
});

// --- State Persistence ---

const STORAGE_KEY = 'mermaid-editor-state';
let saveTimer = null;

function serializeState() {
  saveCurrentTabState();
  return JSON.stringify({
    tabs: tabs.map((t) => ({
      id: t.id,
      name: t.name,
      code: t.code,
      nodeColors: [...t.nodeColors.entries()],
      nodePositions: [...t.nodePositions.entries()],
    })),
    activeTabId,
    tabCounter,
    gridSize: parseInt(gridSizeInput.value) || 20,
    showGrid: showGridCheckbox.checked,
    snapEnabled: snapEnabledCheckbox.checked,
    leftCollapsed: document.body.classList.contains('left-collapsed'),
    rightCollapsed: document.body.classList.contains('right-collapsed'),
    lang: currentLang,
  });
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, serializeState()); }
    catch (e) { console.error('Save failed:', e); }
  }, 500);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const state = JSON.parse(raw);
    if (!state.tabs || state.tabs.length === 0) return false;

    tabs = state.tabs.map((t) => ({
      id: t.id,
      name: t.name,
      code: t.code,
      nodeColors: new Map(t.nodeColors || []),
      nodePositions: new Map(t.nodePositions || []),
      selectedNodeLabel: null,
      edgeMap: [],
      renderCounter: 0,
    }));

    // Recalculate tabCounter from max existing id to avoid collisions
    tabCounter = Math.max(...tabs.map((t) => t.id), 0);

    activeTabId = state.activeTabId || tabs[0].id;
    const tab = getActiveTab();
    if (!tab) { activeTabId = tabs[0].id; }
    editor.value = getActiveTab().code;

    // Restore settings
    gridSizeInput.value = state.gridSize || 20;
    showGridCheckbox.checked = state.showGrid !== false;
    snapEnabledCheckbox.checked = state.snapEnabled !== false;

    if (state.leftCollapsed) {
      document.body.classList.add('left-collapsed');
      toggleLeft.innerHTML = '&#9654;';
    }
    if (state.rightCollapsed) {
      document.body.classList.add('right-collapsed');
      toggleRight.innerHTML = '&#9664;';
    }

    // Restore language
    if (state.lang && LOCALES[state.lang]) {
      currentLang = state.lang;
      langSelect.value = state.lang;
      applyI18n();
    }

    renderTabBar();
    updateGrid();
    renderDiagram(true);
    return true;
  } catch (e) {
    console.error('Load failed:', e);
    return false;
  }
}

// Hook auto-save into key actions
editor.addEventListener('input', scheduleSave);
gridSizeInput.addEventListener('change', scheduleSave);
showGridCheckbox.addEventListener('change', scheduleSave);
snapEnabledCheckbox.addEventListener('change', scheduleSave);

// --- Language Switch ---

langSelect.addEventListener('change', (e) => {
  setLang(e.target.value);
  renderTabBar();
  // Update deselected node text if no node selected
  const tab = getActiveTab();
  if (!tab || !tab.selectedNodeLabel) {
    selectedNodeName.textContent = t('noSelection');
  }
  scheduleSave();
});

// --- Panel Collapse ---

const toggleLeft = document.getElementById('toggle-left');
const toggleRight = document.getElementById('toggle-right');

toggleLeft.addEventListener('click', () => {
  document.body.classList.toggle('left-collapsed');
  toggleLeft.innerHTML = document.body.classList.contains('left-collapsed') ? '&#9654;' : '&#9664;';
  scheduleSave();
});

toggleRight.addEventListener('click', () => {
  document.body.classList.toggle('right-collapsed');
  toggleRight.innerHTML = document.body.classList.contains('right-collapsed') ? '&#9664;' : '&#9654;';
  scheduleSave();
});

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  if (!loadState()) {
    applyI18n();
    addTab(`${t('defaultTabName')} 1`, getDefaultCode());
  }
});
