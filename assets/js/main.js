const toggle = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    toggle.textContent = open ? '×' : '☰';
  });

  document.querySelectorAll('.nav a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'メニューを開く');
    toggle.textContent = '☰';
  }));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'メニューを開く');
      toggle.textContent = '☰';
      toggle.focus();
    }
  });
}

document.querySelectorAll('.logo').forEach((logoLink) => {
  const logoImage = document.createElement('img');
  const logoPath = logoLink.closest('.footer') ? 'img/logo-w.png' : 'img/logo.png';
  logoImage.src = new URL(logoPath, document.baseURI).href;
  logoImage.alt = 'Rest-Work';
  logoLink.replaceChildren(logoImage);
});

const contactForm = document.querySelector('#contact-form');
const contactConfirm = document.querySelector('#contact-confirm');
const contactComplete = document.querySelector('#contact-complete');

if (contactForm && contactConfirm && contactComplete) {
  const fields = ['name', 'email', 'category', 'message'];
  const errorMessages = {
    name: '氏名を入力してください。',
    email: '有効なメールアドレスを入力してください。',
    category: '問い合わせ種別を選択してください。',
    message: '問い合わせ内容を入力してください。'
  };

  const validate = () => {
    let valid = true;
    fields.forEach((fieldName) => {
      const field = contactForm.elements[fieldName];
      const error = document.querySelector(`[data-error-for="${fieldName}"]`);
      const isValid = field.checkValidity();
      field.setAttribute('aria-invalid', String(!isValid));
      if (error) error.textContent = isValid ? '' : errorMessages[fieldName];
      if (!isValid) valid = false;
    });
    return valid;
  };

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validate()) return;
    const data = new FormData(contactForm);
    const labels = { name: '氏名', email: 'メールアドレス', category: '問い合わせ種別', message: '問い合わせ内容' };
    const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    document.querySelector('#confirm-body').innerHTML = fields.map((fieldName) => `<dl><dt>${labels[fieldName]}</dt><dd>${escapeHtml(data.get(fieldName))}</dd></dl>`).join('');
    contactForm.hidden = true;
    contactConfirm.hidden = false;
    contactConfirm.querySelector('h2').focus?.();
  });

  document.querySelector('[data-contact-back]')?.addEventListener('click', () => {
    contactConfirm.hidden = true;
    contactForm.hidden = false;
  });

  document.querySelector('[data-contact-submit]')?.addEventListener('click', () => {
    contactConfirm.hidden = true;
    contactComplete.hidden = false;
  });
}
