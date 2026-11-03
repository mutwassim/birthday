export function setupResize(camera, renderer, composer, onResizeCallback) {
  function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    if (camera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    if (renderer) {
      renderer.setSize(width, height);
      renderer.setPixelRatio(dpr);
    }

    if (composer) {
      composer.setSize(width, height);
      composer.setPixelRatio(dpr);
    }

    if (onResizeCallback) {
      onResizeCallback(width, height, dpr);
    }
  }

  window.addEventListener("resize", handleResize);
  // Initial call
  handleResize();

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}

