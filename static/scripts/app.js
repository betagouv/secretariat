(function () {
  "use strict";

  function initializeDrawerToggle() {
    const drawerToggleButton = document.getElementById('drawer-toggle')
    const drawerToggleArrow = document.getElementById('drawer-toggle-arrow')
    const drawer = document.getElementById('drawer')
    drawerToggleButton.addEventListener('click', () => {
      drawer.classList.toggle('hidden-mobile')
      drawerToggleArrow.classList.toggle('rotate180', !drawer.classList.contains('hidden-mobile'))
    })
  }

  window.addEventListener('DOMContentLoaded', () => {
    initializeDrawerToggle()
    const search = new URLSearchParams(window.location.search.replace('?', ''))
    const hash = window.location.hash.replace('#', '') || search.get('anchor')
    // scroll main view to anchors, wish does not work otherwise because scroll must be done in
    // main container not on window.
    if (hash) {
      let $elmnt = document.getElementById(hash);
      let $main = document.body.getElementsByClassName('main')[0]
      if ($main && $elmnt) {
        $main.scrollTop = $elmnt.getBoundingClientRect().top + $main.scrollTop;
      }
    }
  })
}());
