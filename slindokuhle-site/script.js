const menuButton = document.querySelector('#menu-toggle');
const navigation = document.querySelector('#main-nav');
function setMenu(open) {
  navigation.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.firstChild.textContent = open ? 'Close ' : 'Menu ';
}
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
});
matchMedia('(max-width:800px)').addEventListener('change', () => setMenu(false));
document.querySelector('#year').textContent = new Date().getFullYear();

// Every content image has a loading, missing, and retry state.
document.querySelectorAll('.media').forEach(figure => {
  const img = figure.querySelector('img');
  const status = figure.querySelector('.media-status');
  const source = img.getAttribute('src');
  function settle() {
    figure.setAttribute('aria-busy', 'false');
    if (img.naturalWidth) {
      status.hidden = true;
      img.hidden = false;
      return;
    }
    img.hidden = true;
    status.hidden = false;
    status.replaceChildren(document.createTextNode('Image unavailable.'));
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Retry image';
    retry.addEventListener('click', () => {
      figure.setAttribute('aria-busy', 'true');
      status.textContent = 'Loading image…';
      img.src = source + '?retry=' + Date.now();
    });
    status.append(retry);
  }
  img.addEventListener('load', settle);
  img.addEventListener('error', settle);
  if (!source) {
    figure.setAttribute('aria-busy', 'false');
    status.textContent = 'No image available.';
  } else if (img.complete) settle();
});

const form = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');
const submit = form.querySelector('button');
const fields = [...form.querySelectorAll('input,select,textarea')];
fields.forEach(field => field.setAttribute('aria-describedby', 'form-status'));
document.querySelectorAll('[data-enquiry]').forEach(link => link.addEventListener('click', () => {
  form.elements.subject.value = link.dataset.enquiry;
}));
form.addEventListener('submit', async event => {
  event.preventDefault();
  fields.forEach(field => field.removeAttribute('aria-invalid'));
  const invalid = fields.filter(field => !field.value.trim() || !field.validity.valid);
  if (invalid.length) {
    invalid.forEach(field => field.setAttribute('aria-invalid', 'true'));
    formStatus.dataset.state = 'error';
    formStatus.textContent = fields.every(field => !field.value.trim())
      ? 'Add your details, select an enquiry and write a message to get started.'
      : 'Complete all fields and enter a valid email address.';
    invalid[0].focus();
    return;
  }
  submit.disabled = true;
  form.setAttribute('aria-busy', 'true');
  formStatus.dataset.state = 'loading';
  formStatus.textContent = 'Preparing your email draft…';
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  try {
    const data = new FormData(form);
    const body = 'Name: ' + data.get('name') + '\nEmail: ' + data.get('email') + '\n\n' + data.get('message');
    location.href = 'mailto:info@slindokuhlebiyela.co.za?subject=' + encodeURIComponent(data.get('subject')) + '&body=' + encodeURIComponent(body);
    formStatus.dataset.state = 'ready';
    formStatus.textContent = 'Draft requested. If no email app opens, use the email address alongside this form. Your message has not been sent yet.';
  } catch {
    formStatus.dataset.state = 'error';
    formStatus.textContent = 'Unable to open a draft. Please email the address alongside this form.';
  } finally {
    submit.disabled = false;
    form.setAttribute('aria-busy', 'false');
  }
});
form.addEventListener('input', event => {
  event.target.removeAttribute('aria-invalid');
  if (formStatus.dataset.state === 'error') {
    formStatus.textContent = '';
    delete formStatus.dataset.state;
  }
});

// Motion: scroll progress, header state, pointer glow and reveal-on-scroll.
// Skipped entirely when the visitor prefers reduced motion.
(() => {
  if (!document.documentElement.classList.contains('anim')) return;

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.prepend(progress);
  const header = document.querySelector('.site-header');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
      header.classList.toggle('scrolled', scrollY > 24);
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const heroCard = document.querySelector('.hero-main');
  if (heroCard && matchMedia('(pointer:fine)').matches) {
    heroCard.addEventListener('pointermove', event => {
      const box = heroCard.getBoundingClientRect();
      heroCard.style.setProperty('--mx', (event.clientX - box.left) + 'px');
      heroCard.style.setProperty('--my', (event.clientY - box.top) + 'px');
    });
  }

  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      observer.unobserve(el);
      el.classList.add('in');
      // Clear the reveal state afterwards so hover transitions are not delayed.
      setTimeout(() => {
        el.classList.remove('reveal', 'in');
        el.style.transitionDelay = '';
      }, 1400 + (parseFloat(el.style.transitionDelay) || 0));
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  function reveal(el, delay) {
    el.classList.add('reveal');
    if (delay) el.style.transitionDelay = delay + 'ms';
    observer.observe(el);
  }
  ['.about', '.practice .section-heading', '.work', '.achievements', '.quote', '.experience',
    '.education', '.insights', '.speaking', '.contact']
    .forEach(selector => document.querySelectorAll(selector).forEach(el => reveal(el, 0)));
  ['.practice-list', '.projects', '.checklist', '.timeline', '.credentials', '.insight-list']
    .forEach(selector => document.querySelectorAll(selector).forEach(group =>
      [...group.children].forEach((el, index) => reveal(el, 120 + index * 90))));
})();
