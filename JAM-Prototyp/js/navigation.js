document.addEventListener('DOMContentLoaded', () => {
    const salmonGroup = document.querySelector('.disease-group.salmonellose');
    const salmonHeader = salmonGroup ? salmonGroup.querySelector('.disease-header') : null;
    const salmonLinks = salmonGroup ? salmonGroup.querySelectorAll('.disease-submenu > .sidebar-link') : [];
    const dataToggle = salmonGroup ? salmonGroup.querySelector('.data-toggle') : null;
    const dataLinks = salmonGroup ? salmonGroup.querySelectorAll('.data-submenu .sidebar-link') : [];
    const scrollyContent = document.querySelector('.scrolly-content');
    const dataContent = document.querySelector('#data-content');
    const scrollyLayout = document.querySelector('.scrolly-layout');

    function setDataMenu(open) {
        if (!dataToggle) {
            return;
        }

        dataToggle.classList.toggle('active', open);
        dataToggle.setAttribute('aria-expanded', String(open));
    }

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
    }

    if (salmonHeader) {
        salmonHeader.addEventListener('click', () => {
            salmonGroup.classList.toggle('active');
        });
    }

    salmonLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const shouldOpenDataMenu = link === dataToggle
                ? !dataToggle.classList.contains('active')
                : false;

            salmonLinks.forEach((item) => item.classList.toggle('active', item === link));
            dataLinks.forEach((item) => item.classList.remove('active'));

            if (link === dataToggle) {
                setDataMenu(shouldOpenDataMenu);
                setView('data');
            } else {
                setDataMenu(false);
                setView('scrolly');
            }
        });
    });

    dataLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            salmonLinks.forEach((item) => item.classList.toggle('active', item === dataToggle));
            dataLinks.forEach((item) => item.classList.toggle('active', item === link));
            setDataMenu(true);
            setView('data');
        });
    });
});