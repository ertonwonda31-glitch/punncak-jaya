
// KONFIGURASI WEBSITE
const WA_NUMBER = "6281234567890"; // GANTI DENGAN NOMOR WHATSAPP PENGELOLA

// LOGIN DEMO - GANTI PASSWORD
const ADMIN_USER = "ulla";
const ADMIN_PASS = "admin123";

// PRODUK AWAL
const defaultProducts = [
  {
    id: 1,
    name: "Kopi Lokal",
    price: 50000,
    category: "Pertanian",
    image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600",
    description: "Contoh produk kopi lokal. Sesuaikan dengan produk sebenarnya."
  },
  {
    id: 2,
    name: "Sayuran Segar",
    price: 25000,
    category: "Pertanian",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600",
    description: "Contoh produk hasil pertanian lokal."
  },
  {
    id: 3,
    name: "Ubi Lokal",
    price: 30000,
    category: "Pertanian",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600",
    description: "Contoh produk pangan lokal."
  },
  {
    id: 4,
    name: "Kerajinan Lokal",
    price: 75000,
    category: "Kerajinan",
    image: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600",
    description: "Contoh kerajinan masyarakat."
  }
];

function getSaved(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

let products = getSaved("pj_products", defaultProducts);
let cart = getSaved("pj_cart", []);

function saveData() {
  localStorage.setItem("pj_products", JSON.stringify(products));
  localStorage.setItem("pj_cart", JSON.stringify(cart));
}

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

// TAMPILAN PRODUK
function renderProducts() {
  const list = document.getElementById("productList");
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const category = document.getElementById("categoryFilter").value;

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(keyword) &&
    (category === "Semua" || p.category === category)
  );

  list.innerHTML = filtered.length
    ? filtered.map(p => `
      <div class="product-card">
        <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}"
             onerror="this.src='https://placehold.co/600x400?text=Produk+Lokal'">
        <div class="product-info">
          <small>${escapeHTML(p.category)}</small>
          <h3>${escapeHTML(p.name)}</h3>
          <p>${escapeHTML(p.description)}</p>
          <div class="price">${rupiah(p.price)}</div>
          <button class="btn" onclick="addToCart(${p.id})">
            + Keranjang
          </button>
        </div>
      </div>
    `).join("")
    : "<p>Produk belum ditemukan.</p>";
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// KERANJANG
function addToCart(id) {
  const item = cart.find(p => p.id === id);

  if (item) {
    item.qty++;
  } else {
    cart.push({ id, qty: 1 });
  }

  saveData();
  updateCart();
  alert("Produk berhasil dimasukkan ke keranjang!");
}

function updateCart() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById("cartCount").textContent = count;

  const items = document.getElementById("cartItems");
  let total = 0;

  items.innerHTML = cart.map(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return "";

    const subtotal = product.price * item.qty;
    total += subtotal;

    return `
      <div class="cart-row">
        <span>${escapeHTML(product.name)} x ${item.qty}</span>
        <span>${rupiah(subtotal)}</span>
        <button class="delete-btn" onclick="removeCart(${item.id})">Hapus</button>
      </div>
    `;
  }).join("") || "<p>Keranjang masih kosong.</p>";

  document.getElementById("cartTotal").textContent =
    "Total: " + rupiah(total);
}

function removeCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveData();
  updateCart();
}

function openCart() {
  updateCart();
  showModal("cartModal");
}

// PEMESANAN
document.getElementById("orderForm").addEventListener("submit", function(e) {
  e.preventDefault();

  if (!cart.length) {
    alert("Keranjang masih kosong.");
    return;
  }

  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const address = document.getElementById("customerAddress").value.trim();
  const note = document.getElementById("customerNote").value.trim();

  let total = 0;
  let message = "HALO PRODUK PUNCAK JAYA, SAYA INGIN MEMESAN:%0A%0A";

  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return;

    const subtotal = product.price * item.qty;
    total += subtotal;
    message += `- ${encodeURIComponent(product.name)} x ${item.qty}: ${rupiah(subtotal)}%0A`;
  });

  const order = {
    id: Date.now(),
    name,
    phone,
    address,
    note,
    total,
    date: new Date().toLocaleString("id-ID"),
    items: cart.map(item => {
      const product = products.find(p => p.id === item.id);
      return {
        name: product?.name || "Produk",
        qty: item.qty
      };
    })
  };

  const orders = getSaved("pj_orders", []);
  orders.push(order);
  localStorage.setItem("pj_orders", JSON.stringify(orders));

  message += `%0ATotal: ${encodeURIComponent(rupiah(total))}`;
  message += `%0ANama: ${encodeURIComponent(name)}`;
  message += `%0ANomor: ${encodeURIComponent(phone)}`;
  message += `%0AAlamat: ${encodeURIComponent(address)}`;
  message += `%0ACatatan: ${encodeURIComponent(note)}`;

  const url = `https://wa.me/${WA_NUMBER}?text=${message}`;

  cart = [];
  saveData();
  updateCart();
  this.reset();
  closeModal("cartModal");

  window.open(url, "_blank");
});

// LOGIN ADMIN
function openAdmin() {
  showModal("adminLogin");
}

document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const username = document.getElementById("adminUsername").value;
  const password = document.getElementById("adminPassword").value;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    closeModal("adminLogin");
    renderAdmin();
    showModal("adminDashboard");
    this.reset();
    document.getElementById("loginMessage").textContent = "";
  } else {
    document.getElementById("loginMessage").textContent =
      "Username atau password salah!";
  }
});

// ADMIN TAMBAH PRODUK
document.getElementById("productForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("productName").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const image = document.getElementById("productImage").value.trim();
  const category = document.getElementById("productCategory").value;
  const description = document.getElementById("productDescription").value.trim();

  if (!name || !price || price < 1 || !description) {
    alert("Periksa kembali data produk.");
    return;
  }

  if (!/^https?:\/\//i.test(image)) {
    alert("Masukkan URL gambar yang valid.");
    return;
  }

  products.push({
    id: Date.now(),
    name,
    price,
    image,
    category,
    description
  });

  saveData();
  renderProducts();
  renderAdmin();
  this.reset();

  alert("Produk berhasil ditambahkan!");
});

function renderAdmin() {
  document.getElementById("adminProducts").innerHTML =
    products.map(p => `
      <div class="admin-row">
        <span>${escapeHTML(p.name)} - ${rupiah(p.price)}</span>
        <button class="delete-btn" onclick="deleteProduct(${p.id})">Hapus</button>
      </div>
    `).join("") || "Belum ada produk.";

  const orders = getSaved("pj_orders", []);

  document.getElementById("adminOrders").innerHTML =
    orders.slice().reverse().map(order => `
      <div class="info-card">
        <b>Pesanan #${order.id}</b>
        <p>Nama: ${escapeHTML(order.name)}</p>
        <p>Telepon: ${escapeHTML(order.phone)}</p>
        <p>Alamat: ${escapeHTML(order.address)}</p>
        <p>Produk: ${order.items.map(i =>
          escapeHTML(i.name) + " x " + i.qty
        ).join(", ")}</p>
        <b>${rupiah(order.total)}</b>
        <p>${escapeHTML(order.date)}</p>
      </div>
    `).join("") || "Belum ada pesanan.";

}

function deleteProduct(id) {
  if (!confirm("Apakah Anda yakin menghapus produk ini?")) return;

  products = products.filter(p => p.id !== id);
  cart = cart.filter(p => p.id !== id);

  saveData();
  renderProducts();
  renderAdmin();
}

function logoutAdmin() {
  closeModal("adminDashboard");
}

// KONTROL MODAL
function showModal(id) {
  document.getElementById(id).style.display = "block";
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

function toggleMenu() {
  document.getElementById("navMenu").classList.toggle("active");
}

// LINK KONTAK
document.getElementById("contactLink").href =
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Halo, saya ingin mengetahui informasi produk lokal Puncak Jaya.")}`;

// JALANKAN WEBSITE
renderProducts();
updateCart();

