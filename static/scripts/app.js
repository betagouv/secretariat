(function () {
  "use strict";

  window.addEventListener('DOMContentLoaded', () => {
    const drawerToggleButton = document.getElementById('drawer-toggle')
    const drawer = document.getElementById('drawer')
    drawerToggleButton.addEventListener('click', () => {
      drawer.classList.toggle('hidden-mobile')
    })
  })
}());
