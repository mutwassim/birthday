import gsap from "gsap";
import { soundManager } from "../utils/audio.js";

export function setupIntroScene(onOpenCallback) {
  const introEl = document.getElementById("scene-intro");
  const openBtn = document.getElementById("btn-open");

  if (!introEl || !openBtn) return;

  // Initial pulsing animation on the button
  gsap.to(openBtn, {
    scale: 1.06,
    boxShadow: "0 0 35px rgba(255, 111, 165, 0.7)",
    repeat: -1,
    yoyo: true,
    duration: 1.2,
    ease: "power1.inOut",
  });

  openBtn.addEventListener("click", () => {
    // Unlock Web Audio Context & music
    soundManager.init();
    soundManager.playChime();

    // GSAP Transition from intro screen to cake scene
    const tl = gsap.timeline({
      onComplete: () => {
        introEl.classList.add("hidden");
        if (onOpenCallback) onOpenCallback();
      },
    });

    tl.to(openBtn, {
      scale: 0.9,
      opacity: 0,
      duration: 0.4,
      ease: "power2.in",
    })
      .to(
        "#intro-content",
        {
          opacity: 0,
          y: -40,
          filter: "blur(12px)",
          duration: 0.8,
          ease: "power2.inOut",
        },
        "-=0.2"
      )
      .to(
        introEl,
        {
          opacity: 0,
          duration: 1.0,
          ease: "power2.inOut",
        },
        "-=0.4"
      );
  });
}

