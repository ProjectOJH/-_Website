document.documentElement.classList.add('js');
const menu = document.querySelector('.menu');
const nav = document.querySelector('#navigation');
menu.hidden = false;
function closeMenu() { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
menu.addEventListener('click', () => {
  const open = !nav.classList.contains('open');
  nav.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); }
});
matchMedia('(max-width:800px)').addEventListener('change', closeMenu);
nav.addEventListener('click', event => {
  if (event.target.closest('a') && matchMedia('(max-width:800px)').matches) closeMenu();
});
const motionPreference = matchMedia('(prefers-reduced-motion:reduce)');
const mainLinks = [...nav.querySelectorAll(':scope > a, :scope > details > summary')];
const indicator = document.createElement('span');
indicator.className = 'nav-indicator';
indicator.setAttribute('aria-hidden', 'true');
nav.append(indicator);
function moveIndicator(item, animate = true) {
  if (!item || matchMedia('(max-width:800px)').matches) return;
  const box = item.getBoundingClientRect();
  const parent = nav.getBoundingClientRect();
  indicator.style.transition = animate && !motionPreference.matches ? '' : 'none';
  indicator.style.height = `${box.height}px`;
  indicator.style.transform = `translateY(${box.top - parent.top}px)`;
}
const currentLink = (document.body.classList.contains("page-about") ? nav.querySelector(".about-navigation summary") : null) || nav.querySelector('a[aria-current]') || (document.body.classList.contains('page-services') ? nav.querySelector('a[href^="services.html"]') : mainLinks[0]);
moveIndicator(currentLink, false);
addEventListener('resize', () => moveIndicator(currentLink, false));
let menuNavigating = false;
nav.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || motionPreference.matches) return;
  const destination = new URL(link.href, location.href);
  if (destination.origin !== location.origin || destination.pathname === location.pathname || matchMedia('(max-width:800px)').matches) return;
  event.preventDefault();
  if (menuNavigating) return;
  menuNavigating = true;
  moveIndicator(link);
  setTimeout(() => location.assign(destination.href), 300);
});
addEventListener('pageshow', () => { menuNavigating = false; moveIndicator(currentLink, false); });
// Reveal each content group once, as it enters the viewport.
if (!motionPreference.matches && 'IntersectionObserver' in window) {
  const groups = document.querySelectorAll('main > header, main > section > :not(.salon-orbit):not(.royal-corner), .tier-choices > a');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: .08, rootMargin:'0px 0px -24px 0px'});
  groups.forEach((element, index) => {
    element.classList.add('scroll-reveal');
    const initiallyVisible = element.getBoundingClientRect().top < innerHeight - 24 && element.getBoundingClientRect().bottom > 0;
    element.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * (initiallyVisible ? 110 : 55)}ms`);
    if (initiallyVisible) {
      element.classList.add('page-entry-reveal', 'is-revealed');
    } else {
      observer.observe(element);
    }
  });
  motionPreference.addEventListener('change', event => {
    if (event.matches) { observer.disconnect(); groups.forEach(element => element.classList.add('is-revealed')); }
  });
}
