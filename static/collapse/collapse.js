document.addEventListener('DOMContentLoaded', function () {

    const headings = document.querySelectorAll('.collapse-header');

    Array.prototype.forEach.call(headings, heading => {
        let btn = heading.querySelector('button')
        let target = heading.nextElementSibling

        btn.onclick = () => {
        let expanded = btn.getAttribute('aria-expanded') === 'true' || false

        const isDown = btn.querySelector('div').classList.contains('fa-chevron-down')
        if (isDown) {
            btn.querySelector('div').classList.replace('fa-chevron-down', 'fa-chevron-up');
        } else {
            btn.querySelector('div').classList.replace('fa-chevron-up', 'fa-chevron-down');
        }

        btn.setAttribute('aria-expanded', !expanded)
        target.hidden = expanded    
        }
    })
});