document.addEventListener('DOMContentLoaded', function() {
    const projects = [
        {
            name: "slavazaharov.github.io",
            description: "Мой персональный сайт-портфолио с проектами",
            url: "https://github.com/slavazaharov/slavazaharov.github.io",
            stars: 1,
            language: "JavaScript",
            updated: "2025-04-13T10:50:30Z"
        },
        {
            name: "XorDeobfuscator",
            description: "Мощный инструмент для деобфускации XOR-шифрования в Java",
            url: "https://github.com/slavazaharov/XorDeobfuscator",
            stars: 1,
            language: "Java",
            updated: "2025-03-18T11:02:47Z"
        }
    ];

    const projectsContainer = document.getElementById('projects');
    
    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        
        const updatedDate = new Date(project.updated).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        card.innerHTML = `
            <h3 class="project-title">${project.name}</h3>
            <p class="project-description">${project.description}</p>
            <div class="project-meta">
                <span class="project-likes">
                    <i class="fas fa-star"></i> ${project.stars}
                </span>
                <span class="project-language">${project.language}</span>
                <span class="project-date">${updatedDate}</span>
            </div>
        `;
        
        card.addEventListener('click', () => {
            window.open(project.url, '_blank');
        });
        
        projectsContainer.appendChild(card);
    });
});
