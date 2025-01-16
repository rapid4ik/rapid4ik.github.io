const shopId = '126209'; // Укажите ваш ID магазина EasyDonate
const apiUrl = `https://easydonate.ru/api/v3/shop/${shopId}/products`;
const productsContainer = document.getElementById('products');

// Функция для загрузки товаров
async function loadProducts() {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.success) {
            displayProducts(data.response.items);
        } else {
            productsContainer.innerHTML = '<p>Ошибка при загрузке товаров.</p>';
        }
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        productsContainer.innerHTML = '<p>Не удалось загрузить товары.</p>';
    }
}

// Функция для отображения товаров на странице
function displayProducts(products) {
    productsContainer.innerHTML = ''; // Очистка содержимого
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product';
        productElement.innerHTML = `
            <h3>${product.name}</h3>
            <p>Цена: ${product.price} ₽</p>
            <a href="https://easydonate.ru/shop/${shopId}/buy/${product.id}" class="buy-button" target="_blank">Купить</a>
        `;
        productsContainer.appendChild(productElement);
    });
}

// Загрузка товаров при загрузке страницы
loadProducts();
