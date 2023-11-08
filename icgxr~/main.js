// https://threejs.org/examples/#webxr_xr_dragging を改造

import * as THREE from "three";
import { XRButton } from "three/addons/webxr/XRButton.js";

import { IntegralCirculantGraph } from "./CirculantGraph.js";

let scene, camera, renderer, container;
let controller1, controller2;

let raycaster;

const intersected = [];
const tempMatrix = new THREE.Matrix4();

let group;

let graph;

init();
animate();

function initGraph() {

  const vertexSize = 0.01;
  const edgeThickness = vertexSize / 4;

  graph = new IntegralCirculantGraph(12, [1,2,3]);

  // 頂点
  graph.vertices = new Array(graph.order);
  const vertexGeometry = new THREE.IcosahedronGeometry(vertexSize);
  const vertexMaterial = new THREE.MeshNormalMaterial();
  for (let i = 0; i < graph.order; i++) {
    graph.vertices[i] = new THREE.Mesh(vertexGeometry, vertexMaterial);
    graph.vertices[i].position.x = 0.3 * Math.cos(2 * i * Math.PI / graph.order);
    graph.vertices[i].position.y = 1 + 0.3 * Math.sin(2 * i * Math.PI / graph.order);
    graph.vertices[i].position.z = -0.5;
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

  graph.size = graph.edges.length;

}

function init() {

  initGraph();

  container = document.createElement("div");
  document.body.appendChild(container);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x808080);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1, 0);

  document.body.appendChild(XRButton.createButton(renderer));
  
  //
  
  group = new THREE.Group();
  scene.add(group);

  for (let i = 0; i < graph.order; i++) {
    group.add(graph.vertices[i]);
  }

  for (let i = 0; i < graph.size; i++) {
    group.add(graph.edges[i].object);
  }

  // renderer

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
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

  // コントローラーから出る線

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

  //

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
    controller.attach(object);

    controller.userData.selected = object;

  }

  controller.userData.targetRayMode = event.data.targetRayMode;

}

function onSelectEnd(event) {

  const controller = event.target;

  if (controller.userData.selected !== undefined) {

    const object = controller.userData.selected;
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

  if (controller.userData.selected !== undefined) return;

  const line = controller.getObjectByName('line');
  const intersections = getIntersections(controller);
  const intersection = intersections.find(item => item.object.name === "vertex");

  if (intersection) {

    const object = intersection.object;
    intersected.push(object);

    line.scale.z = intersection.distance;

  } else {

    line.scale.z = 5;

  }
}

function cleanIntersected() {

  intersected.length = 0;

}

function animate() {

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

  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();

  for (let i = 0; i < graph.size; i++) {
    const edge = graph.edges[i];

    p1.copy(edge.v1.position);
    p2.copy(edge.v2.position);

    // コントローラーが触っているときは、その分ずらす
    if (edge.v1 === controller1.userData.selected) {
      p1.applyEuler(controller1.rotation).add(controller1.position);
    }
    if (edge.v1 === controller2.userData.selected) {
      p1.applyEuler(controller2.rotation).add(controller2.position);
    }
    if (edge.v2 === controller1.userData.selected) {
      p2.applyEuler(controller1.rotation).add(controller1.position);
    }
    if (edge.v2 === controller2.userData.selected) {
      p2.applyEuler(controller2.rotation).add(controller2.position);
    }

    edge.object.scale.z = p1.distanceTo(p2);

    // 順番変えるとバグる
    edge.object.position.lerpVectors(p1, p2, 0.5);
    edge.object.lookAt(p1);

  }

}
