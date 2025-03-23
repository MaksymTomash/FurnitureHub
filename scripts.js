const catalogButton = document.getElementById('catalog');
const catalogItems = document.getElementById('menu-wrap');


catalogButton.addEventListener('click', () => {
    catalogItems.classList.toggle('open');
});