(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const body = document.body;
  const themeToggle = $('#themeToggle');
  const menuToggle = $('#menuToggle');
  const siteMenu = $('#siteMenu');
  const menuBackdrop = $('#menuBackdrop');
  const menuClose = $('#menuClose');
  const toast = $('#toast');
  let toastTimer;

  // Hide missing media gracefully and show the designed placeholder beneath it.
  $$('[data-optional-image]').forEach((img) => {
    const frame = img.closest('.media-frame, .brand-mark');
    const revealImage = () => {
      if (img.complete && img.naturalWidth > 0) frame?.classList.add('has-image');
    };
    img.addEventListener('load', revealImage);
    img.addEventListener('error', () => {
      img.hidden = true;
      if (img.classList.contains('brand-logo')) {
        const fallback = $('.brand-fallback', frame);
        if (fallback) fallback.style.display = 'block';
      }
    });
    revealImage();
  });

  // Theme preference: save locally where browser storage is available.
  const setTheme = (dark) => {
    body.classList.toggle('dark', dark);
    const symbol = $('.theme-symbol', themeToggle);
    if (symbol) symbol.textContent = dark ? 'ðŸŒ•' : 'ðŸŒ‘';
    themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    themeToggle.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#102019' : '#123f35');
    try { localStorage.setItem('charity-ewela-theme', dark ? 'dark' : 'light'); } catch (_) {}
  };
  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem('charity-ewela-theme') || 'light'; } catch (_) {}
  setTheme(savedTheme === 'dark');
  themeToggle.addEventListener('click', () => setTheme(!body.classList.contains('dark')));

  const openMenu = () => {
    siteMenu.hidden = false;
    menuBackdrop.hidden = false;
    menuToggle.setAttribute('aria-expanded', 'true');
    body.style.overflow = 'hidden';
    menuClose.focus();
  };
  const closeMenu = () => {
    siteMenu.hidden = true;
    menuBackdrop.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    body.style.overflow = '';
  };
  menuToggle.addEventListener('click', () => siteMenu.hidden ? openMenu() : closeMenu());
  menuClose.addEventListener('click', closeMenu);
  menuBackdrop.addEventListener('click', closeMenu);
  $$('a[href^="#"]', siteMenu).forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!siteMenu.hidden) { closeMenu(); menuToggle.focus(); }
      if (!lightbox.hidden) closeLightbox();
    }
  });

  // Copy account details with a fallback for browsers without Clipboard API.
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed'; textarea.style.opacity = '0';
        document.body.appendChild(textarea); textarea.select();
        const copied = document.execCommand('copy'); textarea.remove();
        if (!copied) throw new Error('Copy unavailable');
      }
      showToast('Copied to clipboard');
    } catch (_) {
      showToast('Please copy the details manually: ' + text.replace(/\n/g, ' Â· '));
    }
  }
  $$('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
    const original = button.textContent;
    await copyText(button.dataset.copy.replace(/\\n/g, '\n'));
    button.textContent = 'Copied âœ“';
    setTimeout(() => { button.textContent = original; }, 1800);
  }));

  // Filter the photo/video gallery.
  const galleryItems = $$('.gallery-item');
  $$('.filter-button').forEach((button) => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    $$('.filter-button').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    galleryItems.forEach((item) => { item.hidden = filter !== 'all' && item.dataset.category !== filter; });
  }));

  // Accessible media lightbox; videos use native controls.
  const lightbox = $('#lightbox');
  const lightboxContent = $('#lightboxContent');
  const lightboxCaption = $('#lightboxCaption');
  const lightboxPrev = $('#lightboxPrev');
  const lightboxNext = $('#lightboxNext');
  let activeGalleryIndex = 0;
  let visibleGallery = [];
  let previousFocus = null;
  const getVisibleGallery = () => galleryItems.filter((item) => !item.hidden && !item.dataset.videoSrc && item.querySelector('img') && !item.querySelector('img').hidden);
  function showGalleryItem(index) {
    visibleGallery = getVisibleGallery();
    if (!visibleGallery.length) return;
    activeGalleryIndex = (index + visibleGallery.length) % visibleGallery.length;
    const item = visibleGallery[activeGalleryIndex];
    lightboxContent.replaceChildren();
    const image = document.createElement('img');
    image.src = item.dataset.gallerySrc;
    image.alt = item.querySelector('img')?.alt || item.dataset.galleryTitle || '';
    lightboxContent.appendChild(image);
    lightboxCaption.textContent = item.dataset.galleryTitle || '';
    lightboxPrev.disabled = visibleGallery.length < 2;
    lightboxNext.disabled = visibleGallery.length < 2;
  }
  function openLightbox(item) {
    previousFocus = document.activeElement;
    lightbox.hidden = false;
    body.style.overflow = 'hidden';
    if (item.dataset.videoSrc) {
      lightboxContent.replaceChildren();
      const video = document.createElement('video');
      video.controls = true; video.autoplay = true; video.playsInline = true;
      video.src = item.dataset.videoSrc;
      video.setAttribute('aria-label', item.dataset.galleryTitle || 'Charity home video');
      lightboxContent.appendChild(video);
      lightboxCaption.textContent = item.dataset.galleryTitle || '';
      lightboxPrev.disabled = true; lightboxNext.disabled = true;
    } else {
      const sourceImage = item.querySelector('img');
      if (sourceImage && sourceImage.hidden) {
        lightboxContent.replaceChildren();
        const placeholder = document.createElement('div');
        placeholder.style.cssText = 'width:min(620px,85vw);min-height:260px;display:grid;place-items:center;text-align:center;padding:36px;border:1px solid rgba(255,255,255,.25);border-radius:14px;color:#fff;background:linear-gradient(145deg,#426c58,#173f34 60%,#0c2c25);font:24px Georgia,serif;';
        placeholder.textContent = 'Add ' + (item.dataset.gallerySrc || 'your photo') + ' to the assets folder to display this image.';
        lightboxContent.appendChild(placeholder);
        lightboxCaption.textContent = item.dataset.galleryTitle || '';
        lightboxPrev.disabled = true; lightboxNext.disabled = true;
      } else {
        visibleGallery = getVisibleGallery();
        showGalleryItem(Math.max(0, visibleGallery.indexOf(item)));
      }
    }
    lightboxClose.focus();
  }
  function closeLightbox() {
    if (lightbox.hidden) return;
    const video = $('video', lightboxContent);
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
    lightbox.hidden = true;
    lightboxContent.replaceChildren();
    body.style.overflow = siteMenu.hidden ? '' : 'hidden';
    previousFocus?.focus?.();
  }
  const lightboxClose = $('#lightboxClose');
  galleryItems.forEach((item) => item.addEventListener('click', () => openLightbox(item)));
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
  lightboxPrev.addEventListener('click', () => showGalleryItem(activeGalleryIndex - 1));
  lightboxNext.addEventListener('click', () => showGalleryItem(activeGalleryIndex + 1));

  // Static-host-friendly contact form: opens a pre-filled email, without pretending to store submissions.
  $('#contactForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const subject = encodeURIComponent('Website enquiry: ' + data.get('topic'));
    const message = encodeURIComponent(
      'Name: ' + data.get('name') + '\nEmail: ' + data.get('email') + '\nTopic: ' + data.get('topic') + '\n\n' + data.get('message')
    );
    $('#formStatus').textContent = 'Opening your email appâ€¦';
    window.location.href = `mailto:care@hajiyabilkisu.org?subject=${subject}&body=${message}`;
  });

  $('#currentYear').textContent = String(new Date().getFullYear());

  // Subtle scroll reveal, with a no-JS/reduced-motion friendly fallback.
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    revealEls.forEach((el) => observer.observe(el));
  } else revealEls.forEach((el) => el.classList.add('is-visible'));
})();
