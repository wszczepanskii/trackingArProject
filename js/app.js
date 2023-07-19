// import * as THREE from "three";
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";
// import { ARButton } from "three/addons/webxr/ARButton.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
// import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
// import { RGBELoader } from "three/addons/loaders/lwo/RGBELoader.js";

var scene, camera, renderer, clock, deltaTime, totalTime;

var arToolkitSource, arToolkitContext;

var markerRoot1, markerRoot2;

var mesh1, obj;

initialize();
animate();

function initialize() {
	scene = new THREE.Scene();

	let ambientLight = new THREE.AmbientLight(0xcccccc, 0.5);
	scene.add(ambientLight);

	camera = new THREE.Camera();
	scene.add(camera);

	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true,
	});
	renderer.setClearColor(new THREE.Color("lightgrey"), 0);
	renderer.setSize(640, 480);
	renderer.domElement.style.position = "absolute";
	renderer.domElement.style.top = "0px";
	renderer.domElement.style.left = "0px";
	document.body.appendChild(renderer.domElement);

	clock = new THREE.Clock();
	deltaTime = 0;
	totalTime = 0;

	////////////////////////////////////////////////////////////
	// setup arToolkitSource
	////////////////////////////////////////////////////////////

	arToolkitSource = new THREEx.ArToolkitSource({
		sourceType: "webcam",
	});

	function onResize() {
		arToolkitSource.onResize();
		arToolkitSource.copySizeTo(renderer.domElement);
		if (arToolkitContext.arController !== null) {
			arToolkitSource.copySizeTo(arToolkitContext.arController.canvas);
		}
	}

	arToolkitSource.init(function onReady() {
		onResize();
	});

	// handle resize event
	window.addEventListener("resize", function () {
		onResize();
	});

	////////////////////////////////////////////////////////////
	// setup arToolkitContext
	////////////////////////////////////////////////////////////

	// create atToolkitContext
	arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: "js/camera_para.dat",
		detectionMode: "mono",
	});

	// copy projection matrix to camera when initialization complete
	arToolkitContext.init(function onCompleted() {
		camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
	});

	////////////////////////////////////////////////////////////
	// setup markerRoots
	////////////////////////////////////////////////////////////

	// build markerControls
	markerRoot1 = new THREE.Group();
	scene.add(markerRoot1);
	let markerControls1 = new THREEx.ArMarkerControls(
		arToolkitContext,
		markerRoot1,
		{
			type: "pattern",
			patternUrl: "markers/hiro.patt",
		}
	);

	let geometry1 = new THREE.PlaneGeometry(1, 1, 4, 4);
	let loader = new THREE.TextureLoader();
	let material1 = new THREE.MeshBasicMaterial({
		color: 0x0000ff,
		opacity: 0.5,
	});

	mesh1 = new THREE.Mesh(geometry1, material1);
	mesh1.rotation.x = -Math.PI / 2;

	markerRoot1.add(mesh1);

	function onProgress(xhr) {
		console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
	}

	function onError(xhr) {
		console.error(xhr);
	}

	function loadModel(model) {
		let loader = new GLTFLoader().setPath("models/");
		loader.load(
			model + ".glb",
			(glb) => {
				obj = glb.scene;
				obj.scale.set(
					0.5 * glb.scene.scale.x,
					0.5 * glb.scene.scale.y,
					0.5 * glb.scene.scale.z
				);

				markerRoot1.add(obj);
			},
			onProgress,
			onError
		);
	}

	loadModel("chair");

	// new MTLLoader().setPath("models/").load("fish-2.mtl", function (materials) {
	// 	materials.preload();
	// 	new OBJLoader()
	// 		.setMaterials(materials)
	// 		.setPath("models/")
	// 		.load(
	// 			"fish-2.obj",
	// 			function (group) {
	// 				let mesh0;
	// 				mesh0 = group.children[0];
	// 				mesh0.material.side = THREE.DoubleSide;
	// 				mesh0.position.y = 0.25;
	// 				mesh0.scale.set(0.25, 0.25, 0.25);
	// 				markerRoot1.add(mesh0);
	// 			},
	// 			onProgress,
	// 			onError
	// 		);
	// });
}

function update() {
	// update artoolkit on every frame
	if (arToolkitSource.ready !== false)
		arToolkitContext.update(arToolkitSource.domElement);
}

function render() {
	renderer.render(scene, camera);
}

function animate() {
	requestAnimationFrame(animate);
	deltaTime = clock.getDelta();
	totalTime += deltaTime;
	update();
	render();
}
