import * as THREE from "three";
import gsap from "gsap";
import { PHOTOS, PHOTO_CAPTIONS, RECIPIENT_NAME } from "../config.js";
import { soundManager } from "../utils/audio.js";

export function createGalleryScene(camera, raycaster) {
  const galleryGroup = new THREE.Group();
  const cards = [];
  let currentAngle = 0;
  let targetAngle = 0;
  let isDragging = false;
  let previousMouseX = 0;
  let activeCard = null;

  const textureLoader = new THREE.TextureLoader();

  // Polaroid Card Geometry
  const cardWidth = 2.4;
  const cardHeight = 3.0;
  const frameGeom = new THREE.PlaneGeometry(cardWidth, cardHeight);
  const photoGeom = new THREE.PlaneGeometry(cardWidth * 0.88, cardHeight * 0.65);
  const captionGeom = new THREE.PlaneGeometry(cardWidth * 0.9, 0.5);

  const photoList = PHOTOS && PHOTOS.length > 0 ? PHOTOS : [
    "/photos/photo1.jpg",
    "/photos/photo2.jpg",
    "/photos/photo3.jpg",
    "/photos/photo4.jpg",
    "/photos/photo5.jpg"
  ];

  const totalCards = photoList.length;

  function getResponsiveSettings() {
    const isMobile = window.innerWidth <= 600;
    const cardScale = isMobile ? 0.75 : 1.0;
    const radius = Math.max(isMobile ? 4.4 : 5.2, totalCards * (isMobile ? 0.72 : 0.85));
    return { isMobile, cardScale, radius };
  }

  let { isMobile, cardScale, radius } = getResponsiveSettings();

  photoList.forEach((photoUrl, i) => {
    const cardGroup = new THREE.Group();
    const angle = (i / totalCards) * Math.PI * 2;

    // Position along cylinder/carousel
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const y = Math.sin(i * 1.5) * 0.35;

    cardGroup.position.set(x, y, z);
    cardGroup.rotation.y = angle;
    cardGroup.scale.set(cardScale, cardScale, cardScale);

    // 1. Polaroid White Frame
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xfbfbf9,
      roughness: 0.35,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const frameMesh = new THREE.Mesh(frameGeom, frameMat);
    cardGroup.add(frameMesh);

    // 2. Photo Surface
    const photoMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.FrontSide,
    });

    textureLoader.load(
      photoUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        photoMat.map = tex;
        photoMat.needsUpdate = true;
      },
      undefined,
      () => {
        // Fallback procedural canvas texture if load fails
        const fallbackCanvas = document.createElement("canvas");
        fallbackCanvas.width = 400;
        fallbackCanvas.height = 340;
        const ctx = fallbackCanvas.getContext("2d");
        ctx.fillStyle = "#ff758c";
        ctx.fillRect(0, 0, 400, 340);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 26px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Memory #${i + 1}`, 200, 150);
        ctx.font = "18px sans-serif";
        ctx.fillText(`With ${RECIPIENT_NAME}`, 200, 190);
        photoMat.map = new THREE.CanvasTexture(fallbackCanvas);
        photoMat.needsUpdate = true;
      }
    );

    const photoMesh = new THREE.Mesh(photoGeom, photoMat);
    photoMesh.position.set(0, 0.32, 0.015);
    cardGroup.add(photoMesh);

    // 3. Polaroid Handwritten Caption
    const captionCanvas = document.createElement("canvas");
    captionCanvas.width = 512;
    captionCanvas.height = 120;
    const cCtx = captionCanvas.getContext("2d");
    cCtx.fillStyle = "rgba(0,0,0,0)";
    cCtx.fillRect(0, 0, 512, 120);
    cCtx.fillStyle = "#332238";
    cCtx.font = "bold 44px 'Caveat', cursive, sans-serif";
    cCtx.textAlign = "center";
    cCtx.textBaseline = "middle";

    const captionText =
      (PHOTO_CAPTIONS && PHOTO_CAPTIONS[i]) ||
      `Memory #${i + 1} with ${RECIPIENT_NAME}`;
    cCtx.fillText(captionText, 256, 60);

    const captionTex = new THREE.CanvasTexture(captionCanvas);
    const captionMat = new THREE.MeshBasicMaterial({
      map: captionTex,
      transparent: true,
      side: THREE.FrontSide,
    });
    const captionMesh = new THREE.Mesh(captionGeom, captionMat);
    captionMesh.position.set(0, -0.95, 0.015);
    cardGroup.add(captionMesh);

    // Store card data for raycasting & animation
    cardGroup.userData = {
      index: i,
      baseAngle: angle,
      baseScale: cardScale,
      isZoomed: false,
      frameMesh,
    };

    galleryGroup.add(cardGroup);
    cards.push(cardGroup);
  });

  // Touch and Mouse Drag Carousel Controls
  function onPointerDown(e) {
    isDragging = true;
    previousMouseX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const deltaX = clientX - previousMouseX;
    previousMouseX = clientX;
    const sens = window.innerWidth <= 600 ? 0.0085 : 0.005;
    targetAngle += deltaX * sens;
  }

  function onPointerUp() {
    isDragging = false;
  }

  function onWheel(e) {
    targetAngle += e.deltaY * 0.0015;
  }

  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("wheel", onWheel, { passive: true });

  // Handle Resize for Responsive Carousel
  function handleResize() {
    const settings = getResponsiveSettings();
    cardScale = settings.cardScale;
    radius = settings.radius;

    cards.forEach((card) => {
      card.userData.baseScale = cardScale;
      if (activeCard !== card) {
        card.scale.set(cardScale, cardScale, cardScale);
      }
    });
  }
  window.addEventListener("resize", handleResize);

  // Click / Tap to Zoom on a Photo
  function handleCardClick(intersectedObject) {
    let clickedGroup = intersectedObject;
    while (clickedGroup && clickedGroup.userData.index === undefined && clickedGroup.parent) {
      clickedGroup = clickedGroup.parent;
    }

    if (!clickedGroup || clickedGroup.userData.index === undefined) return;

    soundManager.playClick();
    const isMob = window.innerWidth <= 600;
    const defScale = clickedGroup.userData.baseScale || (isMob ? 0.75 : 1.0);
    const zoomFactor = isMob ? 1.2 : 1.35;

    if (activeCard === clickedGroup) {
      // Zoom out
      gsap.to(clickedGroup.scale, {
        x: defScale,
        y: defScale,
        z: defScale,
        duration: 0.5,
        ease: "power2.out",
      });
      activeCard = null;
    } else {
      // Reset previous
      if (activeCard) {
        const prevBase = activeCard.userData.baseScale || (isMob ? 0.75 : 1.0);
        gsap.to(activeCard.scale, {
          x: prevBase,
          y: prevBase,
          z: prevBase,
          duration: 0.4,
          ease: "power2.out",
        });
      }
      // Zoom in
      activeCard = clickedGroup;
      gsap.to(clickedGroup.scale, {
        x: defScale * zoomFactor,
        y: defScale * zoomFactor,
        z: defScale * zoomFactor,
        duration: 0.6,
        ease: "back.out(1.8)",
      });
    }
  }

  function update(delta) {
    // Smooth interpolation towards targetAngle
    currentAngle += (targetAngle - currentAngle) * 0.08;

    // Auto rotate gently if not dragging
    if (!isDragging) {
      targetAngle += delta * 0.15;
    }

    cards.forEach((card) => {
      const angle = card.userData.baseAngle + currentAngle;
      card.position.x = Math.sin(angle) * radius;
      card.position.z = Math.cos(angle) * radius;
      card.rotation.y = angle;

      // Subtle float up and down
      card.position.y = Math.sin(angle * 2) * 0.35;
    });
  }

  function cleanup() {
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("resize", handleResize);
  }

  return {
    group: galleryGroup,
    cards,
    update,
    handleCardClick,
    cleanup,
  };
}
