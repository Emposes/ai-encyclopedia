/* ============================================================
   LLM FIELD MANUAL — cover visualization
   A tensor lattice: 14³ points in a cube. A brightness wave
   sweeps diagonally through the volume (a forward pass),
   while the lattice slowly rotates and answers the cursor.
   ============================================================ */
import * as THREE from "three";

const canvas = document.getElementById("cover-canvas");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    renderer = null;
  }

  if (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    /* ---------- lattice points ---------- */
    const N = 14;                 // points per edge
    const SIZE = 3.4;             // cube edge length in world units
    const count = N * N * N;
    const positions = new Float32Array(count * 3);
    const phase = new Float32Array(count); // diagonal coordinate, 0..1

    let i = 0;
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
        for (let z = 0; z < N; z++) {
          positions[i * 3 + 0] = (x / (N - 1) - 0.5) * SIZE;
          positions[i * 3 + 1] = (y / (N - 1) - 0.5) * SIZE;
          positions[i * 3 + 2] = (z / (N - 1) - 0.5) * SIZE;
          phase[i] = (x + y + z) / (3 * (N - 1));
          i++;
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      vertexShader: `
        attribute float aPhase;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vGlow;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          // forward-pass wave: a band of activation travelling along the
          // main diagonal of the tensor, wrapping every 6 seconds
          float w = fract(uTime * 0.16);
          float d = abs(aPhase - w);
          d = min(d, 1.0 - d);                       // wrap distance
          float band = smoothstep(0.16, 0.0, d);     // activation band
          vGlow = 0.10 + band * 0.9;
          float size = (1.0 + band * 2.4) * 2.0;
          gl_PointSize = size * uPixelRatio * (6.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vGlow;
        void main() {
          // soft round sprite
          vec2 uv = gl_PointCoord - 0.5;
          float r = length(uv);
          float a = smoothstep(0.5, 0.12, r);
          // palette: rest = deep green #2b5945, lit = mint #a6f2cc
          vec3 rest = vec3(0.169, 0.349, 0.271);
          vec3 lit  = vec3(0.651, 0.949, 0.800);
          vec3 col = mix(rest, lit, vGlow);
          gl_FragColor = vec4(col, a * vGlow);
        }
      `
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    /* ---------- cube wireframe (hairline) ---------- */
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(SIZE, SIZE, SIZE));
    const frame = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x2f3234, transparent: true, opacity: 0.9 })
    );
    scene.add(frame);

    /* inner axis cross, very faint */
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-SIZE / 2, 0, 0), new THREE.Vector3(SIZE / 2, 0, 0),
      new THREE.Vector3(0, -SIZE / 2, 0), new THREE.Vector3(0, SIZE / 2, 0),
      new THREE.Vector3(0, 0, -SIZE / 2), new THREE.Vector3(0, 0, SIZE / 2)
    ]);
    const axes = new THREE.LineSegments(
      axisGeo,
      new THREE.LineBasicMaterial({ color: 0x2b5945, transparent: true, opacity: 0.35 })
    );
    scene.add(axes);

    const group = new THREE.Group();
    group.add(points); group.add(frame); group.add(axes);
    scene.add(group);
    group.rotation.set(0.42, -0.62, 0.0);

    /* ---------- interaction ---------- */
    const target = { x: 0, y: 0 };
    window.addEventListener("pointermove", (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    function resize() {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // push the lattice right of center on wide screens, center on small
      group.position.x = w > 900 ? 1.5 : 0;
      group.position.y = w > 900 ? 0 : 0.6;
    }
    window.addEventListener("resize", resize);
    resize();

    const clock = new THREE.Clock();
    let raf = null;

    function frameLoop() {
      const t = clock.getElapsedTime();
      mat.uniforms.uTime.value = t;
      if (!reduced) {
        group.rotation.y += 0.0011;
        group.rotation.x += (0.42 + target.y * 0.14 - group.rotation.x) * 0.03;
        group.rotation.z += (target.x * 0.05 - group.rotation.z) * 0.03;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frameLoop);
    }

    /* pause rendering when the cover is off-screen */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && raf === null) {
            clock.start();
            raf = requestAnimationFrame(frameLoop);
          } else if (!entry.isIntersecting && raf !== null) {
            cancelAnimationFrame(raf);
            raf = null;
          }
        });
      }).observe(canvas);
    }
    raf = requestAnimationFrame(frameLoop);
  }
}
