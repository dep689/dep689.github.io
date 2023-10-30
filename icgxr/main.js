import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { XRButton } from "three/addons/webxr/XRButton.js";
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

import { IntegralCirculantGraph } from "./CirculantGraph.js";

let scene, camera, renderer, container;
let controls;
let controller1, controller2;
let controllerGrip1, controllerGrip2;

let raycaster;

const intersected = [];
const tempMatrix = new THREE.Matrix4();

let group;

let graph;

init();
animate();

function initGraph() {

  const vertexSize = 0.02;
  const edgeThickness = vertexSize / 2;

  graph = new IntegralCirculantGraph(8, [1]);

  // 頂点
  graph.vertices = new Array(graph.order);
  const vertexGeometry = new THREE.IcosahedronGeometry(vertexSize);
  const vertexMaterial = new THREE.MeshNormalMaterial();
  for (let i = 0; i < graph.order; i++) {
    graph.vertices[i] = new THREE.Mesh(vertexGeometry, vertexMaterial);
    graph.vertices[i].position.x = 0.3 * Math.cos(2 * i * Math.PI / graph.order);
    graph.vertices[i].position.y = 1.5 + 0.3 * Math.sin(2 * i * Math.PI / graph.order);
    graph.vertices[i].position.z = -0.6;
    graph.vertices[i].name = "vertex";
  }

  // 辺
  graph.edges = [];
  const edgeGeometry = new THREE.BoxGeometry(edgeThickness, edgeThickness, 1);
  const edgeMaterial = new THREE.MeshNormalMaterial();
  for (let i = 0; i < graph.order; i++) {
    for (let j = i + 1; j < graph.order; j++) {

      if (graph.isAdjacent(i, j)) {

        const v1 = graph.vertices[i];
        const v2 = graph.vertices[j];
        const object = new THREE.Mesh(edgeGeometry, edgeMaterial);

        object.name = "edge";

        graph.edges.push({ v1, v2, object });
      }
    }
  }
  updateEdges();

  graph.size = graph.edges.length;

}

function init() {

  initGraph();

  container = document.createElement("div");
  document.body.appendChild(container);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x808080);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.6, 0);

  document.body.appendChild(XRButton.createButton(renderer));
  
  controls = new OrbitControls(camera, container);
  controls.target.set(0, 1.6, 0);
  controls.update();

  //

  // const floorGeometry = new THREE.PlaneGeometry(6, 6);
  // const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.25, blending: THREE.CustomBlending, transparent: false });
  // const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  // floor.rotation.x = - Math.PI / 2;
  // floor.receiveShadow = true;
  // scene.add(floor);

  // scene.add(new THREE.HemisphereLight(0xbcbcbc, 0xa5a5a5, 3));

  // const light = new THREE.DirectionalLight(0xffffff, 3);
  // light.position.set(0, 6, 0);
  // light.castShadow = true;
  // light.shadow.camera.top = 3;
  // light.shadow.camera.bottom = - 3;
  // light.shadow.camera.right = 3;
  // light.shadow.camera.left = - 3;
  // light.shadow.mapSize.set(4096, 4096);
  // scene.add(light);

  //
  
  group = new THREE.Group();
  scene.add(group);

  for (let i = 0; i < graph.order; i++) {
    group.add(graph.vertices[i]);
  }

  for (let i = 0; i < graph.size; i++) {
    group.add(graph.edges[i].object);
  }

  

  // const geometries = [
  //   new THREE.BoxGeometry(0.2, 0.2, 0.2),
  //   new THREE.ConeGeometry(0.2, 0.2, 64),
  //   new THREE.CylinderGeometry(0.2, 0.2, 0.2, 64),
  //   new THREE.IcosahedronGeometry(0.2, 8),
  //   new THREE.TorusGeometry(0.2, 0.04, 64, 32)
  // ];

  // for (let i = 0; i < 50; i++) {

  //   const geometry = geometries[Math.floor(Math.random() * geometries.length)];
  //   const material = new THREE.MeshStandardMaterial({
  //     color: Math.random() * 0xffffff,
  //     roughness: 0.7,
  //     metalness: 0.0
  //   });

  //   const object = new THREE.Mesh(geometry, material);

  //   object.position.x = Math.random() * 4 - 2;
  //   object.position.y = Math.random() * 2;
  //   object.position.z = Math.random() * 4 - 2;

  //   object.rotation.x = Math.random() * 2 * Math.PI;
  //   object.rotation.y = Math.random() * 2 * Math.PI;
  //   object.rotation.z = Math.random() * 2 * Math.PI;

  //   object.scale.setScalar(Math.random() + 0.5);

  //   // object.castShadow = true;
  //   // object.receiveShadow = true;

  //   group.add(object);

  // }

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.shadowMap.enabled = true;
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  document.body.appendChild(XRButton.createButton(renderer));

  // コントローラー
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener('selectstart', onSelectStart);
  controller1.addEventListener('selectend', onSelectEnd);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener('selectstart', onSelectStart);
  controller2.addEventListener('selectend', onSelectEnd);
  scene.add(controller2);

  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
  scene.add(controllerGrip2);

  //

  const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, - 1)]);

  const line = new THREE.Line(geometry);
  line.name = 'line';
  line.scale.z = 5;

  controller1.add(line.clone());
  controller2.add(line.clone());

  raycaster = new THREE.Raycaster();

  //

  window.addEventListener("resize", onWindowResize);

  //

  renderer.setAnimationLoop(animate);
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function onSelectStart(event) {

  const controller = event.target;

  const intersections = getIntersections(controller);
  const intersection = intersections.find(item => item.object.name === "vertex");

  if (intersection) {

    const object = intersection.object;
    // object.material.emissive.b = 1;
    controller.attach(object);

    controller.userData.selected = object;

  }

  controller.userData.targetRayMode = event.data.targetRayMode;

}

function onSelectEnd(event) {

  const controller = event.target;

  if (controller.userData.selected !== undefined) {

    const object = controller.userData.selected;
    // object.material.emissive.b = 0;
    group.attach(object);

    controller.userData.selected = undefined;

  }

}

function getIntersections(controller) {

  controller.updateMatrixWorld();

  tempMatrix.identity().extractRotation(controller.matrixWorld);

  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  return raycaster.intersectObjects(group.children, false);

}

function intersectObjects(controller) {

  // Do not highlight in mobile-ar

  if (controller.userData.targetRayMode === 'screen') return;

  // Do not highlight when already selected

  if (controller.userData.selected !== undefined) return;

  const line = controller.getObjectByName('line');
  const intersections = getIntersections(controller);
  const intersection = intersections.find(item => item.object.name === "vertex");

  if (intersection) {

    const object = intersection.object;
    // object.material.emissive.r = 1;
    intersected.push(object);

    line.scale.z = intersection.distance;

  } else {

    line.scale.z = 5;

  }
}

function cleanIntersected() {
  intersected.length = 0;

  // while (intersected.length) {

  //   const object = intersected.pop();
  //   // object.material.emissive.r = 0;

  // }

}

function animate() {

  // for (let i = 0; i < graph.order; i++) {
  //   graph.vertices[i].position.x += 0.01 * (Math.random() - 0.5);
  //   graph.vertices[i].position.y += 0.01 * (Math.random() - 0.5);
  //   graph.vertices[i].position.z += 0.01 * (Math.random() - 0.5);
  // }

  updateEdges();
  
  render();

}

function render() {

  cleanIntersected();

  intersectObjects(controller1);
  intersectObjects(controller2);

  renderer.render(scene, camera);

}

function updateEdges() {
  for (let i = 0; i < graph.size; i++) {
    const edge = graph.edges[i];

    let v1 = edge.v1;
    let v2 = edge.v2;

    if (v1 === controller1.userData.selected) {
      v1 = v1.parent;
    }
    if (v2 === controller1.userData.selected) {
      v2 = v2.parent;
    }

    const distance = edge.v1.position.distanceTo(edge.v2.position);

    edge.object.scale.z = distance;

    // 順番変えるとバグる
    edge.object.position.set(
      (v1.position.x + v2.position.x) / 2,
      (v1.position.y + v2.position.y) / 2,
      (v1.position.z + v2.position.z) / 2);
    edge.object.lookAt(v1.position);
  }
}
