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

// Visual editor DOM references
const modeCodeBtn = document.getElementById('mode-code');
const modeVisualBtn = document.getElementById('mode-visual');
const codePanel = document.getElementById('code-panel');
const visualPanel = document.getElementById('visual-panel');
const visualDirectionSelect = document.getElementById('visual-direction');
const connectBar = document.getElementById('connect-bar');
const btnConnectCancel = document.getElementById('btn-connect-cancel');
const visualNodeList = document.getElementById('visual-node-list');

// --- Tab System ---
const langSelect = document.getElementById('lang-select');

// --- Editor Mode ---
let editorMode = 'visual'; // 'code' or 'visual'

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
    selectedNodeLabels: [],
    edgeMap: [],
    renderCounter: 0,
    // Visual editor model
    visualNodes: [],   // [{id, type, label}]
    visualEdges: [],   // [{from, to, label}]
    visualDirection: 'TD',
    visualIdCounter: 0,
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
  exitConnectMode();
  renderTabBar();
  renderDiagram(true);
  if (editorMode === 'visual') {
    visualDirectionSelect.value = tab.visualDirection || 'TD';
    renderVisualNodeList();
    renderVisualEdgeList();
  }
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

  // If preservePositions is requested and the canvas is currently showing this tab,
  // capture moved nodes' absolute positions so we can rebase their deltas after Mermaid re-layout.
  const shouldRebaseMovedNodes =
    preservePositions && canvas.dataset.renderTabId === String(tab.id) && tab.nodePositions.size > 0;
  const movedNodeAbsPositions = shouldRebaseMovedNodes ? new Map() : null;
  if (movedNodeAbsPositions) {
    for (const label of tab.nodePositions.keys()) {
      const node = findNodeByLabel(label);
      if (!node) continue;
      movedNodeAbsPositions.set(label, parseTranslate(node));
    }
  }

  tab.renderCounter++;
  const renderSeq = tab.renderCounter;
  const renderTabId = tab.id;
  const id = `mermaid-${renderTabId}-${renderSeq}`;

  try {
    const { svg } = await mermaid.default.render(id, code);

    // Ignore stale renders (async Mermaid render can resolve out of order).
    const currentTab = getActiveTab();
    if (!currentTab || currentTab.id !== renderTabId) return;
    if (currentTab.renderCounter !== renderSeq) return;

    canvas.innerHTML = svg;
    canvas.dataset.renderTabId = String(renderTabId);
    buildEdgeMap();

    if (preservePositions) {
      if (movedNodeAbsPositions && movedNodeAbsPositions.size > 0) {
        // Rebase deltas to the new Mermaid layout baseline.
        currentTab.nodePositions.clear();
        for (const [label, oldPos] of movedNodeAbsPositions) {
          const node = findNodeByLabel(label);
          if (!node) continue;
          const basePos = parseTranslate(node);
          currentTab.nodePositions.set(label, { dx: oldPos.x - basePos.x, dy: oldPos.y - basePos.y });
        }
      }
      restoreNodePositions();
    }

    applyColorOverrides();
    attachDragToNodes();
    attachClickToNodes();
    attachEdgeInteractions();
    if (tab.selectedNodeLabel) highlightSelectedNode();
  } catch (err) {
    // Same stale-render guard for errors: don't overwrite a newer successful render.
    const currentTab = getActiveTab();
    if (!currentTab || currentTab.id !== renderTabId) return;
    if (currentTab.renderCounter !== renderSeq) return;

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

function clearSelectedNodeClasses() {
  canvas.querySelectorAll('.node.selected').forEach((node) => node.classList.remove('selected'));
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

// When nodes are draggable, a "click" often produces both:
// - interact.js drag end (with tiny movement), and
// - a native DOM click that bubbles to the canvas listener.
// We handle node-click behavior in the interact.js end handler, so we must suppress the
// immediately-following DOM click to avoid double-processing (e.g. Shift+Click connect cancel).
let _suppressNextCanvasNodeClickLabel = null;
function suppressNextCanvasNodeClick(label) {
  _suppressNextCanvasNodeClickLabel = label;
  // Clear on next tick even if no click fires, so we don't suppress unrelated future clicks.
  setTimeout(() => {
    if (_suppressNextCanvasNodeClickLabel === label) _suppressNextCanvasNodeClickLabel = null;
  }, 0);
}

function consumeSuppressedCanvasNodeClick(nodeEl) {
  if (!_suppressNextCanvasNodeClickLabel || !nodeEl) return false;
  const label = getNodeLabel(nodeEl);
  if (label !== _suppressNextCanvasNodeClickLabel) return false;
  _suppressNextCanvasNodeClickLabel = null;
  return true;
}

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

  // Track the last highlighted target during connection drag
  let _connDragTarget = null;

  interact.default('.node').draggable({
    modifiers,
    listeners: {
      start(event) {
        const el = event.target;
        // Always init drag data to prevent NaN on subsequent drags
        const pos = parseTranslate(el);
        el.dataset.startX = pos.x;
        el.dataset.startY = pos.y;
        el.dataset.dx = '0';
        el.dataset.dy = '0';

        const shiftHeld = event.shiftKey;

        // Shift+Drag in visual mode = draw connection line (not move node)
        if (editorMode === 'visual' && shiftHeld) {
          el.dataset.connectionDrag = 'true';
          el.classList.add('connect-source');
          const label = getNodeLabel(el);
          const tab = getActiveTab();
          const vNode = tab?.visualNodes?.find((n) => n.id === label);
          if (!vNode) { delete el.dataset.connectionDrag; return; }

          connectMode = true;
          connectSourceId = vNode.id;
          _connDragTarget = null;
          connectBar.classList.add('active');

          // Create temp line from node center
          const svgEl = canvas.querySelector('svg');
          if (svgEl) {
            tempConnectionLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tempConnectionLine.classList.add('temp-connection-line');
            const center = getNodeSvgCenter(el);
            tempConnectionLine.setAttribute('x1', center.x);
            tempConnectionLine.setAttribute('y1', center.y);
            tempConnectionLine.setAttribute('x2', center.x);
            tempConnectionLine.setAttribute('y2', center.y);
            svgEl.appendChild(tempConnectionLine);
          }
          return;
        }

        // Normal drag
        el.classList.add('dragging');
      },
      move(event) {
        const el = event.target;

        // Connection drag: update temp line endpoint
        if (el.dataset.connectionDrag === 'true') {
          if (tempConnectionLine) {
            const svgEl = canvas.querySelector('svg');
            if (svgEl) {
              const pt = svgEl.createSVGPoint();
              pt.x = event.clientX;
              pt.y = event.clientY;
              const ctm = svgEl.getScreenCTM();
              if (ctm) {
                const svgPt = pt.matrixTransform(ctm.inverse());
                tempConnectionLine.setAttribute('x2', svgPt.x);
                tempConnectionLine.setAttribute('y2', svgPt.y);
              }
            }
          }
          // Highlight potential target — scan all nodes by bounding rect
          canvas.querySelectorAll('.node.connect-target').forEach((n) => n.classList.remove('connect-target'));
          _connDragTarget = null;
          canvas.querySelectorAll('.node').forEach((nodeEl) => {
            if (getNodeLabel(nodeEl) === connectSourceId) return;
            const rect = nodeEl.getBoundingClientRect();
            if (event.clientX >= rect.left && event.clientX <= rect.right &&
                event.clientY >= rect.top && event.clientY <= rect.bottom) {
              nodeEl.classList.add('connect-target');
              _connDragTarget = nodeEl;
            }
          });
          return;
        }

        // Normal drag: move node
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

        // Connection drag end: use the tracked target node
        if (el.dataset.connectionDrag === 'true') {
          delete el.dataset.connectionDrag;
          el.classList.remove('dragging');
          const tab = getActiveTab();
          const targetNode = _connDragTarget;
          const sourceId = connectSourceId;
          _connDragTarget = null;
          exitConnectMode();

          if (targetNode && tab) {
            const targetLabel = getNodeLabel(targetNode);
            const targetVNode = tab.visualNodes.find((n) => n.id === targetLabel);
            if (targetVNode && targetVNode.id !== sourceId) {
              tab.visualEdges.push({ from: sourceId, to: targetVNode.id, label: '' });
              syncVisualToCode();
              renderVisualNodeList();
              renderVisualEdgeList();
            }
          }
          return;
        }

        // Normal drag end
        el.classList.remove('dragging');
        const label = getNodeLabel(el);
        const totalDx = parseFloat(el.dataset.dx);
        const totalDy = parseFloat(el.dataset.dy);
        const tab = getActiveTab();
        if (tab) {
          const prev = tab.nodePositions.get(label) || { dx: 0, dy: 0 };
          tab.nodePositions.set(label, { dx: prev.dx + totalDx, dy: prev.dy + totalDy });
        }
        if (Math.abs(totalDx) < 5 && Math.abs(totalDy) < 5) {
          suppressNextCanvasNodeClick(label);
          selectNode(el);
        }
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
      if (consumeSuppressedCanvasNodeClick(nodeEl)) { e.stopPropagation(); return; }
      e.stopPropagation();
      deselectEdge();
      selectNode(nodeEl);
    } else {
      if (connectMode) exitConnectMode();
      deselectNode();
      deselectEdge();
    }
  });
  // Second click on already-selected node → inline edit label on canvas
  // (interact.js drag-end with small movement calls selectNode; if it's already selected, edit)

}

function selectNode(nodeEl) {
  const tab = getActiveTab();
  if (!tab || !nodeEl) return;

  // Second click on already-selected node in visual mode → inline edit
  if (editorMode === 'visual' && nodeEl.classList.contains('selected')) {
    const label = getNodeLabel(nodeEl);
    const vNode = tab.visualNodes.find((n) => n.id === label);
    if (vNode) {
      showNodeLabelEditor(nodeEl, vNode);
      return;
    }
  }

  selectNodes([nodeEl]);
}

function showNodeLabelEditor(nodeEl, vNode) {
  // Remove any existing editor
  const existing = canvasPanel.querySelector('.edge-label-editor');
  if (existing) existing.remove();

  // Position at node center in viewport coords
  const rect = nodeEl.getBoundingClientRect();
  const panelRect = canvasPanel.getBoundingClientRect();
  const x = rect.left + rect.width / 2 - panelRect.left;
  const y = rect.top + rect.height / 2 - panelRect.top;

  const input = document.createElement('input');
  input.className = 'edge-label-editor';
  input.type = 'text';
  input.value = vNode.label || '';
  input.placeholder = t('nodeEditPrompt');
  input.style.left = x + 'px';
  input.style.top = y + 'px';
  canvasPanel.appendChild(input);
  input.focus();
  input.select();

  function commit() {
    const newLabel = input.value.trim();
    input.remove();
    if (newLabel && newLabel !== vNode.label) {
      vNode.label = newLabel;
      syncVisualToCode();
      renderVisualNodeList();
    }
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.value = vNode.label || ''; input.blur(); }
  });
}

function selectNodes(nodeEls) {
  const tab = getActiveTab();
  if (!tab) return;

  const labels = [...new Set(nodeEls.map((nodeEl) => getNodeLabel(nodeEl)).filter(Boolean))];
  clearSelectedNodeClasses();

  labels.forEach((label) => {
    const node = findNodeByLabel(label);
    if (node) node.classList.add('selected');
  });

  tab.selectedNodeLabels = labels;
  tab.selectedNodeLabel = labels[0] || null;

  if (labels.length === 0) {
    selectedNodeName.textContent = t('noSelection');
    selectedNodeName.classList.add('no-selection');
    colorControls.classList.remove('active');
    return;
  }

  selectedNodeName.classList.remove('no-selection');
  if (labels.length === 1) {
    const label = labels[0];
    selectedNodeName.textContent = label;
    colorControls.classList.add('active');

    const node = findNodeByLabel(label);
    const colors = tab.nodeColors.get(label) || (node ? readNodeColors(node) : { background: '#FDF8F0', border: '#C96442', text: '#3D3929' });
    colorBg.value = colors.background;
    colorBorder.value = colors.border;
    colorText.value = colors.text;
    hexBg.textContent = colors.background;
    hexBorder.textContent = colors.border;
    hexText.textContent = colors.text;
    return;
  }

  selectedNodeName.textContent = `${labels[0]} +${labels.length - 1}`;
  colorControls.classList.remove('active');
}

function deselectNode() {
  clearSelectedNodeClasses();
  const tab = getActiveTab();
  if (tab) {
    tab.selectedNodeLabel = null;
    tab.selectedNodeLabels = [];
  }
  selectedNodeName.textContent = t('noSelection');
  selectedNodeName.classList.add('no-selection');
  colorControls.classList.remove('active');
}

function highlightSelectedNode() {
  const tab = getActiveTab();
  if (!tab) return;
  const labels = (tab.selectedNodeLabels && tab.selectedNodeLabels.length > 0)
    ? tab.selectedNodeLabels
    : (tab.selectedNodeLabel ? [tab.selectedNodeLabel] : []);
  if (labels.length === 0) return;
  selectNodes(labels.map((label) => findNodeByLabel(label)).filter(Boolean));
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
let isMarqueeSelecting = false;
let marqueeStart = null;
let marqueeMoved = false;
const selectionMarquee = document.createElement('div');
selectionMarquee.className = 'selection-marquee';
canvasPanel.appendChild(selectionMarquee);

function applyViewTransform() {
  const { x, y, scale } = viewTransform;
  canvas.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  canvas.style.transformOrigin = '0 0';
}

function resetViewTransform() {
  viewTransform = { x: 0, y: 0, scale: 1 };
  applyViewTransform();
}

function hideSelectionMarquee() {
  selectionMarquee.style.display = 'none';
}

function updateSelectionMarquee(start, current) {
  const left = Math.min(start.x, current.x);
  const top = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  selectionMarquee.style.display = 'block';
  selectionMarquee.style.left = `${left}px`;
  selectionMarquee.style.top = `${top}px`;
  selectionMarquee.style.width = `${width}px`;
  selectionMarquee.style.height = `${height}px`;
}

function getPanelPoint(event) {
  const rect = canvasPanel.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function isNodeIntersectingSelection(nodeEl, selectionRect) {
  const rect = nodeEl.getBoundingClientRect();
  return !(
    rect.right < selectionRect.left ||
    rect.left > selectionRect.right ||
    rect.bottom < selectionRect.top ||
    rect.top > selectionRect.bottom
  );
}

function finishMarqueeSelection(event) {
  if (!isMarqueeSelecting) return;
  isMarqueeSelecting = false;
  hideSelectionMarquee();

  if (!marqueeMoved || !marqueeStart) {
    marqueeStart = null;
    marqueeMoved = false;
    return;
  }

  const current = getPanelPoint(event);
  const panelRect = canvasPanel.getBoundingClientRect();
  const selectionRect = {
    left: panelRect.left + Math.min(marqueeStart.x, current.x),
    right: panelRect.left + Math.max(marqueeStart.x, current.x),
    top: panelRect.top + Math.min(marqueeStart.y, current.y),
    bottom: panelRect.top + Math.max(marqueeStart.y, current.y),
  };

  const nodes = [...canvas.querySelectorAll('.node')].filter((nodeEl) => isNodeIntersectingSelection(nodeEl, selectionRect));
  if (nodes.length > 0) selectNodes(nodes);
  else deselectNode();

  marqueeStart = null;
  marqueeMoved = false;
}

// Middle mouse button pan
canvasPanel.addEventListener('mousedown', (e) => {
  if (e.button === 1) { // middle click
    e.preventDefault();
    isPanning = true;
    panStart = { x: e.clientX - viewTransform.x, y: e.clientY - viewTransform.y };
    canvasPanel.classList.add('panning');
    return;
  }

  if (e.button !== 0 || e.target.closest('.panel-toggle') || e.target.closest('.node')) return;
  if (window.getSelection) window.getSelection().removeAllRanges();
  isMarqueeSelecting = true;
  marqueeStart = getPanelPoint(e);
  marqueeMoved = false;
  updateSelectionMarquee(marqueeStart, marqueeStart);
  if (connectMode) exitConnectMode();
});

window.addEventListener('mousemove', (e) => {
  if (isPanning) {
    viewTransform.x = e.clientX - panStart.x;
    viewTransform.y = e.clientY - panStart.y;
    applyViewTransform();
  }

  if (isMarqueeSelecting && marqueeStart) {
    const current = getPanelPoint(e);
    marqueeMoved = marqueeMoved || Math.abs(current.x - marqueeStart.x) > 4 || Math.abs(current.y - marqueeStart.y) > 4;
    updateSelectionMarquee(marqueeStart, current);
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 1 && isPanning) {
    isPanning = false;
    canvasPanel.classList.remove('panning');
  }
  if (e.button === 0) finishMarqueeSelection(e);
});

// Prevent default middle-click auto-scroll
canvasPanel.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });
canvasPanel.addEventListener('selectstart', (e) => { e.preventDefault(); });

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

// --- Edge Interaction on Canvas ---

let selectedEdgeIndex = null; // index into tab.visualEdges

function deselectEdge() {
  selectedEdgeIndex = null;
  canvas.querySelectorAll('.edge-selected').forEach((el) => el.classList.remove('edge-selected'));
}

function selectEdge(edgeIdx, pathEl) {
  deselectEdge();
  deselectNode();
  selectedEdgeIndex = edgeIdx;
  if (pathEl) pathEl.classList.add('edge-selected');
}

function attachEdgeInteractions() {
  if (editorMode !== 'visual') return;
  const tab = getActiveTab();
  if (!tab) return;

  const edgePaths = canvas.querySelectorAll('path.flowchart-link');
  edgePaths.forEach((pathEl, svgIdx) => {
    // Find which visual edge this SVG path corresponds to
    const edgeInfo = tab.edgeMap[svgIdx];
    if (!edgeInfo) return;
    const vEdgeIdx = tab.visualEdges.findIndex(
      (ve) => ve.from === edgeInfo.sourceLabel && ve.to === edgeInfo.targetLabel
    );
    if (vEdgeIdx === -1) return;

    // Create wider invisible hit area for easy clicking
    // Match width to the arrowhead marker for intuitive clicking
    const hitPath = pathEl.cloneNode(false);
    hitPath.classList.remove('flowchart-link');
    hitPath.classList.add('edge-hit-area');
    hitPath.removeAttribute('id');
    hitPath.removeAttribute('marker-end');
    // Detect arrowhead width from marker element
    const markerRef = pathEl.getAttribute('marker-end') || '';
    const markerMatch = markerRef.match(/url\(#(.+?)\)/);
    let hitWidth = 20; // default
    if (markerMatch) {
      const marker = canvas.querySelector('#' + CSS.escape(markerMatch[1]));
      if (marker) {
        hitWidth = Math.max(hitWidth, parseFloat(marker.getAttribute('markerWidth') || 20) * 2);
      }
    }
    hitPath.style.stroke = 'rgba(0,0,0,0)';
    hitPath.style.strokeWidth = hitWidth + 'px';
    pathEl.parentNode.insertBefore(hitPath, pathEl);

    // Click to select edge
    hitPath.addEventListener('click', (e) => {
      e.stopPropagation();
      selectEdge(vEdgeIdx, pathEl);
    });

    // Also click on the visible path
    pathEl.style.pointerEvents = 'stroke';
    pathEl.style.cursor = 'pointer';
    pathEl.addEventListener('click', (e) => {
      e.stopPropagation();
      selectEdge(vEdgeIdx, pathEl);
    });

    // Double-click to edit label
    function onDblClick(e) {
      e.stopPropagation();
      const ve = tab.visualEdges[vEdgeIdx];
      if (!ve) return;

      // Position the floating editor near the click point
      const rect = canvasPanel.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      showEdgeLabelEditor(vEdgeIdx, x, y);
    }
    hitPath.addEventListener('dblclick', onDblClick);
    pathEl.addEventListener('dblclick', onDblClick);
  });
}

function showEdgeLabelEditor(edgeIdx, x, y) {
  // Remove any existing editor
  const existing = canvasPanel.querySelector('.edge-label-editor');
  if (existing) existing.remove();

  const tab = getActiveTab();
  if (!tab) return;
  const edge = tab.visualEdges[edgeIdx];
  if (!edge) return;

  const input = document.createElement('input');
  input.className = 'edge-label-editor';
  input.type = 'text';
  input.value = edge.label || '';
  input.placeholder = t('edgeLabelPlaceholder');
  input.style.left = x + 'px';
  input.style.top = y + 'px';
  canvasPanel.appendChild(input);
  input.focus();
  input.select();

  function commit() {
    const newLabel = input.value.trim();
    input.remove();
    if (newLabel !== edge.label) {
      edge.label = newLabel;
      syncVisualToCode();
      renderVisualEdgeList();
    }
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.value = edge.label || ''; input.blur(); }
  });
}

// --- Delete Key Handler ---
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Delete') return;
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
  if (editorMode !== 'visual') return;

  const tab = getActiveTab();
  if (!tab) return;

  e.preventDefault();

  // Delete selected edge first if any
  if (selectedEdgeIndex !== null) {
    tab.visualEdges.splice(selectedEdgeIndex, 1);
    deselectEdge();
    syncVisualToCode();
    renderVisualEdgeList();
    return;
  }

  // Delete selected nodes
  const labels = tab.selectedNodeLabels?.length ? tab.selectedNodeLabels : (tab.selectedNodeLabel ? [tab.selectedNodeLabel] : []);
  if (labels.length === 0) return;

  for (const nodeId of [...new Set(labels)]) {
    deleteVisualNode(nodeId, false);
  }
  syncVisualToCode();
  renderVisualEdgeList();
  deselectNode();
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
      selectedNodeLabels: t.selectedNodeLabels || [],
      visualNodes: t.visualNodes || [],
      visualEdges: t.visualEdges || [],
      visualDirection: t.visualDirection || 'TD',
      visualIdCounter: t.visualIdCounter || 0,
    })),
    activeTabId,
    tabCounter,
    editorMode,
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
      selectedNodeLabels: t.selectedNodeLabels || [],
      edgeMap: [],
      renderCounter: 0,
      visualNodes: t.visualNodes || [],
      visualEdges: t.visualEdges || [],
      visualDirection: t.visualDirection || 'TD',
      visualIdCounter: t.visualIdCounter || 0,
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

    // Restore editor mode
    if (state.editorMode) {
      setEditorMode(state.editorMode);
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

// --- Visual Editor: Mode Switching ---

function setEditorMode(mode) {
  editorMode = mode;
  if (mode === 'code') {
    modeCodeBtn.classList.add('active');
    modeVisualBtn.classList.remove('active');
    codePanel.classList.remove('hidden');
    visualPanel.classList.remove('active');
    exitConnectMode();
  } else {
    modeVisualBtn.classList.add('active');
    modeCodeBtn.classList.remove('active');
    codePanel.classList.add('hidden');
    visualPanel.classList.add('active');
    // Always re-parse current code to rebuild visual model
    // (code may have changed in code mode, or localStorage may be stale)
    const tab = getActiveTab();
    if (tab) {
      parseCodeToVisualModel(tab);
    }
    renderVisualNodeList();
    renderVisualEdgeList();
    // Sync direction select
    if (tab) visualDirectionSelect.value = tab.visualDirection || 'TD';
  }
  scheduleSave();
}

modeCodeBtn.addEventListener('click', () => setEditorMode('code'));
modeVisualBtn.addEventListener('click', () => setEditorMode('visual'));

// --- Visual Editor: Code Generation ---

function generateNodeSyntax(node) {
  const label = node.label;
  switch (node.type) {
    case 'process':    return `${node.id}[${label}]`;
    case 'decision':   return `${node.id}{${label}}`;
    case 'terminal':   return `${node.id}([${label}])`;
    case 'io':         return `${node.id}[/${label}/]`;
    case 'subroutine': return `${node.id}[[${label}]]`;
    case 'database':   return `${node.id}[(${label})]`;
    default:           return `${node.id}[${label}]`;
  }
}

function generateMermaidCode(tab) {
  if (!tab) return '';
  const dir = tab.visualDirection || 'TD';
  const lines = [`flowchart ${dir}`];

  // Define all nodes first
  for (const node of tab.visualNodes) {
    lines.push(`    ${generateNodeSyntax(node)}`);
  }

  // Then all edges
  for (const edge of tab.visualEdges) {
    if (edge.label) {
      lines.push(`    ${edge.from} -->|${edge.label}| ${edge.to}`);
    } else {
      lines.push(`    ${edge.from} --> ${edge.to}`);
    }
  }

  return lines.join('\n');
}

function syncVisualToCode() {
  const tab = getActiveTab();
  if (!tab) return;
  const code = generateMermaidCode(tab);
  tab.code = code;
  editor.value = code;
  // Graph structure changed — old position deltas are invalid for the new layout.
  tab.nodePositions.clear();
  renderDiagram(false);
  scheduleSave();
}

// --- Visual Editor: Parse Code to Visual Model ---

function parseCodeToVisualModel(tab) {
  const code = tab.code || '';
  const lines = code.split('\n');
  tab.visualNodes = [];
  tab.visualEdges = [];
  tab.visualIdCounter = 0;

  // Detect direction from first line
  const dirMatch = code.match(/flowchart\s+(TD|TB|BT|LR|RL)/i);
  if (dirMatch) {
    tab.visualDirection = dirMatch[1].toUpperCase();
    if (tab.visualDirection === 'TB') tab.visualDirection = 'TD';
  }

  const knownNodes = new Map(); // id -> {id, type, label}

  function detectNodeType(fullDef) {
    // Check shape syntax to determine type
    if (/^\w+\(\[.*\]\)/.test(fullDef)) return 'terminal';
    if (/^\w+\[\[.*\]\]/.test(fullDef)) return 'subroutine';
    if (/^\w+\[\(.*\)\]/.test(fullDef)) return 'database';
    if (/^\w+\[\/.*\/\]/.test(fullDef)) return 'io';
    if (/^\w+\{.*\}/.test(fullDef)) return 'decision';
    if (/^\w+\[.*\]/.test(fullDef)) return 'process';
    return 'process';
  }

  function extractLabel(fullDef) {
    let m;
    if ((m = fullDef.match(/^\w+\(\[(.*)\]\)/s))) return m[1];
    if ((m = fullDef.match(/^\w+\[\[(.*)\]\]/s))) return m[1];
    if ((m = fullDef.match(/^\w+\[\((.*)\)\]/s))) return m[1];
    if ((m = fullDef.match(/^\w+\[\/(.*?)\/\]/s))) return m[1];
    if ((m = fullDef.match(/^\w+\{(.*)\}/s))) return m[1];
    if ((m = fullDef.match(/^\w+\[(.*)\]/s))) return m[1];
    return fullDef;
  }

  function extractNodeId(def) {
    const m = def.match(/^(\w+)/);
    return m ? m[1] : def;
  }

  function ensureNode(def) {
    const id = extractNodeId(def);
    if (!knownNodes.has(id)) {
      const type = detectNodeType(def);
      const label = def === id ? id : extractLabel(def);
      const node = { id, type, label };
      knownNodes.set(id, node);
      tab.visualNodes.push(node);
    }
    return id;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^flowchart\s/i.test(trimmed) || /^%%/.test(trimmed)) continue;

    // Try to parse edge: A[...] --> B[...] or A -->|label| B
    // Complex regex to handle node definitions with brackets in edge lines
    const edgePattern = /^(.+?)\s*(-->|---|-\.-|==>)\s*(?:\|([^|]*)\|\s*)?(.+)$/;
    const edgeMatch = trimmed.match(edgePattern);

    if (edgeMatch) {
      const fromDef = edgeMatch[1].trim();
      const toDef = edgeMatch[4].trim();
      const edgeLabel = edgeMatch[3] ? edgeMatch[3].trim() : '';

      const fromId = ensureNode(fromDef);
      const toId = ensureNode(toDef);

      tab.visualEdges.push({ from: fromId, to: toId, label: edgeLabel });
    } else {
      // Standalone node definition
      ensureNode(trimmed);
    }
  }

  // Set visualIdCounter to avoid collisions
  let maxNum = 0;
  for (const node of tab.visualNodes) {
    const m = node.id.match(/^[A-Z]*(\d+)$/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
  }
  tab.visualIdCounter = maxNum;
}

// --- Visual Editor: Generate Unique Node ID ---

function nextNodeId(tab) {
  tab.visualIdCounter++;
  // Generate IDs like N1, N2, ... to avoid collisions with parsed IDs
  return `N${tab.visualIdCounter}`;
}

// --- Visual Editor: Toolbox Drag & Drop ---

let dragGhost = null;
let dragNodeType = null;

document.querySelectorAll('.toolbox-item').forEach((item) => {
  item.addEventListener('dragstart', (e) => {
    dragNodeType = item.dataset.nodeType;
    // Create ghost
    dragGhost = item.cloneNode(true);
    dragGhost.classList.add('drag-ghost');
    dragGhost.style.width = '80px';
    document.body.appendChild(dragGhost);
    e.dataTransfer.setDragImage(dragGhost, 40, 20);
    e.dataTransfer.setData('text/plain', dragNodeType);
    e.dataTransfer.effectAllowed = 'copy';
  });

  item.addEventListener('dragend', () => {
    if (dragGhost) {
      dragGhost.remove();
      dragGhost = null;
    }
    dragNodeType = null;
    canvasPanel.classList.remove('drop-hover');
  });
});

canvasPanel.addEventListener('dragover', (e) => {
  if (editorMode !== 'visual') return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  canvasPanel.classList.add('drop-hover');
});

canvasPanel.addEventListener('dragleave', (e) => {
  canvasPanel.classList.remove('drop-hover');
});

canvasPanel.addEventListener('drop', (e) => {
  e.preventDefault();
  canvasPanel.classList.remove('drop-hover');
  if (editorMode !== 'visual') return;

  const nodeType = e.dataTransfer.getData('text/plain');
  if (!nodeType) return;

  const tab = getActiveTab();
  if (!tab) return;

  const nodeId = nextNodeId(tab);
  const typeNames = {
    process: t('toolProcess'),
    decision: t('toolDecision'),
    terminal: t('toolTerminal'),
    io: t('toolIO'),
    subroutine: t('toolSubroutine'),
    database: t('toolDatabase'),
  };
  const label = `${typeNames[nodeType] || nodeType} ${tab.visualNodes.length + 1}`;

  tab.visualNodes.push({ id: nodeId, type: nodeType, label });

  syncVisualToCode();
  renderVisualNodeList();
  renderVisualEdgeList();
});

// --- Visual Editor: Node List ---

function renderVisualNodeList() {
  const tab = getActiveTab();
  if (!tab) { visualNodeList.innerHTML = ''; return; }

  visualNodeList.innerHTML = '';

  for (const node of tab.visualNodes) {
    const item = document.createElement('div');
    item.className = 'visual-node-item';

    const badge = document.createElement('span');
    badge.className = 'node-type-badge';
    const typeKeys = {
      process: 'toolProcess', decision: 'toolDecision', terminal: 'toolTerminal',
      io: 'toolIO', subroutine: 'toolSubroutine', database: 'toolDatabase'
    };
    badge.textContent = t(typeKeys[node.type] || 'toolProcess');
    item.appendChild(badge);

    const labelSpan = document.createElement('span');
    labelSpan.className = 'node-label-text';
    labelSpan.textContent = node.label;
    labelSpan.title = t('nodeEditPrompt');
    item.appendChild(labelSpan);

    // Double-click to rename
    labelSpan.addEventListener('dblclick', () => {
      labelSpan.contentEditable = 'true';
      labelSpan.focus();
      const range = document.createRange();
      range.selectNodeContents(labelSpan);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    labelSpan.addEventListener('blur', () => {
      labelSpan.contentEditable = 'false';
      const newLabel = labelSpan.textContent.trim();
      if (newLabel && newLabel !== node.label) {
        node.label = newLabel;
        syncVisualToCode();
      } else {
        labelSpan.textContent = node.label;
      }
    });

    labelSpan.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); labelSpan.blur(); }
    });

    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'node-delete-btn';
    deleteBtn.textContent = '\u00d7';
    deleteBtn.title = t('deleteNode');
    deleteBtn.addEventListener('click', () => {
      deleteVisualNode(node.id);
    });
    item.appendChild(deleteBtn);

    visualNodeList.appendChild(item);
  }
}

function deleteVisualNode(nodeId, sync = true) {
  const tab = getActiveTab();
  if (!tab) return;
  tab.visualNodes = tab.visualNodes.filter((n) => n.id !== nodeId);
  tab.visualEdges = tab.visualEdges.filter((e) => e.from !== nodeId && e.to !== nodeId);
  tab.selectedNodeLabels = (tab.selectedNodeLabels || []).filter((label) => label !== nodeId);
  if (tab.selectedNodeLabel === nodeId) {
    tab.selectedNodeLabel = tab.selectedNodeLabels[0] || null;
  }
  if (sync) syncVisualToCode();
  renderVisualNodeList();
  renderVisualEdgeList();
}

// --- Visual Editor: Edge List ---

const visualEdgeList = document.getElementById('visual-edge-list');

function renderVisualEdgeList() {
  const tab = getActiveTab();
  if (!tab) { visualEdgeList.innerHTML = ''; return; }

  visualEdgeList.innerHTML = '';

  tab.visualEdges.forEach((edge, idx) => {
    const item = document.createElement('div');
    item.className = 'visual-edge-item';

    // From node
    const fromSpan = document.createElement('span');
    fromSpan.className = 'edge-nodes';
    fromSpan.textContent = edge.from;
    item.appendChild(fromSpan);

    // Arrow
    const arrow = document.createElement('span');
    arrow.className = 'edge-arrow';
    arrow.textContent = ' → ';
    item.appendChild(arrow);

    // To node
    const toSpan = document.createElement('span');
    toSpan.className = 'edge-nodes';
    toSpan.textContent = edge.to;
    item.appendChild(toSpan);

    // Label (editable)
    const labelSpan = document.createElement('span');
    labelSpan.className = 'edge-label-text';
    labelSpan.textContent = edge.label || '';
    labelSpan.title = t('edgeLabelPlaceholder');
    item.appendChild(labelSpan);

    // Double-click to edit label
    labelSpan.addEventListener('dblclick', () => {
      labelSpan.contentEditable = 'true';
      labelSpan.focus();
      const range = document.createRange();
      range.selectNodeContents(labelSpan);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    labelSpan.addEventListener('blur', () => {
      labelSpan.contentEditable = 'false';
      const newLabel = labelSpan.textContent.trim();
      if (newLabel !== edge.label) {
        edge.label = newLabel;
        syncVisualToCode();
      }
    });

    labelSpan.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); labelSpan.blur(); }
    });

    // Delete button
    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'edge-delete-btn';
    deleteBtn.textContent = '\u00d7';
    deleteBtn.title = t('deleteEdge');
    deleteBtn.addEventListener('click', () => {
      tab.visualEdges.splice(idx, 1);
      syncVisualToCode();
      renderVisualEdgeList();
    });
    item.appendChild(deleteBtn);

    visualEdgeList.appendChild(item);
  });
}

// --- Visual Editor: Shift+Click Connection ---
// Shift+click node A → highlight as source → click node B → create edge
// Works through interact.js drag-end (small movement = click) path

let connectMode = false;
let connectSourceId = null;
let tempConnectionLine = null;

function exitConnectMode() {
  connectMode = false;
  connectSourceId = null;
  connectBar.classList.remove('active');
  if (tempConnectionLine) {
    tempConnectionLine.remove();
    tempConnectionLine = null;
  }
  canvas.querySelectorAll('.node.connect-source').forEach((n) => n.classList.remove('connect-source'));
  canvas.querySelectorAll('.node.connect-target').forEach((n) => n.classList.remove('connect-target'));
}

btnConnectCancel.addEventListener('click', exitConnectMode);

// Cancel connection with Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && connectMode) {
    exitConnectMode();
  }
});

// --- Visual Editor: Direction Change ---

visualDirectionSelect.addEventListener('change', () => {
  const tab = getActiveTab();
  if (!tab) return;
  tab.visualDirection = visualDirectionSelect.value;
  syncVisualToCode();
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
  // Ensure visual mode is initialized (parse code into visual model)
  if (editorMode === 'visual') {
    const tab = getActiveTab();
    if (tab) {
      parseCodeToVisualModel(tab);
      renderVisualNodeList();
      renderVisualEdgeList();
      if (tab) visualDirectionSelect.value = tab.visualDirection || 'TD';
    }
  }
});
