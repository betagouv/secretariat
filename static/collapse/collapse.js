document.addEventListener('DOMContentLoaded', function () {

    const headings = document.querySelectorAll('.collapse-header');

    Array.prototype.forEach.call(headings, heading => {
        let btn = heading.querySelector('button')
        let target = heading.nextElementSibling
        let toggleExpand = (expanded) => {
            if (expanded) {
                btn.querySelector('div').classList.replace('fa-chevron-up', 'fa-chevron-down');
            } else {
                btn.querySelector('div').classList.replace('fa-chevron-down', 'fa-chevron-up');
            }

            btn.setAttribute('aria-expanded', !expanded)
            target.hidden = expanded
        }
        btn.onclick = () => {
            let expanded = btn.getAttribute('aria-expanded') === 'true' || false
            toggleExpand(expanded)
        }

        let hash = window.location.hash.replace('#', '')
        if (btn.id === hash) {
            toggleExpand(false)
        }
    })
});