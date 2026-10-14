import * as WebIFC from "https://unpkg.com/web-ifc@0.0.57/web-ifc-api.js";

let scene, camera, renderer, controls;
let ifcApi = null;
const branchModels = {};
let currentActiveBranch = null;

let allMeshes = [];
let elementMeshesMap = new Map();
let currentHighlightedMeshes = [];
let currentGroupExpressIDs = [];
let currentGroupIndex = 0;
let currentGroupInfo = null;
let isWireframeMode = false;
let targetBoxHelper = null;

const activeHighlightMat = new THREE.MeshLambertMaterial({ color: 0xf97316, emissive: 0xc2410c });
const groupHighlightMat = new THREE.MeshLambertMaterial({ color: 0xfacc15, transparent: true, opacity: 0.5 });
const ghostWireMat = new THREE.MeshBasicMaterial({ color: 0x334155, wireframe: true, transparent: true, opacity: 0.3 });
const ghostSolidMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.15 });

init();

function setStatus(text, color = "#94a3b8") {
  const el = document.getElementById("status-badge");
  if (el) { el.innerText = text; el.style.color = color; }
}

function init() {
  const container = document.getElementById("canvas-container");
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1120);

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(30, 35, 45);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(60, 100, 60);
  scene.add(dirLight);

  targetBoxHelper = new THREE.BoxHelper(new THREE.Mesh(new THREE.BufferGeometry()), 0xfacc15);
  targetBoxHelper.visible = false;
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
    if (meshList.length > 0) elementMeshesMap.set(expressID, meshList);
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
  currentHighlightedMeshes = [];
  document.getElementById("info-card").style.display = "none";
  const nav = document.getElementById("nav-arrows");
  if (nav) nav.style.display = "none";
}

function toggleGhostMode() {
  isWireframeMode = !isWireframeMode;
  renderFocusHighlights();
}

function getExpressIdByGuid(modelID, targetGuid) {
  for (let expId of elementMeshesMap.keys()) {
    try {
      const line = ifcApi.GetLine(modelID, expId);
      const g = (line && line.GlobalId && (line.GlobalId.value || line.GlobalId)) || "";
      if (g === targetGuid) return expId;
    } catch(e){}
  }
  return null;
}

async function focusGroup(data) {
  const targetBranch = data.branch || "SAN";
  if (branchModels[targetBranch] && currentActiveBranch !== targetBranch) {
    await switchActiveBranch(targetBranch);
  }
  if (!currentActiveBranch || !branchModels[currentActiveBranch]) return;
  const modelID = branchModels[currentActiveBranch].modelID;

  let matchedExpressIDs = [];
  if (data.guids && data.guids.length > 0) {
    data.guids.forEach(g => {
      const eid = getExpressIdByGuid(modelID, g);
      if (eid !== null) matchedExpressIDs.push(eid);
    });
  }

  currentGroupExpressIDs = matchedExpressIDs;
  currentGroupIndex = 0;
  currentGroupInfo = data.rowData || {};
  renderFocusHighlights();
}

function renderFocusHighlights() {
  allMeshes.forEach(m => {
    m.material = isWireframeMode ? ghostWireMat : ghostSolidMat;
  });

  const nav = document.getElementById("nav-arrows");
  if (currentGroupExpressIDs.length === 0) {
    if (nav) nav.style.display = "none";
    resetView();
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

  if (activeMeshes.length > 0) {
    targetBoxHelper.setFromObject(activeMeshes[0]);
    targetBoxHelper.visible = true;
    const box = new THREE.Box3();
    activeMeshes.forEach(m => box.expandByObject(m));
    const center = box.getCenter(new THREE.Vector3());
    controls.target.copy(center);
    controls.update();
  }

  showInfoCard(activeEid);
}

function showInfoCard(eid) {
  const card = document.getElementById("info-card");
  if (!card) return;
  card.style.display = "block";
  const row = currentGroupInfo || {};
  const fields = Object.entries(row).filter(([k,v]) => v && !k.startsWith("_") && k !== "Row_Key");
  let body = fields.map(([k,v]) => `${k}: <strong>${v}</strong>`).join("<br>");
  if (!body) body = `ID: #${eid}`;
  card.innerHTML = `${body}`;
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

function setupKeyboardEvents() {
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") nextElement();
    else if (e.key === "ArrowLeft") prevElement();
  });
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
    const modelID = branchModels[currentActiveBranch].modelID;
    try {
      const line = ifcApi.GetLine(modelID, eid);
      const guid = (line && line.GlobalId && (line.GlobalId.value || line.GlobalId)) || "";
      if (guid) {
        window.parent.postMessage({ type: "VIEWER_PICK_GUID", guid: guid }, "*");
      }
    } catch(err){}
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
  } else if (d.type === "SWITCH_AND_FOCUS_GROUP") {
    await focusGroup(d);
  } else if (d.type === "ROW_INFO") {
    const lbl = document.getElementById("row-label");
    if (lbl) lbl.innerText = `RZĄD: ${d.row} / ${d.total}`;
  }
});
