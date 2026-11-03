import * as THREE from "three";
import gsap from "gsap";
import { FAVORITE_COLORS, AGE } from "../config.js";
import { soundManager } from "../utils/audio.js";

export function createCakeScene(smokePuff) {
  const cakeGroup = new THREE.Group();
  let isBlownOut = false;
  const flames = [];
  const candleLights = [];

  // Materials
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0xfffcf7,
    roughness: 0.25,
    metalness: 0.1,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    metalness: 0.7,
    roughness: 0.3,
  });

  const tier1Mat = new THREE.MeshStandardMaterial({
    color: 0xffd6e0, // Soft pastel pink
    roughness: 0.45,
    metalness: 0.05,
  });

  const tier2Mat = new THREE.MeshStandardMaterial({
    color: 0xfff0f5, // Soft ivory cream
    roughness: 0.4,
    metalness: 0.05,
  });

  const frostingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.05,
  });

  const candleMat = new THREE.MeshStandardMaterial({
    color: 0x8ecae6, // Baby blue candle
    roughness: 0.3,
    metalness: 0.1,
  });

  // 1. Stand / Pedestal
  const standBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 0.2, 36), plateMat);
  standBase.position.y = -0.6;
  cakeGroup.add(standBase);

  const standPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.5, 24), goldTrimMat);
  standPillar.position.y = -0.3;
  cakeGroup.add(standPillar);

  const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.15, 40), plateMat);
  plate.position.y = -0.05;
  cakeGroup.add(plate);

  const plateRim = new THREE.Mesh(new THREE.TorusGeometry(2.32, 0.05, 16, 48), goldTrimMat);
  plateRim.position.y = -0.05;
  plateRim.rotation.x = Math.PI / 2;
  cakeGroup.add(plateRim);

  // 2. Tier 1 (Bottom)
  const tier1Height = 0.9;
  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, tier1Height, 40), tier1Mat);
  tier1.position.y = tier1Height / 2;
  cakeGroup.add(tier1);

  // Tier 1 Side Inscription: "Happy Birthday Panda"
  const tier1TextTexture = createCakeSideTextTexture({
    text: "Happy Birthday Panda",
    width: 4096,
    height: 256,
    repeatCount: 3,
    fontSize: 78,
    pandaScale: 1.25,
    sparkleScale: 1.15,
    heartScale: 1.1,
  });

  const tier1TextMat = new THREE.MeshStandardMaterial({
    map: tier1TextTexture,
    transparent: true,
    roughness: 0.35,
    metalness: 0.05,
    side: THREE.FrontSide,
    depthWrite: false,
  });

  const tier1Text = new THREE.Mesh(
    new THREE.CylinderGeometry(1.808, 1.808, 0.68, 64, 1, true),
    tier1TextMat
  );
  tier1Text.position.y = tier1Height / 2;
  tier1Text.rotation.y = -Math.PI / 3; // Align first phrase directly facing the camera
  cakeGroup.add(tier1Text);

  // Tier 1 Frosting Trim (pearls)
  const pearlCount1 = 28;
  const pearlGeom = new THREE.SphereGeometry(0.1, 16, 16);
  for (let i = 0; i < pearlCount1; i++) {
    const angle = (i / pearlCount1) * Math.PI * 2;
    const pearl = new THREE.Mesh(pearlGeom, frostingMat);
    pearl.position.set(Math.cos(angle) * 1.82, 0.05, Math.sin(angle) * 1.82);
    cakeGroup.add(pearl);
  }

  // Tier 1 Top Rim
  const tier1TopRim = new THREE.Mesh(new THREE.TorusGeometry(1.82, 0.07, 16, 40), frostingMat);
  tier1TopRim.position.y = tier1Height;
  tier1TopRim.rotation.x = Math.PI / 2;
  cakeGroup.add(tier1TopRim);

  // 3. Tier 2 (Top)
  const tier2Height = 0.75;
  const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, tier2Height, 36), tier2Mat);
  tier2.position.y = tier1Height + tier2Height / 2;
  cakeGroup.add(tier2);

  // Tier 2 Side Inscription: "Happy Birthday Panda"
  const tier2TextTexture = createCakeSideTextTexture({
    text: "Happy Birthday Panda",
    width: 2048,
    height: 140,
    repeatCount: 2,
    fontSize: 48,
    pandaScale: 0.85,
    sparkleScale: 0.8,
    heartScale: 0.75,
  });

  const tier2TextMat = new THREE.MeshStandardMaterial({
    map: tier2TextTexture,
    transparent: true,
    roughness: 0.35,
    metalness: 0.05,
    side: THREE.FrontSide,
    depthWrite: false,
  });

  const tier2Text = new THREE.Mesh(
    new THREE.CylinderGeometry(1.208, 1.208, 0.50, 64, 1, true),
    tier2TextMat
  );
  tier2Text.position.y = tier1Height + tier2Height / 2;
  tier2Text.rotation.y = -Math.PI / 2; // Align first phrase directly facing the camera
  cakeGroup.add(tier2Text);

  // Tier 2 pearls
  const pearlCount2 = 20;
  for (let i = 0; i < pearlCount2; i++) {
    const angle = (i / pearlCount2) * Math.PI * 2;
    const pearl = new THREE.Mesh(pearlGeom, frostingMat);
    pearl.position.set(Math.cos(angle) * 1.22, tier1Height + 0.05, Math.sin(angle) * 1.22);
    cakeGroup.add(pearl);
  }

  // Tier 2 Top Frosting Drips / Swirls
  const dripCount = 12;
  for (let i = 0; i < dripCount; i++) {
    const angle = (i / dripCount) * Math.PI * 2;
    const drip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), frostingMat);
    drip.scale.set(1, 1.4, 0.8);
    drip.position.set(
      Math.cos(angle) * 1.15,
      tier1Height + tier2Height - 0.04,
      Math.sin(angle) * 1.15
    );
    cakeGroup.add(drip);
  }

  // 4. Cake Toppings (Fresh berries / macarons)
  const berryCount = 6;
  const berryMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    roughness: 0.3,
  });
  for (let i = 0; i < berryCount; i++) {
    const angle = (i / berryCount) * Math.PI * 2 + 0.2;
    const berry = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), berryMat);
    berry.position.set(Math.cos(angle) * 0.75, tier1Height + tier2Height + 0.08, Math.sin(angle) * 0.75);
    cakeGroup.add(berry);
  }

  // 5. Candle(s)
  const candlePositions = [
    new THREE.Vector3(0, tier1Height + tier2Height + 0.45, 0),
  ];

  // If age or extra candles desired
  if (AGE) {
    candlePositions.push(
      new THREE.Vector3(-0.4, tier1Height + tier2Height + 0.45, 0.1),
      new THREE.Vector3(0.4, tier1Height + tier2Height + 0.45, 0.1)
    );
  }

  candlePositions.forEach((pos, idx) => {
    // Candle Stick
    const candleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.85, 16), candleMat);
    candleMesh.position.copy(pos);
    cakeGroup.add(candleMesh);

    // Wick
    const wick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.15, 8),
      new THREE.MeshBasicMaterial({ color: 0x222222 })
    );
    wick.position.set(pos.x, pos.y + 0.45, pos.z);
    cakeGroup.add(wick);

    // Flame Core & Halo
    const flameGroup = new THREE.Group();
    flameGroup.position.set(pos.x, pos.y + 0.58, pos.z);

    // Inner Flame
    const innerFlameGeom = new THREE.ConeGeometry(0.08, 0.26, 16);
    const innerFlameMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });
    const innerFlame = new THREE.Mesh(innerFlameGeom, innerFlameMat);
    innerFlame.position.y = 0.1;
    flameGroup.add(innerFlame);

    // Outer Glow Flame
    const outerFlameGeom = new THREE.ConeGeometry(0.14, 0.38, 16);
    const outerFlameMat = new THREE.MeshBasicMaterial({
      color: 0xff9900,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const outerFlame = new THREE.Mesh(outerFlameGeom, outerFlameMat);
    outerFlame.position.y = 0.12;
    flameGroup.add(outerFlame);

    // Point Light casting warm flicker
    const candleLight = new THREE.PointLight(0xffa149, 1.8, 4.5);
    candleLight.position.set(pos.x, pos.y + 0.65, pos.z);
    cakeGroup.add(candleLight);
    candleLights.push(candleLight);

    cakeGroup.add(flameGroup);
    flames.push({
      group: flameGroup,
      inner: innerFlame,
      outer: outerFlame,
      light: candleLight,
      pos: flameGroup.position,
      baseIntensity: 1.8,
      phase: idx * 1.5,
    });
  });

  // Extinguish logic
  function extinguish(onComplete) {
    if (isBlownOut) return;
    isBlownOut = true;

    soundManager.playBlowout();

    flames.forEach((flame) => {
      // Smoke puff at flame position
      const worldPos = new THREE.Vector3();
      flame.group.getWorldPosition(worldPos);
      if (smokePuff) smokePuff.puff(worldPos);

      // GSAP flame extinguish squash and fade
      gsap.to(flame.group.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.45,
        ease: "power2.in",
        onComplete: () => {
          flame.group.visible = false;
        },
      });

      gsap.to(flame.light, {
        intensity: 0,
        duration: 0.35,
        ease: "power2.out",
      });
    });

    // Small delay before celebration starts
    setTimeout(() => {
      soundManager.playPop();
      soundManager.playCheer();
      if (onComplete) onComplete();
    }, 600);
  }

  function reset() {
    isBlownOut = false;
    flames.forEach((flame) => {
      flame.group.visible = true;
      flame.group.scale.set(1, 1, 1);
      flame.light.intensity = flame.baseIntensity;
    });
  }

  function update(delta, time) {
    // Subtle rotation of entire cake
    cakeGroup.rotation.y += delta * 0.2;

    if (!isBlownOut) {
      flames.forEach((flame) => {
        // Natural candle flicker
        const flicker =
          Math.sin(time * 18 + flame.phase) * 0.08 +
          Math.cos(time * 26 + flame.phase) * 0.05;

        flame.group.scale.set(1 + flicker, 1 + flicker * 1.4, 1 + flicker);
        flame.group.rotation.z = Math.sin(time * 12 + flame.phase) * 0.08;
        flame.group.rotation.x = Math.cos(time * 10 + flame.phase) * 0.06;

        flame.light.intensity = flame.baseIntensity + flicker * 2.2;
      });
    }
  }

  return {
    group: cakeGroup,
    extinguish,
    reset,
    update,
    get isBlownOut() {
      return isBlownOut;
    },
  };
}

/**
 * Helper to draw a cute, vector-styled baby panda face on canvas
 */
function drawCutePanda(ctx, x, y, size = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);

  // 1. Black Ears
  ctx.fillStyle = "#1e1e24";
  ctx.beginPath();
  ctx.arc(-14, -13, 7, 0, Math.PI * 2);
  ctx.arc(14, -13, 7, 0, Math.PI * 2);
  ctx.fill();

  // 2. Pink Inner Ears
  ctx.fillStyle = "#f472b6";
  ctx.beginPath();
  ctx.arc(-14, -13, 3.5, 0, Math.PI * 2);
  ctx.arc(14, -13, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 3. Head with subtle shadow
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Head delicate outline
  ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 4. Black Eye Patches (tilted ovals)
  ctx.fillStyle = "#1e1e24";
  ctx.beginPath();
  ctx.ellipse(-7, -1, 5, 6.5, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(7, -1, 5, 6.5, 0.25, 0, Math.PI * 2);
  ctx.fill();

  // 5. White Sparkle Glints in eyes
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-8, -3, 1.8, 0, Math.PI * 2);
  ctx.arc(6, -3, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 6. Blushing Pink Cheeks
  ctx.fillStyle = "rgba(244, 114, 182, 0.75)";
  ctx.beginPath();
  ctx.ellipse(-12, 5, 3.5, 2, 0, 0, Math.PI * 2);
  ctx.ellipse(12, 5, 3.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // 7. Nose
  ctx.fillStyle = "#1e1e24";
  ctx.beginPath();
  ctx.ellipse(0, 3, 2.5, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // 8. Sweet Smile
  ctx.strokeStyle = "#1e1e24";
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(-2.5, 5.5, 2.5, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(2.5, 5.5, 2.5, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

/**
 * 4-pointed golden sparkle star
 */
function drawSparkle(ctx, x, y, size = 1, color = "#ffd166") {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.quadraticCurveTo(0, 0, 14, 0);
  ctx.quadraticCurveTo(0, 0, 0, 14);
  ctx.quadraticCurveTo(0, 0, -14, 0);
  ctx.quadraticCurveTo(0, 0, 0, -14);
  ctx.fill();
  ctx.restore();
}

/**
 * Sweet little royal icing heart
 */
function drawHeart(ctx, x, y, size = 1, color = "#f43f5e") {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.bezierCurveTo(-8, -6, -14, 2, 0, 14);
  ctx.bezierCurveTo(14, 2, 8, -6, 0, 4);
  ctx.fill();
  ctx.restore();
}

/**
 * Creates high-res canvas texture repeated seamlessly around the cylinder side
 */
function createCakeSideTextTexture({
  text = "Happy Birthday Panda",
  width = 4096,
  height = 256,
  repeatCount = 3,
  fontSize = 78,
  pandaScale = 1.25,
  sparkleScale = 1.15,
  heartScale = 1.1,
}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const segmentWidth = width / repeatCount;
    const centerY = height / 2;

    ctx.font = `italic 700 ${fontSize}px 'Great Vibes', 'Caveat', cursive, sans-serif`;
    ctx.textBaseline = "middle";

    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;

    // Dimensions of icons
    const sparkleSpacing = 50 * sparkleScale;
    const pandaSpacing = 55 * pandaScale;
    const heartSpacing = 45 * heartScale;
    const totalGroupWidth = sparkleSpacing + textWidth + pandaSpacing + heartSpacing;

    for (let i = 0; i < repeatCount; i++) {
      const segmentCenterX = segmentWidth * i + segmentWidth / 2;
      const groupStartX = segmentCenterX - totalGroupWidth / 2;

      // 1. Left Sparkle
      drawSparkle(ctx, groupStartX + sparkleSpacing * 0.4, centerY, sparkleScale, "#ffd166");

      // 2. Center Text
      const textX = groupStartX + sparkleSpacing + textWidth / 2;

      ctx.save();
      ctx.textAlign = "center";

      // Royal icing drop-shadow (gives 3D physical rise off cake)
      ctx.shadowColor = "rgba(180, 50, 80, 0.4)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;

      // Outer piped white frosting border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = Math.max(6, Math.round(fontSize * 0.12));
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeText(text, textX, centerY);
      ctx.restore();

      // Rich royal raspberry gradient body
      const gradient = ctx.createLinearGradient(0, centerY - fontSize * 0.5, 0, centerY + fontSize * 0.5);
      gradient.addColorStop(0, "#f43f5e");
      gradient.addColorStop(0.5, "#be123c");
      gradient.addColorStop(1, "#881337");

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = gradient;
      ctx.fillText(text, textX, centerY);

      // Glossy top highlight line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = Math.max(1.5, fontSize * 0.035);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeText(text, textX, centerY - 2);
      ctx.restore();

      // 3. Cute Panda
      const pandaX = groupStartX + sparkleSpacing + textWidth + pandaSpacing * 0.5;
      drawCutePanda(ctx, pandaX, centerY, pandaScale);

      // 4. Right Heart
      const heartX = pandaX + pandaSpacing * 0.5 + heartSpacing * 0.5;
      drawHeart(ctx, heartX, centerY - 4, heartScale, "#f43f5e");
    }
  }

  draw();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  if (typeof document !== "undefined" && document.fonts) {
    document.fonts.ready.then(() => {
      draw();
      texture.needsUpdate = true;
    });
  }

  return texture;
}

