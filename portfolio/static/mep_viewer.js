import * as WebIFC from "https://unpkg.com/web-ifc@0.0.57/web-ifc-api.js";

let scene, camera, renderer, controls;
let ifcApi = null;
let modelID = 0;
let allMeshes = [];
let guidToExpressMap = new Map();
let expressToMeshMap = new Map();
let currentHighlighted = [];

init();

function setStatus(text, color = "#94a3b8") {
  const el = document.getElementById("status-badge");
  if (el) { el.innerText = text; el.style.color = color; }
}

function init() {
  const container = document.getElementById("canvas-container");
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1120);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(30, 30, 30);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(50, 80, 50);
  scene.add(dirLight);

  window.addEventListener("resize", onResize);
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
    setStatus("Gotowy. Wskaż plik IFC.");
  } catch (e) {
    setStatus("Błąd WebAssembly: " + e.message, "#f87171");
  }
}

async function loadBuffer(buffer) {
  try {
    setStatus("Przetwarzanie geometrii 3D...");
    if (modelID !== 0) {
      try { ifcApi.CloseModel(modelID); } catch(e){}
    }
    const data = new Uint8Array(buffer);
    modelID = ifcApi.OpenModel(data);

    allMeshes.forEach(m => scene.remove(m));
    allMeshes = [];
    guidToExpressMap.clear();
    expressToMeshMap.clear();

    const group = new THREE.Group();
    ifcApi.StreamAllMeshes(modelID, (flatMesh) => {
      const expressID = flatMesh.expressID;
      const placedGeometries = flatMesh.geometries;
      const meshList = [];

      for (let i = 0; i < placedGeometries.size(); i++) {
        const placedGeom = placedGeometries.get(i);
        const meshGeom = ifcApi.GetGeometry(modelID, placedGeom.geometryExpressID);
        const vData = ifcApi.GetVertexArray(meshGeom.GetVertexData(), meshGeom.GetVertexDataSize());
        const iData = ifcApi.GetIndexArray(meshGeom.GetIndexData(), meshGeom.GetIndexDataSize());

        const bufferGeom = new THREE.BufferGeometry();
        const pos = [];
        const norms = [];

        for (let k = 0; k < vData.length; k += 6) {
          pos.push(vData[k], vData[k+1], vData[k+2]);
          norms.push(vData[k+3], vData[k+4], vData[k+5]);
        }
        bufferGeom.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        bufferGeom.setAttribute("normal", new THREE.Float32BufferAttribute(norms, 3));
        bufferGeom.setIndex(Array.from(iData));

        const mat = new THREE.MeshLambertMaterial({
          color: new THREE.Color(placedGeom.color.x, placedGeom.color.y, placedGeom.color.z),
          transparent: placedGeom.color.w < 0.99,
          opacity: Math.max(placedGeom.color.w, 0.4),
          side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(bufferGeom, mat);
        mesh.applyMatrix4(new THREE.Matrix4().fromArray(placedGeom.flatTransformation));
        mesh.userData = { expressID: expressID, originalMat: mat };
        allMeshes.push(mesh);
        meshList.push(mesh);
        group.add(mesh);
      }
      if (meshList.length > 0) expressToMeshMap.set(expressID, meshList);
    });

    scene.add(group);
    zoomFit(group);
    setStatus("Model załadowany", "#4ade80");
  } catch (e) {
    setStatus("Błąd parsowania IFC: " + e.message, "#f87171");
  }
}

function zoomFit(object) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  camera.position.set(center.x + maxDim, center.y + maxDim * 0.8, center.z + maxDim);
  controls.target.copy(center);
  controls.update();
}

function highlightElement(guid) {
  currentHighlighted.forEach(m => m.material = m.userData.originalMat);
  currentHighlighted = [];

  if (!guid || !modelID) return;

  const hlMat = new THREE.MeshLambertMaterial({ color: 0xf97316, emissive: 0xc2410c });
  for (let [expId, meshes] of expressToMeshMap.entries()) {
    try {
      const line = ifcApi.GetLine(modelID, expId);
      const itemGuid = (line && line.GlobalId && (line.GlobalId.value || line.GlobalId)) || "";
      if (itemGuid === guid) {
        meshes.forEach(m => {
          m.material = hlMat;
          currentHighlighted.push(m);
        });
        const box = new THREE.Box3();
        meshes.forEach(m => box.expandByObject(m));
        const center = box.getCenter(new THREE.Vector3());
        controls.target.copy(center);
        controls.update();
        break;
      }
    } catch(e){}
  }
}

window.addEventListener("message", (event) => {
  const d = event.data;
  if (!d) return;
  if (d.type === "LOAD_LOCAL_BUFFER" && d.buffer) {
    loadBuffer(d.buffer);
  } else if (d.type === "EXCEL_SELECTION" && d.guid) {
    highlightElement(d.guid);
  }
});
