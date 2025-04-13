document.addEventListener('DOMContentLoaded', function() {
    const GITHUB_USER = 'slavazaharov';
    const GITHUB_ID = '118283118'; // Ваш GitHub ID из ответа API
    const GITHUB_API = `https://api.github.com/users/${GITHUB_USER}`;
    
    // Загрузка информации о профиле
    fetch(GITHUB_API)
        .then(response => response.json())
        .then(data => {
            // Обновление аватара
            const avatar = document.getElementById('avatar');
            avatar.src = data.avatar_url || `https://avatars.githubusercontent.com/u/${GITHUB_ID}`;
            
            // Обновление даты последнего обновления
            const lastUpdated = document.getElementById('last-updated');
            const updatedDate = new Date(data.updated_at);
            lastUpdated.textContent = `Последнее обновление: ${updatedDate.toLocaleDateString()}`;
        })
        .catch(error => console.error('Ошибка загрузки профиля:', error));

    // Ваши репозитории (вместо запроса к API используем данные из ответа)
    const repos = [
        {
            name: "slavazaharov.github.io",
            description: "Мой персональный сайт-портфолио",
            html_url: "https://github.com/slavazaharov/slavazaharov.github.io",
            stargazers_count: 1,
            language: "JavaScript",
            updated_at: "2025-04-13T10:50:30Z"
        },
        {
            name: "XorDeobfuscator",
            description: "Инструмент для деобфускации XOR-шифрования",
            html_url: "https://github.com/slavazaharov/XorDeobfuscator",
            stargazers_count: 1,
            language: "Java",
            updated_at: "2025-03-18T11:02:47Z"
        }
    ];

    // Отображение проектов
    const projectsContainer = document.getElementById('projects');
    projectsContainer.innerHTML = '';
    
    // Сортируем по дате обновления (новые сначала)
    repos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    
    // Создаем карточки проектов
    repos.forEach(repo => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        
        // Используем изображение из OpenGraph
        const imageUrl = `https://opengraph.githubassets.com/1/${GITHUB_USER}/${repo.name}`;
        
        // Форматируем дату обновления
        const updatedDate = new Date(repo.updated_at);
        const formattedDate = updatedDate.toLocaleDateString();
        
        projectCard.innerHTML = `
            <img src="${imageUrl}" alt="${repo.name}" class="project-image">
            <div class="project-info">
                <h3 class="project-title">${repo.name}</h3>
                <p class="project-description">${repo.description || 'Без описания'}</p>
                <div class="project-meta">
                    <span><i class="fas fa-code"></i> ${repo.language || 'Не указан'}</span>
                    <span><i class="fas fa-star"></i> ${repo.stargazers_count || 0}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
                </div>
            </div>
        `;
        
        // Добавляем клик по карточке
        projectCard.addEventListener('click', () => {
            window.open(repo.html_url, '_blank');
        });
        
        projectsContainer.appendChild(projectCard);
    });

    // Обновляем информацию о последнем релизе (берем из первого репозитория)
    const lastRelease = document.getElementById('last-release');
    if (repos.length > 0) {
        const latestRepo = repos[0];
        const releaseDate = new Date(latestRepo.updated_at);
        lastRelease.textContent = `Последнее обновление проекта: ${latestRepo.name} (${releaseDate.toLocaleDateString()})`;
    } else {
        lastRelease.textContent = 'Нет информации о релизах';
    }
});
