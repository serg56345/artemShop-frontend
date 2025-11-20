// ---------------- СЛАЙДЕР ---------------- //
let slideIndex = 0;
const slidesContainer = document.querySelector(".slides");
const slides = document.querySelectorAll(".slide");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

function showSlide(index) {
  if (!slidesContainer) return;
  const total = slides.length;
  slideIndex = (index + total) % total;
  slidesContainer.style.transform = `translateX(-${slideIndex * 100}%)`;
}

if (prevBtn && nextBtn) {
  prevBtn.addEventListener("click", () => showSlide(slideIndex - 1));
  nextBtn.addEventListener("click", () => showSlide(slideIndex + 1));
  setInterval(() => showSlide(slideIndex + 1), 5000);
}

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
const API_BASE = window.API_BASE || "https://artemShop-backend.onrender.com/api";

// ---------------- НАВІГАЦІЯ ---------------- //
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    link.classList.add("active");

    const section = link.dataset.section;
    if (section === "catalog") showCatalog();
    else if (section === "blog") loadBlog();
    else if (section === "home") location.reload();
  });
});

// ---------------- КАТАЛОГ ---------------- //
function showCatalog() {
  catalogSection.style.display = "block";
  productGrid.innerHTML = "<p>Виберіть категорію меблів 👇</p>";

  document.querySelectorAll(".btn-cat").forEach(btn => {
    btn.addEventListener("click", async () => {
      const file = btn.dataset.file;
      try {
        const res = await fetch(`data/${file}`);
        const data = await res.json();
        renderProducts(data);
      } catch {
        productGrid.innerHTML = "<p>❌ Помилка завантаження каталогу</p>";
      }
    });
  });
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
registerBtn.addEventListener("click", () => openRegisterModal());
loginBtn.addEventListener("click", () => openLoginModal());
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

  // Заміна старого слухача
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Помилка");

      msg.textContent = "✅ Реєстрація успішна! Тепер увійдіть.";
      msg.style.color = "green";

      setTimeout(() => authModal.style.display = "none", 1000);

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

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Помилка");

      sessionStorage.setItem("user", JSON.stringify(data.user));
      user = data.user;
      updateAuthButtons();
      authModal.style.display = "none";

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

