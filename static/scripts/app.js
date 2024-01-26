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

  function initializeComprehensionCheckboxes() {
    let checkboxes = document.querySelectorAll('.ensure-comprehension');

    // parcourir toutes les cases à cocher
    checkboxes.forEach(checkbox => {
        // ajouter un gestionnaire d'événements pour l'événement change
        checkbox.addEventListener('change', function(e) {
            // trouver le bouton submit suivant
            let nextSubmitButton = this.nextElementSibling;
            while (nextSubmitButton && nextSubmitButton.tagName.toLowerCase() !== 'input' && nextSubmitButton.getAttribute('type').toLowerCase() !== 'submit') {
                nextSubmitButton = nextSubmitButton.nextElementSibling;
            }
            
            // vérifier si la case à cocher est cochée ou non
            if (this.checked) {
                // si la case à cocher est cochée, activer le bouton submit
                if (nextSubmitButton) {
                    nextSubmitButton.disabled = false;
                }
            } else {
                // si la case à cocher n'est pas cochée, désactiver le bouton submit
                if (nextSubmitButton) {
                    nextSubmitButton.disabled = true;
                }
            }
        });
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    initializeDrawerToggle()
    const hash = window.location.hash.replace('#', '')
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
