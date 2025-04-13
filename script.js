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
						}});

					const username = 'slavazaharov';
					const MAX_RETRIES = 2;
					let retryCount = 0;

					// Функция для обработки ошибок
					function showError(elementId, message) {
						const element = document.getElementById(elementId);
						if (element) {
							element.innerHTML = `<p class="error-message">${message}</p>`;
						}
					}

					// Универсальная функция для запросов с повторами
					async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
						try {
							const response = await fetch(url, options);
							if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
							return await response.json();
						} catch (error) {
							if (retries > 0) {
								console.log(`Повтор запроса (осталось попыток: ${retries})`);
								await new Promise(resolve => setTimeout(resolve, 1000 * (MAX_RETRIES - retries + 1)));
								return fetchWithRetry(url, options, retries - 1);
							}
							throw error;
						}
					}

					// Загрузка данных пользователя
					loadUserData(); loadProjects(); loadReleases();

					async function loadUserData() {
						try {
							const user = await fetchWithRetry(`https://api.github.com/users/${username}`);

							// Аватар
							const avatar = document.getElementById('github-avatar');
							if (avatar) {
								avatar.src = user.avatar_url;
								setTimeout(() => {
									avatar.style.opacity = '1';
									avatar.style.transform = 'scale(1)';
								}, 300);
							}

							// Статистика
							updateElementText('repo-count', `${user.public_repos} проектов`);

							// Загружаем репозитории для подсчёта звёзд
							const repos = await fetchWithRetry(`https://api.github.com/users/${username}/repos?per_page=100`);
							const totalStars = repos.filter(r => !r.fork).reduce((acc, repo) => acc + repo.stargazers_count, 0);
							updateElementText('total-stars', `${totalStars} звёзд`);

							if (repos.length > 0) {
								const lastUpdated = new Date(repos[0].updated_at);
								updateElementText('last-updated', `Обновлено ${formatDate(lastUpdated)}`);
							}

						} catch (error) {
							console.error('Ошибка загрузки данных пользователя:', error);
							showError('repo-count', 'Не удалось загрузить данные');
							document.getElementById('github-avatar').src = 'https://via.placeholder.com/150';
						}
					}

					async function loadProjects() {
						try {
							const repos = await fetchWithRetry(
								`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`
							);

							const projectsContainer = document.getElementById('projects-container');
							if (!projectsContainer) return;

							projectsContainer.innerHTML = '';

							const nonForkedRepos = repos.filter(repo => !repo.fork && !repo.archived);

							if (nonForkedRepos.length === 0) {
								projectsContainer.innerHTML = '<p class="no-projects">Нет публичных проектов</p>';
								return;
							}

							nonForkedRepos.forEach((repo, index) => {
								setTimeout(() => {
									const projectCard = createProjectCard(repo);
									projectsContainer.appendChild(projectCard);
								}, index * 150);
							});

						} catch (error) {
							console.error('Ошибка загрузки проектов:', error);
							showError('projects-container', 'Не удалось загрузить проекты');
						}
					}

					async function loadReleases() {
						try {
							const repos = await fetchWithRetry(
								`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`
							);

							const releasesContainer = document.getElementById('releases-container');
							const lastReleaseElement = document.getElementById('last-release');
							if (!releasesContainer || !lastReleaseElement) return;

							releasesContainer.innerHTML = '';

							// Получаем релизы только для репозиториев с релизами
							const releases = await Promise.all(
								repos.map(repo =>
									fetchWithRetry(
										`https://api.github.com/repos/${username}/${repo.name}/releases?per_page=1`
									).catch(() => [])
								)
							);

							const flatReleases = releases.flat().filter(Boolean);
							flatReleases.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

							if (flatReleases.length > 0) {
								updateElementText('last-release',
									`Последний релиз: ${flatReleases[0].name || flatReleases[0].tag_name} (${formatDate(new Date(flatReleases[0].published_at))})`);

								flatReleases.slice(0, 5).forEach((release, index) => {
									setTimeout(() => {
										const releaseItem = createReleaseItem(release);
										releasesContainer.appendChild(releaseItem);
									}, index * 200);
								});
							} else {
								updateElementText('last-release', 'Нет релизов');
								releasesContainer.innerHTML = '<p class="no-releases">Релизы не найдены</p>';
							}

						} catch (error) {
							console.error('Ошибка загрузки релизов:', error);
							showError('releases-container', 'Не удалось загрузить релизы');
							updateElementText('last-release', 'Ошибка загрузки релизов');
						}
					}

					function updateElementText(elementId, text) {
						const element = document.getElementById(elementId);
						if (element) {
							element.textContent = text;
						}
					}

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
						const options = {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						};
						return date.toLocaleDateString('ru-RU', options);
					}
