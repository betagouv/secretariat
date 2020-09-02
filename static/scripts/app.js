(function () {
  "use strict";

  const navItems = document.getElementById('navigation').getElementsByClassName('nav-item');
  const activeClass = 'active';

  function deactivateNavItem(navItem) {
    document.getElementById(navItem.getAttribute('data-toggle')).classList.add('hidden');
    navItem.classList.remove(activeClass);
  }

  function activateNavItem(navItem) {
    document.getElementById(navItem.getAttribute('data-toggle')).classList.remove('hidden');
    navItem.classList.add(activeClass);
  }

  for (let i = 0; i < navItems.length; i++) {
    const navItem = navItems[i];
    navItem.addEventListener('click', () => {
      if (navItem.classList.contains(activeClass))
        return;

      for (let i = 0; i < navItems.length; i++)
        deactivateNavItem(navItems[i]);
      activateNavItem(navItem);
    })
  }
}());