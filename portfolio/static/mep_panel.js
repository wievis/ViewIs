let currentTab = "3d";
const loadedModels = {};
let sheetIndexCache = { stamp: 0, data: null };
let currentActiveSheetName = "";
let visibleSheetsList = [];

Office.onReady(async () => {
  registerSelectionEvents();
  registerSheetListEvents();
  registerGlobalKeyEvents();
  await renderSheetButtons();
});

function toggleSheetsDrawer() {
  const d = document.getElementById("sheetsDrawer");
  if (d) d.classList.toggle("collapsed");
}

function handleTabClick(tabName, color, btn) {
  if (currentTab === tabName) return;
  currentTab = tabName;
  document.body.style.setProperty('--accent', color);
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('active');
    t.style.background = "#1e293b";
    t.style.color = "var(--subtext)";
  });
  document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  btn.style.background = color;
  btn.style.color = "#fff";
  const target = document.getElementById("tab-" + tabName);
  if (target) target.classList.add("active");
}

function autoDetectBranch(fileName) {
  const up = fileName.toUpperCase();
  if (up.includes("_SAN") || up.includes("SAN") || up.includes("PLUMB") || up.includes("DRAIN")) return "SAN";
  if (up.includes("_LFT") || up.includes("LFT") || up.includes("WENT") || up.includes("MECH") || up.includes("HVAC")) return "LFT";
  if (up.includes("_ARC") || up.includes("ARC") || up.includes("ARCH")) return "ARC";
  return null;
}

function onProjectFolderSelected(event) {
  const allFiles = Array.from(event.target.files);
  const ifcFiles = allFiles.filter(f => f.name.toLowerCase().endsWith(".ifc"));
  const jsonFiles = allFiles.filter(f => f.name.toLowerCase().endsWith(".json") && f.name.includes("system"));

  if (jsonFiles.length > 0) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        sendToViewer({
          type: "REGISTER_SYSTEM_DATA",
          members: parsed.members || {},
          details: parsed.details || {},
          duplicates: parsed.duplicates || {}
        });
      } catch(err){}
    };
    reader.readAsText(jsonFiles[0]);
  }

  const detected = [];
  ifcFiles.forEach(file => {
    let branch = autoDetectBranch(file.name);
    if (!branch) {
      if (!loadedModels["SAN"]) branch = "SAN";
      else if (!loadedModels["LFT"]) branch = "LFT";
      else branch = "ARC";
    }
    loadedModels[branch] = file;
    detected.push(`${branch}: ${file.name}`);
    const reader = new FileReader();
    reader.onload = (e) => {
      sendToViewer({
        type: "REGISTER_BRANCH_MODEL",
        branch: branch,
        filename: file.name,
        buffer: e.target.result
      });
    };
    reader.readAsArrayBuffer(file);
  });

  const jsonStatus = jsonFiles.length > 0 ? " | JSON: aktywny" : " | JSON: brak";
  const lbl = document.getElementById("models-status-label");
  if (lbl) lbl.textContent = (detected.join(" | ") || "Brak IFC") + jsonStatus;
}

function sendToViewer(msg) {
  const f = document.getElementById("viewerFrame");
  if (f && f.contentWindow) f.contentWindow.postMessage(msg, "*");
}

function getSheetTheme(name) {
  const s = String(name || "").toUpperCase();
  if (s.startsWith("SAN") || s.includes("RUR") || s.includes("WODA")) return { bg: "#0F766E", border: "#2DD4BF" };
  if (s.startsWith("LFT") || s.includes("WENTYL")) return { bg: "#1D4ED8", border: "#60A5FA" };
  if (s.startsWith("ARC")) return { bg: "#475569", border: "#CBD5E1" };
  return { bg: "#1E293B", border: "#475569" };
}

async function renderSheetButtons() {
  const list = document.getElementById("sheetsList");
  if (!list || typeof Excel === "undefined") return;
  try {
    await Excel.run(async (context) => {
      const sheets = context.workbook.worksheets;
      sheets.load(["items/name", "items/visibility"]);
      const active = context.workbook.worksheets.getActiveWorksheet();
      active.load("name");
      await context.sync();
      currentActiveSheetName = active.name;
      list.innerHTML = "";
      visibleSheetsList = sheets.items.filter(s => s.visibility === Excel.SheetVisibility.visible).map(s => s.name);
      sheets.items.filter(s => s.visibility === Excel.SheetVisibility.visible).forEach(s => {
        const t = getSheetTheme(s.name);
        const isActive = s.name === active.name;
        const btn = document.createElement("button");
        btn.textContent = s.name;
        btn.style.cssText = `background:${isActive ? '#fff' : t.bg};color:${isActive ? t.bg : '#fff'};border:1px solid ${t.border};padding:3px 8px;font-size:11px;border-radius:4px;cursor:pointer;white-space:nowrap;font-weight:${isActive ? '700':'400'};`;
        btn.onclick = () => switchWorksheet(s.name);
        list.appendChild(btn);
      });
    });
  } catch(e){}
}

async function switchWorksheet(name) {
  try {
    await Excel.run(async (context) => {
      context.workbook.worksheets.getItem(name).activate();
      await context.sync();
    });
    currentActiveSheetName = name;
    await renderSheetButtons();
    await handleSelectionChange();
  } catch(e){}
}

function registerSheetListEvents() {
  if (typeof Excel === "undefined") return;
  Excel.run(async (context) => {
    const sheets = context.workbook.worksheets;
    const refresh = async () => { 
      sheetIndexCache.data = null;
      await renderSheetButtons(); 
    };
    ["onAdded", "onDeleted", "onNameChanged"].forEach(n => {
      if (sheets[n]) sheets[n].add(refresh);
    });
    if (sheets.onActivated) sheets.onActivated.add(refresh);
    await context.sync();
  }).catch(()=>{});
}

function registerSelectionEvents() {
  if (typeof Excel === "undefined") return;
  Excel.run(async (context) => {
    context.workbook.onSelectionChanged.add(async () => {
      await handleSelectionChange();
    });
    await context.sync();
  }).catch(()=>{});
}

function registerGlobalKeyEvents() {
  window.addEventListener("keydown", (e) => {
    if (e.altKey && !e.ctrlKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      cycleVisibleSheets(e.key === "ArrowRight" ? 1 : -1);
    } else if (e.altKey && e.ctrlKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      sendToViewer({ type: "REQ_OCC_NAV", delta: e.key === "ArrowRight" ? 1 : -1 });
    } else if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      handleColNav(e.key === "ArrowRight" ? 1 : -1);
    }
  });
}

async function cycleVisibleSheets(delta) {
  if (visibleSheetsList.length <= 1) return;
  let idx = visibleSheetsList.indexOf(currentActiveSheetName);
  if (idx === -1) idx = 0;
  let nextIdx = (idx + delta + visibleSheetsList.length) % visibleSheetsList.length;
  await switchWorksheet(visibleSheetsList[nextIdx]);
}

async function handleColNav(delta) {
  if (typeof Excel === "undefined") return;
  try {
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = context.workbook.getSelectedRange();
      const used = sheet.getUsedRange();
      range.load(["rowIndex", "columnIndex"]);
      used.load(["columnCount"]);
      await context.sync();
      let targetCol = range.columnIndex + delta;
      if (targetCol < 0) targetCol = 0;
      if (targetCol >= used.columnCount) targetCol = used.columnCount - 1;
      sheet.getCell(range.rowIndex, targetCol).select();
      await context.sync();
      await handleSelectionChange();
    });
  } catch(err){}
}

async function buildSheetIndex() {
  const now = Date.now();
  if (sheetIndexCache.data && now - sheetIndexCache.stamp < 15000) return sheetIndexCache.data;
  const result = [];
  try {
    await Excel.run(async (context) => {
      const sheets = context.workbook.worksheets;
      sheets.load(["items/name", "items/visibility"]);
      await context.sync();
      const visible = sheets.items.filter(s => s.visibility === Excel.SheetVisibility.visible);
      const usedRanges = visible.map(s => {
        const u = s.getUsedRangeOrNullObject();
        u.load(["isNullObject", "values", "rowIndex"]);
        return u;
      });
      await context.sync();

      visible.forEach((s, idx) => {
        const u = usedRanges[idx];
        const set = new Set();
        result.push({ name: s.name, tokens: set, rowIndex: u.isNullObject ? 0 : u.rowIndex });
        if (u.isNullObject || !u.values) return;
        u.values.forEach(row => {
          row.forEach(cell => {
            const str = String(cell || "").trim();
            if (str) {
              str.split(/[\s,;|]+/).forEach(tok => {
                if (tok && tok.length >= 6) set.add(tok);
              });
            }
          });
        });
      });
    });
  } catch(e){}
  sheetIndexCache = { stamp: now, data: result };
  return result;
}

async function publishOccurrences(tokens) {
  if (!tokens || tokens.length === 0) {
    sendToViewer({ type: "SET_OCCURRENCES", occurrences: [], activeSheet: currentActiveSheetName });
    return;
  }
  const index = await buildSheetIndex();
  const occurrences = [];
  index.forEach(entry => {
    if (tokens.some(t => entry.tokens.has(t))) {
      occurrences.push(entry.name);
    }
  });
  sendToViewer({
    type: "SET_OCCURRENCES",
    occurrences: occurrences,
    activeSheet: currentActiveSheetName
  });
}

async function handleSelectionChange() {
  if (typeof Excel === "undefined") return;
  try {
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = context.workbook.getSelectedRange();
      const used = sheet.getUsedRange();
      sheet.load("name");
      range.load(["rowIndex", "columnIndex"]);
      used.load(["values", "rowCount", "columnCount"]);
      await context.sync();

      currentActiveSheetName = sheet.name;
      const totalRows = used.rowCount;
      const rIdx = range.rowIndex;
      const cIdx = range.columnIndex;

      let headerIdx = 0;
      for (let r = 0; r < Math.min(10, totalRows); r++) {
        const row = used.values[r] || [];
        if (row.some(v => /row_key|kondygnacja|system|klasa|lp\./i.test(String(v || "")))) {
          headerIdx = r;
          break;
        }
      }
      if (rIdx <= headerIdx || rIdx >= totalRows) return;

      const headers = (used.values[headerIdx] || []).map(h => String(h || "").trim());
      const rowVals = used.values[rIdx] || [];
      const rowData = {};
      headers.forEach((h, i) => { rowData[h] = rowVals[i]; });

      sendToViewer({
        type: "ROW_INFO",
        row: rIdx - headerIdx,
        total: totalRows - headerIdx - 1
      });

      let detectedBranch = "SAN";
      const upSheet = sheet.name.toUpperCase();
      if (upSheet.includes("LFT") || upSheet.includes("WENTYL")) detectedBranch = "LFT";
      else if (upSheet.includes("ARC") || upSheet.includes("ŚCIAN") || upSheet.includes("STROP")) detectedBranch = "ARC";

      let rowKeys = [];
      const rkIdx = headers.indexOf("Row_Key");
      if (rkIdx >= 0 && rowVals[rkIdx]) {
        rowKeys = String(rowVals[rkIdx]).trim().split(/[\s,;|]+/).filter(Boolean);
      } else {
        for (let v of rowVals) {
          const s = String(v || "").trim();
          if (/^[A-Z0-9]{3,4}-[A-F0-9]{6,}/i.test(s)) {
            rowKeys = s.split(/[\s,;|]+/).filter(Boolean);
            break;
          }
        }
      }

      let guids = [];
      const isBilans = upSheet.includes("BILANS") || upSheet.includes("AUDYT");
      const clickedHeader = String(headers[cIdx] || "").toLowerCase();
      const normH = headers.map(h => h.toLowerCase().replace(/[\s_]+/g, ""));
      const dupIdx = normH.indexOf("globalidduplikaty");
      const pomIdx = normH.indexOf("globalidpominiete");
      const rapIdx = normH.indexOf("globalidraport");
      const allIdx = normH.indexOf("globalid");

      if (isBilans || clickedHeader.includes("błąd") || clickedHeader.includes("blad") || clickedHeader.includes("pomini") || clickedHeader.includes("odrzucon") || clickedHeader.includes("duplikat")) {
        let targetVal = "";
        if (clickedHeader.includes("pomini") || clickedHeader.includes("odrzucone") || clickedHeader.includes("błąd") || clickedHeader.includes("blad") || clickedHeader.includes("duplikat")) {
          targetVal = (dupIdx >= 0 && rowVals[dupIdx]) ? rowVals[dupIdx] : (pomIdx >= 0 ? rowVals[pomIdx] : "");
        } else if (clickedHeader.includes("rapor")) {
          targetVal = rapIdx >= 0 ? rowVals[rapIdx] : "";
        } else {
          targetVal = (dupIdx >= 0 && rowVals[dupIdx]) ? rowVals[dupIdx] : (pomIdx >= 0 && rowVals[pomIdx] ? rowVals[pomIdx] : (rapIdx >= 0 ? rowVals[rapIdx] : (allIdx >= 0 ? rowVals[allIdx] : "")));
        }
        if (targetVal) {
          guids = String(targetVal).trim().split(/[\s,;|]+/).filter(Boolean);
        }
      } else {
        headers.forEach((h, i) => {
          const hLow = h.toLowerCase();
          if (hLow.includes("globalid") || hLow === "guid") {
            const val = String(rowVals[i] || "").trim();
            if (val) {
              val.split(/[\s,;|]+/).forEach(g => {
                if (g && g.length >= 16 && !guids.includes(g)) guids.push(g);
              });
            }
          }
        });
      }

      const lookupTokens = [...guids, ...rowKeys].filter(Boolean);
      await publishOccurrences(lookupTokens);

      sendToViewer({
        type: "SWITCH_AND_FOCUS_GROUP",
        branch: detectedBranch,
        rowKey: rowKeys[0] || `ROW_${rIdx}`,
        rowKeys: rowKeys,
        guids: guids,
        rowData: rowData,
        sheetName: sheet.name,
        isBilans: isBilans
      });
    });
  } catch(e){}
}

window.addEventListener("message", async (e) => {
  const d = e.data;
  if (!d) return;

  if (d.type === "ROW_NAV" && typeof Excel !== "undefined") {
    try {
      await Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const range = context.workbook.getSelectedRange();
        const used = sheet.getUsedRange();
        range.load(["rowIndex", "columnIndex"]);
        used.load(["rowCount"]);
        await context.sync();
        let targetRow = range.rowIndex + d.delta;
        if (targetRow < 1) targetRow = 1;
        if (targetRow >= used.rowCount) targetRow = used.rowCount - 1;
        sheet.getCell(targetRow, range.columnIndex).select();
        await context.sync();
        await handleSelectionChange();
      });
    } catch(err){}
  } else if (d.type === "COL_NAV") {
    await handleColNav(d.delta);
  } else if (d.type === "SHEET_CYCLE") {
    await cycleVisibleSheets(d.delta);
  } else if (d.type === "OCC_NAV") {
    const list = d.occurrences || [];
    if (list.length > 1 && typeof Excel !== "undefined") {
      let idx = list.indexOf(currentActiveSheetName);
      if (idx === -1) idx = 0;
      let nextIdx = (idx + d.delta + list.length) % list.length;
      await switchWorksheet(list[nextIdx]);
    }
  } else if (d.type === "JUMP_TO_SHEET" && d.sheetName) {
    await switchWorksheet(d.sheetName);
  } else if (d.type === "VIEWER_PICK_GUID" && d.guid && typeof Excel !== "undefined") {
    try {
      await Excel.run(async (context) => {
        const sheet = context.workbook.worksheets.getActiveWorksheet();
        const used = sheet.getUsedRange();
        used.load(["values", "rowIndex"]);
        await context.sync();
        const vals = used.values;
        for (let r = 0; r < vals.length; r++) {
          if (vals[r].some(cell => String(cell || "").includes(d.guid))) {
            sheet.getCell(used.rowIndex + r, 0).select();
            await context.sync();
            break;
          }
        }
      });
    } catch(err){}
  }
});
