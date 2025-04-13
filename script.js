document.addEventListener('DOMContentLoaded', function() {
    // Замените YOUR_GITHUB_ID на ваш реальный GitHub ID (можно найти в URL вашего профиля)
    const GITHUB_USER = 'slavazaharov';
    const GITHUB_API = `https://api.github.com/users/${GITHUB_USER}`;
    const GITHUB_REPOS_API = `https://api.github.com/users/${GITHUB_USER}/repos`;
    
    // Загрузка информации о профиле
    fetch(GITHUB_API)
        .then(response => response.json())
        .then(data => {
            // Обновление аватара
            const avatar = document.getElementById('avatar');
            if (data.avatar_url) {
                avatar.src = data.avatar_url;
            }
            
            // Обновление даты последнего обновления
            const lastUpdated = document.getElementById('last-updated');
            if (data.updated_at) {
                const updatedDate = new Date(data.updated_at);
                lastUpdated.textContent = `Последнее обновление: ${updatedDate.toLocaleDateString()}`;
            }
        })
        .catch(error => console.error('Ошибка загрузки профиля:', error));
    
    // Загрузка релизов (берем последний релиз из любого репозитория)
    fetch(`${GITHUB_API}/repos?per_page=100`)
        .then(response => response.json())
        .then(repos => {
            // Ищем репозитории с релизами
            const reposWithReleases = repos.filter(repo => repo.has_releases);
            
            if (reposWithReleases.length > 0) {
                // Берем первый репозиторий с релизами
                return fetch(`https://api.github.com/repos/${GITHUB_USER}/${reposWithReleases[0].name}/releases`);
            } else {
                return Promise.resolve([]);
            }
        })
        .then(response => response.json())
        .then(releases => {
            const lastRelease = document.getElementById('last-release');
            if (releases.length > 0) {
                const latestRelease = releases[0];
                const releaseDate = new Date(latestRelease.published_at);
                lastRelease.textContent = `Последний релиз: ${latestRelease.name} (${releaseDate.toLocaleDateString()})`;
            } else {
                lastRelease.textContent = 'Последний релиз: нет релизов';
            }
        })
        .catch(error => console.error('Ошибка загрузки релизов:', error));
    
    // Загрузка репозиториев (проектов)
    fetch(GITHUB_REPOS_API)
        .then(response => response.json())
        .then(repos => {
            const projectsContainer = document.getElementById('projects');
            projectsContainer.innerHTML = '';
            
            // Фильтруем репозитории (исключаем форки и пустые)
            const filteredRepos = repos.filter(repo => !repo.fork && repo.description);
            
            if (filteredRepos.length === 0) {
                projectsContainer.innerHTML = '<div class="loader">Нет проектов для отображения</div>';
                return;
            }
            
            // Сортируем по дате обновления (новые сначала)
            filteredRepos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            
            // Создаем карточки проектов
            filteredRepos.forEach(repo => {
                const projectCard = document.createElement('div');
                projectCard.className = 'project-card';
                
                // Используем изображение по умолчанию или из темы репозитория
                const imageUrl = `https://opengraph.githubassets.com/1/${GITHUB_USER}/${repo.name}`;
                
                // Форматируем описание (удаляем эмодзи и лишние символы)
                let description = repo.description || 'Без описания';
                description = description.replace(/:[a-z_]+:/g, '').trim();
                
                projectCard.innerHTML = `
                    <img src="${imageUrl}" alt="${repo.name}" class="project-image">
                    <div class="project-info">
                        <h3 class="project-title">${repo.name}</h3>
                        <p class="project-description">${description}</p>
                        <div class="project-stats">
                            <span class="likes"><i class="fas fa-heart"></i> ${repo.stargazers_count || 0} лайков</span>
                            <span class="release"><i class="fas fa-tag"></i> ${repo.language || 'Не указан'}</span>
                        </div>
                    </div>
                `;
                
                // Добавляем клик по карточке (переход на репозиторий)
                projectCard.addEventListener('click', () => {
                    window.open(repo.html_url, '_blank');
                });
                
                projectsContainer.appendChild(projectCard);
            });
        })
        .catch(error => {
            console.error('Ошибка загрузки репозиториев:', error);
            document.getElementById('projects').innerHTML = '<div class="loader">Ошибка загрузки проектов</div>';
        });
});
