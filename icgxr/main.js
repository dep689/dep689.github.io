import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { XRButton } from "three/addons/webxr/XRButton.js";
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

import { IntegralCirculantGraph } from "./CirculantGraph.js";

let scene, camera, renderer;
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
    graph.vertices[i].position.y = 1.6 + 0.3 * Math.sin(2 * i * Math.PI / graph.order);
    graph.vertices[i].position.z = -0.5;
  }

  // 辺
  graph.edges = [];
  const edgeGeometry = new THREE.BoxGeometry(edgeThickness, edgeThickness, 1);
  const edgeMaterial = new THREE.MeshNormalMaterial();
  for (let i = 0; i < graph.order; i++) {
    for (let j = i + 1; j < graph.order; j++) {
      if (graph.isAdjacent(i, j)) {
        graph.edges.push({
          v1: graph.vertices[i].position,
          v2: graph.vertices[j].position,
          object: new THREE.Mesh(edgeGeometry, edgeMaterial),
        })
      }
    }
  }
  graph.size = graph.edges.length;

}

function init() {

  initGraph();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x808080);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.6, 0);
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  document.body.appendChild(XRButton.createButton(renderer));
  
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.6, -1);
  controls.update();
  
  group = new THREE.Group();
  scene.add(group);

  for (let i = 0; i < graph.order; i++) {
    group.add(graph.vertices[i]);
  }

  for (let i = 0; i < graph.size; i++) {
    group.add(graph.edges[i].object);
  }

  // コントローラー
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener("selectstart", onSelectStart);
  controller1.addEventListener("selectend", onSelectEnd);
  scene.add(controller1);
  
  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);

  raycaster = new THREE.Raycaster();

  //
  window.addEventListener("resize", onWindowResize);

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function onSelectStart(event) {

  const controller = event.target;

  const intersections = getIntersections(controller);

  if (intersections.length > 0) {

    const intersection = intersections[0];

    const object = intersection.object;
    object.material.emissive.b = 1;
    controller.attach(object);

    controller.userData.selected = object;

  }

  controller.userData.targetRayMode = event.data.targetRayMode;

}

function onSelectEnd(event) {

  const controller = event.target;

  if (controller.userData.selected !== undefined) {

    const object = controller.userData.selected;
    object.material.emissive.b = 0;
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


function animate() {

  for (let i = 0; i < graph.order; i++) {
    graph.vertices[i].position.x += 0.01 * (Math.random() - 0.5);
    graph.vertices[i].position.y += 0.01 * (Math.random() - 0.5);
    graph.vertices[i].position.z += 0.01 * (Math.random() - 0.5);
  }

  for (let i = 0; i < graph.size; i++) {
    const edge = graph.edges[i];

    const distance = edge.v1.distanceTo(edge.v2);
        
    edge.object.lookAt(edge.v1);
    edge.object.scale.z = distance;
    edge.object.position.set(
      (edge.v1.x + edge.v2.x) / 2,
      (edge.v1.y + edge.v2.y) / 2,
      (edge.v1.z + edge.v2.z) / 2,
    );
  }
  
  requestAnimationFrame(animate);
  render();

}

function render() {

  renderer.render(scene, camera);

}
