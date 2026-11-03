import * as THREE from "three";
import gsap from "gsap";
import { FAVORITE_COLORS } from "../config.js";

/**
 * 1. Background Starfield / Fairy Dust Particles
 */
export function createStarfield(count = 700) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const scales = new Float32Array(count);

  const palette = FAVORITE_COLORS.map((c) => new THREE.Color(c));
  palette.push(new THREE.Color("#ffffff"), new THREE.Color("#fff5cc"));

  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

    const col = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3 + 0] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;

    scales[i] = Math.random() * 2.5 + 0.8;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));

  // Circular soft particle texture created procedurally
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255, 255, 255, 1)");
  grad.addColorStop(0.3, "rgba(255, 240, 200, 0.8)");
  grad.addColorStop(0.8, "rgba(255, 200, 220, 0.2)");
  grad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.PointsMaterial({
    size: 0.35,
    vertexColors: true,
    map: texture,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);

  function update(delta, time) {
    points.rotation.y = time * 0.03;
    points.rotation.x = Math.sin(time * 0.02) * 0.05;
  }

  return { object: points, update };
}

/**
 * 2. InstancedMesh Confetti System
 */
export function createConfettiSystem(count = 350) {
  const geom = new THREE.PlaneGeometry(0.18, 0.1);
  const mat = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
  });

  const mesh = new THREE.InstancedMesh(geom, mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const palette = FAVORITE_COLORS.map((c) => new THREE.Color(c));
  palette.push(new THREE.Color("#ffffff"), new THREE.Color("#ffdfba"));

  const dummy = new THREE.Object3D();
  const confettiData = [];

  for (let i = 0; i < count; i++) {
    mesh.setColorAt(i, palette[i % palette.length]);

    confettiData.push({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        Math.random() * 20 - 5,
        (Math.random() - 0.5) * 16
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        -(Math.random() * 2.5 + 1.2),
        (Math.random() - 0.5) * 1.5
      ),
      rotation: new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ),
      rotSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      ),
      swayFreq: Math.random() * 3 + 1,
      swayAmp: Math.random() * 0.4 + 0.1,
      active: true,
    });
  }

  mesh.instanceColor.needsUpdate = true;

  function burst(origin = new THREE.Vector3(0, 3, 0)) {
    confettiData.forEach((d) => {
      d.position.copy(origin).add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          Math.random() * 1.0,
          (Math.random() - 0.5) * 1.5
        )
      );
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 4;
      d.velocity.set(
        Math.cos(angle) * speed * 0.5,
        Math.random() * 5 + 4,
        Math.sin(angle) * speed * 0.5
      );
    });
  }

  function update(delta, time) {
    confettiData.forEach((d, i) => {
      // Gravity & air flutter
      d.velocity.y -= 3.5 * delta;
      d.velocity.x += Math.sin(time * d.swayFreq) * d.swayAmp * delta;
      d.velocity.z += Math.cos(time * d.swayFreq) * d.swayAmp * delta;

      // Terminal velocity clamp
      if (d.velocity.y < -3.5) d.velocity.y = -3.5;

      d.position.x += d.velocity.x * delta;
      d.position.y += d.velocity.y * delta;
      d.position.z += d.velocity.z * delta;

      d.rotation.x += d.rotSpeed.x * delta;
      d.rotation.y += d.rotSpeed.y * delta;
      d.rotation.z += d.rotSpeed.z * delta;

      // Recycle if fallen below floor
      if (d.position.y < -6) {
        d.position.y = 12 + Math.random() * 4;
        d.position.x = (Math.random() - 0.5) * 16;
        d.position.z = (Math.random() - 0.5) * 16;
        d.velocity.y = -(Math.random() * 2 + 1);
      }

      dummy.position.copy(d.position);
      dummy.rotation.copy(d.rotation);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  }

  return { object: mesh, burst, update };
}

/**
 * 3. 3D Floating Balloons Group
 */
export function createBalloonsGroup(count = 14) {
  const group = new THREE.Group();
  const balloons = [];
  const palette = FAVORITE_COLORS.map((c) => new THREE.Color(c));

  const balloonGeom = new THREE.SphereGeometry(0.7, 32, 32);
  // Slight taper at bottom
  const posAttr = balloonGeom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i);
    if (y < 0) {
      const scale = 1 + y * 0.28;
      posAttr.setX(i, posAttr.getX(i) * scale);
      posAttr.setZ(i, posAttr.getZ(i) * scale);
    }
  }
  balloonGeom.computeVertexNormals();

  const knotGeom = new THREE.ConeGeometry(0.12, 0.16, 12);
  const stringGeom = new THREE.CylinderGeometry(0.006, 0.006, 2.2, 6);

  for (let i = 0; i < count; i++) {
    const color = palette[i % palette.length];
    const bMat = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.18,
      metalness: 0.12,
      clearcoat: 0.7,
      clearcoatRoughness: 0.1,
    });

    const bMesh = new THREE.Mesh(balloonGeom, bMat);

    // Knot
    const knot = new THREE.Mesh(knotGeom, bMat);
    knot.position.y = -0.75;
    knot.rotation.x = Math.PI;
    bMesh.add(knot);

    // String
    const sMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6 });
    const string = new THREE.Mesh(stringGeom, sMat);
    string.position.y = -1.85;
    bMesh.add(string);

    const initialX = (Math.random() - 0.5) * 12;
    const initialZ = (Math.random() - 0.5) * 8 - 2;
    const initialY = -10 - Math.random() * 8;

    bMesh.position.set(initialX, initialY, initialZ);

    const scale = Math.random() * 0.4 + 0.85;
    bMesh.scale.set(scale, scale * 1.15, scale);

    group.add(bMesh);

    balloons.push({
      mesh: bMesh,
      speed: Math.random() * 0.8 + 1.2,
      swayX: Math.random() * 0.4 + 0.2,
      swayZ: Math.random() * 0.4 + 0.2,
      freq: Math.random() * 1.5 + 1.0,
      phase: Math.random() * Math.PI * 2,
      initialX,
      initialZ,
      active: false,
    });
  }

  function launch() {
    balloons.forEach((b, i) => {
      b.active = true;
      b.mesh.position.y = -8 - (i % 4) * 2;
      gsap.to(b.mesh.scale, {
        x: b.mesh.scale.x,
        y: b.mesh.scale.y,
        z: b.mesh.scale.z,
        duration: 0.8,
        ease: "back.out(1.5)",
      });
    });
  }

  function update(delta, time) {
    balloons.forEach((b) => {
      if (!b.active) return;
      b.mesh.position.y += b.speed * delta;
      b.mesh.position.x = b.initialX + Math.sin(time * b.freq + b.phase) * b.swayX;
      b.mesh.position.z = b.initialZ + Math.cos(time * b.freq + b.phase) * b.swayZ;
      b.mesh.rotation.z = Math.sin(time * b.freq) * 0.1;
      b.mesh.rotation.x = Math.cos(time * b.freq) * 0.08;

      if (b.mesh.position.y > 18) {
        b.mesh.position.y = -10;
      }
    });
  }

  return { object: group, launch, update };
}

/**
 * 4. 3D Fireworks Particle System for Finale
 */
export function createFireworksSystem() {
  const group = new THREE.Group();
  const particles = [];
  const palette = FAVORITE_COLORS.map((c) => new THREE.Color(c));
  palette.push(new THREE.Color("#ffffff"), new THREE.Color("#ffea79"));

  const pGeom = new THREE.SphereGeometry(0.06, 8, 8);

  function explode(origin = new THREE.Vector3(0, 5, 0), color = null) {
    const count = 90;
    const fireworkCol = color || palette[Math.floor(Math.random() * palette.length)];

    const mat = new THREE.MeshBasicMaterial({
      color: fireworkCol,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(pGeom, mat.clone());
      mesh.position.copy(origin);
      group.add(mesh);

      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = Math.random() * 4.5 + 2.5;

      const vel = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      );

      particles.push({
        mesh,
        vel,
        life: 1.0,
        decay: Math.random() * 0.6 + 0.5,
      });
    }
  }

  function update(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= p.decay * delta;
      p.vel.y -= 3.5 * delta; // Gravity

      p.mesh.position.addScaledVector(p.vel, delta);
      p.mesh.material.opacity = Math.max(0, p.life);
      p.mesh.scale.setScalar(Math.max(0.01, p.life));

      if (p.life <= 0) {
        group.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        particles.splice(i, 1);
      }
    }
  }

  return { object: group, explode, update };
}

/**
 * 5. Candle Extinguish Smoke Puff
 */
export function createSmokePuff() {
  const group = new THREE.Group();
  const smokeParticles = [];
  const geom = new THREE.SphereGeometry(0.12, 12, 12);

  function puff(origin = new THREE.Vector3(0, 2.8, 0)) {
    for (let i = 0; i < 20; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0.7,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(origin).add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          Math.random() * 0.1,
          (Math.random() - 0.5) * 0.1
        )
      );
      group.add(mesh);

      smokeParticles.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.35,
          Math.random() * 0.8 + 0.4,
          (Math.random() - 0.5) * 0.35
        ),
        growth: Math.random() * 1.5 + 1.2,
        life: 1.0,
        decay: Math.random() * 0.8 + 0.6,
      });
    }
  }

  function update(delta) {
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
      const p = smokeParticles[i];
      p.life -= p.decay * delta;
      p.mesh.position.addScaledVector(p.vel, delta);
      const s = p.mesh.scale.x + p.growth * delta;
      p.mesh.scale.set(s, s, s);
      p.mesh.material.opacity = p.life * 0.55;

      if (p.life <= 0) {
        group.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        smokeParticles.splice(i, 1);
      }
    }
  }

  return { object: group, puff, update };
}
