let currentTab = "ilosci";
const loadedModels = {};

Office.onReady(async () => {
  registerSelectionEvents();
  registerSheetListEvents();
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

function processFileList(files) {
  const ifcFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith(".ifc"));
  if (ifcFiles.length === 0) {
    alert("W wybranym folderze nie ma plików .ifc");
    return;
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
  const lbl = document.getElementById("models-status-label");
  if (lbl) lbl.textContent = detected.join(" | ");
}

function onIfcFolderSelected(event) {
  processFileList(event.target.files);
}

function onIfcFilesSelected(event) {
  processFileList(event.target.files);
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
      list.innerHTML = "";
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
    await renderSheetButtons();
    await handleSelectionChange();
  } catch(e){}
}

function registerSheetListEvents() {
  if (typeof Excel === "undefined") return;
  Excel.run(async (context) => {
    const sheets = context.workbook.worksheets;
    const refresh = async () => { await renderSheetButtons(); };
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

async function handleSelectionChange() {
  if (typeof Excel === "undefined") return;
  try {
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = context.workbook.getSelectedRange();
      const used = sheet.getUsedRange();
      sheet.load("name");
      range.load(["rowIndex", "columnIndex"]);
      used.load(["values", "rowCount"]);
      await context.sync();

      const totalRows = used.rowCount;
      const rIdx = range.rowIndex;
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

      let rowKey = "";
      const rkIdx = headers.indexOf("Row_Key");
      if (rkIdx >= 0 && rowVals[rkIdx]) rowKey = String(rowVals[rkIdx]).trim();
      else {
        for (let v of rowVals) {
          const s = String(v || "").trim();
          if (/^[A-Z0-9]{3,4}-[A-F0-9]{6,}/i.test(s)) { rowKey = s; break; }
        }
      }

      let guids = [];
      const gIdx = headers.indexOf("GlobalId");
      if (gIdx >= 0 && rowVals[gIdx]) {
        guids = String(rowVals[gIdx]).trim().split(/[\s,;|]+/).filter(Boolean);
      }

      sendToViewer({
        type: "SWITCH_AND_FOCUS_GROUP",
        branch: detectedBranch,
        rowKey: rowKey || `ROW_${rIdx}`,
        guids: guids,
        rowData: rowData,
        sheetName: sheet.name
      });
    });
  } catch(e){}
}

window.addEventListener("message", async (e) => {
  const d = e.data;
  if (!d) return;
  if (d.type === "VIEWER_PICK_GUID" && d.guid && typeof Excel !== "undefined") {
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
