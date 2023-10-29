import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { XRButton } from "three/addons/webxr/XRButton.js";

import { IntegralCirculantGraph } from './CirculantGraph.js';

let graph;

let container;
let scene, camera, renderer;
let controls, group;

init();
animate();

function initGraph() {
  graph = new IntegralCirculantGraph(8, [1]);

  const N = graph.order;

  graph.vertices = [];
  for (let i = 0; i < N; i++) {
    const object = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.1),
      new THREE.MeshNormalMaterial()
    );
    object.position.x = 0.3 * Math.cos(2 * i * Math.PI / N);
    object.position.y = 1.5 + 0.3 * Math.sin(2 * i * Math.PI / N);
    object.position.z = -0.2;
    graph.vertices[i] = object;
  }

}

function init() {
  console.log("Hello")

  initGraph();

  container = document.body;

  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.01, 100);
  camera.position.set(0, 0, -2);
  
  controls = new OrbitControls(camera, container);
  controls.target.set(0, 0, 0);
  controls.update();
  
  group = new THREE.Group();
  scene.add(group);
  
  for (let i = 0; i < graph.order; i++) {
    group.add(graph.vertices[i]);
  }

  

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(devicePixelRatio);
  renderer.setSize(innerWidth, innerHeight);
  renderer.xr.enabled = true;
  // document.body.appendChild(renderer.domElement);
  container.appendChild(renderer.domElement);

  container.appendChild(XRButton.createButton(renderer));

  window.addEventListener("resize", onWindowResize);

}

function onWindowResize() {

  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);

}

function animate() {
  
  renderer.setAnimationLoop(render);

}

function render() {

  for (let i = 0; i < graph.order; i++) {
    for (let j = i + 1; j < graph.order; j++) {
      if (graph.isAdjacent(i, j)) {
        group.add(new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.LineCurve3(graph.vertices[i].position, graph.vertices[j].position), 20, 0.01),
          new THREE.MeshNormalMaterial(),
        ));
      }
    }
  }

  renderer.render(scene, camera);

}

