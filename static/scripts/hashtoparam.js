(function () {
  "use strict";

    const search = new URLSearchParams(window.location.search.replace('?', ''))
    const hash = window.location.hash.replace('#', '')
    // scroll main view to anchors, wish does not work otherwise because scroll must be done in
    // main container not on window.
    if (hash && window.location.pathname === '/signin') {
        var tokenInput = document.getElementById('inputToken')
        tokenInput.setAttribute('value', hash)
        const $elm = document.getElementById('signin_form')
        $elm.action = window.location.pathname + '?' + search.toString();
    }
    if (hash && window.location.pathname === '/api/signin') {
        console.log('LCS IN SIGNIN API 1')
        var tokenInput = document.getElementById('inputToken')
        tokenInput.setAttribute('value', hash)
        const $elm = document.getElementById('signin_form')
        $elm.action = window.location.pathname + '?' + search.toString();
        fetch('/signin', {
            redirect: 'follow',
            method: "POST", // *GET, POST, PUT, DELETE, etc.
            mode: "cors", // no-cors, *cors, same-origin
            cache: "no-cache",
            body: JSON.stringify({
                token: hash,
                next: document.getElementById('next').getAttribute('value')
            })
        });
    }
    if (hash && window.location.pathname === '/login' && search.get('next') && !search.get('anchor')) {
        search.set('anchor', hash)
        if (history.pushState) {
            // if history pushstate exist we use it to prevent page reload
            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + search.toString() + '#' + hash;
            window.history.pushState({ path:newurl }, '', newurl);
            const $elm = document.getElementById('login_form')
            $elm.action = window.location.pathname + '?' + search.toString();
        } else {
            window.location.search = '?' + search.toString();
        }
    }


}());
