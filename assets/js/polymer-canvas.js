/**
 * Interactive polymer chain simulation with periodic boundaries.
 * Rigid bonds, excluded volume, shear flow, Langevin dynamics.
 * Multiple architectures: linear, cyclic, star, branched.
 *
 * Physics are scaled to canvas width (reference: 800 px) so that
 * the simulation fits comfortably on any screen size without
 * exploding on narrow mobile viewports.
 *
 * A fixed 60 Hz physics timestep decouples simulation speed from
 * the display refresh rate, preventing fast-forward on high-
 * refresh-rate phone displays (90 / 120 / 144 Hz).
 */

document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("polymer-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // --- Reference dimensions (physics tuned for ~800 px wide canvas) ---
  const REFERENCE_WIDTH = 800;

  // --- Color palette (PVDF extended) ---
  const CHAIN_COLORS = ["#E4256D", "#2495C1", "#F5A623", "#7B4B94", "#3CA474", "#D63384", "#0DCAF0", "#FFC107", "#6F42C1", "#20C997"];
  const BOND_ALPHA = 0.45;
  const SOLVENT_COLOR = "rgba(154, 163, 171, 0.50)";

  // --- Base physics parameters (reference scale) ---
  const BASE_BEAD_RADIUS = 5;
  const BASE_SOLVENT_RADIUS = 1.8;
  const BASE_BOND_LENGTH = 20;
  const CONSTRAINT_ITERS = 4;
  const ANGLE_STIFFNESS = 0.015;
  const BASE_THERMAL_KICK = 0.22;
  const BASE_SHEAR_RATE = 0.015;
  const FRICTION = 0.99;
  const SOLVENT_FRICTION = 0.985;
  const BASE_REPULSION_STRENGTH = 100;
  const BASE_SEGMENT_STRENGTH = 60;
  const BASE_SOLVENT_COUNT = 120;

  // --- Scaled parameters (recomputed in rescalePhysics()) ---
  let physScale = 1.0;
  let BEAD_RADIUS = BASE_BEAD_RADIUS;
  let SOLVENT_RADIUS = BASE_SOLVENT_RADIUS;
  let BOND_LENGTH = BASE_BOND_LENGTH;
  let THERMAL_KICK = BASE_THERMAL_KICK;
  let SHEAR_RATE = BASE_SHEAR_RATE;
  let REPULSION_STRENGTH = BASE_REPULSION_STRENGTH;
  let SEGMENT_STRENGTH = BASE_SEGMENT_STRENGTH;
  let REPULSION_CUTOFF;
  let SEGMENT_CUTOFF;
  let SOLVENT_COUNT = BASE_SOLVENT_COUNT;
  let DRAG_RADIUS;

  // --- State ---
  let width, height;
  let chains = [];
  let solvent = [];
  let dragBead = null;
  let mouseX = -1000,
    mouseY = -1000;

  // --- Fixed-timestep accumulator (60 Hz physics) ---
  const PHYSICS_DT = 1000 / 60; // 16.67 ms per physics step
  const MAX_STEPS_PER_FRAME = 3; // guard against spiral-of-death
  const DT = 0.35; // integration damping factor (original tuning)
  let physAccum = 0;
  let lastTime = 0;

  // --- Bond topology helpers ---
  function makeLinearBonds(n) {
    const b = [];
    for (let i = 0; i < n - 1; i++) b.push([i, i + 1]);
    return b;
  }
  function makeCyclicBonds(n) {
    const b = makeLinearBonds(n);
    b.push([n - 1, 0]);
    return b;
  }

  // --- Chain constructors (use scaled BOND_LENGTH) ---
  function createLinearChain(n, color, sx, sy) {
    const beads = [];
    let x = sx,
      y = sy;
    for (let i = 0; i < n; i++) {
      beads.push({ x: x + (Math.random() - 0.5) * 4 * physScale, y: y + (Math.random() - 0.5) * 4 * physScale, vx: 0, vy: 0 });
      const a = Math.random() * Math.PI * 2;
      x += Math.cos(a) * BOND_LENGTH;
      y += Math.sin(a) * BOND_LENGTH;
    }
    return { beads, bonds: makeLinearBonds(n), color };
  }

  function createCyclicChain(n, color, sx, sy) {
    const beads = [];
    const r = (n * BOND_LENGTH) / (2 * Math.PI);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      beads.push({ x: sx + Math.cos(a) * r, y: sy + Math.sin(a) * r, vx: 0, vy: 0 });
    }
    return { beads, bonds: makeCyclicBonds(n), color };
  }

  function createStarChain(nArms, armLen, color, sx, sy) {
    const beads = [{ x: sx, y: sy, vx: 0, vy: 0 }];
    const bonds = [];
    for (let arm = 0; arm < nArms; arm++) {
      const angle = (arm / nArms) * Math.PI * 2;
      let x = sx,
        y = sy;
      for (let i = 0; i < armLen; i++) {
        x += Math.cos(angle) * BOND_LENGTH;
        y += Math.sin(angle) * BOND_LENGTH;
        beads.push({ x, y, vx: 0, vy: 0 });
        bonds.push([i === 0 ? 0 : beads.length - 2, beads.length - 1]);
      }
    }
    return { beads, bonds, color };
  }

  function createBranchedChain(backboneLen, nBranches, branchLen, color, sx, sy) {
    const beads = [];
    const bonds = [];
    let x = sx,
      y = sy;
    for (let i = 0; i < backboneLen; i++) {
      beads.push({ x, y, vx: 0, vy: 0 });
      x += BOND_LENGTH;
      if (i < backboneLen - 1) bonds.push([i, i + 1]);
    }
    const step = Math.max(2, Math.floor(backboneLen / (nBranches + 1)));
    for (let b = 0; b < nBranches; b++) {
      const ai = step * (b + 1);
      if (ai >= backboneLen) break;
      const main = beads[ai];
      let bx = main.x,
        by = main.y + BOND_LENGTH;
      const base = beads.length;
      beads.push({ x: bx, y: by, vx: 0, vy: 0 });
      bonds.push([ai, base]);
      for (let i = 1; i < branchLen; i++) {
        by += BOND_LENGTH;
        beads.push({ x: bx, y: by, vx: 0, vy: 0 });
        bonds.push([base + i - 1, base + i]);
      }
    }
    return { beads, bonds, color };
  }

  // --- Scale physics parameters for current canvas width ---
  function rescalePhysics() {
    physScale = Math.max(0.35, Math.min(1.0, width / REFERENCE_WIDTH));
    BEAD_RADIUS = BASE_BEAD_RADIUS * physScale;
    SOLVENT_RADIUS = BASE_SOLVENT_RADIUS * physScale;
    BOND_LENGTH = BASE_BOND_LENGTH * physScale;
    THERMAL_KICK = BASE_THERMAL_KICK * physScale;
    SHEAR_RATE = BASE_SHEAR_RATE / Math.max(0.5, physScale);
    REPULSION_STRENGTH = BASE_REPULSION_STRENGTH * physScale * physScale;
    SEGMENT_STRENGTH = BASE_SEGMENT_STRENGTH * physScale * physScale;
    REPULSION_CUTOFF = BEAD_RADIUS * 3.5;
    SEGMENT_CUTOFF = BEAD_RADIUS * 3.0;
    SOLVENT_COUNT = Math.max(20, Math.floor(BASE_SOLVENT_COUNT * physScale * physScale));
    DRAG_RADIUS = 30 * physScale;
  }

  // --- Chain specs for different canvas sizes ---
  function getChainSpecs() {
    if (width >= 500) {
      // Full set — 10 chains for comfortable canvas widths
      return [
        { fn: createLinearChain, args: [14, CHAIN_COLORS[0]] },
        { fn: createLinearChain, args: [10, CHAIN_COLORS[1]] },
        { fn: createLinearChain, args: [18, CHAIN_COLORS[2]] },
        { fn: createCyclicChain, args: [12, CHAIN_COLORS[3]] },
        { fn: createCyclicChain, args: [8, CHAIN_COLORS[4]] },
        { fn: createStarChain, args: [4, 4, CHAIN_COLORS[5]] },
        { fn: createStarChain, args: [3, 5, CHAIN_COLORS[6]] },
        { fn: createBranchedChain, args: [10, 3, 3, CHAIN_COLORS[7]] },
        { fn: createBranchedChain, args: [8, 2, 4, CHAIN_COLORS[8]] },
        { fn: createLinearChain, args: [12, CHAIN_COLORS[9]] },
      ];
    }
    // Reduced set — 6 shorter chains for narrow mobile screens
    return [
      { fn: createLinearChain, args: [6, CHAIN_COLORS[0]] },
      { fn: createCyclicChain, args: [5, CHAIN_COLORS[3]] },
      { fn: createStarChain, args: [3, 3, CHAIN_COLORS[5]] },
      { fn: createBranchedChain, args: [5, 2, 2, CHAIN_COLORS[7]] },
      { fn: createLinearChain, args: [5, CHAIN_COLORS[1]] },
      { fn: createCyclicChain, args: [4, CHAIN_COLORS[4]] },
    ];
  }

  function initChains() {
    chains = [];
    const specs = getChainSpecs();
    const nChains = specs.length;
    const cols = width < 500 ? Math.min(3, nChains) : Math.min(4, nChains);
    const rows = Math.ceil(nChains / cols);
    const margin = 50 * physScale;
    const cellW = (width - margin * 2) / cols;
    const cellH = (height - margin * 2) / rows;

    for (let i = 0; i < nChains; i++) {
      const col = i % cols,
        row = Math.floor(i / cols);
      const cx = margin + cellW * (col + 0.5);
      const cy = margin + cellH * (row + 0.5);
      const chain = specs[i].fn(...specs[i].args, cx, cy);
      chains.push(chain);
    }

    // Silent warmup — scaled steps and forces
    const savedCutoff = REPULSION_CUTOFF;
    const savedStrength = REPULSION_STRENGTH;
    REPULSION_CUTOFF = BEAD_RADIUS * 5;
    REPULSION_STRENGTH = BASE_REPULSION_STRENGTH * physScale * physScale * 2;
    const warmupSteps = Math.floor(500 * physScale);
    for (let w = 0; w < warmupSteps; w++) {
      stepPhysics();
    }
    REPULSION_CUTOFF = savedCutoff;
    REPULSION_STRENGTH = savedStrength;
    // Reset velocities after warmup
    for (const chain of chains) {
      for (const bead of chain.beads) {
        bead.vx = 0;
        bead.vy = 0;
      }
    }
  }

  function initSolvent() {
    solvent = [];
    for (let i = 0; i < SOLVENT_COUNT; i++) {
      solvent.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6 * physScale,
        vy: (Math.random() - 0.5) * 0.6 * physScale,
      });
    }
  }

  // --- Periodic wrapping ---
  function wrap(v, max) {
    return ((v % max) + max) % max;
  }
  function wrapDelta(dx, max) {
    if (dx > max / 2) return dx - max;
    if (dx < -max / 2) return dx + max;
    return dx;
  }

  // --- Rigid bond constraints (works on any bond list) ---
  function enforceBondConstraints(chain) {
    const beads = chain.beads,
      bonds = chain.bonds;
    for (let iter = 0; iter < CONSTRAINT_ITERS; iter++) {
      for (const [i, j] of bonds) {
        const a = beads[i],
          b = beads[j];
        let dx = wrapDelta(a.x - b.x, width),
          dy = wrapDelta(a.y - b.y, height);
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r < 0.001) continue;
        const corr = ((BOND_LENGTH - r) / r) * 0.5;
        a.x += dx * corr;
        a.y += dy * corr;
        b.x -= dx * corr;
        b.y -= dy * corr;
        a.x = wrap(a.x, width);
        a.y = wrap(a.y, height);
        b.x = wrap(b.x, width);
        b.y = wrap(b.y, height);
      }
    }
  }

  // --- Angle bending (graph-based, works for any topology) ---
  function applyAngleForces(chain) {
    const beads = chain.beads,
      bonds = chain.bonds;
    const adj = {};
    for (const [i, j] of bonds) {
      if (!adj[i]) adj[i] = [];
      if (!adj[j]) adj[j] = [];
      adj[i].push(j);
      adj[j].push(i);
    }
    for (const [mid, neighbors] of Object.entries(adj)) {
      if (neighbors.length < 2) continue;
      const b = beads[+mid];
      for (let p = 0; p < neighbors.length; p++) {
        for (let q = p + 1; q < neighbors.length; q++) {
          const a = beads[neighbors[p]],
            c = beads[neighbors[q]];
          let dx1 = wrapDelta(a.x - b.x, width),
            dy1 = wrapDelta(a.y - b.y, height);
          let dx2 = wrapDelta(c.x - b.x, width),
            dy2 = wrapDelta(c.y - b.y, height);
          const r1 = Math.sqrt(dx1 * dx1 + dy1 * dy1),
            r2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (r1 < 0.001 || r2 < 0.001) continue;
          dx1 /= r1;
          dy1 /= r1;
          dx2 /= r2;
          dy2 /= r2;
          const cs = dx1 * dx2 + dy1 * dy2;
          const f = ANGLE_STIFFNESS * (1 - cs);
          const p1x = dx2 - cs * dx1,
            p1y = dy2 - cs * dy1;
          const p2x = dx1 - cs * dx2,
            p2y = dy1 - cs * dy2;
          a.vx += p1x * f * DT;
          a.vy += p1y * f * DT;
          c.vx += p2x * f * DT;
          c.vy += p2y * f * DT;
          b.vx -= (p1x + p2x) * f * DT;
          b.vy -= (p1y + p2y) * f * DT;
        }
      }
    }
  }

  // --- Segment-segment repulsion (prevents phantom chain crossing) ---
  function segmentDist2(a, b, c, d) {
    let abx = wrapDelta(b.x - a.x, width),
      aby = wrapDelta(b.y - a.y, height);
    let cdx = wrapDelta(d.x - c.x, width),
      cdy = wrapDelta(d.y - c.y, height);
    let acx = wrapDelta(c.x - a.x, width),
      acy = wrapDelta(c.y - a.y, height);
    let t = (acx * cdx + acy * cdy) / (cdx * cdx + cdy * cdy + 0.0001);
    t = Math.max(0, Math.min(1, t));
    const nearX = c.x + cdx * t,
      nearY = c.y + cdy * t;
    let dax = wrapDelta(nearX - a.x, width),
      day = wrapDelta(nearY - a.y, height);
    let bestDist2 = dax * dax + day * day;
    let bcx = wrapDelta(c.x - b.x, width),
      bcy = wrapDelta(c.y - b.y, height);
    t = (bcx * cdx + bcy * cdy) / (cdx * cdx + cdy * cdy + 0.0001);
    t = Math.max(0, Math.min(1, t));
    const nearX2 = c.x + cdx * t,
      nearY2 = c.y + cdy * t;
    let dbx = wrapDelta(nearX2 - b.x, width),
      dby = wrapDelta(nearY2 - b.y, height);
    bestDist2 = Math.min(bestDist2, dbx * dbx + dby * dby);
    return bestDist2;
  }

  function applySegmentRepulsion() {
    const n = chains.length;
    for (let ci = 0; ci < n; ci++) {
      const ca = chains[ci];
      for (let cj = ci + 1; cj < n; cj++) {
        const cb = chains[cj];
        for (const [ai, aj] of ca.bonds) {
          const a = ca.beads[ai],
            b = ca.beads[aj];
          for (const [bi, bj] of cb.bonds) {
            const c = cb.beads[bi],
              d = cb.beads[bj];
            const d2 = segmentDist2(a, b, c, d);
            if (d2 < SEGMENT_CUTOFF * SEGMENT_CUTOFF) {
              const force = SEGMENT_STRENGTH / (d2 + 0.001);
              const mabx = (a.x + b.x) / 2,
                maby = (a.y + b.y) / 2;
              const mcdx = (c.x + d.x) / 2,
                mcdy = (c.y + d.y) / 2;
              let dx = wrapDelta(mabx - mcdx, width);
              let dy = wrapDelta(maby - mcdy, height);
              const mag = Math.sqrt(dx * dx + dy * dy) + 0.001;
              dx /= mag;
              dy /= mag;
              const f2 = force * 2;
              a.vx += dx * f2 * DT;
              a.vy += dy * f2 * DT;
              b.vx += dx * f2 * DT;
              b.vy += dy * f2 * DT;
              c.vx -= dx * f2 * DT;
              c.vy -= dy * f2 * DT;
              d.vx -= dx * f2 * DT;
              d.vy -= dy * f2 * DT;
            }
          }
        }
      }
    }
  }

  // --- Core physics (one fixed 60 Hz step) ---
  function stepPhysics() {
    const allBeads = [];
    chains.forEach((chain, ci) => {
      applyAngleForces(chain);
      chain.beads.forEach((bead, bi) => allBeads.push({ bead, ci, bi }));
    });

    // Langevin + shear + position integration
    for (const { bead: b } of allBeads) {
      b.vx += (Math.random() - 0.5) * THERMAL_KICK;
      b.vy += (Math.random() - 0.5) * THERMAL_KICK;
      b.vx += (SHEAR_RATE * (b.y - height / 2)) / (height / 2);
      b.vx *= FRICTION;
      b.vy *= FRICTION;
      b.x += b.vx * DT;
      b.y += b.vy * DT;
      b.x = wrap(b.x, width);
      b.y = wrap(b.y, height);
    }

    // Bead-bead excluded volume
    for (let i = 0; i < allBeads.length; i++) {
      for (let j = i + 1; j < allBeads.length; j++) {
        const ia = allBeads[i],
          ja = allBeads[j];
        if (ia.ci === ja.ci) {
          const c = chains[ia.ci];
          const bonded = c.bonds.some(([a, b]) => (a === ia.bi && b === ja.bi) || (a === ja.bi && b === ia.bi));
          if (bonded) continue;
        }
        const a = ia.bead,
          b = ja.bead;
        let dx = wrapDelta(a.x - b.x, width),
          dy = wrapDelta(a.y - b.y, height);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPULSION_CUTOFF && dist > 0.001) {
          const force = REPULSION_STRENGTH / (dist * dist);
          const fx = (dx / dist) * force,
            fy = (dy / dist) * force;
          a.vx += fx * DT;
          a.vy += fy * DT;
          b.vx -= fx * DT;
          b.vy -= fy * DT;
        }
      }
    }

    // Bond-bond segment repulsion (prevents phantom crossing)
    applySegmentRepulsion();

    for (const chain of chains) enforceBondConstraints(chain);

    // Solvent particles
    for (const s of solvent) {
      s.vx += (Math.random() - 0.5) * 0.4 * physScale;
      s.vy += (Math.random() - 0.5) * 0.4 * physScale;
      s.vx += (SHEAR_RATE * (s.y - height / 2)) / (height / 2);
      s.vx *= SOLVENT_FRICTION;
      s.vy *= SOLVENT_FRICTION;
      s.x += s.vx * DT;
      s.y += s.vy * DT;
      s.x = wrap(s.x, width);
      s.y = wrap(s.y, height);
    }
  }

  // --- Drag ---
  function findNearestBead(mx, my) {
    let best = null,
      bestDist = DRAG_RADIUS;
    chains.forEach((chain, ci) =>
      chain.beads.forEach((bead, bi) => {
        let dx = wrapDelta(bead.x - mx, width),
          dy = wrapDelta(bead.y - my, height);
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestDist) {
          bestDist = d;
          best = { ci, bi };
        }
      })
    );
    return best;
  }

  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const n = findNearestBead((e.clientX - rect.left) * (width / rect.width), (e.clientY - rect.top) * (height / rect.height));
    if (n) dragBead = n;
  });

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (width / rect.width);
    mouseY = (e.clientY - rect.top) * (height / rect.height);
    if (dragBead) {
      const b = chains[dragBead.ci].beads[dragBead.bi];
      b.x = mouseX;
      b.y = mouseY;
      b.vx = 0;
      b.vy = 0;
      canvas.style.cursor = "grabbing";
    } else {
      canvas.style.cursor = findNearestBead(mouseX, mouseY) ? "grab" : "default";
    }
  });

  canvas.addEventListener("mouseup", () => {
    dragBead = null;
    canvas.style.cursor = "default";
  });
  canvas.addEventListener("mouseleave", () => {
    dragBead = null;
    canvas.style.cursor = "default";
  });

  // Touch
  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const n = findNearestBead(
        (e.touches[0].clientX - rect.left) * (width / rect.width),
        (e.touches[0].clientY - rect.top) * (height / rect.height)
      );
      if (n) dragBead = n;
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      if (!dragBead) return;
      const rect = canvas.getBoundingClientRect();
      const b = chains[dragBead.ci].beads[dragBead.bi];
      b.x = (e.touches[0].clientX - rect.left) * (width / rect.width);
      b.y = (e.touches[0].clientY - rect.top) * (height / rect.height);
      b.vx = 0;
      b.vy = 0;
    },
    { passive: false }
  );

  canvas.addEventListener("touchend", () => {
    dragBead = null;
  });

  // --- Rendering ---
  function drawBond(ax, ay, bx, by, color) {
    let dx = wrapDelta(bx - ax, width),
      dy = wrapDelta(by - ay, height);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + dx, ay + dy);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6 * physScale;
    ctx.globalAlpha = BOND_ALPHA;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (const s of solvent) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, SOLVENT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = SOLVENT_COLOR;
      ctx.fill();
    }
    for (const chain of chains) {
      for (const [i, j] of chain.bonds) {
        drawBond(chain.beads[i].x, chain.beads[i].y, chain.beads[j].x, chain.beads[j].y, chain.color);
      }
      for (const bead of chain.beads) {
        ctx.beginPath();
        ctx.arc(bead.x, bead.y, BEAD_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = chain.color;
        ctx.fill();
        const hlX = bead.x - 1.2 * physScale;
        const hlY = bead.y - 1.2 * physScale;
        ctx.beginPath();
        ctx.arc(hlX, hlY, BEAD_RADIUS * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fill();
      }
    }
  }

  // --- Fixed-timestep animation loop (60 Hz physics regardless of display Hz) ---
  function loop(timestamp) {
    if (lastTime === 0) lastTime = timestamp;

    const elapsed = timestamp - lastTime;
    physAccum += elapsed;
    lastTime = timestamp;

    // Clamp accumulator to avoid spiral-of-death after tab switch
    if (physAccum > PHYSICS_DT * MAX_STEPS_PER_FRAME) {
      physAccum = PHYSICS_DT * MAX_STEPS_PER_FRAME;
    }

    // Run physics at fixed 60 Hz interval
    let stepped = false;
    while (physAccum >= PHYSICS_DT) {
      stepPhysics();
      physAccum -= PHYSICS_DT;
      stepped = true;
    }

    // Only redraw if physics actually stepped (avoids wasted draws at 120+ Hz)
    if (stepped) {
      draw();
    }

    requestAnimationFrame(loop);
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = canvas.parentElement.clientWidth;
    height = Math.min(width * 0.35, 320);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rescalePhysics();
  }

  resize();
  initChains();
  initSolvent();
  window.addEventListener("resize", () => {
    resize();
    initChains();
    initSolvent();
    // Reset timing on resize to avoid a burst of catch-up steps
    physAccum = 0;
    lastTime = 0;
  });
  requestAnimationFrame(loop);
});
