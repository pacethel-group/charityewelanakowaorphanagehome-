(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const menu = $('#siteMenu'), menuToggle = $('#menuToggle'), backdrop = $('#menuBackdrop');
  const toast = $('#toast'); let toastTimer;
  function notify(message) {
    if (!toast) return;
    toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
  }
  function openMenu(open) {
    if (!menu || !menuToggle) return;
    menu.hidden = !open; if (backdrop) backdrop.hidden = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    if (open) $('#menuClose')?.focus(); else menuToggle.focus({preventScroll:true});
  }
  menuToggle?.addEventListener('click', () => openMenu(menu.hidden));
  $('#menuClose')?.addEventListener('click', () => openMenu(false));
  backdrop?.addEventListener('click', () => openMenu(false));
  $$('#siteMenu a').forEach(link => link.addEventListener('click', () => openMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (menu && !menu.hidden) openMenu(false);
      closeLightbox();
    }
  });

  const themeToggle = $('#themeToggle');
  function setTheme(dark) {
    document.body.classList.toggle('dark', dark);
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      const symbol = $('.theme-symbol', themeToggle); if (symbol) symbol.textContent = dark ? '☀️' : '🌑';
    }
  }
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('cen-theme'); } catch (_) {}
  setTheme(savedTheme ? savedTheme === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches === true);
  themeToggle?.addEventListener('click', () => {
    const dark = !document.body.classList.contains('dark'); setTheme(dark);
    try { localStorage.setItem('cen-theme', dark ? 'dark' : 'light'); } catch (_) {}
  });

  // Hide unavailable optional media and retain the designed placeholder beneath it.
  $$('img[data-optional-image]').forEach(img => {
    const frame = img.closest('.media-frame, .brand-mark');
    const loaded = () => { frame?.classList.add('has-image'); img.hidden = false; };
    const failed = () => { img.hidden = true; frame?.classList.remove('has-image'); };
    img.addEventListener('load', loaded); img.addEventListener('error', failed);
    if (img.complete) img.naturalWidth ? loaded() : failed();
  });

  // Gallery filters
  const filterButtons = $$('.filter-button');
  filterButtons.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    filterButtons.forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
    $$('.gallery-item').forEach(item => { item.hidden = category !== 'all' && item.dataset.category !== category; });
  }));

  // Accessible image/video lightbox
  const lightbox = $('#lightbox'), lightboxContent = $('#lightboxContent'), caption = $('#lightboxCaption');
  let galleryItems = [], galleryIndex = 0, lastFocused = null;
  function visibleGalleryItems() { return $$('.gallery-item').filter(item => !item.hidden); }
  function renderGalleryItem(item) {
    if (!item || !lightboxContent) return;
    lightboxContent.replaceChildren();
    if (item.dataset.videoSrc) {
      const video = document.createElement('video'); video.src = item.dataset.videoSrc; video.controls = true; video.autoplay = true; video.playsInline = true;
      video.setAttribute('aria-label', item.dataset.galleryTitle || 'Orphanage home video'); lightboxContent.append(video);
    } else {
      const img = document.createElement('img'); img.src = item.dataset.gallerySrc || $('img', item)?.src || ''; img.alt = $('img', item)?.alt || item.dataset.galleryTitle || 'Gallery image';
      img.addEventListener('error', () => { img.replaceWith(Object.assign(document.createElement('p'), {textContent:'This media file has not been uploaded yet.'})); }); lightboxContent.append(img);
    }
    if (caption) caption.textContent = item.dataset.galleryTitle || '';
    const isVideo = Boolean(item.dataset.videoSrc);
    $('#lightboxPrev').hidden = isVideo || galleryItems.length < 2;
    $('#lightboxNext').hidden = isVideo || galleryItems.length < 2;
  }
  function openLightbox(item) {
    if (!lightbox) return;
    lastFocused = document.activeElement; galleryItems = visibleGalleryItems(); galleryIndex = Math.max(0, galleryItems.indexOf(item));
    lightbox.hidden = false; document.body.style.overflow = 'hidden'; renderGalleryItem(item); $('#lightboxClose')?.focus();
  }
  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    const video = $('video', lightboxContent); if (video) video.pause();
    lightbox.hidden = true; if (lightboxContent) lightboxContent.replaceChildren(); document.body.style.overflow = '';
    lastFocused?.focus?.({preventScroll:true});
  }
  function stepGallery(direction) {
    if (!galleryItems.length) return;
    galleryIndex = (galleryIndex + direction + galleryItems.length) % galleryItems.length;
    renderGalleryItem(galleryItems[galleryIndex]);
  }
  $$('.gallery-item').forEach(item => item.addEventListener('click', () => openLightbox(item)));
  $('#lightboxClose')?.addEventListener('click', closeLightbox);
  $('#lightboxPrev')?.addEventListener('click', () => stepGallery(-1));
  $('#lightboxNext')?.addEventListener('click', () => stepGallery(1));
  lightbox?.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', event => {
    if (lightbox && !lightbox.hidden) {
      if (event.key === 'ArrowLeft') stepGallery(-1);
      if (event.key === 'ArrowRight') stepGallery(1);
      if (event.key === 'Tab') {
        const focusable = $$('button:not([hidden])', lightbox).filter(el => !el.disabled);
        if (focusable.length && event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
        else if (focusable.length && !event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
      }
    }
  });

  // Copy donation details using clipboard where available, with a fallback.
  async function copyText(value) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
      else {
        const field = document.createElement('textarea'); field.value = value; field.style.position = 'fixed'; field.style.opacity = '0';
        document.body.append(field); field.select(); const ok = document.execCommand('copy'); field.remove(); if (!ok) throw new Error('copy failed');
      }
      notify('Copied to clipboard');
    } catch (_) { notify('Copy failed — please select and copy the details manually.'); }
  }
  $$('[data-copy]').forEach(button => button.addEventListener('click', () => copyText(button.dataset.copy || '')));

  // This form opens a pre-filled email; it does not store or transmit form data itself.
  $('#contactForm')?.addEventListener('submit', event => {
    event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return;
    const data = new FormData(form); const subject = `Website enquiry: ${data.get('topic')}`;
    const body = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\nTopic: ${data.get('topic')}\n\nMessage:\n${data.get('message')}`;
    const mailto = `mailto:care@hajiyabilkisu.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const status = $('#formStatus'); if (status) status.textContent = 'Your email app should open with the enquiry prepared. Please send it from there.';
    window.location.href = mailto;
  });
  const year = $('#currentYear'); if (year) year.textContent = String(new Date().getFullYear());
})();
