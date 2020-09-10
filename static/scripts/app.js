(function () {
  "use strict";

  let redirectionsFetched = false;
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

  function fetchRedirections() {
    redirectionButton.setAttribute('disabled', '')
    return window.fetch(`/redirections`)
      .then((response) => {
        redirectionButton.removeAttribute('disabled')
        if (!response.ok)
          throw new Error('Oops, il y a eu une erreur, veuillez essayer plus tard');
        return response.json();
      })
      .then((redirections) => {
        for (let i = 0; i < redirections.length; i++) {
          const redirection = redirections[i];
          const container = document.querySelector(`td .redirection-list[data-id="${redirection.id}"]`)
          if (container && redirection.redirections.length > 0)
            container.innerHTML = redirection.redirections.map(x => `${x}<br />`).join(' ')
        }
      })
  }

  redirectionButton.addEventListener('click', (e) => {
    const isChecked = e.target.checked;
    if (!redirectionsFetched) {
      fetchRedirections()
        .then(() => redirectionsFetched = true)
        .catch(alert);
    }
    document.querySelectorAll('.redirection-list').forEach(element => {
      isChecked ? element.classList.remove('hidden') : element.classList.add('hidden')
    })
  });


}());