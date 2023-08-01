import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let scene, camera, renderer, clock, deltaTime, totalTime;

let arToolkitSource, arToolkitContext;

let markerRoot1, markerRoot2;

const animationBtn = document.querySelector(".play-animation");

let glbScene,
	glbModel,
	glbAnimations,
	mixer,
	hasLoaded = false,
	clicked = false;

const initialize = () => {
	scene = new THREE.Scene();

	// let sceneLight = new THREE.PointLight(0xffffff, 0.5, 100);
	// scene.add(sceneLight);
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

	const onResize = () => {
		arToolkitSource.onResizeElement();
		arToolkitSource.copyElementSizeTo(renderer.domElement);
		if (arToolkitContext.arController !== null) {
			arToolkitSource.copyElementSizeTo(
				window.arToolkitContext.arController.canvas
			);
		}
	};

	arToolkitSource.init(() => {
		onResize();
	});

	// handle resize event
	window.addEventListener("resize", () => {
		onResize();
	});

	////////////////////////////////////////////////////////////
	// setup arToolkitContext
	////////////////////////////////////////////////////////////

	// create atToolkitContext
	arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: "js/camera_para.dat",
		detectionMode: "mono_and_matrix",
	});

	arToolkitContext.init(function onCompleted() {
		camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
		window.arToolkitContext = arToolkitContext;
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
		}
	);

	const onProgress = (xhr) => {
		console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
	};

	const onError = (xhr) => {
		console.error(xhr);
	};

	const loadModel = (model) => {
		let loader = new GLTFLoader().setPath("models/");
		loader.load(
			model + ".glb",
			(glb) => {
				glbScene = glb.scene;
				glbModel = glb;
				glbAnimations = glb.animations.length;

				glbScene.scale.set(
					1.5 * glb.scene.scale.x,
					1.5 * glb.scene.scale.y,
					1.5 * glb.scene.scale.z
				);

				hasLoaded = true;

				glbScene.position.y = -0.25;
				glbScene.position.z = 0.5;

				glbScene.rotation.x = -Math.PI / 2;
				markerRoot1.add(glbScene);
			},
			onProgress,
			onError
		);
	};

	loadModel("doc_animated_light2");
};

const update = () => {
	// update artoolkit on every frame
	if (arToolkitSource.ready !== false)
		arToolkitContext.update(arToolkitSource.domElement);

	if (hasLoaded && mixer !== undefined && clicked) mixer.update(deltaTime);
};

const render = () => {
	renderer.render(scene, camera);
};

const animate = () => {
	requestAnimationFrame(animate);
	deltaTime = clock.getDelta();
	totalTime += deltaTime;
	update();
	render();
};

animationBtn.addEventListener("click", () => {
	if (hasLoaded && glbAnimations !== 0) {
		clicked = true;

		mixer = new THREE.AnimationMixer(glbScene);
		const clips = glbModel.animations;
		const clip = THREE.AnimationClip.findByName(clips, "Take 001");
		const action = mixer.clipAction(clip);
		action.play();

		clips.forEach((clip) => {
			mixer.clipAction(clip).play();
		});
	} else if (hasLoaded && glbAnimations === 0) {
		alert("Model nie posiada animacji");
	}
});

initialize();
animate();
