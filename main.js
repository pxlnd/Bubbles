const canvas = document.querySelector("#scene");

const controls = {
  camX: document.querySelector("#cam-x"),
  camY: document.querySelector("#cam-y"),
  camZ: document.querySelector("#cam-z"),
  camFocal: document.querySelector("#cam-focal"),
  camPitch: document.querySelector("#cam-pitch"),
  camYaw: document.querySelector("#cam-yaw"),
  camRoll: document.querySelector("#cam-roll"),
  camXValue: document.querySelector("#cam-x-value"),
  camYValue: document.querySelector("#cam-y-value"),
  camZValue: document.querySelector("#cam-z-value"),
  camFocalValue: document.querySelector("#cam-focal-value"),
  camPitchValue: document.querySelector("#cam-pitch-value"),
  camYawValue: document.querySelector("#cam-yaw-value"),
  camRollValue: document.querySelector("#cam-roll-value"),
  pitch: document.querySelector("#light-pitch"),
  yaw: document.querySelector("#light-yaw"),
  pitchValue: document.querySelector("#light-pitch-value"),
  yawValue: document.querySelector("#light-yaw-value"),
  gravity: document.querySelector("#phys-gravity"),
  jelly: document.querySelector("#phys-jelly"),
  gravityValue: document.querySelector("#phys-gravity-value"),
  jellyValue: document.querySelector("#phys-jelly-value"),
};

const cameraState = {
  x: 0,
  y: 21.6,
  z: 20.5,
  focalLength: 705,
  pitch: -51,
  yaw: 0,
  roll: 0,
};

const lightState = {
  pitch: 52,
  yaw: 40,
  radius: 38,
};

const physicsTuning = {
  gravity: 18,
  jelly: 1,
};
const gravity = new THREE.Vector3(0, -physicsTuning.gravity, 0);

const ground = {
  width: 28,
  depth: 34,
  tiltX: -0.035,
  wallHeight: 2.6,
};

const state = {
  mode: "scene",
  elapsed: 0,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc9ec);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 250);
camera.rotation.order = "YXZ";

const hemi = new THREE.HemisphereLight(0xdff3ff, 0x7e8f62, 1.25);
scene.add(hemi);

const ambient = new THREE.AmbientLight(0xffffff, 0.42);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 1.25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -30;
sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -30;
scene.add(sun);
sun.target.position.set(0, 0, 0);
scene.add(sun.target);

const table = new THREE.Group();
table.rotation.x = ground.tiltX;
table.rotation.y = 0;
scene.add(table);

const textureLoader = new THREE.TextureLoader();
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.9,
  metalness: 0.02,
  side: THREE.DoubleSide,
});

const groundMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(ground.width, ground.depth, 1, 1),
  groundMaterial,
);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
table.add(groundMesh);
groundMaterial.emissive = new THREE.Color(0x252525);
groundMaterial.emissiveIntensity = 0.16;

textureLoader.load(
  "./Assets/floor.jpg",
  (tex) => {
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    groundMaterial.map = tex;
    groundMaterial.color.setHex(0xffffff);
    groundMaterial.needsUpdate = true;
  },
  undefined,
  () => {
    // Fallback for cases where image loading is blocked (e.g. file:// restrictions).
    groundMaterial.map = null;
    groundMaterial.color.setHex(0xb98953);
    groundMaterial.needsUpdate = true;
  },
);

const markerMaterial = new THREE.MeshStandardMaterial({
  color: 0x2477ff,
  roughness: 0.55,
  metalness: 0.05,
});
const squareMarker = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.08, 2.9), markerMaterial);
squareMarker.position.set(0, 0.04, 0);
table.add(squareMarker);

const canvasMarker = new THREE.Mesh(
  new THREE.BoxGeometry(10.5, 0.08, 2.2),
  new THREE.MeshStandardMaterial({ color: 0xf4f5f9, roughness: 0.72, metalness: 0.03 }),
);
canvasMarker.position.set(0, 0.04, 5.4);
table.add(canvasMarker);

const wallMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xb8edff,
  transparent: true,
  opacity: 0.3,
  roughness: 0.1,
  metalness: 0,
  transmission: 0.35,
  depthWrite: false,
});

function makeWall(width, depth, x, z) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, ground.wallHeight, depth), wallMaterial);
  wall.position.set(x, ground.wallHeight * 0.5, z);
  table.add(wall);
}

const wallThickness = 0.2;
makeWall(ground.width, wallThickness, 0, -ground.depth * 0.5);
makeWall(ground.width, wallThickness, 0, ground.depth * 0.5);
makeWall(wallThickness, ground.depth, -ground.width * 0.5, 0);
makeWall(wallThickness, ground.depth, ground.width * 0.5, 0);

const sphereRadius = 1;
const sphereBody = new THREE.Mesh(
  new THREE.SphereGeometry(sphereRadius, 48, 48),
  new THREE.MeshPhysicalMaterial({
    color: 0xef3b17,
    roughness: 0.35,
    metalness: 0.05,
    clearcoat: 0.95,
    clearcoatRoughness: 0.2,
    sheen: 0.2,
  }),
);
sphereBody.castShadow = true;
sphereBody.receiveShadow = false;
scene.add(sphereBody);

function createLabelTexture(text) {
  const texCanvas = document.createElement("canvas");
  texCanvas.width = 512;
  texCanvas.height = 512;
  const c = texCanvas.getContext("2d");
  c.clearRect(0, 0, texCanvas.width, texCanvas.height);
  c.translate(texCanvas.width * 0.5, texCanvas.height * 0.5);
  c.fillStyle = "rgba(0,0,0,0)";
  c.fillRect(-256, -256, 512, 512);
  c.lineJoin = "round";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.font = "700 210px Trebuchet MS, sans-serif";
  c.strokeStyle = "rgba(120, 24, 12, 0.75)";
  c.lineWidth = 24;
  c.strokeText(text, 0, 10);
  c.fillStyle = "#fffaf2";
  c.fillText(text, 0, 10);
  const tex = new THREE.CanvasTexture(texCanvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const labelMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1.08, 1.08),
  new THREE.MeshBasicMaterial({
    map: createLabelTexture("50"),
    transparent: true,
    depthWrite: false,
  }),
);
labelMesh.position.set(0, 0, sphereRadius + 0.01);
sphereBody.add(labelMesh);

const physics = {
  position: new THREE.Vector3(0, 5.2, -4.5),
  velocity: new THREE.Vector3(),
  grounded: false,
  impact: 0,
};
sphereBody.position.copy(physics.position);

const temp = {
  normal: new THREE.Vector3(),
  delta: new THREE.Vector3(),
  tangentAcc: new THREE.Vector3(),
  planePoint: new THREE.Vector3(),
  localPos: new THREE.Vector3(),
  localVel: new THREE.Vector3(),
  invQuat: new THREE.Quaternion(),
  quat: new THREE.Quaternion(),
  axis: new THREE.Vector3(),
};

function syncCameraFromState() {
  camera.position.set(cameraState.x, cameraState.y, cameraState.z);
  camera.rotation.y = THREE.MathUtils.degToRad(cameraState.yaw);
  // Negative pitch should look down, matching user-facing control expectations.
  camera.rotation.x = THREE.MathUtils.degToRad(-cameraState.pitch);
  camera.rotation.z = THREE.MathUtils.degToRad(cameraState.roll);
  camera.fov = THREE.MathUtils.clamp(1000 / Math.max(1, cameraState.focalLength) * 28, 18, 95);
  camera.updateProjectionMatrix();
}

function syncLightFromState() {
  const yaw = THREE.MathUtils.degToRad(lightState.yaw);
  const pitch = THREE.MathUtils.degToRad(lightState.pitch);
  const cosPitch = Math.cos(pitch);
  sun.position.set(
    Math.sin(yaw) * cosPitch * lightState.radius,
    Math.sin(pitch) * lightState.radius,
    Math.cos(yaw) * cosPitch * lightState.radius,
  );
  sun.target.position.set(0, 0, 0);
  sun.target.updateMatrixWorld();
}

function syncPanel() {
  if (!controls.camX) return;
  controls.camX.value = String(cameraState.x);
  controls.camY.value = String(cameraState.y);
  controls.camZ.value = String(cameraState.z);
  controls.camFocal.value = String(cameraState.focalLength);
  controls.camPitch.value = String(cameraState.pitch);
  controls.camYaw.value = String(cameraState.yaw);
  controls.camRoll.value = String(cameraState.roll);
  controls.camXValue.value = cameraState.x.toFixed(1);
  controls.camYValue.value = cameraState.y.toFixed(1);
  controls.camZValue.value = cameraState.z.toFixed(1);
  controls.camFocalValue.value = cameraState.focalLength.toFixed(0);
  controls.camPitchValue.value = `${cameraState.pitch.toFixed(0)}°`;
  controls.camYawValue.value = `${cameraState.yaw.toFixed(0)}°`;
  controls.camRollValue.value = `${cameraState.roll.toFixed(0)}°`;

  controls.pitch.value = String(lightState.pitch);
  controls.yaw.value = String(lightState.yaw);
  controls.pitchValue.value = `${lightState.pitch.toFixed(0)}°`;
  controls.yawValue.value = `${lightState.yaw.toFixed(0)}°`;

  controls.gravity.value = String(physicsTuning.gravity);
  controls.jelly.value = String(physicsTuning.jelly);
  controls.gravityValue.value = physicsTuning.gravity.toFixed(1);
  controls.jellyValue.value = physicsTuning.jelly.toFixed(2);
}

function bindPanel() {
  if (!controls.camX) return;
  controls.camX.addEventListener("input", (event) => {
    cameraState.x = Number(event.target.value);
    syncPanel();
    syncCameraFromState();
    renderer.render(scene, camera);
  });
  controls.camY.addEventListener("input", (event) => {
    cameraState.y = Number(event.target.value);
    syncPanel();
    syncCameraFromState();
    renderer.render(scene, camera);
  });
  controls.camZ.addEventListener("input", (event) => {
    cameraState.z = Number(event.target.value);
    syncPanel();
    syncCameraFromState();
    renderer.render(scene, camera);
  });
  controls.camFocal.addEventListener("input", (event) => {
    cameraState.focalLength = Number(event.target.value);
    syncPanel();
    syncCameraFromState();
    renderer.render(scene, camera);
  });
  controls.camPitch.addEventListener("input", (event) => {
    cameraState.pitch = Number(event.target.value);
    syncPanel();
    syncCameraFromState();
    renderer.render(scene, camera);
  });
  controls.camYaw.addEventListener("input", (event) => {
    cameraState.yaw = Number(event.target.value);
    syncPanel();
    syncCameraFromState();
    renderer.render(scene, camera);
  });
  controls.camRoll.addEventListener("input", (event) => {
    cameraState.roll = Number(event.target.value);
    syncPanel();
    syncCameraFromState();
    renderer.render(scene, camera);
  });

  controls.pitch.addEventListener("input", (event) => {
    lightState.pitch = Number(event.target.value);
    syncPanel();
    syncLightFromState();
    renderer.render(scene, camera);
  });
  controls.yaw.addEventListener("input", (event) => {
    lightState.yaw = Number(event.target.value);
    syncPanel();
    syncLightFromState();
    renderer.render(scene, camera);
  });

  controls.gravity.addEventListener("input", (event) => {
    physicsTuning.gravity = Number(event.target.value);
    gravity.set(0, -physicsTuning.gravity, 0);
    syncPanel();
  });
  controls.jelly.addEventListener("input", (event) => {
    physicsTuning.jelly = Number(event.target.value);
    syncPanel();
  });

  syncPanel();
}

function clampToTableBounds() {
  temp.localPos.copy(physics.position);
  table.worldToLocal(temp.localPos);

  temp.quat.setFromEuler(table.rotation);
  temp.invQuat.copy(temp.quat).invert();
  temp.localVel.copy(physics.velocity).applyQuaternion(temp.invQuat);

  const halfW = ground.width * 0.5 - sphereRadius;
  const halfD = ground.depth * 0.5 - sphereRadius;
  const bounce = 0.18;

  if (temp.localPos.x < -halfW) {
    temp.localPos.x = -halfW;
    if (temp.localVel.x < 0) temp.localVel.x *= -bounce;
  } else if (temp.localPos.x > halfW) {
    temp.localPos.x = halfW;
    if (temp.localVel.x > 0) temp.localVel.x *= -bounce;
  }

  if (temp.localPos.z < -halfD) {
    temp.localPos.z = -halfD;
    if (temp.localVel.z < 0) temp.localVel.z *= -bounce;
  } else if (temp.localPos.z > halfD) {
    temp.localPos.z = halfD;
    if (temp.localVel.z > 0) temp.localVel.z *= -bounce;
  }

  physics.position.copy(temp.localPos);
  table.localToWorld(physics.position);
  physics.velocity.copy(temp.localVel).applyQuaternion(temp.quat);
}

function updateSphere(dt) {
  physics.velocity.addScaledVector(gravity, dt);
  physics.position.addScaledVector(physics.velocity, dt);

  temp.normal.set(0, 1, 0).applyQuaternion(table.quaternion).normalize();
  temp.planePoint.setFromMatrixPosition(table.matrixWorld);
  temp.delta.copy(physics.position).sub(temp.planePoint);
  const distanceToPlane = temp.delta.dot(temp.normal) - sphereRadius;

  physics.grounded = false;
  if (distanceToPlane < 0) {
    physics.position.addScaledVector(temp.normal, -distanceToPlane);

    const normalSpeed = physics.velocity.dot(temp.normal);
    if (normalSpeed < 0) {
      physics.velocity.addScaledVector(temp.normal, -normalSpeed);
      physics.impact = Math.max(physics.impact, Math.min(0.22, -normalSpeed * 0.04 * physicsTuning.jelly));
    }

    temp.tangentAcc.copy(gravity);
    temp.tangentAcc.addScaledVector(temp.normal, -gravity.dot(temp.normal));
    physics.velocity.addScaledVector(temp.tangentAcc, dt);
    physics.velocity.multiplyScalar(Math.max(0, 1 - dt * 0.32));
    physics.grounded = true;
  }

  clampToTableBounds();

  if (physics.grounded) {
    const moveLen = temp.delta.copy(physics.velocity).setY(0).length() * dt;
    if (moveLen > 0.00001) {
      temp.axis.copy(physics.velocity).cross(temp.normal).normalize();
      sphereBody.rotateOnWorldAxis(temp.axis, moveLen / sphereRadius);
    }
  }

  physics.impact *= Math.max(0, 1 - dt * 2.4);
  const speed = physics.velocity.length();
  const squash = THREE.MathUtils.clamp((speed * 0.012 + physics.impact) * physicsTuning.jelly, 0, 0.22);
  sphereBody.scale.set(1 + squash * 0.35, 1 - squash, 1 + squash * 0.35);
  sphereBody.position.copy(physics.position);
}

function update(dt) {
  state.elapsed += dt;
  updateSphere(dt);
}

function resizeRenderer() {
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function frame(now) {
  if (!frame.prev) frame.prev = now;
  const dt = Math.min((now - frame.prev) / 1000, 1 / 20);
  frame.prev = now;
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

window.render_game_to_text = () =>
  JSON.stringify({
    mode: state.mode,
    coordinateSystem: {
      origin: "table center (world)",
      x: "left/right",
      y: "up/down",
      z: "depth",
    },
    sphere: {
      x: Number(physics.position.x.toFixed(2)),
      y: Number(physics.position.y.toFixed(2)),
      z: Number(physics.position.z.toFixed(2)),
      vx: Number(physics.velocity.x.toFixed(2)),
      vy: Number(physics.velocity.y.toFixed(2)),
      vz: Number(physics.velocity.z.toFixed(2)),
      grounded: physics.grounded,
    },
    table: {
      width: ground.width,
      depth: ground.depth,
      tiltX: Number(ground.tiltX.toFixed(3)),
      wallHeight: ground.wallHeight,
    },
    camera: {
      x: Number(camera.position.x.toFixed(2)),
      y: Number(camera.position.y.toFixed(2)),
      z: Number(camera.position.z.toFixed(2)),
      pitch: Number(cameraState.pitch.toFixed(1)),
      yaw: Number(cameraState.yaw.toFixed(1)),
      roll: Number(cameraState.roll.toFixed(1)),
      focalLength: Number(cameraState.focalLength.toFixed(0)),
      fov: Number(camera.fov.toFixed(2)),
    },
    light: {
      pitch: Number(lightState.pitch.toFixed(1)),
      yaw: Number(lightState.yaw.toFixed(1)),
      x: Number(sun.position.x.toFixed(2)),
      y: Number(sun.position.y.toFixed(2)),
      z: Number(sun.position.z.toFixed(2)),
    },
    tuning: {
      gravity: Number(physicsTuning.gravity.toFixed(2)),
      jelly: Number(physicsTuning.jelly.toFixed(2)),
    },
  });

window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  const dt = ms / 1000 / steps;
  for (let i = 0; i < steps; i += 1) update(dt);
  renderer.render(scene, camera);
};

window.addEventListener("resize", () => {
  resizeRenderer();
  renderer.render(scene, camera);
});

bindPanel();
syncCameraFromState();
syncLightFromState();
resizeRenderer();
renderer.render(scene, camera);
requestAnimationFrame(frame);
