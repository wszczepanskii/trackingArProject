import * as THREE from "three";
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";
// import { ARButton } from "three/addons/webxr/ARButton.js";
// import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// import { RGBELoader } from "three/addons/loaders/lwo/RGBELoader.js";

let camera, scene, renderer, controller, controls, reticle;
let ArToolkitSource, ArToolkitContext, ArMarkerControls;

const init = () => {
	const container = document.createElement("div");
	document.body.append(container);

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(
		70,
		window.innerWidth / window.innerHeight,
		0.01,
		40
	);

	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.useLegacyLights = false;
	renderer.xr.enabled = true;
	document.body.append(renderer.domElement);

	const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
	light.position.set(0.5, 1, 0.25);
	scene.add(light);

	window.addEventListener("resize", onWindowResize, false);

	ArToolkitSource = new THREEx.ArToolkitSource({
		sourceType: "webcam",
	});

	ArToolkitSource.init(() => {
		setTimeout(() => {
			ArToolkitSource.onResizeElement();
			ArToolkitSource.copyElementSizeTo(render.domElement);
		}, 2000);
	});

	ArToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: "camera_para.dat",
		detectionMode: "mono",
	});

	ArToolkitContext.init(() => {
		camera.projectionMatrix.copy(ArToolkitContext.getProjectionMatrix());
	});

	ArMarkerControls = new THREEx.ArMarkerControls(ArToolkitContext, camera, {
		type: "pattern",
		patternUrl: "./markers/hiro.patt",
		changeMatrixMode: "cameraTransformMatrix",
	});

	scene.visible = false;

	const geometry = new THREE.CubeGeometry(1, 1, 1);
	const material = new THREE.MeshNormalMaterial({
		transparent: true,
		opacity: 0.5,
		side: THREE.DoubleSide,
	});
	const cube = new THREE.Mesh(geometry, material);
	cube.position.y = 0.5;

	scene.add(cube);
};

const onWindowResize = () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
};

const animate = () => {
	renderer.setAnimationLoop(render);
	ArToolkitContext.update(ArToolkitSource.domElement);
	scene.visible = camera.visible;
};

const render = () => {
	renderer.render(scene, camera);
};

init();
animate();
