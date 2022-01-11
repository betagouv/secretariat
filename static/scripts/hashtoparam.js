(function () {
  "use strict";

    const search = new URLSearchParams(window.location.search.replace('?', ''))
    const hash = window.location.hash.replace('#', '')
    // set hash to query params to use it after user logged in
    if (hash && window.location.pathname === '/login' && search.get('next')) {
        search.set('anchor', hash)
        window.location.search = '?' + search.toString();
    }
}());
