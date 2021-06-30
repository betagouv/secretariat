import topbar from 'topbar'

function initializeDrawerToggle() {
  const drawerToggleButton = document.getElementById('drawer-toggle')
  if (drawerToggleButton) {
    const drawerToggleArrow = document.getElementById('drawer-toggle-arrow')
    const drawer = document.getElementById('drawer')
    drawerToggleButton.addEventListener('click', () => {
      drawer.classList.toggle('hidden-mobile')
      drawerToggleArrow.classList.toggle('rotate180', !drawer.classList.contains('hidden-mobile'))
    })
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initializeDrawerToggle()
})

// show the loading topbar when navigating on desktop only (mobile browsers already have their loading bar)
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
if (!isMobile) {
  window.addEventListener('beforeunload', () => {
    setTimeout(() => {
      topbar.show()
    }, 500)
  })
}
