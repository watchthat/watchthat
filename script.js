(function() {
  'use strict';

  // ===== STATE =====
  let currentUsername = '';
  let selectedUsername = '';
  let isVerified = false;
  let currentVideoId = '';
  let cinemaModeActive = false;
  let isDragging = false;

  // ===== DOM REFS =====
  const authOverlay = document.getElementById('authOverlay');
  const mainApp = document.getElementById('mainApp');
  const createAccountBtn = document.getElementById('createAccountBtn');
  const usernameSelection = document.getElementById('usernameSelection');
  const usernameGrid = document.getElementById('usernameGrid');
  const verifyStatus = document.getElementById('verifyStatus');
  const enterAppBtn = document.getElementById('enterAppBtn');
  const displayUsername = document.getElementById('displayUsername');

  const sliderContainer = document.getElementById('sliderContainer');
  const sliderThumb = document.getElementById('sliderThumb');
  const sliderFill = document.getElementById('sliderFill');
  const sliderText = document.getElementById('sliderText');

  const youtubeLinkInput = document.getElementById('youtubeLinkInput');
  const loadVideoBtn = document.getElementById('loadVideoBtn');
  const videoIframe = document.getElementById('videoIframe');
  const videoPlaceholder = document.getElementById('videoPlaceholder');
  const videoStatus = document.getElementById('videoStatus');
  const downloadBtn = document.getElementById('downloadBtn');
  const newVideoBtn = document.getElementById('newVideoBtn');
  const reloadBtn = document.getElementById('reloadBtn');
  const statusDot = document.querySelector('.status-dot');

  const toast = document.getElementById('toast');
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel = document.getElementById('settingsPanel');
  const downloadPopup = document.getElementById('downloadPopup');
  const downloadOptions = document.getElementById('downloadOptions');
  const closeDownloadBtn = document.getElementById('closeDownloadBtn');

  const darkModeToggle = document.getElementById('darkModeToggle');
  const cinemaModeToggle = document.getElementById('cinemaModeToggle');
  const autoplayToggle = document.getElementById('autoplayToggle');
  const loopToggle = document.getElementById('loopToggle');
  const resetSettingsBtn = document.getElementById('resetSettingsBtn');

  // ===== HELPERS =====
  function generateRandomString(len = 10) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < len; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  function getRandomUsernames(count = 4) {
    return Array.from({ length: count }, () => 'user_' + generateRandomString(10));
  }

  function showToast(msg, duration = 2500) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), duration);
  }

  function setStatus(text, isActive = false) {
    videoStatus.innerHTML = `<span class="status-dot ${isActive ? 'active' : ''}"></span> ${text}`;
  }

  // ===== RENDER USERNAMES =====
  function renderUsernames() {
    const names = getRandomUsernames(4);
    usernameGrid.innerHTML = '';
    names.forEach(name => {
      const div = document.createElement('div');
      div.className = 'username-option';
      div.textContent = name;
      div.dataset.name = name;
      div.addEventListener('click', function() {
        document.querySelectorAll('.username-option').forEach(el => el.classList.remove('selected'));
        this.classList.add('selected');
        selectedUsername = this.dataset.name;
        sliderContainer.classList.add('active');
        resetSlider();
        checkVerification();
      });
      usernameGrid.appendChild(div);
    });
  }

  // ===== SLIDER =====
  function getSliderWidth() {
    return sliderContainer.offsetWidth - sliderThumb.offsetWidth - 8;
  }

  function updateSlider(clientX) {
    const rect = sliderContainer.getBoundingClientRect();
    const containerWidth = getSliderWidth();
    let x = clientX - rect.left - sliderThumb.offsetWidth / 2;
    x = Math.max(4, Math.min(x, containerWidth));
    const progress = x / containerWidth;
    sliderThumb.style.left = x + 'px';
    sliderFill.style.width = (progress * 100) + '%';
    if (progress > 0.92) completeVerification();
    return progress;
  }

  function onSliderStart(e) {
    if (isVerified) return;
    e.preventDefault();
    const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    isDragging = true;
    sliderThumb.classList.add('dragging');
    sliderText.innerHTML = '<i class="fas fa-arrow-right"></i> Keep dragging...';
    document.addEventListener('mousemove', onSliderMove);
    document.addEventListener('mouseup', onSliderEnd);
    document.addEventListener('touchmove', onSliderMove, { passive: false });
    document.addEventListener('touchend', onSliderEnd);
  }

  function onSliderMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    updateSlider(clientX);
  }

  function onSliderEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    sliderThumb.classList.remove('dragging');
    document.removeEventListener('mousemove', onSliderMove);
    document.removeEventListener('mouseup', onSliderEnd);
    document.removeEventListener('touchmove', onSliderMove);
    document.removeEventListener('touchend', onSliderEnd);

    const thumbLeft = parseFloat(sliderThumb.style.left) || 4;
    const containerWidth = getSliderWidth();
    if (thumbLeft / containerWidth > 0.9) {
      completeVerification();
    } else {
      sliderThumb.style.left = '4px';
      sliderFill.style.width = '0%';
      sliderText.innerHTML = '<i class="fas fa-arrow-right"></i> Slide to verify';
      sliderText.className = 'slider-text';
      sliderThumb.className = 'slider-thumb';
      sliderThumb.innerHTML = '<i class="fas fa-chevron-right"></i>';
    }
  }

  function completeVerification() {
    if (isVerified) return;
    isVerified = true;
    const containerWidth = getSliderWidth();
    sliderThumb.style.left = containerWidth + 'px';
    sliderFill.style.width = '100%';
    sliderFill.classList.add('success');
    sliderText.innerHTML = '<i class="fas fa-check-circle"></i> Verified!';
    sliderText.className = 'slider-text success-text';
    sliderThumb.className = 'slider-thumb success';
    sliderThumb.innerHTML = '<i class="fas fa-check"></i>';
    sliderContainer.classList.add('verified');
    verifyStatus.textContent = '✅ Verified!';
    verifyStatus.className = 'verify-status success';
    checkVerification();
    showToast('✅ Verified!');
  }

  function resetSlider() {
    isVerified = false;
    sliderThumb.style.left = '4px';
    sliderFill.style.width = '0%';
    sliderFill.classList.remove('success');
    sliderText.innerHTML = '<i class="fas fa-arrow-right"></i> Slide to verify';
    sliderText.className = 'slider-text';
    sliderThumb.className = 'slider-thumb';
    sliderThumb.innerHTML = '<i class="fas fa-chevron-right"></i>';
    sliderContainer.classList.remove('verified');
    verifyStatus.textContent = '';
    verifyStatus.className = 'verify-status';
    enterAppBtn.classList.remove('active');
  }

  function initSlider() {
    const newThumb = sliderThumb.cloneNode(true);
    sliderThumb.parentNode.replaceChild(newThumb, sliderThumb);
    const freshThumb = document.getElementById('sliderThumb');
    freshThumb.addEventListener('mousedown', onSliderStart);
    freshThumb.addEventListener('touchstart', onSliderStart, { passive: false });
  }

  function checkVerification() {
    if (isVerified && selectedUsername) {
      enterAppBtn.classList.add('active');
    } else {
      enterAppBtn.classList.remove('active');
    }
  }

  // ===== VIDEO =====
  function extractVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  function loadYouTubeVideo(url) {
    try {
      const videoId = extractVideoId(url);
      if (!videoId) {
        setStatus('❌ invalid link');
        showToast('❌ Invalid YouTube link');
        return;
      }
      currentVideoId = videoId;
      const proxyUrl = `https://yout-ube.com/watch?v=${videoId}`;
      setStatus('⏳ loading...', true);
      videoIframe.style.display = 'block';
      videoPlaceholder.style.display = 'none';
      videoIframe.src = proxyUrl;
      setStatus('✅ loaded (no ads)', true);
      setTimeout(() => {
        if (cinemaModeActive) applyCinemaMode(true);
      }, 1000);
      showToast('✅ Video loaded!');
    } catch (err) {
      setStatus('⚠️ failed to load');
      videoIframe.style.display = 'none';
      videoPlaceholder.style.display = 'flex';
      videoPlaceholder.innerHTML = `
        <div class="placeholder-icon">
          <i class="fas fa-exclamation-triangle" style="color:var(--danger);"></i>
        </div>
        <h3>Could not load video</h3>
        <p>Try another link</p>
      `;
      showToast('⚠️ Failed to load video');
    }
  }

  // ===== DOWNLOAD =====
  function downloadVideo() {
    if (!currentVideoId) {
      showToast('⚠️ No video loaded');
      return;
    }

    const videoUrl = `https://www.youtube.com/watch?v=${currentVideoId}`;
    const methods = [
      { name: '📥 SaveFrom.net', url: `https://en.savefrom.net/1/?url=${encodeURIComponent(videoUrl)}` },
      { name: '📥 YT5s.com', url: `https://yt5s.com/en/` },
      { name: '📥 SSYouTube', url: `https://ssyoutube.com/watch?v=${currentVideoId}` },
      { name: '📥 YT1s.com', url: `https://yt1s.com/en/` },
      { name: '📥 Y2Mate', url: `https://www.y2mate.com/en474/youtube-mp4?url=${encodeURIComponent(videoUrl)}` }
    ];

    downloadOptions.innerHTML = '';
    methods.forEach(m => {
      const btn = document.createElement('button');
      btn.textContent = m.name;
      btn.addEventListener('click', () => {
        window.open(m.url, '_blank');
        showToast('✅ Opening download page...');
        downloadPopup.classList.remove('active');
      });
      downloadOptions.appendChild(btn);
    });

    downloadPopup.classList.add('active');
  }

  // ===== CONTROLS =====
  function resetVideo() {
    videoIframe.src = '';
    videoIframe.style.display = 'none';
    videoPlaceholder.style.display = 'flex';
    videoPlaceholder.innerHTML = `
      <div class="placeholder-icon">
        <i class="fas fa-film"></i>
      </div>
      <h3>Ready to watch</h3>
      <p>Paste a YouTube link and click Watch</p>
    `;
    currentVideoId = '';
    setStatus('no video loaded');
    youtubeLinkInput.value = '';
    if (cinemaModeActive) applyCinemaMode(false);
    showToast('🔄 Reset');
  }

  function reloadVideo() {
    if (!currentVideoId) {
      showToast('⚠️ No video to reload');
      return;
    }
    videoIframe.src = `https://yout-ube.com/watch?v=${currentVideoId}`;
    showToast('🔄 Reloaded');
    setStatus('✅ reloaded', true);
  }

  // ===== CINEMA MODE =====
  function applyCinemaMode(active) {
    cinemaModeActive = active;
    const wrapper = document.querySelector('.video-wrapper');
    if (active) {
      wrapper.style.boxShadow = '0 0 80px rgba(0,0,0,0.7)';
      wrapper.style.transform = 'scale(1.02)';
      wrapper.style.borderColor = 'transparent';
      document.body.style.background = '#0a0a0f';
    } else {
      wrapper.style.boxShadow = '';
      wrapper.style.transform = '';
      wrapper.style.borderColor = '';
      document.body.style.background = '';
    }
  }

  // ===== THEME =====
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('watchthat-theme', theme);
  }

  function loadTheme() {
    const saved = localStorage.getItem('watchthat-theme') || 'light';
    darkModeToggle.checked = saved === 'dark';
    applyTheme(saved);
  }

  // ===== SETTINGS =====
  function saveSetting(key, value) {
    localStorage.setItem(`watchthat_${key}`, JSON.stringify(value));
  }

  function loadSetting(key, defaultValue) {
    const saved = localStorage.getItem(`watchthat_${key}`);
    return saved !== null ? JSON.parse(saved) : defaultValue;
  }

  function loadAllSettings() {
    autoplayToggle.checked = loadSetting('autoplay', true);
    loopToggle.checked = loadSetting('loop', false);
    cinemaModeToggle.checked = loadSetting('cinema', false);
    if (cinemaModeToggle.checked) setTimeout(() => applyCinemaMode(true), 500);
  }

  function resetAllSettings() {
    ['autoplay', 'loop', 'cinema', 'theme'].forEach(k => localStorage.removeItem(`watchthat_${k}`));
    loadAllSettings();
    if (cinemaModeActive) applyCinemaMode(false);
    showToast('✅ All settings reset');
  }

  // ===== AUTH FLOW =====
  createAccountBtn.addEventListener('click', function() {
    renderUsernames();
    usernameSelection.style.display = 'block';
    resetSlider();
    setTimeout(() => {
      if (!isVerified && selectedUsername) {
        sliderContainer.classList.add('active');
        initSlider();
      }
    }, 100);
  });

  enterAppBtn.addEventListener('click', function() {
    if (!isVerified || !selectedUsername) {
      verifyStatus.textContent = '⚠️ Verify & pick a username';
      verifyStatus.className = 'verify-status error';
      return;
    }
    currentUsername = selectedUsername;
    displayUsername.innerHTML = `<i class="fas fa-user"></i> ${currentUsername}`;
    authOverlay.style.display = 'none';
    mainApp.style.display = 'block';
    loadTheme();
    loadAllSettings();
    resetVideo();
  });

  // ===== EVENTS =====
  loadVideoBtn.addEventListener('click', function() {
    const link = youtubeLinkInput.value.trim();
    if (!link) {
      showToast('⚠️ Enter a YouTube link');
      return;
    }
    loadYouTubeVideo(link);
  });

  youtubeLinkInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') loadVideoBtn.click();
  });

  downloadBtn.addEventListener('click', downloadVideo);
  newVideoBtn.addEventListener('click', resetVideo);
  reloadBtn.addEventListener('click', reloadVideo);

  // ===== SETTINGS EVENTS =====
  settingsToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    settingsPanel.classList.toggle('open');
  });

  document.addEventListener('click', function(e) {
    if (!settingsPanel.contains(e.target) && e.target !== settingsToggle && !settingsToggle.contains(e.target)) {
      settingsPanel.classList.remove('open');
    }
  });

  darkModeToggle.addEventListener('change', function() {
    applyTheme(this.checked ? 'dark' : 'light');
    saveSetting('theme', this.checked ? 'dark' : 'light');
  });

  cinemaModeToggle.addEventListener('change', function() {
    saveSetting('cinema', this.checked);
    applyCinemaMode(this.checked);
  });

  autoplayToggle.addEventListener('change', function() {
    saveSetting('autoplay', this.checked);
  });

  loopToggle.addEventListener('change', function() {
    saveSetting('loop', this.checked);
  });

  resetSettingsBtn.addEventListener('click', resetAllSettings);

  // ===== DOWNLOAD POPUP EVENTS =====
  closeDownloadBtn.addEventListener('click', () => downloadPopup.classList.remove('active'));
  downloadPopup.addEventListener('click', (e) => {
    if (e.target === downloadPopup) downloadPopup.classList.remove('active');
  });

  // ===== KEYBOARD SHORTCUTS =====
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      settingsPanel.classList.remove('open');
      downloadPopup.classList.remove('active');
      if (cinemaModeActive) {
        cinemaModeToggle.checked = false;
        applyCinemaMode(false);
        saveSetting('cinema', false);
      }
    }
  });

  // ===== INIT =====
  renderUsernames();
  loadTheme();

})();
