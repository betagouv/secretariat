(function () {
  "use strict";

  window.addEventListener('DOMContentLoaded', () => {
    const drawerToggleButton = document.getElementById('drawer-toggle')
    const drawerToggleArrow = document.getElementById('drawer-toggle-arrow')
    const drawer = document.getElementById('drawer')
    drawerToggleButton.addEventListener('click', () => {
      drawer.classList.toggle('hidden-mobile')
      drawerToggleArrow.classList.toggle('rotate180', !drawer.classList.contains('hidden-mobile'))
    })
  })
}());
