import * as THREE from 'three';

export interface SceneRefs {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  trees: THREE.Group[];
  water: THREE.Mesh;
  particles: THREE.Points;
  ground: THREE.Mesh;
  clock: THREE.Clock;
  animFrame: number;
}

let refs: SceneRefs | null = null;

// Simplex-like noise for ground displacement
function noise(x: number, z: number): number {
  return Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.15
    + Math.sin(x * 1.3 + z * 0.7) * 0.08
    + Math.cos(x * 0.3 + z * 1.1) * 0.07;
}

export function createScene(container: HTMLElement): SceneRefs {
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Camera
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 3, 8);
  camera.lookAt(0, 1.5, 0);

  // Scene
  const scene = new THREE.Scene();

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xF5F0E8, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xFFE8C8, 0.8);
  dirLight.position.set(5, 8, 3);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  scene.add(dirLight);

  // Ground
  const groundGeo = new THREE.PlaneGeometry(30, 30, 64, 64);
  const posAttr = groundGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getY(i);
    posAttr.setZ(i, noise(x, z));
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0xE8DFD0,
    roughness: 0.9,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Trees
  const trees: THREE.Group[] = [];
  const treePositions = [
    [-3, -1], [-1.5, 1], [0.5, -0.5], [2.5, 0.5],
    [-2, 2], [1.5, -2], [3.5, -1.5], [-0.5, 2.5],
  ];

  treePositions.forEach(([tx, tz]) => {
    const treeGroup = new THREE.Group();
    const yPos = noise(tx, tz);
    treeGroup.position.set(tx, yPos, tz);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.5, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.95 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.75;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Canopy
    const canopyGeo = new THREE.IcosahedronGeometry(0.6, 1);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x4A7C59,
      roughness: 0.8,
      flatShading: true,
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 1.8;
    canopy.castShadow = true;
    canopy.name = 'canopy';
    treeGroup.add(canopy);

    treeGroup.userData = { type: 'tree', originalY: 1.8, canopy };
    scene.add(treeGroup);
    trees.push(treeGroup);
  });

  // Water
  const waterGeo = new THREE.PlaneGeometry(8, 4, 32, 32);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x7BA3A8,
    transparent: true,
    opacity: 0.6,
    roughness: 0.2,
    metalness: 0.1,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.05, -2);
  water.name = 'water';
  water.userData = { type: 'water' };
  scene.add(water);

  // Sky dome
  const skyGeo = new THREE.SphereGeometry(20, 32, 32);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {},
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        vec3 bottom = vec3(0.961, 0.941, 0.910); // #F5F0E8
        vec3 top = vec3(0.784, 0.847, 0.894);    // #C8D8E4
        vec3 color = mix(bottom, top, max(h, 0.0));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // Atmospheric particles
  const particleCount = 500;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities: THREE.Vector3[] = [];

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = Math.random() * 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    velocities.push(new THREE.Vector3(
      (Math.random() - 0.5) * 0.002,
      (Math.random() - 0.5) * 0.001,
      (Math.random() - 0.5) * 0.002
    ));
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0xD4A574,
    size: 0.05,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // Raycaster
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const clock = new THREE.Clock();

  refs = {
    renderer, camera, scene, raycaster, mouse,
    trees, water, particles, ground, clock, animFrame: 0,
  };

  return refs;
}

export function animateScene(
  onFrame?: (time: number) => void
) {
  if (!refs) return;
  const { renderer, camera, scene, particles, trees, clock, water } = refs;

  const tick = () => {
    clock.getDelta();
    const time = clock.getElapsedTime();

    // Animate particles - Brownian drift
    const posAttr = particles.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);

      x += (Math.random() - 0.5) * 0.002 + Math.sin(time * 0.1 + i) * 0.0003;
      y += (Math.random() - 0.5) * 0.001 + Math.cos(time * 0.15 + i) * 0.0002;
      z += (Math.random() - 0.5) * 0.002;

      // Respawn if out of bounds
      if (Math.abs(x) > 10 || y < 0 || y > 5 || Math.abs(z) > 10) {
        x = (Math.random() - 0.5) * 20;
        y = Math.random() * 5;
        z = (Math.random() - 0.5) * 20;
      }

      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;

    // Animate tree canopy sway
    trees.forEach((tree, i) => {
      const canopy = tree.userData.canopy as THREE.Mesh;
      if (canopy) {
        canopy.position.y = tree.userData.originalY + Math.sin(time * 0.5 + i) * 0.02;
        canopy.rotation.z = Math.sin(time * 0.3 + i * 0.5) * 0.03;
      }
    });

    // Animate water
    const waterPos = (water.geometry as THREE.PlaneGeometry).attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < waterPos.count; i++) {
      const x = (water.geometry as THREE.PlaneGeometry).parameters.width * (i % 33) / 32 - 4;
      const y = Math.floor(i / 33);
      const wx = x * 3.0;
      const wy = y * 2.0;
      const z = Math.sin(time * 2.0 + wx) * Math.cos(time * 1.5 + wy) * 0.05;
      waterPos.setZ(i, z);
    }
    waterPos.needsUpdate = true;
    water.geometry.computeVertexNormals();

    if (onFrame) onFrame(time);
    renderer.render(scene, camera);
    refs!.animFrame = requestAnimationFrame(tick);
  };

  tick();
}

export function updateCameraParallax(mouseX: number, mouseY: number) {
  if (!refs) return;
  const targetX = mouseX * 0.5;
  const targetY = 3 + mouseY * 0.3;
  refs.camera.position.x += (targetX - refs.camera.position.x) * 0.05;
  refs.camera.position.y += (targetY - refs.camera.position.y) * 0.05;
  refs.camera.lookAt(0, 1.5, 0);
}

export function raycast(x: number, y: number): THREE.Intersection[] {
  if (!refs) return [];
  refs.raycaster.setFromCamera(new THREE.Vector2(x, y), refs.camera);
  return refs.raycaster.intersectObjects(refs.scene.children, true);
}

export function projectToScreen(worldPos: THREE.Vector3): { x: number; y: number } {
  if (!refs) return { x: 0, y: 0 };
  const vector = worldPos.clone().project(refs.camera);
  return {
    x: (vector.x * 0.5 + 0.5) * refs.renderer.domElement.clientWidth,
    y: (-vector.y * 0.5 + 0.5) * refs.renderer.domElement.clientHeight,
  };
}

export function getTreeScreenPositions(): { x: number; y: number; tree: THREE.Group }[] {
  if (!refs) return [];
  return refs.trees.map((tree) => {
    const canopy = tree.userData.canopy as THREE.Mesh;
    const worldPos = new THREE.Vector3();
    canopy.getWorldPosition(worldPos);
    const screen = projectToScreen(worldPos);
    return { ...screen, tree };
  });
}

export function pulseTree(treeIndex: number) {
  if (!refs || !refs.trees[treeIndex]) return;
  const canopy = refs.trees[treeIndex].userData.canopy as THREE.Mesh;
  if (!canopy) return;

  const startScale = canopy.scale.x;
  const targetScale = 1.15;
  const startTime = performance.now();
  const duration = 600;

  const animate = () => {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    // Ease out elastic
    const ease = t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const scale = startScale + (t < 0.5
      ? (targetScale - startScale) * ease * 2
      : (startScale - targetScale) * (ease - 0.5) * 2 + (targetScale - startScale));
    canopy.scale.setScalar(Math.max(startScale, scale));
    if (t < 1) requestAnimationFrame(animate);
    else canopy.scale.setScalar(1);
  };
  animate();
}

export function resizeScene(width: number, height: number) {
  if (!refs) return;
  refs.camera.aspect = width / height;
  refs.camera.updateProjectionMatrix();
  refs.renderer.setSize(width, height);
}

export function destroyScene() {
  if (!refs) return;
  cancelAnimationFrame(refs.animFrame);
  refs.renderer.dispose();
  refs.scene.clear();
  if (refs.renderer.domElement.parentElement) {
    refs.renderer.domElement.parentElement.removeChild(refs.renderer.domElement);
  }
  refs = null;
}

export function getSceneRefs(): SceneRefs | null {
  return refs;
}
