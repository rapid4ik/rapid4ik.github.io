document.addEventListener('DOMContentLoaded', function() {
    // Инициализация частиц
    particlesJS('particles-js', {
        "particles": {
            "number": {
                "value": 80,
                "density": {
                    "enable": true,
                    "value_area": 800
                }
            },
            "color": {
                "value": "#9c27b0"
            },
            "shape": {
                "type": "circle",
                "stroke": {
                    "width": 0,
                    "color": "#000000"
                },
                "polygon": {
                    "nb_sides": 5
                }
            },
            "opacity": {
                "value": 0.5,
                "random": true,
                "anim": {
                    "enable": true,
                    "speed": 1,
                    "opacity_min": 0.1,
                    "sync": false
               }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": {
            "onhover": {
                "enable": true,
                "mode": "repulse"
            },
            "onclick": {
                "enable": true,
                "mode": "push"
            },
            "resize": true
        },
        "modes": {
            "repulse": {
                "distance": 100,
                "duration": 0.4
            },
            "push": {
                "particles_nb": 4
            }
        }
    },
    "retina_detect": true
});

// Замените на ваш GitHub username
const username = 'slavazaharov';

// Получаем информацию о пользователе
fetch(`https://api.github.com/users/${username}`)
    .then(response => response.json())
    .then(user => {
        // Устанавливаем аватар
        const avatar = document.getElementById('github-avatar');
        avatar.src = user.avatar_url;
        
        // Анимация появления аватара
        setTimeout(() => {
            avatar.style.opacity = '1';
            avatar.style.transform = 'scale(1)';
        }, 300);
        
        // Обновляем количество репозиториев
        document.getElementById('repo-count').textContent = `${user.public_repos} проектов`;
    })
    .catch(error => {
        console.error('Error loading user data:', error);
        document.getElementById('github-avatar').src = 'https://via.placeholder.com/150';
    });

// Получаем репозитории пользователя
fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`)
    .then(response => response.json())
    .then(repos => {
        const projectsContainer = document.getElementById('projects-container');
        const nonForkedRepos = repos.filter(repo => !repo.fork);
        
        // Удаляем скелетоны
        projectsContainer.innerHTML = '';
        
        // Обновляем общее количество звезд
        const totalStars = nonForkedRepos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
        document.getElementById('total-stars').textContent = `${totalStars} звёзд`;
        
        // Обновляем дату последнего обновления
        if (nonForkedRepos.length > 0) {
            const lastUpdated = new Date(nonForkedRepos[0].updated_at);
            document.getElementById('last-updated').textContent = `Обновлено ${formatDate(lastUpdated)}`;
        }
        
        // Отображаем проекты (первые 6)
        const displayedRepos = nonForkedRepos.slice(0, 6);
        displayedRepos.forEach((repo, index) => {
            setTimeout(() => {
                const projectCard = createProjectCard(repo);
                projectsContainer.appendChild(projectCard);
            }, index * 150); // Задержка для последовательной анимации
        });
        
        // Получаем релизы для всех репозиториев
        return Promise.all(nonForkedRepos.map(repo => 
            fetch(`https://api.github.com/repos/${username}/${repo.name}/releases`)
                .then(response => response.json())
                .catch(() => []) // На случай ошибки (например, если нет релизов)
        ));
    })
    .then(allReleases => {
        const releasesContainer = document.getElementById('releases-container');
        const lastReleaseElement = document.getElementById('last-release');
        
        // Удаляем скелетоны
        releasesContainer.innerHTML = '';
        
        // Собираем все релизы в один массив и сортируем по дате
        const allReleasesFlat = allReleases.flat();
        allReleasesFlat.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
        
        // Отображаем последний релиз в футере
        if (allReleasesFlat.length > 0) {
            const lastRelease = allReleasesFlat[0];
            lastReleaseElement.textContent = `Последний релиз: ${lastRelease.name} (${formatDate(new Date(lastRelease.published_at))})`;
            
            // Анимация для последнего релиза
            lastReleaseElement.style.opacity = '0';
            lastReleaseElement.style.transform = 'translateY(10px)';
            setTimeout(() => {
                lastReleaseElement.style.transition = 'all 0.5s ease';
                lastReleaseElement.style.opacity = '1';
                lastReleaseElement.style.transform = 'translateY(0)';
            }, 500);
        } else {
            lastReleaseElement.textContent = 'Релизы не найдены';
        }
        
        // Отображаем последние 5 релизов
        const displayedReleases = allReleasesFlat.slice(0, 5);
        if (displayedReleases.length > 0) {
            displayedReleases.forEach((release, index) => {
                setTimeout(() => {
                    const releaseItem = createReleaseItem(release);
                    releasesContainer.appendChild(releaseItem);
                }, index * 200); // Задержка для последовательной анимации
            });
        } else {
            releasesContainer.innerHTML = '<p class="no-releases">Релизы не найдены</p>';
        }
    })
    .catch(error => {
        console.error('Error fetching GitHub data:', error);
        document.getElementById('projects-container').innerHTML = '<p class="error-message">Ошибка загрузки проектов. Пожалуйста, попробуйте позже.</p>';
        document.getElementById('releases-container').innerHTML = '<p class="error-message">Ошибка загрузки релизов. Пожалуйста, попробуйте позже.</p>';
    });

// Анимация при скролле
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.project-card, .release-item');
    elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;
        
        if (elementPosition < screenPosition) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
};

window.addEventListener('scroll', animateOnScroll);
});

function createProjectCard(repo) {
const card = document.createElement('div');
card.className = 'project-card';

// Используем изображение по умолчанию или из README (если есть)
const imageUrl = `https://opengraph.githubassets.com/1/${repo.full_name}`;

card.innerHTML = `
    <img src="${imageUrl}" alt="${repo.name}" class="project-image">
    <div class="project-info">
        <h3 class="project-title">${repo.name}</h3>
        <p class="project-description">${repo.description || 'Описание отсутствует'}</p>
        <div class="project-stats">
            <span class="updated">Обновлено ${formatDate(new Date(repo.updated_at))}</span>
            <span class="likes"><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
        </div>
        <a href="${repo.html_url}" target="_blank" class="repo-link" style="display: none;">Открыть проект</a>
    </div>
`;

// Добавляем эффект параллакса
card.addEventListener('mousemove', (e) => {
    const x = e.pageX - card.getBoundingClientRect().left;
    const y = e.pageY - card.getBoundingClientRect().top;
    
    const centerX = card.offsetWidth / 2;
    const centerY = card.offsetHeight / 2;
    
    const posX = (x - centerX) / 20;
    const posY = (y - centerY) / 20;
    
    card.style.transform = `translateY(-10px) rotateX(${posY}deg) rotateY(${posX}deg) scale(1.02)`;
});

card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(-10px) scale(1.02)';
});

return card;
}

function createReleaseItem(release) {
const item = document.createElement('div');
item.className = 'release-item';

markdown
Copy
item.innerHTML = `
    <h3 class="release-title">
        <span class="release-version">${release.tag_name}</span>
        ${release.name || 'Без названия'}
    </h3>
    <p class="release-date">Опубликовано ${formatDate(new Date(release.published_at))}</p>
    ${release.body ? `<div class="release-notes">${marked.parse(release.body)}</div>` : ''}
    <a href="${release.html_url}" target="_blank" class="release-link">Подробнее</a>
`;

// Добавляем эффект при наведении
item.addEventListener('mouseenter', () => {
    item.style.transform = 'translateX(5px)';
    item.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
});

item.addEventListener('mouseleave', () => {
    item.style.transform = 'translateX(0)';
    item.style.boxShadow = 'none';
});

return item;
}

function formatDate(date) {
const options = { year: 'numeric', month: 'long', day: 'numeric' };
return date.toLocaleDateString('ru-RU', options);
}
