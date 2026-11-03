import gsap from "gsap";
import { LETTER_PIN } from "../config.js";
import { soundManager } from "../utils/audio.js";

export function setupPinModal(onSuccessUnlock) {
  const pinSceneEl = document.getElementById("scene-pin");
  const cardEl = document.getElementById("pin-card");
  const lockIcon = document.getElementById("pin-lock-icon");
  const form = document.getElementById("pin-form");
  const pinInput = document.getElementById("pin-input");
  const errorMsg = document.getElementById("pin-error-msg");

  function show() {
    if (!pinSceneEl) return;

    pinSceneEl.classList.remove("hidden");
    pinSceneEl.style.opacity = "0";

    if (pinInput) {
      pinInput.value = "";
      pinInput.classList.remove("error", "success");
    }

    if (errorMsg) {
      errorMsg.textContent = "";
      errorMsg.classList.add("hidden");
    }

    if (lockIcon) {
      lockIcon.textContent = "🔐";
    }

    const tl = gsap.timeline();
    tl.to(pinSceneEl, {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out",
    }).fromTo(
      cardEl,
      { scale: 0.85, opacity: 0, y: 30 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "back.out(1.6)",
        onComplete: () => {
          if (pinInput) pinInput.focus();
        },
      }
    );
  }

  function handleUnlock() {
    const entered = (pinInput ? pinInput.value : "").trim();

    if (entered === LETTER_PIN) {
      // Success!
      soundManager.playChime();
      soundManager.playPop();

      if (lockIcon) lockIcon.textContent = "🔓";
      if (pinInput) {
        pinInput.classList.remove("error");
        pinInput.classList.add("success");
      }

      if (errorMsg) {
        errorMsg.textContent = "PIN accepted! Unlocking your letter... ✨";
        errorMsg.classList.remove("hidden", "error-text");
        errorMsg.classList.add("success-text");
      }

      gsap.to(cardEl, {
        scale: 1.08,
        boxShadow: "0 0 50px rgba(6, 214, 160, 0.7)",
        duration: 0.4,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(pinSceneEl, {
            opacity: 0,
            scale: 0.95,
            duration: 0.6,
            delay: 0.3,
            ease: "power2.inOut",
            onComplete: () => {
              pinSceneEl.classList.add("hidden");
              if (onSuccessUnlock) onSuccessUnlock();
            },
          });
        },
      });
    } else {
      // Incorrect PIN!
      soundManager.playClick();

      if (pinInput) {
        pinInput.classList.add("error");
      }

      if (errorMsg) {
        errorMsg.textContent = "Incorrect PIN! Enter your mobile phone's PIN (052004) 🐼";
        errorMsg.classList.remove("hidden", "success-text");
        errorMsg.classList.add("error-text");
      }

      // Playful shake animation
      gsap.fromTo(
        pinInput,
        { x: -14 },
        {
          x: 14,
          duration: 0.06,
          repeat: 5,
          yoyo: true,
          ease: "none",
          onComplete: () => {
            gsap.to(pinInput, { x: 0, duration: 0.05 });
            if (pinInput) pinInput.focus();
          },
        }
      );
    }
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleUnlock();
    });
  }

  return { show };
}

