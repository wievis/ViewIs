import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

async function initViewer(container) {
    const { model, hdr, texture, roughness, metalness, alpha } = container.dataset;
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 3;
    const controls = new OrbitControls(camera, renderer.domElement);

    if (hdr) {
        const hLoader = hdr.endsWith('.exr') ? new EXRLoader() : new RGBELoader();
        hLoader.load(hdr, t => {
            t.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = scene.background = t;
        });
    }

    const isGLB = model.endsWith('.glb') || model.endsWith('.gltf');
    const loader = isGLB ? new GLTFLoader() : new OBJLoader();

    loader.load(model, (res) => {
        const obj = res.scene || res;
        if (!isGLB && texture) {
            const tL = new THREE.TextureLoader();
            obj.traverse(c => {
                if (c.isMesh) c.material = new THREE.MeshStandardMaterial({
                    map: tL.load(texture),
                    roughnessMap: roughness ? tL.load(roughness) : null,
                    metalnessMap: metalness ? tL.load(metalness) : null,
                    alphaMap: alpha ? tL.load(alpha) : null,
                    transparent: !!alpha, side: THREE.DoubleSide
                });
            });
        }
        const box = new THREE.Box3().setFromObject(obj);
        obj.position.sub(box.getCenter(new THREE.Vector3()));
        scene.add(obj);
    });

    const anim = () => { requestAnimationFrame(anim); controls.update(); renderer.render(scene, camera); };
    anim();
}
document.querySelectorAll('.model-viewer').forEach(initViewer);