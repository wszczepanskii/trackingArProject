import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

var scene, camera, renderer, clock, deltaTime, totalTime;

var arToolkitSource, arToolkitContext;

var markerRoot1, markerRoot2;

const animationBtn = document.querySelector(".play-animation");

var mesh1,
	glbScene,
	mixer,
	hasLoaded = false,
	glbModel,
	clicked = false;

initialize();
animate();

function initialize() {
	scene = new THREE.Scene();

	let ambientLight = new THREE.AmbientLight(0xcccccc, 1);
	scene.add(ambientLight);

	camera = new THREE.Camera();
	scene.add(camera);

	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true,
	});
	renderer.setClearColor(new THREE.Color("lightgrey"), 0);
	renderer.setSize(window.innerWidth, window.innerHeight);
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
		arToolkitSource.onResizeElement();
		arToolkitSource.copyElementSizeTo(renderer.domElement);
		if (arToolkitContext.arController !== null) {
			arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
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
		detectionMode: "mono_and_matrix",
		// matrixCodeType: "3x3",
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
			patternUrl: "markers/vhsoft_pattern.patt",
			// barcodeValue: "6",
			// smoothCount: "10",
			// changeMatrixMode: "cameraTransformMatrix",
		}
	);

	// let geometry1 = new THREE.PlaneGeometry(1, 1, 4, 4);
	// let material1 = new THREE.MeshBasicMaterial({
	// 	color: 0x0000ff,
	// 	opacity: 0.5,
	// });
	// mesh1 = new THREE.Mesh(geometry1, material1);
	// mesh1.rotation.x = -Math.PI / 2;
	// markerRoot1.add(mesh1);

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
				glbScene = glb.scene;
				glbModel = glb;
				glbScene.scale.set(
					1.2 * glb.scene.scale.x,
					1.2 * glb.scene.scale.y,
					1.2 * glb.scene.scale.z
				);

				hasLoaded = true;

				glbScene.position.y = 0.25;
				// glbScene.position.z = 1;
				glbScene.rotation.x = -Math.PI / 2;
				markerRoot1.add(glbScene);
			},
			onProgress,
			onError
		);
	}

	loadModel("doc_animated_light2");
}

function update() {
	// update artoolkit on every frame
	if (arToolkitSource.ready !== false)
		arToolkitContext.update(arToolkitSource.domElement);

	if (hasLoaded && mixer !== undefined && clicked) mixer.update(deltaTime);
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

animationBtn.addEventListener("click", () => {
	if (hasLoaded) {
		clicked = true;

		mixer = new THREE.AnimationMixer(glbScene);
		const clips = glbModel.animations;
		const clip = THREE.AnimationClip.findByName(clips, "Take 001");
		const action = mixer.clipAction(clip);
		action.play();

		clips.forEach((clip) => {
			mixer.clipAction(clip).play();
		});
	}
});
