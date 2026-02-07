// main.js
import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  moveSpeed: 0.2,
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: {x: 1.53, y: 8.8, z: 5.22}
  },
  atmosphere: {
    backgroundColor: 0x3d4a59,
    fogColor: 0x3d4a59,
    fogNear: 25,
    fogFar: 70
  },

  lights: {
    ambient: { color: 0x404050, intensity: 1.5 },
    directional: { color: 0x7080a0, intensity: 0.5, position: { x: -4, y: 6, z: 2 } },
    rim: { color: 0x505070, intensity: 0.2, position: { x: 0, y: 2, z: -5 } },
    overhead: { 
      color: 0xffffff, 
      intensity: 2, 
      position: { x: 0, y: 15, z: 0 },
      distance: 50,
      decay: 1
    },

     ceiling: {
      color: 0xfff5e6,
      intensity: 0.8,
      position: { x: 0, y: 12, z: 0 },
      distance: 30,
      decay: 2.5
    }
  },

  snoop: {
    path: '/models/snoopy.glb',
    position: {x: 0, y: 0, z: 1
    },
    scale: {x: 1, y: 1,z: 1}
  },

  framez: {
    path: '/models/frame2.glb',
    position: {x: 2, y:6, z: 1.5},
    scale: {x: 1, y: 1,z: 1},
    rotation: {x: 0, y: -0.6, z: 0},
  },

  frame2: {
    path: '/models/frame2.glb',
    videoPath: "/videos/klcc.mp4",
    position: {x: 0.3, y: 6, z: 1},
    rotation: {x: 0, y: -0.15, z: 0},
    scale: {x: 0.7, y: 0.7,z: 0.7}
  },

  framefunnyVid: {
    path: '/models/frame2.glb',
    videoPath: "/videos/funnyVid.mp4" ,
    position: {x: -1.5, y: 6, z: 1},
    rotation: {x: 0, y: 0.2, z: 0},
    scale: {x: 0.6, y: 0.6,z: 0.6}
  },

  thearc: {
    path: '/models/thearc.glb',
    position: {x: 0, y: 0, z: 0},
    scale: {x: 1, y: 1,z: 1}
  },

  candle: {
    path: '/models/scented_candle.glb',
    position: {x: -1, y: 6.3, z: 2},
    scale: {x: 3, y: 3,z: 3},
    hasLight: true
  },

  flowers: {
    path: '/models/flower1.glb',
    position: {x: 0.4, y: 6.3, z: 2.2},
    scale: {x: 10, y: 10,z: 10},
    rotation: {x: 0, y: 1.3,z: 0},
}}


function loadCandleWithLight(scene, modelConfig) {
  const loader = new GLTFLoader();
  
  loader.load(
    modelConfig.path,
    (gltf) => {
      const { x, y, z } = modelConfig.position;
      gltf.scene.position.set(x, y, z);
      gltf.scene.scale.set(
        modelConfig.scale.x,
        modelConfig.scale.y,
        modelConfig.scale.z
      );
      
      // Make flame mesh glow
      gltf.scene.traverse((child) => {
        if (child.isMesh && child.name.includes('flame')) {
          child.material.emissive = new THREE.Color(0xff9933);
          child.material.emissiveIntensity = 2;
        }
      });
      
      scene.add(gltf.scene);
      
      // Add point light
      const candleLight = new THREE.PointLight(0xff9933, 1, 10, 3);
      candleLight.position.set(x, y + 2, z);
      candleLight.castShadow = true;
      scene.add(candleLight);
      
      // Add flickering animation
      candleLight.userData.originalIntensity = 100;
      candleLight.userData.time = Math.random() * 100;
    }
  );
}



function loadVideoFrame(scene, modelConfig) {
  const video = document.createElement('video');
  video.src = modelConfig.videoPath;
  video.loop = true;
  video.muted = true; // Start muted (guaranteed to work)
  video.playsInline = true; 
  video.crossOrigin = "anonymous";
  video.preload = "auto";
  
  // Play immediately (will work because muted)
  video.play()
    .then(() => {
      console.log('✅ Video playing (muted)');
      
      // Unmute after 100ms
      // setTimeout(() => {
      //   video.muted = false;
      //   video.volume = 0.03;
      //   console.log('🔊 Video unmuted');
      // }, 100);
    })
    .catch(err => {
      console.log('❌ Video failed:', err);
    });
  
  // Fallback: ensure unmute on interaction
  document.addEventListener('click', () => {
    if (video.muted) {
      video.muted = false;
      video.volume = 0.01;
      console.log('🔊 Video unmuted on click');
    }
  }, { once: true });

  // Create texture and load model (same as before)
  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.colorSpace = THREE.SRGBColorSpace;
  videoTexture.flipY = false;

  const loader = new GLTFLoader();
  loader.load(modelConfig.path, (gltf) => {
    const model = gltf.scene;

    model.traverse((child) => {
      if (child.isMesh && child.material.name === 'Material.001') {
        child.material = new THREE.MeshBasicMaterial({ map: videoTexture });
        videoTexture.wrapS = videoTexture.wrapT = THREE.ClampToEdgeWrapping;

        const myZoom = 1.7;
        const myOffsetX = 0.0;
        const myOffsetY = 0.0;

        const videoAspect = video.videoWidth / video.videoHeight;
        const frameAspect = 0.24;
        const ratio = frameAspect / videoAspect;

        videoTexture.repeat.set(myZoom, myZoom * ratio);
        videoTexture.offset.set(
          (0.9 - videoTexture.repeat.x) / 2 + myOffsetX,
          (1 - videoTexture.repeat.y) / 2 + myOffsetY
        );
      }
    });

    model.position.set(modelConfig.position.x, modelConfig.position.y, modelConfig.position.z);
    model.scale.set(modelConfig.scale.x, modelConfig.scale.y, modelConfig.scale.z);
    if (modelConfig.rotation) {
      model.rotation.set(modelConfig.rotation.x, modelConfig.rotation.y, modelConfig.rotation.z);
    }

    scene.add(model);
  });
}

// ============================================
// SCENE SETUP
// ============================================
function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.atmosphere.backgroundColor);
  scene.fog = new THREE.Fog(
    CONFIG.atmosphere.fogColor,
    CONFIG.atmosphere.fogNear,
    CONFIG.atmosphere.fogFar
  );
  return scene;
}

function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    CONFIG.camera.fov,
    window.innerWidth / window.innerHeight,
    CONFIG.camera.near,
    CONFIG.camera.far
  );
  const { x, y, z } = CONFIG.camera.position;
  camera.position.set(x, y, z);
  return camera;
}

function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  return renderer;
}

// ============================================
// LIGHTING
// ============================================
function setupLighting(scene) {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(
    CONFIG.lights.ambient.color,
    CONFIG.lights.ambient.intensity
  );
  scene.add(ambientLight);

  // Directional light
  const directionalLight = new THREE.DirectionalLight(
    CONFIG.lights.directional.color,
    CONFIG.lights.directional.intensity
  );
  const { x, y, z } = CONFIG.lights.directional.position;
  directionalLight.position.set(x, y, z);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Rim light
  const rimLight = new THREE.DirectionalLight(
    CONFIG.lights.rim.color,
    CONFIG.lights.rim.intensity
  );
  const rimPos = CONFIG.lights.rim.position;
  rimLight.position.set(rimPos.x, rimPos.y, rimPos.z);
  scene.add(rimLight);

  // Overhead soft white light
  const overheadLight = new THREE.PointLight(
    CONFIG.lights.overhead.color,
    CONFIG.lights.overhead.intensity,
    CONFIG.lights.overhead.distance,
    CONFIG.lights.overhead.decay
  );
  const overheadPos = CONFIG.lights.overhead.position;
  overheadLight.position.set(overheadPos.x, overheadPos.y, overheadPos.z);
  overheadLight.castShadow = true;
  scene.add(overheadLight);
}

// ============================================
// MODEL LOADING
// ============================================
function loadModel(scene, modelConfig) {
  const loader = new GLTFLoader();
  
  loader.load(
    modelConfig.path,
    (gltf) => {
      console.log('✅ Model loaded successfully');
      const { x, y, z } = modelConfig.position;
      gltf.scene.position.set(x, y, z);
      const scale = modelConfig.scale;
      gltf.scene.scale.set(scale.x, scale.y, scale.z);

      if (modelConfig.rotation) {
        gltf.scene.rotation.set(
          modelConfig.rotation.x,
          modelConfig.rotation.y,
          modelConfig.rotation.z
        );
      }

      scene.add(gltf.scene);
    },
    (progress) => {
      const percent = (progress.loaded / progress.total * 100).toFixed(2);
      console.log(`Loading: ${percent}%`);
    },
    (error) => {
      console.error('❌ Error loading model:', error);
    }
  );
}

// ============================================
// CONTROLS
// ============================================
class KeyboardControls {
  constructor() {
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      space: false,
      shift: false
    };
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  onKeyDown(event) {
    const key = event.key.toLowerCase();
    
    if (key === ' ') {
      this.keys.space = true;
      event.preventDefault();
    } else if (key === 'shift') {
      this.keys.shift = true;
    } else if (this.keys.hasOwnProperty(key)) {
      this.keys[key] = true;
    }
  }

  onKeyUp(event) {
    const key = event.key.toLowerCase();
    
    if (key === ' ') {
      this.keys.space = false;
    } else if (key === 'shift') {
      this.keys.shift = false;
    } else if (this.keys.hasOwnProperty(key)) {
      this.keys[key] = false;
    }
  }

  isPressed(key) {
    return this.keys[key];
  }
}

function setupPointerLockControls(camera, renderer) {
  const controls = new PointerLockControls(camera, renderer.domElement);

  // Lock on click
  document.addEventListener('click', () => {
    controls.lock();
  });

  // Event listeners for lock/unlock
  controls.addEventListener('lock', () => {
    console.log('🎮 Controls active - WASD to move, mouse to look, ESC to exit');
  });

  controls.addEventListener('unlock', () => {
    console.log('🔓 Controls unlocked - click to re-enable');
  });

  return controls;
}

// ============================================
// MOVEMENT
// ============================================
function handleMovement(controls, camera, keyboardControls) {
  if (!controls.isLocked) return;

  const speed = CONFIG.moveSpeed;

  // Forward/Backward
  if (keyboardControls.isPressed('w')) {
    controls.moveForward(speed);
  }
  if (keyboardControls.isPressed('s')) {
    controls.moveForward(-speed);
  }

  // Left/Right
  if (keyboardControls.isPressed('a')) {
    controls.moveRight(-speed);
  }
  if (keyboardControls.isPressed('d')) {
    controls.moveRight(speed);
  }

  // Up/Down
  if (keyboardControls.isPressed('space')) {
    camera.position.y += speed;
  }
  if (keyboardControls.isPressed('shift')) {
    camera.position.y -= speed;
  }
}

// ============================================
// WINDOW RESIZE
// ============================================
function handleWindowResize(camera, renderer) {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ============================================
// ANIMATION LOOP
// ============================================
function createAnimationLoop(scene, camera, renderer, controls, keyboardControls) {
  function animate() {
    requestAnimationFrame(animate);
    
    handleMovement(controls, camera, keyboardControls);
    
    // Animate candle flicker
    scene.traverse((object) => {
      if (object.isLight && object.userData.originalIntensity) {
        object.userData.time += 0.05;
        const flicker = Math.sin(object.userData.time) * 20;
        object.intensity = object.userData.originalIntensity + flicker;
      }
    });

    renderer.render(scene, camera);
  }
  
  return animate;
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
  // 1. Core Setup
  const scene = createScene();
  const camera = createCamera();
  const renderer = createRenderer();
  window.camera = camera;
  
  // 2. Audio Setup
  const listener = new THREE.AudioListener();
  camera.add(listener);

  const bgm = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();

  // Load audio with proper callbacks
  audioLoader.load(
    '/audio/about_you.m4a',
    // Success callback
    (buffer) => {
      bgm.setBuffer(buffer);
      bgm.setLoop(true);
      bgm.setVolume(0.2);
      
      console.log('✅ BGM Loaded');
      
      // Try to play
      const attemptPlay = () => {
        const audioContext = THREE.AudioContext.getContext();
        
        if (audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            bgm.play();
            console.log('🎵 BGM Playing (after resume)');
          }).catch(err => {
            console.log('⚠️ BGM autoplay blocked:', err.message);
          });
        } else {
          bgm.play();
          console.log('🎵 BGM Playing');
        }
      };
      
      // Attempt immediate play
      // attemptPlay();
      
      // Fallback: retry on first interaction
      // const retryPlay = () => {
      //   if (!bgm.isPlaying && bgm.buffer) {
      //     attemptPlay();
      //   }
      // };
      
      document.addEventListener('click', retryPlay, { once: true });
      document.addEventListener('keydown', retryPlay, { once: true });
    },
    // Progress callback
    (xhr) => {
      if (xhr.total > 0) {
        const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
        console.log(`Loading BGM: ${percent}%`);
      }
    },
    // Error callback
    (error) => {
      console.error('❌ Failed to load BGM:', error);
    }
  );


// ============================================
  // START SCREEN HANDLER
  // ============================================
  const startScreen = document.getElementById('start-screen');
  let hasStarted = false;
  
  startScreen.addEventListener('click', () => {
    if (hasStarted) return;
    hasStarted = true;
    
    // Fade out the start screen
    startScreen.classList.add('fade-out');
    
    // Remove after animation completes
    setTimeout(() => {
      startScreen.style.display = 'none';
    }, 500);
    
    // Resume audio context (for BGM)
    if (THREE.AudioContext.getContext().state === 'suspended') {
      THREE.AudioContext.getContext().resume();
    }
    
    // Start BGM if it's not playing
    if (window.bgm && !window.bgm.isPlaying && window.bgm.buffer) {
      window.bgm.play();
      console.log('🎵 BGM Started');
    }
    
    console.log('🎮 Game Started');
  });
  
  // Store bgm globally so start screen can access it
  window.bgm = bgm;
  



  // 3. Load Models & Video
  setupLighting(scene);
  loadModel(scene, CONFIG.framez);
  loadModel(scene, CONFIG.thearc);
  loadModel(scene, CONFIG.snoop);
  loadVideoFrame(scene, CONFIG.frame2);
  loadVideoFrame(scene,CONFIG.framefunnyVid);
  loadModel(scene,CONFIG.flowers);
  loadCandleWithLight(scene, CONFIG.candle);

  // 4. Controls & Loop
  const keyboardControls = new KeyboardControls();
  const pointerControls = setupPointerLockControls(camera, renderer);
  
  document.body.appendChild(renderer.domElement);
  handleWindowResize(camera, renderer);
  
  const animate = createAnimationLoop(scene, camera, renderer, pointerControls, keyboardControls);
  animate();
  
  console.log('🎨 3D Scene initialized');
}

// Start the application
init();