function onLocalIfcSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  const infoEl = document.getElementById("model-info");
  if (infoEl) infoEl.textContent = " · " + file.name;

  const reader = new FileReader();
  reader.onload = function(e) {
    const buffer = e.target.result;
    const frame = document.getElementById("viewer-frame");
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({
        type: "LOAD_LOCAL_BUFFER",
        buffer: buffer,
        filename: file.name
      }, "*");
    }
  };
  reader.readAsArrayBuffer(file);
}

Office.onReady(() => {
  if (typeof Excel === "undefined") return;
  Excel.run(async (context) => {
    context.workbook.onSelectionChanged.add(async () => {
      await handleSelectionChange();
    });
    await context.sync();
  }).catch(() => {});
});

async function handleSelectionChange() {
  try {
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = context.workbook.getSelectedRange();
      const used = sheet.getUsedRange();

      range.load(["rowIndex", "columnIndex"]);
      used.load(["values", "rowCount"]);
      await context.sync();

      if (range.rowIndex <= 0 || range.rowIndex >= used.rowCount) return;

      const headers = (used.values[0] || []).map(h => String(h || "").trim());
      const rowVals = used.values[range.rowIndex] || [];

      let guid = "";
      const guidIdx = headers.indexOf("GlobalId");
      if (guidIdx >= 0 && rowVals[guidIdx]) {
        guid = String(rowVals[guidIdx]).trim();
      }

      let rowKey = "";
      const rkIdx = headers.indexOf("Row_Key");
      if (rkIdx >= 0 && rowVals[rkIdx]) {
        rowKey = String(rowVals[rkIdx]).trim();
      } else {
        for (let i = 0; i < rowVals.length; i++) {
          const v = String(rowVals[i] || "").trim();
          if (/^[A-Z0-9]{3,4}-[A-F0-9]{6,}/i.test(v)) {
            rowKey = v;
            break;
          }
        }
      }

      const frame = document.getElementById("viewer-frame");
      if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({
          type: "EXCEL_SELECTION",
          guid: guid,
          rowKey: rowKey,
          rowVals: rowVals
        }, "*");
      }
    });
  } catch (e) {}
}
