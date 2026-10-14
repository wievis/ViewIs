import * as WebIFC from "https://unpkg.com/web-ifc@0.0.57/web-ifc-api.js";

let scene, camera, renderer, controls;
let ifcApi = null;
const branchModels = {};
let currentActiveBranch = null;

let allMeshes = [];
let elementMeshesMap = new Map();
let elementMetadataMap = new Map();
let elementStoreyMap = new Map();
let elementDiamsMap = new Map();

let currentGroupExpressIDs = [];
let currentGroupIndex = 0;
let currentGroupInfo = null;
let currentOccurrences = [];
let currentActiveSheetName = "";
let isWireframeMode = false;
let targetBoxHelper = null;
let externalMembersMap = {};
let externalDetailsMap = {};

const activeHighlightMat = new THREE.MeshLambertMaterial({ color: 0xff4500, emissive: 0xd63000, side: THREE.DoubleSide });
const groupHighlightMat = new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0x5a4a00, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
const ghostWireMat = new THREE.MeshBasicMaterial({ color: 0x334155, wireframe: true, transparent: true, opacity: 0.12 });
const ghostSolidMat = new THREE.MeshLambertMaterial({ color: 0x475569, transparent: true, opacity: 0.08, depthWrite: false });

init();

function setStatus(text, color = "#94a3b8") {
  const el = document.getElementById("status-badge");
  if (el) { el.innerText = text; el.style.color = color; }
}

function init() {
  const container = document.getElementById("canvas-container");
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1120);

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.05, 5000);
  camera.position.set(30, 35, 45);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.enableKeys = false;

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
  dirLight.position.set(60, 100, 60);
  scene.add(dirLight);

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  dirLight2.position.set(-60, -80, -60);
  scene.add(dirLight2);

  targetBoxHelper = new THREE.BoxHelper(new THREE.Mesh(new THREE.BufferGeometry()), 0xff4500);
  targetBoxHelper.visible = false;
  targetBoxHelper.material.depthTest = false;
  targetBoxHelper.renderOrder = 9999;
  scene.add(targetBoxHelper);

  window.addEventListener("resize", onResize);
  setupClickEvents();
  setupKeyboardEvents();
  animate();
  initWasm();
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

async function initWasm() {
  try {
    ifcApi = new WebIFC.IfcAPI();
    ifcApi.SetWasmPath("https://unpkg.com/web-ifc@0.0.57/", true);
    await ifcApi.Init();
    setStatus("Silnik 3D gotowy");
  } catch(e) {
    setStatus("Błąd WASM: " + e.message, "#f87171");
  }
}

async function registerBranchModel(branch, filename, buffer) {
  if (!ifcApi) await initWasm();
  setStatus(`Parsowanie [${branch}] ${filename}...`);
  try {
    const data = new Uint8Array(buffer);
    const modelID = ifcApi.OpenModel(data);
    branchModels[branch] = { modelID, filename };
    setStatus(`Załadowano model: ${filename}`, "#4ade80");
    if (!currentActiveBranch) {
      await switchActiveBranch(branch);
    }
  } catch(e) {
    setStatus(`Błąd modelu ${branch}: ${e.message}`, "#f87171");
  }
}

async function switchActiveBranch(branch) {
  if (!branchModels[branch]) return;
  currentActiveBranch = branch;
  const modelID = branchModels[branch].modelID;

  const oldGroup = scene.getObjectByName("ifcModelGroup");
  if (oldGroup) scene.remove(oldGroup);

  allMeshes = [];
  elementMeshesMap.clear();
  elementMetadataMap.clear();
  elementStoreyMap.clear();
  elementDiamsMap.clear();

  try {
    const storeys = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCBUILDINGSTOREY);
    const storeyNameMap = new Map();
    for (let i = 0; i < storeys.size(); i++) {
      const sId = storeys.get(i);
      const sLine = ifcApi.GetLine(modelID, sId);
      const sName = (sLine && sLine.Name && (sLine.Name.value || sLine.Name)) || "";
      storeyNameMap.set(sId, sName);
    }

    const rels = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE);
    for (let i = 0; i < rels.size(); i++) {
      const rId = rels.get(i);
      const rLine = ifcApi.GetLine(modelID, rId);
      const sId = rLine && rLine.RelatingStructure && rLine.RelatingStructure.value;
      const sName = storeyNameMap.get(sId) || "";
      if (rLine && rLine.RelatedElements) {
        for (let elRef of rLine.RelatedElements) {
          const elId = elRef.value || elRef;
          elementStoreyMap.set(elId, sName);
        }
      }
    }
  } catch(e){}

  const group = new THREE.Group();
  group.name = "ifcModelGroup";

  ifcApi.StreamAllMeshes(modelID, (flatMesh) => {
    const expressID = flatMesh.expressID;
    const placedGeometries = flatMesh.geometries;
    const meshList = [];

    for (let i = 0; i < placedGeometries.size(); i++) {
      const placed = placedGeometries.get(i);
      const geom = ifcApi.GetGeometry(modelID, placed.geometryExpressID);
      const vData = ifcApi.GetVertexArray(geom.GetVertexData(), geom.GetVertexDataSize());
      const iData = ifcApi.GetIndexArray(geom.GetIndexData(), geom.GetIndexDataSize());

      const bufferGeom = new THREE.BufferGeometry();
      const pos = [], norms = [];
      for (let k = 0; k < vData.length; k += 6) {
        pos.push(vData[k], vData[k+1], vData[k+2]);
        norms.push(vData[k+3], vData[k+4], vData[k+5]);
      }
      bufferGeom.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      bufferGeom.setAttribute("normal", new THREE.Float32BufferAttribute(norms, 3));
      bufferGeom.setIndex(Array.from(iData));
      bufferGeom.computeBoundingBox();

      const mat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(placed.color.x, placed.color.y, placed.color.z),
        transparent: placed.color.w < 0.99,
        opacity: Math.max(placed.color.w, 0.4),
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(bufferGeom, mat);
      mesh.applyMatrix4(new THREE.Matrix4().fromArray(placed.flatTransformation));
      mesh.userData = { expressID: expressID, originalMat: mat };
      allMeshes.push(mesh);
      meshList.push(mesh);
      group.add(mesh);
    }
    if (meshList.length > 0) {
      elementMeshesMap.set(expressID, meshList);
      try {
        const line = ifcApi.GetLine(modelID, expressID);
        elementMetadataMap.set(expressID, line);

        const b = new THREE.Box3();
        meshList.forEach(m => b.expandByObject(m));
        const sz = b.getSize(new THREE.Vector3());
        const dims = [sz.x, sz.y, sz.z].sort((a,b) => a - b);
        const approxDiamMm = Math.round(((dims[0] + dims[1]) / 2) * 1000);
        elementDiamsMap.set(expressID, approxDiamMm);
      } catch(e){}
    }
  });

  scene.add(group);
  zoomToFit(group);
}

function zoomToFit(object) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  camera.position.set(center.x + maxDim, center.y + maxDim * 0.8, center.z + maxDim);
  controls.target.copy(center);
  controls.update();
}

function resetView() {
  allMeshes.forEach(m => m.material = m.userData.originalMat);
  targetBoxHelper.visible = false;
  document.getElementById("info-card").style.display = "none";
  const nav = document.getElementById("nav-arrows");
  if (nav) nav.style.display = "none";
}

function toggleGhostMode() {
  isWireframeMode = !isWireframeMode;
  renderFocusHighlights();
}

function cleanStr(v) {
  return String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function focusGroup(data) {
  const targetBranch = data.branch || "SAN";
  if (branchModels[targetBranch] && currentActiveBranch !== targetBranch) {
    await switchActiveBranch(targetBranch);
  }
  if (!currentActiveBranch || !branchModels[currentActiveBranch]) return;
  const modelID = branchModels[currentActiveBranch].modelID;

  let matchedExpressIDs = [];
  const targetKeys = (data.rowKeys && data.rowKeys.length > 0) ? data.rowKeys : [data.rowKey].filter(Boolean);

  for (let rk of targetKeys) {
    const cleanKey = String(rk).trim();
    const cleanKeyBase = cleanKey.replace(/-\d+\$/, "");
    const guidsFromMembers = externalMembersMap[cleanKey] || externalMembersMap[cleanKeyBase] || [];
    if (guidsFromMembers.length > 0) {
      const guidSet = new Set(guidsFromMembers);
      for (let [expId, line] of elementMetadataMap.entries()) {
        const g = (line && line.GlobalId && (line.GlobalId.value || line.GlobalId)) || "";
        if (guidSet.has(g)) matchedExpressIDs.push(expId);
      }
    }
  }

  if (matchedExpressIDs.length === 0 && data.guids && data.guids.length > 0) {
    const guidSet = new Set(data.guids);
    for (let [expId, line] of elementMetadataMap.entries()) {
      const g = (line && line.GlobalId && (line.GlobalId.value || line.GlobalId)) || "";
      if (guidSet.has(g)) matchedExpressIDs.push(expId);
    }
  }

  if (matchedExpressIDs.length === 0 && data.rowData) {
    const row = data.rowData;
    const storeyRaw = cleanStr(row["Kondygnacja"] || "");
    const storeyNum = (storeyRaw.match(/[-+]?\d+/) || [""])[0];

    const typeStr = cleanStr(row["Rodzaj"] || row["Opis"] || row["Opis pozycji katalogowej"] || "");
    const dimRaw = String(row["Średnica katalogowa"] || row["Srednica_Katalogowa"] || row["Średnica / wymiar"] || row["Srednica_Wymiar"] || row["Przekrój [mm]"] || row["Przekroj_mm"] || "");
    const dimNums = (dimRaw.match(/\d+/g) || []).map(Number);
    const angleStr = cleanStr(row["Kąt"] || row["Kat"] || "");
    const angleNum = (angleStr.match(/\d+/) || [""])[0];

    const candidates = [];

    for (let [expId, line] of elementMetadataMap.entries()) {
      const elemStorey = cleanStr(elementStoreyMap.get(expId) || "");
      if (storeyNum && elemStorey) {
        const elemStoreyNum = (elemStorey.match(/[-+]?\d+/) || [""])[0];
        if (elemStoreyNum && elemStoreyNum !== storeyNum) continue;
      }

      const name = cleanStr(line && line.Name && (line.Name.value || line.Name));
      const objType = cleanStr(line && line.ObjectType && (line.ObjectType.value || line.ObjectType));
      const blob = name + objType;

      let score = 0;
      if (typeStr && (blob.includes(typeStr) || (typeStr.includes("kolan") && (blob.includes("bogen") || blob.includes("elbow"))) || (typeStr.includes("trojnik") && (blob.includes("abzweig") || blob.includes("tee"))))) {
        score += 3;
      }

      const approxMm = elementDiamsMap.get(expId) || 0;
      if (dimNums.length > 0) {
        const targetNom = dimNums[0];
        const hasTextMatch = dimNums.some(n => blob.includes(String(n)));
        const hasGeomMatch = (approxMm > 0 && Math.abs(approxMm - targetNom) <= 15);
        if (hasTextMatch || hasGeomMatch) score += 3;
      }

      if (angleNum && blob.includes(angleNum)) {
        score += 2;
      }

      if (score >= 2) {
        candidates.push({ expId, score });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    if (candidates.length > 0) {
      const maxScore = candidates[0].score;
      matchedExpressIDs = candidates.filter(c => c.score === maxScore).map(c => c.expId);
    }
  }

  currentGroupExpressIDs = Array.from(new Set(matchedExpressIDs));
  currentGroupIndex = 0;
  currentGroupInfo = data.rowData || {};
  renderFocusHighlights(data.isBilans);
}

function renderFocusHighlights(isBilans = false) {
  allMeshes.forEach(m => {
    m.material = isWireframeMode ? ghostWireMat : ghostSolidMat;
  });

  const nav = document.getElementById("nav-arrows");
  if (currentGroupExpressIDs.length === 0) {
    if (nav) nav.style.display = "none";
    showInfoCard(null, isBilans);
    return;
  }

  if (nav) {
    nav.style.display = "flex";
    document.getElementById("nav-counter").innerText = `${currentGroupIndex + 1} / ${currentGroupExpressIDs.length}`;
  }

  const activeEid = currentGroupExpressIDs[currentGroupIndex];
  const activeMeshes = elementMeshesMap.get(activeEid) || [];

  currentGroupExpressIDs.forEach(eid => {
    if (eid !== activeEid) {
      (elementMeshesMap.get(eid) || []).forEach(m => m.material = groupHighlightMat);
    }
  });

  activeMeshes.forEach(m => m.material = activeHighlightMat);

  const focusBox = new THREE.Box3();
  if (activeMeshes.length > 0) {
    activeMeshes.forEach(m => focusBox.expandByObject(m));
  } else if (currentGroupExpressIDs.length > 0) {
    currentGroupExpressIDs.forEach(eid => {
      (elementMeshesMap.get(eid) || []).forEach(m => focusBox.expandByObject(m));
    });
  }

  if (!focusBox.isEmpty()) {
    targetBoxHelper.setFromObject(activeMeshes[0] || allMeshes[0]);
    targetBoxHelper.box = focusBox;
    targetBoxHelper.visible = true;

    const center = focusBox.getCenter(new THREE.Vector3());
    const size = focusBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.4);

    const viewDir = new THREE.Vector3().subVectors(camera.position, controls.target);
    if (viewDir.lengthSq() < 0.0001) viewDir.set(1, 0.8, 1);
    viewDir.normalize();

    controls.target.copy(center);
    camera.position.copy(center).addScaledVector(viewDir, Math.max(maxDim * 2.0, 1.2));
    controls.update();
  }

  showInfoCard(activeEid, isBilans);
}

function showInfoCard(eid, isBilans = false) {
  const card = document.getElementById("info-card");
  if (!card) return;
  card.style.display = "block";
  const row = currentGroupInfo || {};

  const filteredEntries = Object.entries(row).filter(([k,v]) => {
    if (v === undefined || v === null || String(v).trim() === "") return false;
    const kLow = k.toLowerCase();
    if (kLow.startsWith("_") || kLow === "row_key") return false;
    if (kLow.includes("globalid") || kLow === "guid") return false;
    if (kLow.includes("klasa") || kLow === "id obiektu") return false;
    if (kLow.includes("pomini") && (v === "-" || v === "0" || v === "0 szt.")) return false;
    return true;
  });

  let body = filteredEntries.map(([k,v]) => `${k}: <strong>${v}</strong>`).join("<br>");

  if (currentOccurrences && currentOccurrences.length > 0) {
    body += `<div style="margin-top:6px;padding-top:4px;border-top:1px solid #334155;font-size:10px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">`;
    body += `<span style="color:#94a3b8;">Występuje w:</span>`;
    currentOccurrences.forEach(sheetName => {
      const isAct = sheetName === currentActiveSheetName;
      body += `<button onclick="window.parent.postMessage({type:'JUMP_TO_SHEET',sheetName:'${sheetName}'},'*')" style="background:${isAct ? '#ffffff' : '#1e293b'};color:${isAct ? '#0f172a' : '#38bdf8'};font-weight:${isAct ? '700' : '400'};border:1px solid ${isAct ? '#ffffff' : '#475569'};padding:2px 6px;border-radius:3px;font-size:9.5px;cursor:pointer;">${sheetName}</button>`;
    });
    body += `</div>`;
  }

  card.innerHTML = body;
}

function nextElement() {
  if (currentGroupExpressIDs.length === 0) return;
  currentGroupIndex = (currentGroupIndex + 1) % currentGroupExpressIDs.length;
  renderFocusHighlights();
}

function prevElement() {
  if (currentGroupExpressIDs.length === 0) return;
  currentGroupIndex = (currentGroupIndex - 1 + currentGroupExpressIDs.length) % currentGroupExpressIDs.length;
  renderFocusHighlights();
}

function rowNav(delta) {
  window.parent.postMessage({ type: "ROW_NAV", delta: delta }, "*");
}

function colNav(delta) {
  window.parent.postMessage({ type: "COL_NAV", delta: delta }, "*");
}

function occNav(delta) {
  window.parent.postMessage({ type: "OCC_NAV", delta: delta, occurrences: currentOccurrences }, "*");
}

function sheetCycle(delta) {
  window.parent.postMessage({ type: "SHEET_CYCLE", delta: delta }, "*");
}

function setupKeyboardEvents() {
  window.focus();
  document.addEventListener("pointerdown", () => {
    window.focus();
  });

  window.addEventListener("keydown", (e) => {
    if (e.altKey && !e.ctrlKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      e.stopPropagation();
      sheetCycle(e.key === "ArrowRight" ? 1 : -1);
      return;
    }
    if (e.altKey && e.ctrlKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      e.stopPropagation();
      occNav(e.key === "ArrowRight" ? 1 : -1);
      return;
    }
    if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      e.stopPropagation();
      colNav(e.key === "ArrowRight" ? 1 : -1);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      nextElement();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevElement();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      rowNav(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      rowNav(1);
    }
  }, true);
}

function setupClickEvents() {
  renderer.domElement.addEventListener("click", (e) => {
    if (!e.ctrlKey) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(allMeshes, false);
    if (hits.length === 0 || !currentActiveBranch) return;

    const hitMesh = hits[0].object;
    const eid = hitMesh.userData.expressID;
    const line = elementMetadataMap.get(eid);
    const guid = (line && line.GlobalId && (line.GlobalId.value || line.GlobalId)) || "";

    currentGroupExpressIDs = [eid];
    currentGroupIndex = 0;
    renderFocusHighlights();

    if (guid) {
      window.parent.postMessage({ type: "VIEWER_PICK_GUID", guid: guid }, "*");
    }
  });
}

window.nextElement = nextElement;
window.prevElement = prevElement;
window.rowNav = rowNav;
window.resetView = resetView;
window.toggleGhostMode = toggleGhostMode;

window.addEventListener("message", async (e) => {
  const d = e.data;
  if (!d) return;
  if (d.type === "REGISTER_BRANCH_MODEL") {
    await registerBranchModel(d.branch, d.filename, d.buffer);
  } else if (d.type === "REGISTER_SYSTEM_DATA") {
    externalMembersMap = d.members || {};
    externalDetailsMap = d.details || {};
  } else if (d.type === "SWITCH_AND_FOCUS_GROUP") {
    await focusGroup(d);
  } else if (d.type === "SET_OCCURRENCES") {
    currentOccurrences = d.occurrences || [];
    currentActiveSheetName = d.activeSheet || "";
    showInfoCard(currentGroupExpressIDs[currentGroupIndex] || null);
  } else if (d.type === "ROW_INFO") {
    const lbl = document.getElementById("row-label");
    if (lbl) lbl.innerText = `RZĄD: ${d.row} / ${d.total}`;
  } else if (d.type === "REQ_OCC_NAV") {
    occNav(d.delta);
  } else if (d.type === "REQ_COL_NAV") {
    colNav(d.delta);
  }
});
