import gsap from "gsap";
import { RECIPIENT_NAME, AGE } from "../config.js";
import { soundManager } from "../utils/audio.js";

export function setupCelebrationScene(confettiSystem, balloonsGroup, onProceedToMessage) {
  const celebrationEl = document.getElementById("scene-celebration");
  const proceedBtn = document.getElementById("btn-to-message");
  const titleEl = document.getElementById("celebration-title");

  if (titleEl) {
    titleEl.textContent = `Happy ${AGE ? AGE + "th " : ""}Birthday, ${RECIPIENT_NAME}! 🎉`;
  }

  function startCelebration() {
    celebrationEl.classList.remove("hidden");
    celebrationEl.style.opacity = "0";

    // Launch 3D Confetti and Balloons
    if (confettiSystem) confettiSystem.burst();
    if (balloonsGroup) balloonsGroup.launch();

    // GSAP reveal
    const tl = gsap.timeline();
    tl.to(celebrationEl, {
      opacity: 1,
      duration: 0.6,
      ease: "power2.out",
    })
      .fromTo(
        "#celebration-badge",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.4)" }
      )
      .fromTo(
        "#celebration-title",
        { y: 30, opacity: 0, filter: "blur(8px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, ease: "power3.out" },
        "-=0.4"
      )
      .fromTo(
        "#celebration-subtitle",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power2.out" },
        "-=0.5"
      )
      .fromTo(
        proceedBtn,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" },
        "-=0.3"
      );
  }

  if (proceedBtn) {
    proceedBtn.addEventListener("click", () => {
      soundManager.playClick();
      gsap.to(celebrationEl, {
        opacity: 0,
        y: -30,
        duration: 0.6,
        ease: "power2.in",
        onComplete: () => {
          celebrationEl.classList.add("hidden");
          if (onProceedToMessage) onProceedToMessage();
        },
      });
    });
  }

  return { startCelebration };
}

