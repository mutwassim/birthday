import gsap from "gsap";
import * as THREE from "three";
import { RECIPIENT_NAME, SENDER_NAME, AGE, FINALE_NOTE } from "../config.js";
import { soundManager } from "../utils/audio.js";

export function setupFinaleScene(fireworksSystem, onReplay) {
  const finaleEl = document.getElementById("scene-finale");
  const titleEl = document.getElementById("finale-title");
  const signEl = document.getElementById("finale-signature");
  const noteEl = document.getElementById("finale-pending-note");
  const replayBtn = document.getElementById("btn-replay");
  let fireworkInterval = null;

  if (titleEl) {
    titleEl.textContent = `Happy ${AGE ? AGE + "th " : ""}Birthday, ${RECIPIENT_NAME}!`;
  }
  if (signEl) {
    signEl.textContent = `Forever celebrating you,\nFrom always yours, ${SENDER_NAME}`;
  }
  if (noteEl) {
    noteEl.textContent = FINALE_NOTE;
  }

  function launchPeriodicFireworks() {
    if (fireworkInterval) clearInterval(fireworkInterval);

    // Initial burst
    launchOneFirework();

    fireworkInterval = setInterval(() => {
      if (finaleEl && !finaleEl.classList.contains("hidden")) {
        launchOneFirework();
      }
    }, 1400);
  }

  function launchOneFirework() {
    if (!fireworksSystem) return;
    const x = (Math.random() - 0.5) * 12;
    const y = Math.random() * 4 + 3;
    const z = (Math.random() - 0.5) * 8 - 1;

    fireworksSystem.explode(new THREE.Vector3(x, y, z));
    soundManager.playFirework();
  }

  function showFinale() {
    finaleEl.classList.remove("hidden");
    finaleEl.style.opacity = "0";

    launchPeriodicFireworks();

    const tl = gsap.timeline();

    tl.to(finaleEl, {
      opacity: 1,
      duration: 1.0,
      ease: "power2.out",
    })
      .fromTo(
        "#finale-badge",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.9, ease: "elastic.out(1, 0.4)" }
      )
      .fromTo(
        titleEl,
        { scale: 0.8, opacity: 0, filter: "blur(12px)" },
        { scale: 1, opacity: 1, filter: "blur(0px)", duration: 1.2, ease: "power3.out" },
        "-=0.5"
      )
      .fromTo(
        "#finale-subtitle",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power2.out" },
        "-=0.6"
      )
      .fromTo(
        "#finale-pending-card",
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.9, ease: "back.out(1.5)" },
        "-=0.4"
      )
      .fromTo(
        signEl,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" },
        "-=0.3"
      )
      .fromTo(
        replayBtn,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(2)" },
        "-=0.3"
      );
  }

  if (replayBtn) {
    replayBtn.addEventListener("click", () => {
      soundManager.playClick();
      if (fireworkInterval) clearInterval(fireworkInterval);

      gsap.to(finaleEl, {
        opacity: 0,
        scale: 0.9,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          finaleEl.classList.add("hidden");
          if (onReplay) onReplay();
        },
      });
    });
  }

  function stop() {
    if (fireworkInterval) clearInterval(fireworkInterval);
  }

  return { showFinale, stop };
}
