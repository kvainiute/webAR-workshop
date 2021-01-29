var scene, camera, renderer, clock, deltaTime, totalTime, mixer;
var arToolkitSource, arToolkitContext;
var markerRoot;
var mesh;

initialize();
animate();

function initialize() {
	scene = new THREE.Scene();

	let ambientLight = new THREE.AmbientLight(0xcccccc, 1.0);
	scene.add(ambientLight);

	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
	scene.add(camera);

	renderer = new THREE.WebGLRenderer({
		antialias: true,
		preserveDrawingBuffer: true,
		alpha: true
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.outputEncoding = THREE.sRGBEncoding;
	document.body.appendChild(renderer.domElement);

	clock = new THREE.Clock();
	deltaTime = 0;
	totalTime = 0;

	////////////////////////////////////////////////////////////
	// setup arToolkitSource
	////////////////////////////////////////////////////////////

	arToolkitSource = new THREEx.ArToolkitSource({
		sourceType: 'webcam',
	});

	function onResize() {
		arToolkitSource.onResize()
		arToolkitSource.copySizeTo(renderer.domElement)
		if (arToolkitContext.arController !== null) {
			arToolkitSource.copySizeTo(arToolkitContext.arController.canvas)
		}
	}

	arToolkitSource.init(function onReady() {
		onResize()
	});

	// handle resize event
	window.addEventListener('resize', function () {
		onResize()
	});

	////////////////////////////////////////////////////////////
	// setup arToolkitContext
	////////////////////////////////////////////////////////////	

	// create atToolkitContext
	arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: 'data/camera_para.dat',
		detectionMode: 'mono'
	});

	// copy projection matrix to camera when initialization complete
	arToolkitContext.init(function onCompleted() {
		camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
	});

	////////////////////////////////////////////////////////////
	// setup markerRoots
	////////////////////////////////////////////////////////////

	// build markerControls
	markerRoot = new THREE.Group();
	scene.add(markerRoot);
	let markerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
		type: 'pattern',
		patternUrl: "data/marker.patt",
	})

	//	let geometry = new THREE.IcosahedronGeometry(1, 5);
	//	geometry.translate(1, 1, 1)
	//	let material = new THREE.MeshBasicMaterial({
	//		color: 0x6281ef,
	//		opacity: 0.3
	//	});
	//	mesh = new THREE.Mesh(geometry, material);
	//	mesh.rotation.x = -Math.PI / 2;
	//	markerRoot.add(mesh);

	let loader = new THREE.GLTFLoader();
	loader.load('./scene.glb', function (gltf) {
		gltf.scene.scale.set(0.002, 0.005, 0.005);
		gltf.scene.position.x += 1
		mixer = new THREE.AnimationMixer(gltf.scene);
		gltf.animations.forEach((clip) => {
			mixer.clipAction(clip).play();

		});
		markerRoot.add(gltf.scene);
	});
}

function animate() {
	requestAnimationFrame(animate);

	deltaTime = clock.getDelta();
	totalTime += deltaTime;
	if (mixer) mixer.update(deltaTime);

	// update artoolkit on every frame
	if (arToolkitSource.ready !== false)
		arToolkitContext.update(arToolkitSource.domElement);

	renderer.render(scene, camera);
}
