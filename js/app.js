import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";

let scene, camera, renderer, clock, deltaTime, totalTime;

let arToolkitSource, arToolkitContext;

let markerRoot1, markerRoot2;

const animationBtn = document.querySelector(".play-animation");

let mesh1,
	glbScene,
	mixer,
	hasLoaded = false,
	glbModel,
	glbAnimations,
	clicked = false;

let composer1;

let loader, model1, model2, modelAnimations;

const initialize = () => {
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
	// renderer.setSize(640, 480);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.domElement.style.position = "absolute";
	renderer.domElement.style.top = "0px";
	renderer.domElement.style.left = "0px";
	document.body.appendChild(renderer.domElement);

	composer1 = new EffectComposer(renderer);

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
			arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
		}
	};

	arToolkitSource.init(() => {
		setTimeout(() => {
			onResize();
		}, 700);
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
		}
	);

	markerRoot2 = new THREE.Group();
	scene.add(markerRoot2);
	let markerControls2 = new THREEx.ArMarkerControls(
		arToolkitContext,
		markerRoot2,
		{
			type: "pattern",
			patternUrl: "markers/hiro.patt",
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

	const onProgress = (xhr) => {
		console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
	};

	const onError = (xhr) => {
		console.error(xhr);
	};

	const laodModel = (url) => {
		return new Promise((resolve) => {
			new GLTFLoader().load(url, resolve);
		});
	};

	let p1 = laodModel("models/celery.glb").then((result) => {
		model1 = result.scene;
		modelAnimations = result.animations;
	});

	let p2 = laodModel("models/chair.glb").then((result) => {
		model2 = result.scene;
	});

	Promise.all([p1, p2]).then(() => {
		model1.scale.set(
			1.2 * model1.scale.x,
			1.2 * model1.scale.y,
			1.2 * model1.scale.z
		);

		model1.position.y = 0.25;
		model1.rotation.x = -Math.PI / 2;

		model2.scale.set(
			1.2 * model2.scale.x,
			1.2 * model2.scale.y,
			1.2 * model2.scale.z
		);

		model2.position.y = 0.25;
		model2.rotation.x = -Math.PI / 2;

		markerRoot1.add(model1);
		markerRoot2.add(model2);

		hasLoaded = true;
	});

	// const loadModel = (model) => {
	// 	loader = new GLTFLoader().setPath("models/");
	// 	loader.load(
	// 		model + ".glb",
	// 		(glb) => {
	// 			glbScene = glb.scene;
	// 			glbModel = glb;
	// 			glbAnimations = glb.animations.length;
	// 			glbScene.scale.set(
	// 				1.2 * glb.scene.scale.x,
	// 				1.2 * glb.scene.scale.y,
	// 				1.2 * glb.scene.scale.z
	// 			);

	// 			hasLoaded = true;

	// 			console.log(glb);

	// 			glbScene.position.y = 0.25;
	// 			glbScene.rotation.x = -Math.PI / 2;
	// 			markerRoot1.add(glbScene)
	// 		},
	// 		onProgress,
	// 		onError
	// 	);
	// };

	// loadModel("doc_animated_light2");
	// setTimeout(() => {
	// 	markerRoot1.add(glbScene);
	// }, 200);

	// loadModel("chair");
	// setTimeout(() => {
	// 	markerRoot2.add(glbScene);
	// }, 200);
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

initialize();
animate();

animationBtn.addEventListener("click", () => {
	if (hasLoaded) {
		clicked = true;
		mixer = new THREE.AnimationMixer(model1);
		const clips = modelAnimations;
		const clip = THREE.AnimationClip.findByName(clips, "Take 001");
		const action = mixer.clipAction(clip);
		action.play();
		clips.forEach((clip) => {
			mixer.clipAction(clip).play();
		});
	}
});
