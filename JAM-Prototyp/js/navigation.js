document.addEventListener('DOMContentLoaded', () => {
    const salmonGroup = document.querySelector('.disease-group.salmonellose');
    const salmonHeader = salmonGroup ? salmonGroup.querySelector('.disease-header') : null;
    const salmonLinks = salmonGroup ? salmonGroup.querySelectorAll('.disease-submenu > .sidebar-link') : [];
    const dataToggle = salmonGroup ? salmonGroup.querySelector('.data-toggle') : null;
    const dataLinks = salmonGroup ? salmonGroup.querySelectorAll('.data-submenu .sidebar-link') : [];
    const scrollyContent = document.querySelector('.scrolly-content');
    const dataContent = document.querySelector('#data-content');
    const scrollyLayout = document.querySelector('.scrolly-layout');
    const diseaseGroups = document.querySelectorAll('.disease-group');
    const scrollyDataButton = document.querySelector('.scrolly-data-button');

    const mainnav = document.querySelector('.mainnav');
    const intro = document.querySelector('.page-intro');
    let openingDataView = false;

    function updateStickyHeaderHeight() {
        const mainnavHeight = mainnav ? mainnav.offsetHeight : 0;
        const introHeight = intro ? intro.offsetHeight : 0;

        document.documentElement.style.setProperty(
            '--mainnav-h',
            mainnavHeight + 'px'
        );
        document.documentElement.style.setProperty(
            '--intro-h',
            mainnavHeight + introHeight + 'px'
        );
    }

    updateStickyHeaderHeight();

    if (mainnav || intro) {
        const stickyHeaderObserver = new ResizeObserver(updateStickyHeaderHeight);
        if (mainnav) {
            stickyHeaderObserver.observe(mainnav);
        }
        if (intro) {
            stickyHeaderObserver.observe(intro);
        }
    }

    function setDataMenu(open) {
        if (!dataToggle) {
            return;
        }

        dataToggle.classList.toggle('active', open);
        dataToggle.setAttribute('aria-expanded', String(open));
    }

    function scrollToDataStart() {
        if (!dataContent) {
            return;
        }

        requestAnimationFrame(() => {
            const introHeight = intro ? intro.offsetHeight : 0;
            const dataTop = dataContent.getBoundingClientRect().top + window.scrollY;

            window.scrollTo({
                top: Math.max(0, dataTop - introHeight),
                left: 0,
                behavior: 'auto',
            });
        });
    }

    function openDataView(scrollToStart = true) {
        openingDataView = true;
        setDataMenu(true);
        setView('data');
        if (salmonGroup) {
            salmonGroup.classList.add('active');
        }
        if (scrollyLayout) {
            scrollyLayout.classList.remove('data-nav-collapsed');
        }
        if (scrollToStart) {
            scrollToDataStart();
        }

        requestAnimationFrame(() => {
            openingDataView = false;
        });
    }

    function scrollToDataCard(link) {
        const targetId = link.dataset.target;
        const target = targetId ? document.getElementById(targetId) : null;

        if (!target) {
            return;
        }

        requestAnimationFrame(() => {
            const introHeight = intro ? intro.offsetHeight : 0;
            const targetTop = target.getBoundingClientRect().top + window.scrollY;

            window.scrollTo({
                top: Math.max(0, targetTop - introHeight),
                left: 0,
                behavior: 'smooth',
            });
        });
    }

    function collapseNavigationOnScroll() {
        if (!dataContent || dataContent.hidden) {
            return;
        }

        if (openingDataView) {
            return;
        }

        const introHeight = intro ? intro.offsetHeight : 0;
        const dataStart = dataContent.getBoundingClientRect().top + window.scrollY - introHeight;
        if (Math.abs(window.scrollY - Math.max(0, dataStart)) <= 2) {
            return;
        }

        diseaseGroups.forEach((group) => {
            group.classList.remove('active');
        });
        if (scrollyLayout) {
            scrollyLayout.classList.add('data-nav-collapsed');
        }
        setDataMenu(false);
    }

    const overviewContent = document.querySelector('#overview-content');
    const views = {
        overview: overviewContent,
        scrolly: scrollyContent,
        data: dataContent,
    };

    function setView(view) {
        Object.entries(views).forEach(([name, el]) => {
            if (el) el.hidden = name !== view;
        });

        if (scrollyLayout) {
            scrollyLayout.classList.toggle('scrolly-mode', view === 'scrolly');
            scrollyLayout.classList.toggle('overview-mode', view === 'overview');
            if (view !== 'data') {
                scrollyLayout.classList.remove('data-nav-collapsed');
            }
            // bei jedem Ansichtswechsel startet die Navigation im Normalzustand
            scrollyLayout.classList.remove('nav-expanded');
        }

        // Im Scrolly ist die Navigation zugeklappt, sonst aufgeklappt
        if (salmonGroup) {
            salmonGroup.classList.toggle('active', view !== 'scrolly');
        }

        if (view === 'scrolly') {
            requestAnimationFrame(() => {
                // 1. Canvas und ScrollTrigger mit dem sichtbaren Scrolly neu vermessen
                window.dispatchEvent(new Event('resize'));
                ScrollTrigger.refresh();

                // 2. an den Anfang des Scrollys springen (sofort, ohne Animation)
                //const top = scrollyLayout.getBoundingClientRect().top + window.scrollY;
                //window.scrollTo({ top, left: 0, behavior: 'instant' });

                // 3. Zustand erst zurücksetzen, wenn alle Scroll-Events durch sind
                requestAnimationFrame(() => {
                    state.lastIndex = 0;
                    state.currentIndex = 0;
                    state.progress = 1;
                });
            });
        }
    }

    setView('overview'); // Startzustand
    if (salmonGroup) salmonGroup.classList.remove('active'); // Navigation beim Laden eingeklappt

    if (salmonHeader) {
        salmonHeader.addEventListener('click', () => {
            const inScrolly = scrollyLayout && scrollyLayout.classList.contains('scrolly-mode');
            const inOverview = overviewContent && !overviewContent.hidden;

            if (inOverview) {
                // Overview: Klick auf Salmonellose öffnet direkt das Scrolly
                salmonLinks.forEach((item) => item.classList.toggle('active', item === salmonLinks[0]));
                dataLinks.forEach((item) => item.classList.remove('active'));
                setDataMenu(false);
                setView('scrolly');
            } else if (inScrolly) {
                // Scrolly: komplette Navigation ein- oder ausklappen
                const isExpanded = scrollyLayout.classList.contains('nav-expanded');
                scrollyLayout.classList.toggle('nav-expanded', !isExpanded);
                salmonGroup.classList.toggle('active', !isExpanded);
            } else {
                // Datenansicht: normal auf- und zuklappen
                const wasCollapsed = scrollyLayout
                    && scrollyLayout.classList.contains('data-nav-collapsed');

                if (scrollyLayout) {
                    scrollyLayout.classList.remove('data-nav-collapsed');
                }

                if (wasCollapsed) {
                    salmonGroup.classList.add('active');
                    setDataMenu(true);
                } else {
                    salmonGroup.classList.toggle('active');
                }
            }
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
                if (shouldOpenDataMenu) {
                    const alreadyInDataView = dataContent && !dataContent.hidden;
                    openDataView(!alreadyInDataView);
                } else {
                    setDataMenu(false);
                    setView('data');
                }
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
            if (scrollyLayout) {
                scrollyLayout.classList.remove('data-nav-collapsed');
            }
            scrollToDataCard(link);
        });
    });

    if (scrollyDataButton) {
        scrollyDataButton.addEventListener('click', () => {
            salmonLinks.forEach((item) => {
                item.classList.toggle('active', item === dataToggle);
            });
            dataLinks.forEach((item) => item.classList.remove('active'));
            openDataView();
        });
    }

    window.addEventListener('scroll', collapseNavigationOnScroll, { passive: true });
});
