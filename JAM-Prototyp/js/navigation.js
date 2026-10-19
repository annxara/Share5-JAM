document.addEventListener('DOMContentLoaded', () => {
    const salmonGroup = document.querySelector('.disease-group.salmonellose');
    const salmonHeader = salmonGroup ? salmonGroup.querySelector('.disease-header') : null;
    const salmonLinks = salmonGroup ? salmonGroup.querySelectorAll('.disease-submenu > .sidebar-link') : [];
    const dataToggle = salmonGroup ? salmonGroup.querySelector('.data-toggle') : null;
    const dataLinks = salmonGroup ? salmonGroup.querySelectorAll('.data-submenu .sidebar-link') : [];
    const scrollyContent = document.querySelector('.scrolly-content');
    const dataContent = document.querySelector('#data-content');
    const scrollyLayout = document.querySelector('.scrolly-layout');

    function setView(view) {
        const showData = view === 'data';

        if (scrollyContent) {
            scrollyContent.hidden = showData;
        }

        if (dataContent) {
            dataContent.hidden = !showData;
        }

        if (scrollyLayout) {
            scrollyLayout.classList.toggle('data-mode', showData);
        }

        if (dataToggle) {
            dataToggle.setAttribute('aria-expanded', String(showData));
        }
    }

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

            setView(link === dataToggle ? 'data' : 'scrolly');
        });
    });

    dataLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            salmonLinks.forEach((item) => item.classList.toggle('active', item === dataToggle));
            dataLinks.forEach((item) => item.classList.toggle('active', item === link));
            setView('data');
        });
    });
});