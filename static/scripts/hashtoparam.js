(function () {
  "use strict";

    const search = new URLSearchParams(window.location.search.replace('?', ''))
    const hash = window.location.hash.replace('#', '')
    // scroll main view to anchors, wish does not work otherwise because scroll must be done in
    // main container not on window.
    if (hash && window.location.pathname === '/login' && search.get('next')) {
        search.set('anchor', hash)
        window.location.search = '?' + search.toString();
    }
}());