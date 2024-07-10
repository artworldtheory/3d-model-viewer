let scene, camera, renderer, model, controls;
const container = document.getElementById('container');
let audioLoader, listener, sound;
let audioFiles = [
    'assets/11_WIP_.mp3',
    'assets/86_WIP_.mp3',
    'assets/90 V1_WIP_.mp3',
    'assets/91_WIP_.mp3'
];
let currentAudioIndex = 0;

init();
animate();

function init() {
    console.log('Initializing scene...');
    // Scene setup
    scene = new THREE.Scene();
    console.log('Scene created.');

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 150, 200); // Move the camera back to ensure the whole model is visible
    console.log('Camera initialized.');

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0xffffff); // Set background to white
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    console.log('Renderer initialized.');

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    console.log('Ambient light added.');

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
    console.log('Directional light added.');

    // OrbitControls setup
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    // AxesHelper to visualize the axes
    const axesHelper = new THREE.AxesHelper(500);
    scene.add(axesHelper);
    console.log('AxesHelper added.');

    // Load model
    const loader = new THREE.GLTFLoader();
    loader.load('assets/Buttons2.gltf', function(gltf) {
        console.log('Model loaded successfully.');
        model = gltf.scene;
        model.position.set(0, 0, 0);
        model.rotation.x += Math.PI / 1;
        model.scale.set(100, 100, 100); // Scale the model to half its previous size
        scene.add(model);
        controls.target.set(0, 0, 0); // Ensure the controls target the center of the model
        controls.update();

        // BoxHelper to visualize the model's bounding box
        const boxHelper = new THREE.BoxHelper(model, 0xff0000);
        scene.add(boxHelper);
        console.log('BoxHelper added.');

        console.log('Model structure:', model);
        setupModelControls();
    }, undefined, function (error) {
        console.error('Error loading model:', error);
    });

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Create audio listener and loader
    listener = new THREE.AudioListener();
    camera.add(listener);
    audioLoader = new THREE.AudioLoader();
}

function setupModelControls() {
    if (!model) {
        console.error('Model is not loaded.');
        return;
    }

    const playButton = model.getObjectByName('PlayButton');
    const pauseButton = model.getObjectByName('PauseButton');
    const forwardButton = model.getObjectByName('ForwardButton');
    const backwardButton = model.getObjectByName('BackwardButton');

    if (!playButton || !pauseButton || !forwardButton || !backwardButton) {
        console.error('One or more buttons are not found on the model.');
        return;
    }

    playButton.userData = { action: () => { console.log('Play button pressed.'); playAudio(audioFiles[currentAudioIndex]); } };
    pauseButton.userData = { action: () => { console.log('Pause button pressed.'); pauseAudio(); } };
    forwardButton.userData = { action: () => { console.log('Forward button pressed.'); nextAudio(); } };
    backwardButton.userData = { action: () => { console.log('Backward button pressed.'); previousAudio(); } };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onDocumentMouseDown(event) {
        event.preventDefault();
        console.log('Mouse down event detected.');

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(model.children, true);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.userData.action) {
                console.log('Executing action for:', object.name);
                object.userData.action();
            } else {
                console.log('No action found for:', object.name);
            }
        } else {
            console.log('No intersections found.');
        }
    }

    window.addEventListener('mousedown', onDocumentMouseDown, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
    renderer.render(scene, camera);
}

function playAudio(url) {
    if (!sound) {
        sound = new THREE.Audio(listener);
        audioLoader.load(url, function(buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(false);
            sound.setVolume(0.5);
            sound.play();
        });
    } else {
        if (sound.isPlaying) {
            sound.stop();
        }
        audioLoader.load(url, function(buffer) {
            sound.setBuffer(buffer);
            sound.play();
        });
    }
}

function pauseAudio() {
    if (sound && sound.isPlaying) {
        sound.pause();
    }
}

function nextAudio() {
    currentAudioIndex = (currentAudioIndex + 1) % audioFiles.length;
    playAudio(audioFiles[currentAudioIndex]);
}

function previousAudio() {
    currentAudioIndex = (currentAudioIndex - 1 + audioFiles.length) % audioFiles.length;
    playAudio(audioFiles[currentAudioIndex]);
}
