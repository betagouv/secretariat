(function () {
  "use strict";

  const navItems = document.getElementById('navigation').getElementsByClassName('nav-item');
  const activeClass = 'active';

  function selectNavItem(navItem) {
    for (let i = 0; i < navItems.length; i++) {
      document.getElementById(navItems[i].getAttribute('data-toggle')).classList.add('hidden');
      navItems[i].classList.remove(activeClass);
    }
    document.getElementById(navItem.getAttribute('data-toggle')).classList.remove('hidden');
    navItem.classList.add(activeClass);
  }

  function navigateToHash() {
    if (location.hash) {
      const navItem = document.querySelector('[data-toggle="' + location.hash.substr(1) + '"]');
      if (navItem)
        return selectNavItem(navItem)
    }
    location.hash = 'account'
  }

  for (let i = 0; i < navItems.length; i++) {
    const navItem = navItems[i];
    navItem.addEventListener('click', () => {
      if (navItem.classList.contains(activeClass))
        return;

      window.history.pushState(null, null, '#' + navItem.getAttribute('data-toggle'))
      selectNavItem(navItem)
    })
  }

  window.addEventListener('popstate', () => navigateToHash());
  window.addEventListener('DOMContentLoaded', () => navigateToHash());
}());