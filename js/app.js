// import * as THREE from "three.js";
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";
// import { ARButton } from "three/addons/webxr/ARButton.js";
// import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// import { RGBELoader } from "three/addons/loaders/lwo/RGBELoader.js";

// let camera, scene, renderer, controller, controls, reticle;
// let ArToolkitSource, ArToolkitContext, ArMarkerControls;

// const init = () => {
// 	const container = document.createElement("div");
// 	document.body.append(container);

// 	scene = new THREE.Scene();

// 	camera = new THREE.Camera();
// 	scene.add(camera);

// 	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
// 	renderer.setPixelRatio(window.devicePixelRatio);
// 	renderer.setSize(window.innerWidth, window.innerHeight);
// 	renderer.useLegacyLights = false;
// 	renderer.xr.enabled = true;
// 	document.body.append(renderer.domElement);

// 	const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
// 	light.position.set(0.5, 1, 0.25);
// 	scene.add(light);

// 	window.addEventListener("resize", onWindowResize, false);

// 	ArToolkitSource = new THREEx.ArToolkitSource({
// 		sourceType: "webcam",
// 	});

// 	ArToolkitSource.init(() => {
// 		setTimeout(() => {
// 			ArToolkitSource.onResizeElement();
// 			ArToolkitSource.copyElementSizeTo(render.domElement);
// 		}, 2000);
// 	});

// 	ArToolkitContext = new THREEx.ArToolkitContext({
// 		cameraParametersUrl: "camera_para.dat",
// 		detectionMode: "mono",
// 	});

// 	ArToolkitContext.init(() => {
// 		camera.projectionMatrix.copy(ArToolkitContext.getProjectionMatrix());
// 	});

// 	ArMarkerControls = new THREEx.ArMarkerControls(ArToolkitContext, camera, {
// 		type: "pattern",
// 		patternUrl: "./markers/hiro.patt",
// 		changeMatrixMode: "cameraTransformMatrix",
// 	});

// 	scene.visible = false;

// 	const geometry = new THREE.BoxGeometry(1, 1, 1);
// 	const material = new THREE.MeshNormalMaterial({
// 		transparent: true,
// 		opacity: 0.5,
// 		side: THREE.DoubleSide,
// 	});
// 	const cube = new THREE.Mesh(geometry, material);
// 	cube.position.y = 0.5;

// 	scene.add(cube);
// };

// const onWindowResize = () => {
// 	camera.aspect = window.innerWidth / window.innerHeight;
// 	camera.updateProjectionMatrix();

// 	renderer.setSize(window.innerWidth, window.innerHeight);
// };

// const animate = () => {
// 	renderer.setAnimationLoop(render);
// 	ArToolkitContext.update(ArToolkitSource.domElement);
// 	scene.visible = camera.visible;
// };

// const render = () => {
// 	renderer.render(scene, camera);
// };

// init();
// animate();

var scene, camera, renderer, clock, deltaTime, totalTime;

var arToolkitSource, arToolkitContext;

var markerRoot1, markerRoot2;

var mesh1;

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

	let geometry1 = new THREE.CubeGeometry(1, 1, 1);
	let material1 = new THREE.MeshNormalMaterial({
		transparent: true,
		opacity: 0.5,
		side: THREE.DoubleSide,
	});

	mesh1 = new THREE.Mesh(geometry1, material1);
	mesh1.position.y = 0.5;

	markerRoot1.add(mesh1);
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
