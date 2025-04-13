document.addEventListener('DOMContentLoaded', function() {
    // Замените YOUR_GITHUB_USERNAME на ваш GitHub username
    const username = 'slavazaharov';
    
    // Получаем информацию о пользователе
    fetch(`https://api.github.com/users/${username}`)
        .then(response => response.json())
        .then(user => {
            // Обновляем аватар (если он не установлен в HTML)
            if (!document.querySelector('.avatar').src.includes('YOUR_GITHUB_USER_ID')) {
                document.querySelector('.avatar').src = user.avatar_url;
            }
            
            // Обновляем количество репозиториев
            document.getElementById('repo-count').textContent = `${user.public_repos} проектов`;
        });
    
    // Получаем репозитории пользователя
    fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`)
        .then(response => response.json())
        .then(repos => {
            const projectsContainer = document.getElementById('projects-container');
            const nonForkedRepos = repos.filter(repo => !repo.fork);
            
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
            displayedRepos.forEach(repo => {
                const projectCard = createProjectCard(repo);
                projectsContainer.appendChild(projectCard);
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
            
            // Собираем все релизы в один массив и сортируем по дате
            const allReleasesFlat = allReleases.flat();
            allReleasesFlat.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
            
            // Отображаем последний релиз в футере
            if (allReleasesFlat.length > 0) {
                const lastRelease = allReleasesFlat[0];
                lastReleaseElement.textContent = `Последний релиз: ${lastRelease.name} (${formatDate(new Date(lastRelease.published_at))})`;
            } else {
                lastReleaseElement.textContent = 'Релизы не найдены';
            }
            
            // Отображаем последние 5 релизов
            const displayedReleases = allReleasesFlat.slice(0, 5);
            if (displayedReleases.length > 0) {
                displayedReleases.forEach(release => {
                    const releaseItem = createReleaseItem(release);
                    releasesContainer.appendChild(releaseItem);
                });
            } else {
                releasesContainer.innerHTML = '<p class="no-releases">Релизы не найдены</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching GitHub data:', error);
            document.getElementById('projects-container').innerHTML = '<p>Ошибка загрузки проектов. Пожалуйста, попробуйте позже.</p>';
            document.getElementById('releases-container').innerHTML = '<p>Ошибка загрузки релизов. Пожалуйста, попробуйте позже.</p>';
        });
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
    
    return card;
}

function createReleaseItem(release) {
    const item = document.createElement('div');
    item.className = 'release-item';
    
    item.innerHTML = `
        <h3 class="release-title">
            <span class="release-version">${release.tag_name}</span>
            ${release.name || 'Без названия'}
        </h3>
        <p class="release-date">Опубликовано ${formatDate(new Date(release.published_at))}</p>
        ${release.body ? `<div class="release-notes">${marked.parse(release.body)}</div>` : ''}
        <a href="${release.html_url}" target="_blank" class="release-link">Подробнее</a>
    `;
    
    return item;
}

function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('ru-RU', options);
}
