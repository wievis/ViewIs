// model-viewer.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

async function initViewer(container) {
    const { model, hdr } = container.dataset;
    if (!model) return;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    const controls = new OrbitControls(camera, renderer.domElement);

    if (hdr) {
        new RGBELoader().load(hdr, t => {
            t.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = t;
        });
    } else {
        scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    }

    new GLTFLoader().load(model, (gltf) => {
        const obj = gltf.scene;
        obj.traverse(c => { if (c.isMesh) c.material.side = THREE.DoubleSide; });
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3());
        obj.position.sub(box.getCenter(new THREE.Vector3()));
        scene.add(obj);

        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.z = maxDim * 2.2;
        camera.updateProjectionMatrix();
        controls.update();
    });

    const anim = () => { requestAnimationFrame(anim); controls.update(); renderer.render(scene, camera); };
    anim();
}

window.initSingleModelViewer = initViewer;
document.querySelectorAll('.model-viewer').forEach(initViewer);