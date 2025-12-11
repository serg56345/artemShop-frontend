// ---------------- Отримуємо параметр категорії зі сторінки ----------------
const params = new URLSearchParams(window.location.search);
const categorySlug = params.get("c");

// ---------------- Встановлюємо заголовок сторінки ----------------
const categoryTitle = document.getElementById('category-title');
categoryTitle.textContent = categorySlug
    ? categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)
    : "Товари";

// ---------------- Функція завантаження товарів ----------------
async function loadProducts() {
    try {
        const response = await fetch('data/products.json');
        const products = await response.json();

        // Фільтруємо товари за категорією
        const filtered = products.filter(p => p.category === categorySlug);

        const container = document.getElementById('product-list');
        container.innerHTML = "";

        if (filtered.length === 0) {
            container.innerHTML = "<p>Товари цієї категорії відсутні.</p>";
            return;
        }

        // Створюємо картки і додаємо обробник addToCart
        filtered.forEach(product => {
            const card = document.createElement("div");
            card.classList.add("product-card");
            card.innerHTML = `
                <img src="${product.img}" alt="${product.title}">
                <h3>${product.title}</h3>
                <p>${product.description}</p>
                <p class="price">${product.price} грн</p>
                <button class="add-to-cart"
                    data-id="${product.id}"
                    data-name="${product.title}"
                    data-price="${product.price}"
                    data-img="${product.img}">
                    В корзину
                </button>
            `;
            container.appendChild(card);

            // Підключаємо addToCart до кнопки одразу після створення
            card.querySelector(".add-to-cart").addEventListener("click", addToCart);
        });

    } catch (error) {
        console.error("Помилка завантаження товарів:", error);
    }
}

// Викликаємо завантаження карток
loadProducts();

// ---------------- Завантаження категорій для сайдбару ----------------
async function loadSidebarCategories() {
    try {
        const response = await fetch('data/category.json');
        const categories = await response.json();

        const container = document.getElementById('sidebar-categories');
        container.innerHTML = "";

        categories.forEach(cat => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="category.html?c=${cat.slug}">${cat.title}</a>`;
            container.appendChild(li);
        });
    } catch (error) {
        console.error("Помилка завантаження категорій:", error);
    }
}

// Викликаємо завантаження сайдбару
loadSidebarCategories();
