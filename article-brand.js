/* Read-only photo viewer / keeps the original full-resolution file. */
(() => {
  'use strict';
  if (!document.body.classList.contains('cg-article')) return;
  const buttons = [...document.querySelectorAll('.b-photo')];
  const dialog = document.createElement('dialog');
  dialog.className = 'b-photo-dialog';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'b-photo-dialog__close';
  const image = document.createElement('img');
  const caption = document.createElement('div');
  caption.className = 'b-photo-dialog__caption';
  dialog.append(close, image, caption);
  document.body.append(dialog);
  const syncLabels = () => {
    const en = document.documentElement.lang === 'en';
    close.textContent = en ? 'close /' : 'chiudi /';
    dialog.setAttribute('aria-label', en ? 'Enlarged photograph' : 'Fotografia ingrandita');
    buttons.forEach(button => {
      const label = button.querySelector('[data-photo-label]');
      if (label) label.textContent = en ? 'enlarge /' : 'ingrandisci /';
      button.setAttribute('aria-label', (en ? 'Enlarge photograph: ' : 'Ingrandisci fotografia: ') + button.querySelector('img').alt);
    });
  };
  syncLabels();
  document.addEventListener('cg-language-change', syncLabels);
  buttons.forEach(button => button.addEventListener('click', () => {
    const original = button.querySelector('img');
    image.src = original.currentSrc || original.src;
    image.alt = original.alt;
    caption.textContent = button.closest('figure')?.querySelector('figcaption')?.textContent.trim() || original.alt;
    dialog.showModal();
    close.focus();
  }));
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
})();
