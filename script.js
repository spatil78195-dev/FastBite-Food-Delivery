/* ------------------------------
   Mobile navigation toggle
------------------------------ */
const navToggle = document.getElementById("nav-toggle");
const nav = document.getElementById("nav");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
  });

  // Close nav when clicking a link (on small screens)
  nav.addEventListener("click", (e) => {
    if (e.target.matches("a")) {
      document.body.classList.remove("nav-open");
    }
  });
}

/* ------------------------------
   Smooth scroll to services
------------------------------ */
const scrollToServices = document.getElementById("scroll-to-services");
if (scrollToServices) {
  scrollToServices.addEventListener("click", () => {
    const section = document.getElementById("services");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  });
}

/* ------------------------------
   Menu filter logic
------------------------------ */
const filterButtons = document.querySelectorAll(".filter-btn");
const menuItems = document.querySelectorAll(".menu-item");

if (filterButtons.length && menuItems.length) {
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;

      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      menuItems.forEach((item) => {
        const category = item.dataset.category;
        const show = filter === "all" || category === filter;
        item.style.display = show ? "" : "none";
      });
    });
  });
}

/* ------------------------------
   Contact Form Toast Message
------------------------------ */
const contactForm = document.getElementById("contact-form");
const toast = document.getElementById("toast");

if (contactForm && toast) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(contactForm);
    const payload = {
      name: (formData.get("name") || "").toString().trim(),
      email: (formData.get("email") || "").toString().trim(),
      subject: (formData.get("subject") || "").toString().trim(),
      message: (formData.get("message") || "").toString().trim(),
    };

    const token = localStorage.getItem("fastbite-token") || "";
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    };

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || (Array.isArray(data.errors) && data.errors[0] && data.errors[0].msg) || "Failed to send message";
        toast.textContent = msg;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2500);
        return;
      }
      toast.textContent = "Thank you! Your message has been received.";
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2500);
      contactForm.reset();
    } catch (_) {
      toast.textContent = "Network error. Please try again.";
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2500);
    }
  });
}

/* ------------------------------
   CART LOGIC (Shared across pages)
------------------------------ */
const CART_KEY = "fastbite-cart";

function loadCart() {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

let cart = loadCart();
const cartCountEl = document.getElementById("cart-count");
const cartToast = document.getElementById("cart-toast");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const cartEmptyEl = document.getElementById("cart-empty");
const checkoutBtn = document.getElementById("checkout-btn");
const orderForm = document.getElementById("order-form");
const orderConfirm = document.getElementById("order-confirm");

function getCartCount() {
  return cart.reduce((sum, item) => sum + (item.qty || 1), 0);
}

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // ignore errors
  }
}

function updateCartCount() {
  if (!cartCountEl) return;
  cartCountEl.textContent = getCartCount();
}

function showCartToast(message) {
  if (!cartToast) return;
  cartToast.textContent = message;
  cartToast.classList.add("show");
  setTimeout(() => cartToast.classList.remove("show"), 2000);
}

function addItemToCart(name, price) {
  const existing = cart.find((item) => item.name === name);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  saveCart();
  updateCartCount();
  showCartToast(`${name} added to cart.`);
}

const formatINR = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

function renderCartPage() {
  if (!cartItemsContainer || !cartTotalEl || !cartEmptyEl) return;

  cartItemsContainer.innerHTML = "";

  if (!cart.length) {
    cartEmptyEl.style.display = "block";
    cartTotalEl.textContent = formatINR(0);
    return;
  }

  cartEmptyEl.style.display = "none";
  let total = 0;

  cart.forEach((item, index) => {
    const qty = item.qty || 1;
    const lineTotal = (item.price || 0) * qty;
    total += lineTotal;

    const li = document.createElement("li");
    li.innerHTML = `
      <div class="cart-item-main">
        <span>${item.name}</span>
        <span>Quantity: ${qty}</span>
        <span>${formatINR(lineTotal)}</span>
      </div>
      <button class="cart-remove" data-index="${index}">Remove</button>
    `;

    cartItemsContainer.appendChild(li);
  });

  cartTotalEl.textContent = formatINR(total);

  const removeButtons = cartItemsContainer.querySelectorAll(".cart-remove");
  removeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.index || "-1", 10);
      if (index >= 0 && index < cart.length) {
        cart.splice(index, 1);
        saveCart();
        updateCartCount();
        renderCartPage();
      }
    });
  });
}

/* Attach add-to-cart buttons */
const addToCartButtons = document.querySelectorAll(".add-to-cart");
if (addToCartButtons.length) {
  addToCartButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      const price = parseFloat(btn.dataset.price || "0");
      if (!name) return;
      addItemToCart(name, price);
    });
  });
}

/* Hero Order Now Auto-Add Combo */
const heroOrderBtn = document.querySelector(".hero .btn-primary");
if (heroOrderBtn) {
  heroOrderBtn.addEventListener("click", (e) => {
    e.preventDefault();
    addItemToCart("Chef's Special Combo", 14.99);
    const href = heroOrderBtn.getAttribute("href");
    if (href) window.location.href = href;
  });
}

/* Initialize cart on load */
updateCartCount();
renderCartPage();

/* ------------------------------
   Checkout Button
------------------------------ */
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", async () => {
    if (!cart.length) {
      showCartToast("Your cart is empty.");
      return;
    }

    if (orderForm) {
      const formData = new FormData(orderForm);
      const name = formData.get("name")?.toString().trim();
      const phone = formData.get("phone")?.toString().trim();
      const address = formData.get("address")?.toString().trim();
      const payment = formData.get("payment")?.toString().trim();

      if (!name || !phone || !address || !payment) {
        showCartToast("Please fill in your delivery details.");
        return;
      }
    }

    const token = localStorage.getItem("fastbite-token") || "";
    if (!token) {
      showCartToast("Please sign in to place your order.");
      window.location.href = "auth.html";
      return;
    }

    const items = cart.map((item) => ({
      name: item.name,
      quantity: item.qty || 1,
      price: Number(item.price || 0),
    }));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ items }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || (Array.isArray(data.errors) && data.errors[0] && data.errors[0].msg) || "Failed to place order";
        showCartToast(msg);
        return;
      }

      cart = [];
      saveCart();
      updateCartCount();
      renderCartPage();
      if (orderConfirm) orderConfirm.classList.remove("hidden");
      showCartToast("Order placed successfully!");
    } catch (_) {
      showCartToast("Network error. Please try again.");
    }
  });
}

/* ------------------------------
   AUTH SYSTEM (Sign In / Sign Up)
------------------------------ */
const authTabs = document.querySelectorAll(".auth-tab");
const authPanels = document.querySelectorAll(".auth-form");
const signinForm = document.getElementById("signin-form");
const signupForm = document.getElementById("signup-form");
const authToast = document.getElementById("auth-toast");

if (authTabs.length && authPanels.length) {
  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.authTab;

      authTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      authPanels.forEach((panel) => {
        panel.classList.toggle("hidden", panel.dataset.authPanel !== target);
      });
    });
  });
}

function showAuthToast(message) {
  if (!authToast) return;
  authToast.textContent = message;
  authToast.classList.add("show");
  setTimeout(() => authToast.classList.remove("show"), 2500);
}

if (signinForm) {
  signinForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(signinForm);
    const payload = {
      email: (formData.get("email") || "").toString().trim(),
      password: (formData.get("password") || "").toString().trim(),
    };

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || (Array.isArray(data.errors) && data.errors[0] && data.errors[0].msg) || "Login failed";
        showAuthToast(msg);
        return;
      }
      if (data && data.token) {
        try { localStorage.setItem("fastbite-token", data.token); } catch {}
      }
      showAuthToast("Signed in successfully.");
      setTimeout(() => { window.location.href = "index.html"; }, 500);
    } catch (_) {
      showAuthToast("Network error. Please try again.");
    }
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = signupForm.querySelector('input[name="password"]');
    const confirm = signupForm.querySelector('input[name="confirmPassword"]');

    if (password && confirm && password.value !== confirm.value) {
      showAuthToast("Passwords do not match.");
      return;
    }

    const formData = new FormData(signupForm);
    const payload = {
      name: (formData.get("name") || "").toString().trim(),
      email: (formData.get("email") || "").toString().trim(),
      password: (formData.get("password") || "").toString().trim(),
    };

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || (Array.isArray(data.errors) && data.errors[0] && data.errors[0].msg) || "Sign up failed";
        showAuthToast(msg);
        return;
      }
      if (data && data.token) {
        try { localStorage.setItem("fastbite-token", data.token); } catch {}
      }
      showAuthToast("Account created.");
      setTimeout(() => { window.location.href = "index.html"; }, 500);
    } catch (_) {
      showAuthToast("Network error. Please try again.");
    }
  });
}
