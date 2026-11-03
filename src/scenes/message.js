import gsap from "gsap";
import { PERSONAL_LETTER_PAGES, SENDER_NAME } from "../config.js";
import { soundManager } from "../utils/audio.js";

export function setupMessageScene(onProceedToGallery) {
  const messageEl = document.getElementById("scene-message");
  const cardEl = document.getElementById("message-card");
  const headerContainer = document.getElementById("letter-header-area");
  const linesContainer = document.getElementById("message-lines");
  const footerContainer = document.getElementById("letter-footer-area");

  let currentPage = 0;
  const totalPages = PERSONAL_LETTER_PAGES.length;

  function renderPage(pageIdx, direction = 1) {
    const pageData = PERSONAL_LETTER_PAGES[pageIdx];
    if (!pageData) return;

    // Header: Greeting and Page Indicator
    if (headerContainer) {
      headerContainer.innerHTML = `
        <div class="letter-top-meta">
          <span class="letter-page-badge">Page ${pageIdx + 1} of ${totalPages}</span>
          <span class="letter-stamp">💌</span>
        </div>
        <h2 class="letter-greeting">${pageData.pageTitle}</h2>
      `;
    }

    // Body Paragraphs
    if (linesContainer) {
      linesContainer.innerHTML = "";
      pageData.paragraphs.forEach((pText) => {
        const p = document.createElement("p");
        p.className = "message-line";

        // Highlight romantic affirmations on final page
        if (pText.includes("A VERY HAPPPY BIRTHDAY") || pText.includes("I LOVE YOU SO MUCH")) {
          p.classList.add("love-highlight");
        }

        p.textContent = pText;
        linesContainer.appendChild(p);
      });

      // Signature on last page
      if (pageData.signature) {
        const sig = document.createElement("div");
        sig.className = "letter-signature";
        sig.textContent = pageData.signature;
        linesContainer.appendChild(sig);
      }
    }

    // Footer Navigation Controls
    if (footerContainer) {
      footerContainer.innerHTML = "";
      const navRow = document.createElement("div");
      navRow.className = "letter-nav-row";

      // Prev Button
      if (pageIdx > 0) {
        const prevBtn = document.createElement("button");
        prevBtn.className = "btn-secondary btn-letter-prev";
        prevBtn.innerHTML = "← Previous";
        prevBtn.addEventListener("click", () => {
          soundManager.playClick();
          changePage(pageIdx - 1, -1);
        });
        navRow.appendChild(prevBtn);
      } else {
        // Spacer to keep layout balanced
        const spacer = document.createElement("div");
        spacer.className = "nav-spacer";
        navRow.appendChild(spacer);
      }

      // Next or To Gallery Button
      if (pageIdx < totalPages - 1) {
        const nextBtn = document.createElement("button");
        nextBtn.className = "btn-primary btn-letter-next";
        nextBtn.innerHTML = `Next Page (${pageIdx + 2}/${totalPages}) →`;
        nextBtn.addEventListener("click", () => {
          soundManager.playClick();
          changePage(pageIdx + 1, 1);
        });
        navRow.appendChild(nextBtn);
      } else {
        const galleryBtn = document.createElement("button");
        galleryBtn.className = "btn-primary btn-to-gallery-action";
        galleryBtn.innerHTML = "Cherished Memories 📸";
        galleryBtn.addEventListener("click", () => {
          soundManager.playClick();
          gsap.to(messageEl, {
            opacity: 0,
            scale: 0.95,
            filter: "blur(10px)",
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: () => {
              messageEl.classList.add("hidden");
              if (onProceedToGallery) onProceedToGallery();
            },
          });
        });
        navRow.appendChild(galleryBtn);
      }

      footerContainer.appendChild(navRow);
    }

    // Staggered reveal for lines
    const startX = direction > 0 ? 25 : -25;
    gsap.fromTo(
      ".message-line, .letter-signature",
      { opacity: 0, x: startX, filter: "blur(6px)" },
      {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        duration: 0.55,
        stagger: 0.15,
        ease: "power2.out",
      }
    );
  }

  function changePage(newIdx, direction) {
    const contentBox = document.querySelector(".letter-scroll-area");
    if (contentBox) {
      gsap.to(contentBox, {
        opacity: 0,
        x: direction > 0 ? -20 : 20,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          currentPage = newIdx;
          renderPage(currentPage, direction);
          contentBox.scrollTop = 0;
          gsap.fromTo(
            contentBox,
            { opacity: 0, x: direction > 0 ? 20 : -20 },
            { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }
          );
        },
      });
    } else {
      currentPage = newIdx;
      renderPage(currentPage, direction);
    }
  }

  // Subtle Mouse Parallax (desktop only)
  function handleMouseMove(e) {
    if (!cardEl || messageEl.classList.contains("hidden") || window.innerWidth <= 768) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 12;
    const y = (e.clientY / window.innerHeight - 0.5) * 12;
    gsap.to(cardEl, {
      rotationY: x,
      rotationX: -y,
      duration: 0.8,
      ease: "power1.out",
      transformPerspective: 1000,
    });
  }
  window.addEventListener("mousemove", handleMouseMove);

  function showMessage() {
    messageEl.classList.remove("hidden");
    messageEl.style.opacity = "0";

    currentPage = 0;
    renderPage(0);

    const tl = gsap.timeline();
    tl.to(messageEl, {
      opacity: 1,
      duration: 0.8,
      ease: "power2.out",
    }).fromTo(
      cardEl,
      { scale: 0.85, opacity: 0, y: 35, filter: "blur(14px)" },
      { scale: 1, opacity: 1, y: 0, filter: "blur(0px)", duration: 1.0, ease: "power3.out" }
    );
  }

  return { showMessage };
}
