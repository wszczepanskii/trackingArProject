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

var mesh1,
	obj,
	mixer,
	hasLoaded = false,
	gltf;

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
					1.2 * glb.scene.scale.x,
					1.2 * glb.scene.scale.y,
					1.2 * glb.scene.scale.z
				);

				hasLoaded = true;

				markerRoot1.add(obj);

				mixer = new THREE.AnimationMixer(obj);
				const clips = glb.animations;
				const clip = THREE.AnimationClip.findByName(clips, "Take 001");
				const action = mixer.clipAction(clip);
				action.play();

				clips.forEach((clip) => {
					mixer.clipAction(clip).play();
				});
			},
			onProgress,
			onError
		);
	}

	loadModel("doc_animated");
}

function update() {
	// update artoolkit on every frame
	if (arToolkitSource.ready !== false)
		arToolkitContext.update(arToolkitSource.domElement);

	if (hasLoaded) mixer.update(deltaTime);
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
