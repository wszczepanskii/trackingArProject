import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";

let scene, camera, renderer, clock, deltaTime, totalTime;

let arToolkitSource, arToolkitContext;

let markerRoot1, markerRoot2;

const animationBtn = document.querySelector(".play-animation");
const changeNameBtn = document.querySelector(".change-name");

let mixer,
	hasLoaded = false,
	clicked = false,
	hasLoadedAnim = false;

let composer1;

let model1, modelAnimations;

let modelArray = [];
let currentModelIndex = 0;

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

	const laodModel = (url) => {
		return new Promise((resolve) => {
			new GLTFLoader().load(url, resolve);
		});
	};

	let p1 = laodModel("models/doc_new.glb").then((result) => {
		model1 = result.scene;
		modelAnimations = result.animations;
		modelArray[0] = result;
		modelArray[0].scene.scale.set(
			1.2 * modelArray[0].scene.scale.x,
			1.2 * modelArray[0].scene.scale.y,
			1.2 * modelArray[0].scene.scale.z
		);

		modelArray[0].scene.position.y = 0.25;
		modelArray[0].scene.rotation.x = -Math.PI / 2;

		hasLoadedAnim = true;
	});

	let p2 = laodModel("models/celery.glb").then((result) => {
		console.log("start");
		modelArray[1] = result;
		modelArray[1].scene.scale.set(
			1.2 * modelArray[1].scene.scale.x,
			1.2 * modelArray[1].scene.scale.y,
			1.2 * modelArray[1].scene.scale.z
		);

		console.log("middle");

		modelArray[1].scene.position.y = 0.25;
		modelArray[1].scene.rotation.x = -Math.PI / 2;
		hasLoaded = true;
		console.log("end");
	});

	const displayModel = (idx) => {
		Promise.all([p1, p2]).then(() => {
			markerRoot1.add(modelArray[idx].scene);
		});
	};

	// const loadModel = (idx) => {
	// 	loader = new GLTFLoader().setPath("models/");
	// 	loader.load(modelArray[idx], (glb) => {
	// 		glbScene = glb.scene;
	// 		glbModel = glb;
	// 		glbAnimations = glb.animations.length;
	// 		glbScene.scale.set(
	// 			1.2 * glb.scene.scale.x,
	// 			1.2 * glb.scene.scale.y,
	// 			1.2 * glb.scene.scale.z
	// 		);

	// 		hasLoaded = true;

	// 		console.log(glb);

	// 		glbScene.position.y = 0.25;
	// 		glbScene.rotation.x = -Math.PI / 2;
	// 		markerRoot1.add(glbScene);
	// 	});
	// };

	window.addEventListener("load", displayModel(currentModelIndex));

	changeNameBtn.addEventListener("click", () => {
		if (hasLoaded) {
			if (currentModelIndex === 0) {
				markerRoot1.remove(modelArray[0].scene);
				currentModelIndex++;
				displayModel(currentModelIndex);
			} else if (currentModelIndex === 1) {
				markerRoot1.remove(modelArray[1].scene);
				currentModelIndex = 0;
				displayModel(currentModelIndex);
			}
		}
	});
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
	if (hasLoadedAnim) {
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
