import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import gsap from "gsap";

import { RECIPIENT_NAME, AGE } from "./config.js";
import { soundManager } from "./utils/audio.js";
import { setupResize } from "./utils/resize.js";
import {
  createStarfield,
  createConfettiSystem,
  createBalloonsGroup,
  createFireworksSystem,
  createSmokePuff,
} from "./utils/particles.js";

import { createCakeScene } from "./scenes/cake.js";
import { createGalleryScene } from "./scenes/gallery.js";
import { setupIntroScene } from "./scenes/intro.js";
import { setupCelebrationScene } from "./scenes/celebration.js";
import { setupPinModal } from "./scenes/pin.js";
import { setupMessageScene } from "./scenes/message.js";
import { setupFinaleScene } from "./scenes/finale.js";

import "./style.css";

// Check prefers-reduced-motion
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 1. Scene, Camera, Renderer
const canvas = document.getElementById("webgl-canvas");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0714);
scene.fog = new THREE.FogExp2(0x0c0714, 0.032);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 2.8, 9.5);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

// OrbitControls (limited for polished camera experience)
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't flip below floor
controls.minDistance = 4;
controls.maxDistance = 14;
controls.target.set(0, 1.2, 0);
controls.enableZoom = false; // Keep smooth UX, enable pan/orbit only

// Post-Processing: Bloom
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  prefersReducedMotion ? 0.4 : 0.85, // bloom strength
  0.35,                              // radius
  0.7                                // threshold
);

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

setupResize(camera, renderer, composer);

// 2. Lighting Setup
const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.75);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
keyLight.position.set(6, 10, 7);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xec4899, 0.4);
fillLight.position.set(-7, 6, -5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0x8ecae6, 0.5);
rimLight.position.set(0, -5, -8);
scene.add(rimLight);

// 3. Particle Systems & Helpers
const smokePuff = createSmokePuff();
scene.add(smokePuff.object);

const starfield = createStarfield(prefersReducedMotion ? 250 : 650);
scene.add(starfield.object);

const confettiSystem = createConfettiSystem(prefersReducedMotion ? 120 : 320);
scene.add(confettiSystem.object);

const balloonsGroup = createBalloonsGroup(prefersReducedMotion ? 6 : 14);
scene.add(balloonsGroup.object);

const fireworksSystem = createFireworksSystem();
scene.add(fireworksSystem.object);

// 4. Core 3D Scenes
const cakeScene = createCakeScene(smokePuff);
scene.add(cakeScene.group);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const galleryScene = createGalleryScene(camera, raycaster);
galleryScene.group.position.set(0, 1.5, 0);
galleryScene.group.visible = false;
scene.add(galleryScene.group);

// 5. State Machine & Scene Transitions
let currentStage = "INTRO"; // INTRO, CAKE, CELEBRATION, MESSAGE, GALLERY, FINALE

// DOM Elements
const cakeBanner = document.getElementById("scene-cake-banner");
const blowBtn = document.getElementById("btn-blow-candles");
const soundToggleBtn = document.getElementById("btn-sound-toggle");
const loadingScreen = document.getElementById("loading-screen");
const progressBar = document.getElementById("progress-bar");

// Hide loading screen after assets ready
setTimeout(() => {
  if (progressBar) progressBar.style.width = "100%";
  gsap.to(loadingScreen, {
    opacity: 0,
    duration: 0.8,
    delay: 0.2,
    ease: "power2.out",
    onComplete: () => {
      loadingScreen.classList.add("hidden");
    },
  });
}, 800);

// Sound Button Toggle
if (soundToggleBtn) {
  soundToggleBtn.addEventListener("click", () => {
    const isMuted = soundManager.toggleMute();
    soundToggleBtn.classList.toggle("muted", isMuted);
    soundToggleBtn.setAttribute("aria-label", isMuted ? "Unmute sound" : "Mute sound");
  });
}

// Blow candles handler
function triggerCandleBlow() {
  if (cakeScene.isBlownOut) return;
  cakeScene.extinguish(() => {
    // Hide cake banner
    gsap.to(cakeBanner, {
      opacity: 0,
      y: -20,
      duration: 0.5,
      onComplete: () => cakeBanner.classList.add("hidden"),
    });

    // Move to Celebration Stage
    currentStage = "CELEBRATION";
    celebrationController.startCelebration();
  });
}

if (blowBtn) {
  blowBtn.addEventListener("click", triggerCandleBlow);
}

// Raycast Click on 3D Canvas
window.addEventListener("click", (e) => {
  // Ignore clicks on HTML buttons
  if (e.target.closest("button") || e.target.closest("a") || e.target.closest(".interactive-ui")) {
    return;
  }

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (currentStage === "CAKE" && !cakeScene.isBlownOut) {
    const cakeIntersects = raycaster.intersectObjects(cakeScene.group.children, true);
    if (cakeIntersects.length > 0) {
      triggerCandleBlow();
    }
  } else if (currentStage === "GALLERY") {
    const galleryIntersects = raycaster.intersectObjects(galleryScene.cards, true);
    if (galleryIntersects.length > 0) {
      galleryScene.handleCardClick(galleryIntersects[0].object);
    }
  }
});

// Scene Controllers
setupIntroScene(() => {
  // Move to Cake Stage
  currentStage = "CAKE";

  // Smooth camera zoom toward cake
  gsap.to(camera.position, {
    x: 0,
    y: 2.1,
    z: 6.2,
    duration: 2.0,
    ease: "power3.inOut",
  });

  gsap.to(controls.target, {
    x: 0,
    y: 1.1,
    z: 0,
    duration: 2.0,
    ease: "power3.inOut",
  });

  // Reveal Cake UI banner
  cakeBanner.classList.remove("hidden");
  gsap.fromTo(
    cakeBanner,
    { opacity: 0, y: 25 },
    { opacity: 1, y: 0, duration: 0.9, delay: 1.2, ease: "power2.out" }
  );
});

const celebrationController = setupCelebrationScene(
  confettiSystem,
  balloonsGroup,
  () => {
    // Show Secret PIN verification modal before reading the letter
    currentStage = "PIN";
    pinController.show();
  }
);

const pinController = setupPinModal(() => {
  // PIN verified! Proceed to Personal Message Stage
  currentStage = "MESSAGE";

  // Camera move
  gsap.to(camera.position, {
    x: 0,
    y: 3.5,
    z: 7.2,
    duration: 1.8,
    ease: "power2.inOut",
  });

  // Lower the cake slightly into background
  gsap.to(cakeScene.group.position, {
    y: -2.0,
    duration: 1.6,
    ease: "power2.inOut",
  });

  messageController.showMessage();
});

const messageController = setupMessageScene(() => {
  // Move to Memories Gallery Stage
  currentStage = "GALLERY";

  // Hide cake
  cakeScene.group.visible = false;
  // Show 3D photo carousel
  galleryScene.group.visible = true;

  // Reveal gallery HUD instructions
  const galleryHUD = document.getElementById("scene-gallery-hud");
  if (galleryHUD) {
    galleryHUD.classList.remove("hidden");
    gsap.fromTo(
      galleryHUD,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
    );
  }

  // Camera for carousel view (pulled back on mobile portrait to fit view)
  const isMobile = window.innerWidth <= 600;
  gsap.to(camera.position, {
    x: 0,
    y: isMobile ? 0.9 : 1.2,
    z: isMobile ? 12.0 : 8.8,
    duration: 1.8,
    ease: "power2.inOut",
  });
  gsap.to(controls.target, {
    x: 0,
    y: isMobile ? 0.9 : 1.2,
    z: 0,
    duration: 1.8,
    ease: "power2.inOut",
  });
});

// Gallery HUD "To Finale" Button
const btnToFinale = document.getElementById("btn-to-finale");
if (btnToFinale) {
  btnToFinale.addEventListener("click", () => {
    soundManager.playClick();
    const galleryHUD = document.getElementById("scene-gallery-hud");
    gsap.to(galleryHUD, {
      opacity: 0,
      y: -20,
      duration: 0.5,
      onComplete: () => {
        galleryHUD.classList.add("hidden");
        currentStage = "FINALE";

        // Hide gallery, bring back cake in festive pose
        galleryScene.group.visible = false;
        cakeScene.group.visible = true;
        gsap.to(cakeScene.group.position, { y: 0, duration: 1.0 });

        // Wide panoramic camera for fireworks
        gsap.to(camera.position, {
          x: 0,
          y: 3.2,
          z: 9.8,
          duration: 2.0,
          ease: "power2.inOut",
        });

        finaleController.showFinale();
      },
    });
  });
}

const finaleController = setupFinaleScene(fireworksSystem, () => {
  // Reset and Replay Experience
  currentStage = "INTRO";
  finaleController.stop();

  cakeScene.reset();
  cakeScene.group.visible = true;
  cakeScene.group.position.set(0, 0, 0);
  galleryScene.group.visible = false;

  const introEl = document.getElementById("scene-intro");
  introEl.classList.remove("hidden");
  introEl.style.opacity = "1";
  document.getElementById("btn-open").style.opacity = "1";
  document.getElementById("btn-open").style.transform = "scale(1)";
  document.getElementById("intro-content").style.opacity = "1";
  document.getElementById("intro-content").style.filter = "none";
  document.getElementById("intro-content").style.transform = "none";

  gsap.to(camera.position, {
    x: 0,
    y: 2.8,
    z: 9.5,
    duration: 1.5,
    ease: "power2.inOut",
  });
  gsap.to(controls.target, {
    x: 0,
    y: 1.2,
    z: 0,
    duration: 1.5,
    ease: "power2.inOut",
  });
});

// 6. Main Animation Loop
let previousTime = performance.now();

function animate(currentTime = performance.now()) {
  requestAnimationFrame(animate);

  const delta = Math.min((currentTime - previousTime) / 1000, 0.1);
  previousTime = currentTime;
  const time = currentTime / 1000;

  // Controls update
  controls.update();

  // Particle updates
  starfield.update(delta, time);
  confettiSystem.update(delta, time);
  balloonsGroup.update(delta, time);
  smokePuff.update(delta);
  fireworksSystem.update(delta);

  // Scene updates
  if (cakeScene.group.visible) {
    cakeScene.update(delta, time);
  }

  if (galleryScene.group.visible) {
    galleryScene.update(delta);
  }

  // Render through Bloom EffectComposer
  composer.render();
}

animate();
