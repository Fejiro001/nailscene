(() => {
  const loader = document.getElementById('nailscene-loader');

  if (!loader || loader.hidden) return;

  const enterButton = loader.querySelector('.nailscene-loader__enter');
  const progress = loader.querySelector('.nailscene-loader__progress');
  const progressFill = loader.querySelector('.nailscene-loader__progress-fill');

  const percentLabel = document.getElementById('nailscene-loading-percent');
  const statusLabel = document.getElementById('nailscene-loading-status');
  const footerLabel = document.getElementById('nailscene-loader-footer');

  if (!enterButton || !progress || !progressFill || !percentLabel || !statusLabel || !footerLabel) return;

  const previousFocus = document.activeElement;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let pageLoaded = document.readyState === 'complete';
  let reached90 = false;
  let finishing = false;
  let closed = false;

  function updateProgress(value) {
    const percent = Math.min(100, Math.max(0, Math.round(value)));

    progressFill.style.width = `${percent}%`;
    percentLabel.textContent = `${percent}%`;
    progress.setAttribute('aria-valuenow', percent);

    if (percent < 30) {
      statusLabel.textContent = 'BOOTING NAILSCENE...';
    } else if (percent < 65) {
      statusLabel.textContent = 'ORGANIZING YOUR SCENE...';
    } else if (percent < 100) {
      statusLabel.textContent = 'ADDING FINAL TOUCHES...';
    } else {
      statusLabel.textContent = 'YOUR SCENE IS READY ✦';
      footerLabel.textContent = 'SCENE_001 // SYSTEM READY';
      loader.classList.add('is-ready');
      document.getElementById('nailscene-display-status').textContent = '✦ SYSTEM ONLINE';
    }
  }

  function animateProgress(from, to, duration, onComplete) {
    if (duration === 0) {
      updateProgress(to);
      onComplete?.();
      return;
    }

    const startTime = performance.now();

    function frame(now) {
      if (closed) return;

      const elapsed = now - startTime;
      const ratio = Math.min(elapsed / duration, 1);

      updateProgress(from + (to - from) * ratio);

      if (ratio < 1) {
        requestAnimationFrame(frame);
      } else {
        onComplete?.();
      }
    }

    requestAnimationFrame(frame);
  }

  function finishLoading() {
    if (finishing || closed) return;

    finishing = true;

    animateProgress(90, 100, reducedMotion ? 0 : 1000);
  }

  function onPageLoaded() {
    pageLoaded = true;

    if (reached90) {
      finishLoading();
    }
  }

  if (!pageLoaded) {
    window.addEventListener('load', onPageLoaded, { once: true });
  }

  updateProgress(0);

  animateProgress(0, 90, reducedMotion ? 0 : 3000, () => {
    reached90 = true;

    if (pageLoaded) {
      finishLoading();
    }
  });

  function closeLoader() {
    if (closed) return;
    closed = true;

    try {
      sessionStorage.setItem('nailscene-intro-seen', '1');
    } catch (error) {
      // The storefront remains accessible if storage is blocked.
    }

    document.removeEventListener('keydown', handleKeydown);

    loader.classList.add('is-closing');

    function finishClose() {
      loader.hidden = true;

      document.documentElement.classList.remove('nailscene-loader-open');

      if (previousFocus instanceof HTMLElement && document.contains(previousFocus) && previousFocus !== document.body) {
        previousFocus.focus({ preventScroll: true });
      }
    }

    if (reducedMotion) {
      finishClose();
    } else {
      setTimeout(finishClose, 300);
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeLoader();
    }

    if (event.key === 'Tab' && !closed) {
      event.preventDefault();
      enterButton.focus();
    }
  }

  enterButton.addEventListener('click', closeLoader);
  document.addEventListener('keydown', handleKeydown);

  enterButton.focus({ preventScroll: true });
})();
