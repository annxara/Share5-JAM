document.addEventListener('DOMContentLoaded', () => {
    const salmonGroup = document.querySelector('.disease-group.salmonellose');
    const salmonHeader = salmonGroup ? salmonGroup.querySelector('.disease-header') : null;
    const salmonLinks = salmonGroup ? salmonGroup.querySelectorAll('.disease-submenu > .sidebar-link') : [];
    const dataToggle = salmonGroup ? salmonGroup.querySelector('.data-toggle') : null;
    const dataLinks = salmonGroup ? salmonGroup.querySelectorAll('.data-submenu .sidebar-link') : [];

    if (salmonHeader) {
        salmonHeader.addEventListener('click', () => {
            salmonGroup.classList.toggle('active');
        });
    }

    salmonLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            salmonLinks.forEach((item) => item.classList.toggle('active', item === link));
            dataLinks.forEach((item) => item.classList.remove('active'));
        });
    });

    dataLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            salmonLinks.forEach((item) => item.classList.toggle('active', item === dataToggle));
            dataLinks.forEach((item) => item.classList.toggle('active', item === link));
        });
    });
});