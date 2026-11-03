import * as THREE from "three";

export function disposeHierarchy(object) {
  if (!object) return;

  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => disposeMaterial(mat));
      } else {
        disposeMaterial(child.material);
      }
    }
  });

  if (object.parent) {
    object.parent.remove(object);
  }
}

function disposeMaterial(material) {
  if (!material) return;
  // Dispose all possible textures in material
  Object.keys(material).forEach((prop) => {
    const value = material[prop];
    if (value && value instanceof THREE.Texture) {
      value.dispose();
    }
  });
  material.dispose();
}

