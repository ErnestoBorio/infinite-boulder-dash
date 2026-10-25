/**
 * Infinite Boulder Dash - Main Controller & Game Loop
 * Manages roguelike permadeath, new world generation, milestones, and input.
 */

import { BoulderDashEngine } from './engine.js?v=20261025_2';
import { BoulderDashRenderer } from './renderer.js?v=20261025_2';
import { sound } from './audio.js';
import { DIR } from './caves.js';

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('game-canvas');
  const soundToggleBtn = document.getElementById('btn-sound');
  const newWorldBtn = document.getElementById('btn-new-world');
  const btnHelp = document.getElementById('btn-help');
  const messageBanner = document.getElementById('message-banner');

  // Help modal elements
  const helpModal = document.getElementById('help-modal');
  const btnCloseHelp = document.getElementById('btn-close-help');

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

  let currentBannerPlacement = 'below';

  function updateMessageBannerPosition(preferredSide = null) {
    if (!renderer) return;

    const pos = renderer.getRockfordScreenPos();
    const cw = window.innerWidth;
    const ch = window.innerHeight;

    const bannerW = messageBanner.offsetWidth || 320;
    const bannerH = messageBanner.offsetHeight || 44;
    const halfW = bannerW / 2;

    // Horizontally center at Rockford, clamped within screen margins
    const targetX = Math.max(halfW + 12, Math.min(cw - halfW - 12, pos.x));

    let side = preferredSide || currentBannerPlacement;
    let targetY;

    if (side === 'above') {
      targetY = pos.y - 24 - bannerH;
      if (targetY < 54) {
        targetY = pos.y + 36;
        side = 'below';
      }
    } else {
      targetY = pos.y + 36;
      if (targetY + bannerH > ch - 16) {
        targetY = pos.y - 24 - bannerH;
        side = 'above';
      }
    }
    targetY = Math.max(54, Math.min(ch - bannerH - 16, targetY));
    currentBannerPlacement = side;

    messageBanner.style.left = `${Math.round(targetX)}px`;
    messageBanner.style.top = `${Math.round(targetY)}px`;
  }

  function checkMessageBannerEvade() {
    if (!renderer || !messageBanner.classList.contains('visible')) return;
    const pos = renderer.getRockfordScreenPos();
    const bannerRect = messageBanner.getBoundingClientRect();
    if (bannerRect.width === 0 || bannerRect.height === 0) return;

    // Safety margin around Rockford (32x32 sprite) and the banner
    const margin = 20;
    const isBeneath = (
      pos.x >= bannerRect.left - margin &&
      pos.x <= bannerRect.right + margin &&
      pos.y >= bannerRect.top - margin &&
      pos.y <= bannerRect.bottom + margin
    );

    if (isBeneath) {
      messageBanner.classList.add('evading');
      // Flip side so the sign gets out of the way!
      const newSide = (currentBannerPlacement === 'below') ? 'above' : 'below';
      updateMessageBannerPosition(newSide);
    } else {
      messageBanner.classList.remove('evading');
    }
  }

  function updateDeathSignPosition() {
    if (!renderer) return;
    const pos = renderer.getRockfordScreenPos();
    const ch = window.innerHeight;
    const deathCard = deathModal.querySelector('.death-card');
    if (!deathCard) return;

    // If Rockford / death position is near the center, shift death card upward
    // so the death spot is clearly visible below it
    if (pos.y >= ch / 2 - 80) {
      deathCard.style.transform = 'translateY(-110px)';
    } else {
      deathCard.style.transform = 'translateY(110px)';
    }
  }

  let renderer = null;

  const urlParams = new URLSearchParams(window.location.search);
  const seedParam = urlParams.get('seed');
  const initialSeed = seedParam && !isNaN(parseInt(seedParam, 10)) ? parseInt(seedParam, 10) : undefined;

  // Create Infinite Engine
  const engine = new BoulderDashEngine({
    seed: initialSeed,
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
        updateDeathSignPosition();
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
    const deathCard = deathModal.querySelector('.death-card');
    if (deathCard) {
      deathCard.style.transform = '';
      deathCard.classList.remove('evading');
    }
    deathModal.classList.remove('visible');
    if (helpModal) {
      helpModal.classList.remove('visible');
    }
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
    if (helpModal && helpModal.classList.contains('visible')) {
      engine.moving.dir = null;
      engine.moving.grab = false;
      return;
    }

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

    // If help modal is visible, close on Esc, H, Space, Enter
    if (helpModal && helpModal.classList.contains('visible')) {
      if (['Escape', 'KeyH', 'Space', 'Enter'].includes(e.code) || e.key === 'h' || e.key === 'H' || e.key === 'Escape') {
        closeHelp();
        return;
      }
    }

    // If death modal is visible, Space, Enter, or R starts a new run
    if (deathModal.classList.contains('visible')) {
      if (['Space', 'Enter', 'KeyR'].includes(e.code)) {
        startNewRun();
        return;
      }
      const deathCard = deathModal.querySelector('.death-card');
      if (deathCard) {
        deathCard.classList.add('evading');
      }
    }

    keysDown.add(e.code);

    if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
      startNewRun();
    } else if (e.code === 'KeyM' || e.key === 'm' || e.key === 'M') {
      toggleSound();
    } else if (e.code === 'KeyH' || e.key === 'h' || e.key === 'H') {
      toggleHelp();
    } else if (e.code === 'Escape' || e.key === 'Escape') {
      if (helpModal && helpModal.classList.contains('visible')) {
        closeHelp();
      }
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

  function openHelp() {
    if (helpModal) {
      helpModal.classList.add('visible');
      updateInput();
    }
  }

  function closeHelp() {
    if (helpModal) {
      helpModal.classList.remove('visible');
      updateInput();
    }
  }

  function toggleHelp() {
    if (helpModal && helpModal.classList.contains('visible')) {
      closeHelp();
    } else {
      openHelp();
    }
  }

  if (btnHelp) {
    btnHelp.addEventListener('click', toggleHelp);
  }
  if (btnCloseHelp) {
    btnCloseHelp.addEventListener('click', closeHelp);
  }
  if (helpModal) {
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) {
        closeHelp();
      }
    });
  }

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

    if (messageBanner.classList.contains('visible')) {
      checkMessageBannerEvade();
    }

    renderer.render(delta);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
