/**
 * Infinite Boulder Dash - Main Controller & Game Loop
 * Manages roguelike permadeath, new world generation, milestones, and input.
 */

import { BoulderDashEngine } from './engine.js';
import { BoulderDashRenderer } from './renderer.js';
import { sound } from './audio.js';
import { DIR } from './caves.js';

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('game-canvas');
  const soundToggleBtn = document.getElementById('btn-sound');
  const newWorldBtn = document.getElementById('btn-new-world');
  const messageBanner = document.getElementById('message-banner');

  // Death modal elements
  const deathModal = document.getElementById('death-modal');
  const deathDiamondsEl = document.getElementById('death-diamonds');
  const deathScoreEl = document.getElementById('death-score');
  const deathDepthEl = document.getElementById('death-depth');
  const deathTimeEl = document.getElementById('death-time');
  const bestScoreEl = document.getElementById('best-score');
  const bestDepthEl = document.getElementById('best-depth');
  const btnModalRetry = document.getElementById('btn-modal-retry');

  // Load high scores from localStorage
  let highScore = parseInt(localStorage.getItem('infinite_bd_high_score') || '0', 10);
  let bestDepth = parseInt(localStorage.getItem('infinite_bd_best_depth') || '0', 10);
  bestScoreEl.textContent = highScore.toLocaleString();
  bestDepthEl.textContent = `${bestDepth}m`;

  let bannerTimeout = null;
  function showMessage(content, duration = 2500) {
    if (bannerTimeout) clearTimeout(bannerTimeout);
    if (typeof content === 'string' && (content.includes('<') || content.includes('\n'))) {
      messageBanner.innerHTML = content;
    } else {
      messageBanner.textContent = content;
    }
    updateMessageBannerPosition();
    messageBanner.classList.add('visible');
    bannerTimeout = setTimeout(() => {
      messageBanner.classList.remove('visible');
    }, duration);
  }

  function updateMessageBannerPosition() {
    if (!renderer) return;

    const pos = renderer.getRockfordScreenPos();
    const cw = window.innerWidth;
    const ch = window.innerHeight;

    const bannerW = messageBanner.offsetWidth || 320;
    const bannerH = messageBanner.offsetHeight || 44;
    const halfW = bannerW / 2;

    // Horizontally center at Rockford, clamped within screen margins
    const targetX = Math.max(halfW + 12, Math.min(cw - halfW - 12, pos.x));

    // Position out of the way below Rockford (pos.y + 16 is feet, + 20px clearance = pos.y + 36)
    let targetY = pos.y + 36;
    if (targetY + bannerH > ch - 16) {
      // Flip above Rockford if viewport bottom is cramped
      targetY = pos.y - 20 - bannerH;
    }
    targetY = Math.max(54, targetY);

    messageBanner.style.left = `${Math.round(targetX)}px`;
    messageBanner.style.top = `${Math.round(targetY)}px`;
  }

  let renderer = null;

  // Create Infinite Engine
  const engine = new BoulderDashEngine({
    onEvent: (event, data) => {
      switch (event) {
        case 'level_loaded':
          sound.playCrack();
          showMessage(`NEW EXPEDITION - SEED #${data.seed}`, 2000);
          if (renderer && renderer.spritesLoaded) {
            renderer.recolorWithPalette(data.seed);
          }
          break;
        case 'diamond_collected':
          sound.playDiamond();
          break;
        case 'boulder_drop':
          sound.playBoulderFall();
          break;
        case 'dig':
          sound.playWalkDirt();
          break;
        case 'explosion':
          sound.playExplosion();
          break;
        case 'milestone_reached':
          sound.playQuotaReached();
          // Milestone notification sign shown directly below Rockford
          showMessage(
            `<div class="milestone-title">★ MILESTONE: ${data.count} DIAMONDS! ★</div>` +
            `<div class="milestone-sub">${data.title} (+${data.bonus.toLocaleString()} PTS)</div>`,
            3500
          );
          break;
        case 'rockford_died':
          handleDeath(data);
          break;
      }
    }
  });

  let deathTimeout = null;

  function handleDeath(stats) {
    if (bannerTimeout) {
      clearTimeout(bannerTimeout);
      bannerTimeout = null;
    }
    messageBanner.classList.remove('visible');

    // Update local storage records
    if (stats.score > highScore) {
      highScore = stats.score;
      localStorage.setItem('infinite_bd_high_score', highScore);
    }
    if (stats.depth > bestDepth) {
      bestDepth = stats.depth;
      localStorage.setItem('infinite_bd_best_depth', bestDepth);
    }

    bestScoreEl.textContent = highScore.toLocaleString();
    bestDepthEl.textContent = `${bestDepth}m`;

    deathDiamondsEl.textContent = stats.diamonds;
    deathScoreEl.textContent = stats.score.toLocaleString();
    deathDepthEl.textContent = `${stats.depth}m`;
    deathTimeEl.textContent = `${stats.time}s`;

    // Display expedition summary modal smoothly after a delay following Rockford's death
    if (deathTimeout) {
      clearTimeout(deathTimeout);
    }
    deathTimeout = setTimeout(() => {
      if (engine.lost) {
        deathModal.classList.add('visible');
      }
    }, 1500);
  }

  function startNewRun() {
    if (bannerTimeout) {
      clearTimeout(bannerTimeout);
      bannerTimeout = null;
    }
    messageBanner.classList.remove('visible');

    if (deathTimeout) {
      clearTimeout(deathTimeout);
      deathTimeout = null;
    }
    deathModal.classList.remove('visible');
    // Roguelike: always rolls a completely new random world seed!
    engine.reset();
    if (renderer) {
      renderer.hasInitCamera = false;
      renderer.recolorWithPalette(engine.seed);
    }
  }

  btnModalRetry.addEventListener('click', startNewRun);

  // Create Full-Window Renderer
  renderer = new BoulderDashRenderer(canvas, engine);

  try {
    await Promise.all([
      renderer.loadSprites('images/sprites.png'),
      renderer.loadTitle('images/infinite-boulder-dash.png')
    ]);
    renderer.recolorWithPalette(engine.seed);
    console.log('Sprites and title loaded, entity palettes randomized for seed #' + engine.seed);
  } catch (err) {
    console.error('Failed to load assets:', err);
  }

  function resize() {
    renderer.resize();
  }
  window.addEventListener('resize', resize);
  resize();

  // Keyboard input
  const keysDown = new Set();

  function updateInput() {
    let dir = null;
    if (keysDown.has('ArrowUp') || keysDown.has('KeyW')) {
      dir = DIR.UP;
    } else if (keysDown.has('ArrowDown') || keysDown.has('KeyS')) {
      dir = DIR.DOWN;
    } else if (keysDown.has('ArrowLeft') || keysDown.has('KeyA')) {
      dir = DIR.LEFT;
    } else if (keysDown.has('ArrowRight') || keysDown.has('KeyD')) {
      dir = DIR.RIGHT;
    }

    const grab = keysDown.has('Space') || keysDown.has('ShiftLeft') || keysDown.has('ShiftRight');
    engine.moving.dir = dir;
    engine.moving.grab = grab;
  }

  window.addEventListener('keydown', (e) => {
    sound.ensureContext();

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    // If death modal is visible, Space, Enter, or R starts a new run
    if (deathModal.classList.contains('visible')) {
      if (['Space', 'Enter', 'KeyR'].includes(e.code)) {
        startNewRun();
        return;
      }
    }

    keysDown.add(e.code);

    if (e.code === 'KeyR') {
      startNewRun();
    } else if (e.code === 'KeyM') {
      toggleSound();
    }

    updateInput();
  });

  window.addEventListener('keyup', (e) => {
    keysDown.delete(e.code);
    updateInput();
  });

  function toggleSound() {
    sound.enabled = !sound.enabled;
    soundToggleBtn.textContent = `SOUND: ${sound.enabled ? 'ON' : 'OFF'}`;
  }

  soundToggleBtn.addEventListener('click', toggleSound);

  newWorldBtn.addEventListener('click', () => {
    startNewRun();
  });

  // Mobile / Touch D-Pad buttons
  const dpadButtons = document.querySelectorAll('[data-dir]');
  dpadButtons.forEach((btn) => {
    const d = btn.getAttribute('data-dir');
    const startPress = (e) => {
      e.preventDefault();
      sound.ensureContext();
      keysDown.add(d);
      updateInput();
    };
    const endPress = (e) => {
      e.preventDefault();
      keysDown.delete(d);
      updateInput();
    };
    btn.addEventListener('mousedown', startPress);
    btn.addEventListener('mouseup', endPress);
    btn.addEventListener('mouseleave', endPress);
    btn.addEventListener('touchstart', startPress, { passive: false });
    btn.addEventListener('touchend', endPress, { passive: false });
  });

  const btnGrab = document.getElementById('touch-grab');
  if (btnGrab) {
    const startGrab = (e) => {
      e.preventDefault();
      sound.ensureContext();
      keysDown.add('Space');
      updateInput();
    };
    const endGrab = (e) => {
      e.preventDefault();
      keysDown.delete('Space');
      updateInput();
    };
    btnGrab.addEventListener('mousedown', startGrab);
    btnGrab.addEventListener('mouseup', endGrab);
    btnGrab.addEventListener('mouseleave', endGrab);
    btnGrab.addEventListener('touchstart', startGrab, { passive: false });
    btnGrab.addEventListener('touchend', endGrab, { passive: false });
  }

  // Fixed timestep physics loop with 60fps smooth render interpolation
  let lastTime = performance.now();
  let accumulator = 0;
  const physicsStep = engine.step; // 0.1s (10Hz)

  function loop(currentTime) {
    const delta = Math.min(1.0, (currentTime - lastTime) / 1000);
    lastTime = currentTime;
    accumulator += delta;

    while (accumulator >= physicsStep) {
      engine.update();
      accumulator -= physicsStep;
    }

    renderer.render(delta);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
