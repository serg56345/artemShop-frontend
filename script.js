// ---------------- ГЛОБАЛЬНІ ЗМІННІ ---------------- //
const catalogSection = document.getElementById("catalog-section");
const productGrid = document.getElementById("product-grid");
const cartBtn = document.getElementById("cart-btn");
const cartModal = document.getElementById("cart-modal");
const authModal = document.getElementById("auth-modal");
const authContent = document.getElementById("auth-content");
const closeBtns = document.querySelectorAll(".close-btn");
const checkoutBtn = document.getElementById("checkout-btn");
const registerBtn = document.getElementById("register-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let user = JSON.parse(sessionStorage.getItem("user")) || null;

updateCartCount();
updateAuthButtons();

// ---------------- БАЗОВИЙ URL API ---------------- //
const API_BASE = "https://artemshop-backend.onrender.com/api";

// ---------------- СЛАЙДЕР ---------------- //
async function loadSlides() {
  try {
    const response = await fetch("./data/slides.json");
    const slidesData = await response.json();

    const wrapper = document.getElementById("swiper-wrapper");
    if (!wrapper) return; // на випадок, якщо контейнера нема

    slidesData.forEach(slide => {
      const slideEl = document.createElement("div");
      slideEl.classList.add("swiper-slide");
      slideEl.innerHTML = `
        <div class="slide-image-container">
          <img src="${slide.image}" alt="${slide.title}">
        </div>
        <div class="slide-text">
          <h3>${slide.title}</h3>
          <p>${slide.text}</p>
        </div>
      `;
      wrapper.appendChild(slideEl);
    });

    // Ініціалізація Swiper
    new Swiper(".mySwiper", {
      loop: true,                  // нескінченне гортання
      speed: 600,                  // швидкість анімації
      autoplay: { delay: 3000, disableOnInteraction: false }, // автопрокрутка
      slidesPerView: 1,            // показуємо 1 слайд
      spaceBetween: 0
    });

  } catch (error) {
    console.error("Помилка при завантаженні слайдів:", error);
  }
}

// Виклик функції лише один раз
loadSlides();

// ---------------- ВИКОНАНІ ЗАМОВЛЕННЯ (SLIDER) ---------------- //
async function loadCompletedOrders() {
  try {
    const response = await fetch("./data/completed-orders.json");
    const ordersData = await response.json();

    const wrapper = document.getElementById("second-swiper-wrapper");
    if (!wrapper) return;

    ordersData.forEach(item => {
      const slideEl = document.createElement("div");
      slideEl.classList.add("swiper-slide");
      slideEl.innerHTML = `
        <div class="slide-image-container">
          <img src="${item.image}" alt="${item.title}">
        </div>
        <div class="slide-text">
          <h3>${item.title}</h3>
          <p>${item.text}</p>
        </div>
      `;
      wrapper.appendChild(slideEl);
    });

    // ❗ ОКРЕМИЙ Swiper з навігацією
    new Swiper(".secondSwiper", {
      loop: true,
      speed: 600,
      slidesPerView: 2,
      spaceBetween: 20,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false
      },
      navigation: {
        nextEl: ".completed-next",
        prevEl: ".completed-prev"
      },
      breakpoints: {
        0: { slidesPerView: 1 },
        768: { slidesPerView: 2 }
      }
    });

  } catch (error) {
    console.error("Помилка завантаження виконаних замовлень:", error);
  }
}

// запуск
loadCompletedOrders();


// ---------------- НАВІГАЦІЯ ---------------- //

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", (e) => {
    const section = link.dataset.section;

    if (section === "catalog") {
      e.preventDefault();
      showCatalog(); // перенаправлення на category.html
    } else if (section === "blog") {
      e.preventDefault();
      loadBlog(); // рендер блогу на поточній сторінці
    }
    // "Головна" веде на index.html через href, нічого додатково не робимо
  });
});

//------ мобільна навігація------///
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

menuToggle.addEventListener('click', () => {
  mainNav.classList.toggle('active');
});

// ---------------- КАТАЛОГ ---------------- //

function showCatalog() {
  window.location.href = "category.html";
}

function renderProducts(products) {
  productGrid.innerHTML = "";
  products.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("card");
    div.innerHTML = `
      <img src="images/${p.image}" alt="${p.name}">
      <h4>${p.name}</h4>
      <p>₴${p.price}</p>
      <button class="btn add-to-cart"
        data-id="${p.id}" data-name="${p.name}"
        data-price="${p.price}" data-img="${p.image}">
        У кошик
      </button>
    `;
    productGrid.appendChild(div);
  });

  document.querySelectorAll(".add-to-cart").forEach(btn =>
    btn.addEventListener("click", addToCart)
  );
}
//-------Категорії-------//
async function loadCategoryCards() {
  const response = await fetch('data/category.json');
  const categories = await response.json();

  const container = document.getElementById('category-list');
  container.innerHTML = "";

  categories.forEach(cat => {
    const card = `
          <div class="category-card" onclick="window.location.href='category.html?c=${cat.slug}'">
              <div class="category__picture">
                  <img src="${cat.img}" alt="${cat.title}">
                  <div class="category__content">
                      <h3 class="category-card__title">${cat.title}</h3>
                      <p class="category-card__text">${cat.p} <span>${cat.pp}</span></p>
                      <button class="category-card__btn">${cat.span}</button>
                  </div>
              </div>
          </div>
      `;
    container.innerHTML += card;
  });

}

loadCategoryCards();
function initReviewsSlider() {
  let reviews = [];
  let currentIndex = 1; // стартуємо на першому справжньому слайді після клону
  let visibleCount = 1;

  const track = document.querySelector('.slider-track');
  const prevBtn = document.getElementById('reviews-prev');
  const nextBtn = document.getElementById('reviews-next');
  const container = document.querySelector('.slider-container');

  fetch('./data/reviews.json')
    .then(res => res.json())
    .then(data => {
      reviews = data;
      renderReviews();
      updateSlider(false);
      window.addEventListener('resize', () => updateSlider(false));
    });

  function renderReviews() {
    track.innerHTML = '';
    // Створюємо клон останніх і перших елементів для безшовної каруселі
    const clonesBefore = reviews.slice(-4); // можна регулювати, залежно від max visibleCount
    const clonesAfter = reviews.slice(0, 4);

    clonesBefore.forEach(review => appendSlide(review));
    reviews.forEach(review => appendSlide(review));
    clonesAfter.forEach(review => appendSlide(review));

    function appendSlide(review) {
      const div = document.createElement('div');
      div.className = 'review';
      div.innerHTML = `
              <img src="${review.image}" alt="${review.name}" />
              <div class="review-text">
                  <h3>${review.name}</h3>
                  <p>${review.text}</p>
                  <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
              </div>
          `;
      track.appendChild(div);
    }
  }

  function getVisibleCount() {
    const width = window.innerWidth;
    if (width <= 768) return 1;
    if (width <= 1024) return 2;
    return 4;
  }

  function updateSlider(animate = true) {
    visibleCount = getVisibleCount();
    const gap = parseInt(getComputedStyle(track).gap) || 0;
    const containerWidth = container.offsetWidth;
    const slideWidth = (containerWidth - gap * (visibleCount - 1)) / visibleCount;

    document.querySelectorAll('.review').forEach(slide => {
      slide.style.flex = `0 0 ${slideWidth}px`;
    });

    if (!animate) {
      track.style.transition = 'none';
    } else {
      track.style.transition = 'transform 0.8s ease-in-out'; // плавніший перехід
    }

    track.style.transform = `translateX(-${currentIndex * (slideWidth + gap)}px)`;
  }

  function nextSlide() {
    currentIndex++;
    updateSlider();
    track.addEventListener('transitionend', handleTransitionEnd);
  }

  function prevSlide() {
    currentIndex--;
    updateSlider();
    track.addEventListener('transitionend', handleTransitionEnd);
  }

  function handleTransitionEnd() {
    track.removeEventListener('transitionend', handleTransitionEnd);

    const totalSlides = reviews.length;

    // Якщо на клоні ззаду
    if (currentIndex >= totalSlides + 1) {
      currentIndex = 1;
      updateSlider(false);
    }

    // Якщо на клоні спереду
    if (currentIndex <= 0) {
      currentIndex = totalSlides;
      updateSlider(false);
    }
  }

  prevBtn.addEventListener('click', prevSlide);
  nextBtn.addEventListener('click', nextSlide);

  // Автопрокрутка (можна включити при потребі)
  let autoSlide = setInterval(nextSlide, 6000);
  container.addEventListener('mouseenter', () => clearInterval(autoSlide));
  container.addEventListener('mouseleave', () => autoSlide = setInterval(nextSlide, 3000));
}

document.addEventListener('DOMContentLoaded', initReviewsSlider);

//-------Картки-------//
async function loadProducts() {
  const response = await fetch('data/products.json');
  const products = await response.json();

  const container = document.getElementById('product-grid');
  container.innerHTML = "";

  products.forEach(product => {
    const card = `
      <div class="card">
        <img src="${product.image}" alt="${product.title}">
        <h3>${product.title}</h3>
        <p>${product.price} грн</p>
      </div>
    `;
    container.innerHTML += card;
  });
}

loadProducts();
//------Як ми працюємо-----//
document.addEventListener("DOMContentLoaded", () => {
  loadHowWeWork();
});

async function loadHowWeWork() {
  try {
    const response = await fetch("data/how-we-work.json");
    const data = await response.json();

    const list = document.getElementById("howWeWorkList");
    list.innerHTML = "";

    data.forEach(item => {
      const stepItem = document.createElement("div");
      stepItem.className = "how-we-work__item";

      stepItem.innerHTML = `
        <div class="how-we-work__image">
          <img src="${item.image}" alt="${item.title}">
          <span class="how-we-work__step">${item.step}</span>
        </div>

        <h3 class="how-we-work__title">${item.title}</h3>
        <p class="how-we-work__text">${item.text}</p>
      `;

      list.appendChild(stepItem);
    });

  } catch (error) {
    console.error("Помилка завантаження how-we-work:", error);
  }
}

// ---------------- КОШИК ---------------- //
cartBtn.addEventListener("click", () => {
  updateCartView();
  cartModal.style.display = "block";
});

closeBtns.forEach(btn =>
  btn.addEventListener("click", () => {
    btn.closest(".modal").style.display = "none";
  })
);

window.addEventListener("click", e => {
  if (e.target.classList.contains("modal")) e.target.style.display = "none";
});

function addToCart(e) {
  const item = e.target.dataset;
  const existing = cart.find(i => i.id === item.id);
  if (existing) existing.qty++;
  else cart.push({ id: item.id, name: item.name, price: +item.price, img: item.img, qty: 1 });
  saveCart();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  document.getElementById("cart-count").textContent = count;
}

function updateCartView() {
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  cartItemsContainer.innerHTML = "";
  let total = 0;
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = "<p>Ваш кошик порожній 🛒</p>";
  } else {
    cart.forEach(item => {
      total += item.price * item.qty;
      const div = document.createElement("div");
      div.classList.add("cart-item");
      div.innerHTML = `
        <img src="images/${item.img}" alt="${item.name}">
        <div><h4>${item.name}</h4><p>₴${item.price} × ${item.qty}</p></div>
        <button class="remove-btn" data-id="${item.id}">✖</button>
      `;
      cartItemsContainer.appendChild(div);
    });
  }
  cartTotal.textContent = total;
  document.querySelectorAll(".remove-btn").forEach(btn =>
    btn.addEventListener("click", removeFromCart)
  );
}

function removeFromCart(e) {
  const id = e.target.dataset.id;
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartView();
}

// ---------------- ОФОРМЛЕННЯ ЗАМОВЛЕННЯ ---------------- //
checkoutBtn.addEventListener("click", () => {
  if (!user) {
    openLoginModal("Для оформлення замовлення увійдіть або зареєструйтесь");
    return;
  }

  const checkoutForm = document.getElementById("checkout-form");
  checkoutForm.style.display = "block";

  const form = document.getElementById("order-form");
  const msg = document.getElementById("order-msg");

  form.replaceWith(form.cloneNode(true));
  const newForm = document.getElementById("order-form");

  newForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const phone = newForm.phone.value.trim();
    const address = newForm.np.value.trim();
    const payment = newForm.payment.value;

    if (!phone || !address) {
      msg.textContent = "Будь ласка, заповніть усі поля!";
      msg.style.color = "red";
      return;
    }

    try {
      const order = {
        userId: user.id,
        items: cart,
        total: cart.reduce((sum, i) => sum + i.price * i.qty, 0),
        phone,
        address,
        paymentType: payment
      };

      const res = await fetch(`${API_BASE}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Помилка");

      msg.textContent = "✅ Замовлення успішно оформлено!";
      msg.style.color = "green";

      cart = [];
      saveCart();
      updateCartView();

      setTimeout(() => {
        checkoutForm.style.display = "none";
        cartModal.style.display = "none";
        msg.textContent = "";
        newForm.reset();
      }, 1000);

    } catch (err) {
      msg.textContent = "❌ Помилка оформлення: " + err.message;
      msg.style.color = "red";
    }
  });
});

// ---------------- АВТОРИЗАЦІЯ ---------------- //
registerBtn.addEventListener("click", openRegisterModal);
loginBtn.addEventListener("click", openLoginModal);
logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("user");
  user = null;
  updateAuthButtons();
});

function openRegisterModal() {
  authModal.style.display = "block";
  authContent.innerHTML = `
    <h2>Реєстрація</h2>
    <form id="register-form">
      <label>Ім'я: <input type="text" name="name" required></label>
      <label>Email: <input type="email" name="email" required></label>
      <label>Пароль: <input type="password" name="password" required minlength="6"></label>
      <button type="submit" class="btn">Зареєструватися</button>
    </form>
    <p id="auth-msg"></p>
  `;

  const form = document.getElementById("register-form");
  const msg = document.getElementById("auth-msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value.trim();

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Помилка сервера");
      }

      msg.textContent = "✅ Реєстрація успішна! Тепер увійдіть.";
      msg.style.color = "green";

      // Автоматично відкриваємо вхід після реєстрації через 1 сек
      setTimeout(() => openLoginModal(), 1000);

    } catch (err) {
      msg.textContent = err.message || "❌ Помилка реєстрації";
      msg.style.color = "red";
    }
  });
}

function openLoginModal(message = "") {
  authModal.style.display = "block";
  authContent.innerHTML = `
    <h2>Вхід</h2>
    ${message ? `<p>${message}</p>` : ""}
    <form id="login-form">
      <label>Email: <input type="email" name="email" required></label>
      <label>Пароль: <input type="password" name="password" required></label>
      <button type="submit" class="btn">Увійти</button>
    </form>
    <p id="auth-msg"></p>
  `;

  const form = document.getElementById("login-form");
  const msg = document.getElementById("auth-msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value.trim();

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Помилка сервера");
      }

      const data = await res.json();
      sessionStorage.setItem("user", JSON.stringify(data.user));
      user = data.user;
      updateAuthButtons();
      authModal.style.display = "none"; // Закриваємо модальне вікно
    } catch (err) {
      msg.textContent = err.message || "❌ Помилка входу";
      msg.style.color = "red";
    }
  });
}

function updateAuthButtons() {
  if (user) {
    loginBtn.style.display = "none";
    registerBtn.style.display = "none";
    logoutBtn.style.display = "inline";
  } else {
    loginBtn.style.display = "inline";
    registerBtn.style.display = "inline";
    logoutBtn.style.display = "none";
  }
}

function loadBlog() {
  catalogSection.style.display = "none";
  const content = document.getElementById("content");
  content.innerHTML = `
    <section class="blog">
      <div class="container">
        <h2>Наш блог</h2>
        <div class="blog-posts">
          <article><h3>Новинка меблів 2025</h3><p>Опис статті...</p></article>
          <article><h3>Як обрати диван</h3><p>Корисні поради...</p></article>
          <article><h3>Догляд за меблями</h3><p>Поради щодо збереження меблів...</p></article>
        </div>
      </div>
    </section>
  `;
}