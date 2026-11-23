import * as THREE from "three";

// Procedural textures (client only: these touch document).
export function makeDotTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,255,255,0.85)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeGlowTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, "rgba(255,255,255,0.9)");
  grd.addColorStop(0.3, "rgba(255,255,255,0.28)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** HUD reticle printed on the smart lens. */
export function makeReticleTexture(color: string): THREE.Texture {
  const s = 512;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = 2;
  const m = s / 2;
  g.globalAlpha = 0.9;
  g.beginPath();
  g.arc(m, m, 120, -Math.PI * 0.9, -Math.PI * 0.1);
  g.stroke();
  g.beginPath();
  g.arc(m, m, 120, Math.PI * 0.1, Math.PI * 0.9);
  g.stroke();
  g.globalAlpha = 0.5;
  g.beginPath();
  g.arc(m, m, 170, 0, Math.PI * 2);
  g.setLineDash([3, 9]);
  g.stroke();
  g.setLineDash([]);
  g.globalAlpha = 1;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    g.beginPath();
    g.moveTo(m + Math.cos(a) * 60, m + Math.sin(a) * 60);
    g.lineTo(m + Math.cos(a) * 90, m + Math.sin(a) * 90);
    g.stroke();
  }
  g.beginPath();
  g.arc(m, m, 4, 0, Math.PI * 2);
  g.fill();
  g.font = "500 22px 'IBM Plex Mono', monospace";
  g.globalAlpha = 0.8;
  g.fillText("NV-01 · PERCEPTION", m - 150, m - 200);
  g.fillText("SYNC 99.2%", m + 40, m + 215);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
