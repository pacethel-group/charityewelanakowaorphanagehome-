/* Charity Ewela Nakowa Orphanage Home — robust site interactions */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Mobile navigation: support the site's existing IDs and avoid CSS overriding hidden.
  const menu = $('#siteMenu');
  const backdrop = $('#menuBackdrop');
  const toggle = $('#menuToggle');
  function setMenu(open) {
    if (!menu || !toggle) return;
    menu.hidden = !open;
    if (backdrop) backdrop.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  }
  toggle?.addEventListener('click', () => setMenu(menu.hidden));
  $('#menuClose')?.addEventListener('click', () => setMenu(false));
  backdrop?.addEventListener('click', () => setMenu(false));
  $$('#siteMenu a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  // Theme switch: delegated handling plus a clear body class; localStorage is optional.
  const themeToggle = $('#themeToggle');
  function setTheme(dark) {
    document.body.classList.toggle('dark', dark);
    const symbol = $('.theme-symbol', themeToggle || document);
    if (symbol) symbol.textContent = dark ? '☀️' : '🌙';
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      themeToggle.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
      themeToggle.setAttribute('aria-pressed', String(dark));
    }
    try { localStorage.setItem('cenoh-theme', dark ? 'dark' : 'light'); } catch (_) {}
  }
  let savedDark = false;
  try { savedDark = localStorage.getItem('cenoh-theme') === 'dark'; } catch (_) {}
  setTheme(savedDark);
  themeToggle?.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    setTheme(!document.body.classList.contains('dark'));
  });

  // Make image frames match the actual media orientation and hide broken paths gracefully.
  $$('img').forEach(img => {
    const setOrientation = () => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      const orientation = img.naturalHeight > img.naturalWidth ? 'portrait' : 'landscape';
      img.dataset.orientation = orientation;
      img.closest('.media-frame')?.classList.toggle('portrait-media', orientation === 'portrait');
      img.closest('.media-frame')?.classList.toggle('landscape-media', orientation === 'landscape');
    };
    img.addEventListener('load', setOrientation);
    if (img.complete) setOrientation();
    if (img.hasAttribute('data-optional-image')) {
      img.addEventListener('error', () => { img.hidden = true; img.closest('.media-frame')?.classList.remove('has-image'); });
      img.addEventListener('load', () => { img.hidden = false; img.closest('.media-frame')?.classList.add('has-image'); });
    }
  });

  // Make previews muted and inline; clicking the card opens a fully playable video.
  $$('.gallery-video-preview').forEach(video => {
    video.muted = true; video.playsInline = true; video.controls = false; video.preload = 'metadata';
    video.addEventListener('loadedmetadata', () => video.closest('.gallery-video')?.classList.add('has-video-preview'));
    video.addEventListener('error', () => { video.hidden = true; });
  });

  const lightbox = $('#lightbox');
  const lightboxContent = $('#lightboxContent');
  const caption = $('#lightboxCaption');
  let currentIndex = -1;
  const galleryItems = () => $$('.gallery-item').filter(el => !el.hidden && getComputedStyle(el).display !== 'none');
  function openItem(item) {
    if (!lightbox || !lightboxContent || !item) return;
    lightboxContent.replaceChildren();
    const videoSrc = item.dataset.videoSrc;
    const image = $('img', item);
    if (videoSrc) {
      const video = document.createElement('video');
      video.controls = true; video.autoplay = true; video.playsInline = true; video.preload = 'auto';
      video.style.cssText = 'max-width:100%;max-height:78vh;width:auto;height:auto;object-fit:contain;background:#000';
      const source = document.createElement('source'); source.src = videoSrc; source.type = 'video/mp4';
      video.append(source); lightboxContent.append(video);
      video.load(); const promise = video.play(); if (promise?.catch) promise.catch(() => { video.controls = true; });
    } else {
      const src = item.dataset.gallerySrc || image?.currentSrc || image?.getAttribute('src');
      if (!src) return;
      const fullImage = document.createElement('img'); fullImage.src = src;
      fullImage.alt = image?.alt || item.dataset.galleryTitle || 'Orphanage home gallery image';
      lightboxContent.append(fullImage);
    }
    if (caption) caption.textContent = item.dataset.galleryTitle || '';
    currentIndex = galleryItems().indexOf(item);
    lightbox.hidden = false; lightbox.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    $('#lightboxClose')?.focus();
  }
  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true; lightbox.setAttribute('aria-hidden', 'true'); lightboxContent?.replaceChildren();
    document.body.style.overflow = ''; currentIndex = -1;
  }
  function moveLightbox(direction) {
    const items = galleryItems(); if (!items.length) return;
    currentIndex = (currentIndex + direction + items.length) % items.length;
    openItem(items[currentIndex]);
  }
  $$('.gallery-item').forEach(item => item.addEventListener('click', () => openItem(item)));
  $('#lightboxClose')?.addEventListener('click', closeLightbox);
  $('#lightboxPrev')?.addEventListener('click', () => moveLightbox(-1));
  $('#lightboxNext')?.addEventListener('click', () => moveLightbox(1));
  lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { setMenu(false); closeLightbox(); }
    if (lightbox && !lightbox.hidden && e.key === 'ArrowLeft') moveLightbox(-1);
    if (lightbox && !lightbox.hidden && e.key === 'ArrowRight') moveLightbox(1);
  });
  // Swipe left/right on mobile to move between gallery items.
  let touchStartX = null;
  lightbox?.addEventListener('touchstart', e => { touchStartX = e.changedTouches?.[0]?.clientX ?? null; }, {passive:true});
  lightbox?.addEventListener('touchend', e => {
    if (touchStartX == null) return;
    const endX = e.changedTouches?.[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX; touchStartX = null;
    if (Math.abs(delta) > 55) moveLightbox(delta < 0 ? 1 : -1);
  }, {passive:true});

  $$('.filter-button').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter || 'all';
    $$('.filter-button').forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
    $$('.gallery-item').forEach(item => { item.hidden = filter !== 'all' && item.dataset.category !== filter; });
  }));

  const toast = $('#toast'); let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }
  $$('[data-copy]').forEach(button => button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(button.dataset.copy || ''); showToast('Copied to clipboard'); }
    catch (_) { const area = document.createElement('textarea'); area.value = button.dataset.copy || ''; document.body.append(area); area.select(); const ok = document.execCommand('copy'); area.remove(); showToast(ok ? 'Copied to clipboard' : 'Please copy the details manually'); }
  }));
  if ($('#currentYear')) $('#currentYear').textContent = String(new Date().getFullYear());
  $('#contactForm')?.addEventListener('submit', e => {
    e.preventDefault(); const form = e.currentTarget; const data = new FormData(form);
    const name = String(data.get('name') || '').trim(); const email = String(data.get('email') || '').trim();
    const subject = encodeURIComponent('Website enquiry — Charity Ewela Nakowa Orphanage Home');
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${String(data.get('message') || '').trim()}`);
    const status = $('#formStatus'); if (status) status.textContent = 'Opening your email app to send this enquiry.';
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  });
})();
