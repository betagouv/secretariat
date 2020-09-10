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
  window.addEventListener('DOMContentLoaded', () => {
    navigateToHash();
  });

  const redirectionButton = document.getElementById('redirection-show')
  redirectionButton.addEventListener('click', () => {
    return window.fetch(`/redirections`)
      .then((response) => {
        if (!response.ok) {
          alert('Oops, il y a eu une erreur, veuillez essayer plus tard');
          return null;
        }
        return response.json();
      })
      .then((redirections) => {
        if (!redirections)
          return;
        for (let i = 0; i < redirections.length; i++) {
          const redirection = redirections[i];
          const container = document.querySelector(`td div.redirection-list[data-id="${redirection.id}"]`)
          if (!container)
            continue
          if (redirection.redirections.length > 0) 
            container.innerHTML = redirection.redirections.map(x => `${x}<br />`).join(' ')
        }
      })
  })
}());