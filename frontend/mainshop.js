let listProducts = [];
let allProducts = [];
let carts = [];

const body = document.body;
const jsonFile = 'mainshop-products.json';

const listProductHTML = document.querySelector('.listProduct');
const listCartHTML = document.querySelector('.listCart');
const iconCart = document.querySelector('.icon-cart');
const iconCartSpan = document.querySelector('.icon-cart span');
const closeCart = document.querySelector('.close');
const searchInput = document.getElementById('myinput') ||
document.getElementById('homepageSearchInput');
const micBtn = document.getElementById('micBtn');

// ⏳ Preloader
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  const content = document.getElementById('content');
  preloader.style.transition = 'opacity 0.5s ease';
  preloader.style.opacity = '0';
  setTimeout(() => {
    preloader.style.display = 'none';
    content.style.display = 'block';
  }, 500);
});

// 📦 Load all products from multiple JSONs
const loadAllProducts = async () => {
  const filesWithCategories = [
    { file: 'vegetable-products.json', category: 'Vegetables' },
    { file: 'chicken-products.json', category: 'Chicken / Meat' },
    { file: 'dogfood&tissues-products.json', category: 'Dog & Households' },
    { file: 'mainshop-products.json', category: 'Uncategorized' } // fallback or legacy
  ];

  let combined = [];

  for (const { file, category } of filesWithCategories) {
    try {
      const res = await fetch(file);
      const data = await res.json();

      // Add category to each product dynamically
      const categorized = data.map(p => ({ ...p, category }));
      combined = combined.concat(categorized);
    } catch (err) {
      console.error(`Error loading ${file}`, err);
    }
  }

  allProducts = combined;
};


// 🧼 Deduplicate cart by product name
const deduplicateCart = () => {
  const seen = new Map();
  carts.forEach(item => {
    const product = allProducts.find(p => p.id === item.product_id);
    if (!product) return;
    const key = product.name.toLowerCase();
    if (seen.has(key)) {
      seen.get(key).quantity += item.quantity;
    } else {
      seen.set(key, { ...item });
    }
  });
  carts = Array.from(seen.values());
  saveCart();
};

// 🛒 Add to cart (name-based matching)
const addToCart = (product_id) => {
  const product = allProducts.find(p => p.id === product_id);
  if (!product) return;

  const existingIndex = carts.findIndex(item => {
    const existingProduct = allProducts.find(p => p.id === item.product_id);
    return existingProduct && existingProduct.name.toLowerCase() === product.name.toLowerCase();
  });

  if (existingIndex === -1) {
    carts.push({ product_id: product.id, quantity: 1 });
  } else {
    carts[existingIndex].quantity += 1;
  }

  saveCart();
  renderCart();
  speak(`${product.name} added to cart`);
};

// ❌ Remove by name
const removeItemByName = (name) => {
  const index = carts.findIndex(item => {
    const prod = allProducts.find(p => p.id === item.product_id);
    return prod && prod.name.toLowerCase().includes(name);
  });

  if (index !== -1) {
    const removed = allProducts.find(p => p.id === carts[index].product_id);
    carts.splice(index, 1);
    saveCart();
    renderCart();
    speak(`${removed.name} removed from cart`);
  } else {
    speak(`No item called ${name} found in cart`);
  }
};

// 💾 Save cart to localStorage
const saveCart = () => {
  localStorage.setItem('cart', JSON.stringify(carts));
};

// 🧾 Render cart UI
const renderCart = () => {
  if (!listCartHTML || !iconCartSpan) return;

  listCartHTML.innerHTML = '';
  let totalQuantity = 0;
  let grandTotal = 0;

  const fullItems = carts
    .map(cart => {
      const product = allProducts.find(p => p.id === cart.product_id);
      return product ? { ...cart, product } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.product.name.localeCompare(b.product.name));

  fullItems.forEach(({ product, quantity }) => {
    const totalPrice = product.price * quantity;
    totalQuantity += quantity;
    grandTotal += totalPrice;

    const item = document.createElement('div');
    item.classList.add('item');
    item.dataset.id = product.id;
    item.innerHTML = `
      <div class="image"><img src="${product.image}" alt="${product.name}"></div>
      <div class="name">${product.name}</div>
      <div class="totalPrice">R${totalPrice}</div>
      <div class="quantity">
        <span class="minus"> < </span>
        <span>${quantity}</span>
        <span class="plus"> > </span>
      </div>
    `;
    listCartHTML.appendChild(item);
  });

  iconCartSpan.innerText = totalQuantity;

  const totalDiv = document.querySelector('.cart-grandtotal');
  if (totalDiv) {
    totalDiv.innerHTML = `
      <hr/>
      <div class="totalRow">
        <strong>Total:</strong>
        <span>R${grandTotal}</span>
      </div>
    `;
  }

  console.log(`🛒 Cart updated: ${totalQuantity} item(s), Total: R${grandTotal}`);
};

const categorySections = {
  "Vegetables": document.getElementById("section-Vegetables"),
  "Chicken / Eggs": document.getElementById("section-Chicken"),
  "Dog & Households": document.getElementById("section-DogHousehold"),
  "Feeds": document.getElementById("section-Feeds"),
  "Maize": document.getElementById("section-Maize")
};

// 🔍 Render filtered products
const renderProducts = (filter = '') => {
  listProductHTML.innerHTML = '';

  const filtered = filter
    ? listProducts.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))
    : listProducts;

if (filtered.length === 0) {
  Object.values(categorySections).forEach(section => {
    if (section) {
      section.innerHTML = '<p>No products found.</p>';
    }
  });
  return;
}

  filtered.forEach(product => {
    const item = document.createElement('div');
    item.classList.add('item');
    item.dataset.id = product.id;
    item.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h2>${product.name}</h2>
      <hr/>
      <div class="price">R${product.price}</div>
      <button class="addCart">Add to Cart</button>
    `;
    listProductHTML.appendChild(item);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  // Load the modal HTML dynamically
  fetch("newsletter-modal.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("modalContainer").innerHTML = html;
      setupNewsletterModal();
    })
    .catch(err => console.error("Modal failed to load:", err));
});

function setupNewsletterModal() {
  const modal = document.getElementById("newsletterModal");
  const closeBtn = modal.querySelector(".close");
  const form = modal.querySelector("#newsletterForm");
  const thankYou = modal.querySelector("#thankYouMessage");
  const existsMsg = modal.querySelector("#existsMessage");

  // Handle ALL .subscribeBtn buttons across page
  document.querySelectorAll(".subscribeBtn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      modal.classList.add("show");
    });
  });

  closeBtn.addEventListener("click", () => modal.classList.remove("show"));
  window.addEventListener("click", e => {
    if (e.target === modal) modal.classList.remove("show");
  });

  const getSubs = () => JSON.parse(localStorage.getItem("subscribers") || "[]");
  const saveSubs = subs => localStorage.setItem("subscribers", JSON.stringify(subs));

  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = form.subscriberName.value.trim();
    const email = form.subscriberEmail.value.trim().toLowerCase();
    const subs = getSubs();

    thankYou.style.display = "none";
    existsMsg.style.display = "none";

    if (subs.includes(email)) {
      existsMsg.style.display = "block";
      return;
    }

    subs.push(email);
    saveSubs(subs);

    form.style.display = "none";
    thankYou.style.display = "block";

    setTimeout(() => {
      modal.classList.remove("show");
      thankYou.style.display = "none";
      form.style.display = "block";
      form.reset();
    }, 3000);
  });
}

// 🚀 App initialization
const initApp = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search') || '';

  try {
    const res = await fetch(jsonFile);
    listProducts = await res.json();
    if (searchInput) searchInput.value = searchQuery;
   renderProductsByCategory(searchQuery);
  } catch (err) {
    listProductHTML.innerHTML = '<p>Error loading products</p>';
  }

  await loadAllProducts();

  const storedCart = localStorage.getItem('cart');
  if (storedCart) {
    carts = JSON.parse(storedCart);
    deduplicateCart();
    renderCart();
  }

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('addCart')) {
    const product_id = e.target.closest('.item')?.dataset?.id;
    if (product_id) addToCart(product_id);
  }
});
};

// ➕➖ Quantity adjust
listCartHTML.addEventListener('click', (e) => {
  const product_id = e.target.closest('.item')?.dataset?.id;
  if (!product_id) return;

  const index = carts.findIndex(c => c.product_id === product_id);
  if (index === -1) return;

  if (e.target.classList.contains('plus')) {
    carts[index].quantity += 1;
  } else if (e.target.classList.contains('minus')) {
    carts[index].quantity -= 1;
    if (carts[index].quantity <= 0) carts.splice(index, 1);
  }

  saveCart();
  renderCart();
});

// Example categories and keywords. You can adjust these
const categories = [
  { name: "Vegetables", keywords: [ "beetroot", "butternut", "cabbage", "carrot", "cucumbe", "green beans", "onions", "potato", "pumpkin", "tomato", "yellow", "peppers", "lettuce", "sweet potato" ] },
 { name: "Chicken / Eggs", keywords: ["broiler", "hard body", "red star", "eggs", "intestines"] },
  { name: "Feeds", keywords: ["feed", "lays mash", "finisher", "starter"] },
  { name: "Dog & Households", keywords: ["dogmor", "dog food", "tissues", "dogmores"] },
  { name: "Maize", keywords: ["maize"] }
];

// Render products into category sections
const renderProductsByCategory = (filter = '') => {

  // Clear all category sections
  Object.values(categorySections).forEach(section => {
    if (section) section.innerHTML = '';
  });

  // Filter products (if search term)
  const filtered = filter
    ? listProducts.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))
    : listProducts;

  if (filtered.length === 0) {
    // Optionally show a message in one of the sections
    const firstSection = categorySections["Vegetables"] || categorySections["Chicken / Meat"];
    if (firstSection) firstSection.innerHTML = '<p>No products found.</p>';
    return;
  }

  // Sort and place each product into a category
  filtered.forEach(product => {
    const name = product.name.toLowerCase();
    let added = false;

    for (const category of categories) {
      if (category.name === "Everything") continue; // Skip "Everything"

      const match = category.keywords.some(keyword => name.includes(keyword));
      if (match && categorySections[category.name]) {
        const item = createProductElement(product);
        categorySections[category.name].appendChild(item);
        added = true;
        break;
      }
    }

    // If not matched, don't display (or optionally log)
    if (!added) {
      console.warn(`Product "${product.name}" not categorized`);
    }
  });
};

// 🔧 Helper function to create a product element
function createProductElement(product) {
  const item = document.createElement('div');
  item.classList.add('item');
  item.dataset.id = product.id;
  item.innerHTML = `
    <img src="${product.image}" alt="${product.name}">
    <h2>${product.name}</h2>
    <hr/>
    <div class="price">R${product.price}</div>
    <button class="addCart">Add to Cart</button>
  `;
  return item;
}

// 🛍️ Cart icon toggle
iconCart?.addEventListener('click', () => {
  if (window.innerWidth <= 800) {
    window.location.href = 'cartPage.html';
  } else {
    body.classList.toggle('showCart');
  }
});
closeCart?.addEventListener('click', () => {
  body.classList.remove('showCart');
});

// 🔄 Sync cart icon across tabs/pages
window.addEventListener('storage', (event) => {
  if (event.key === 'cart') {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      carts = JSON.parse(storedCart);
      renderCart();
    }
  }
});

// 🔍 Live search typing
searchInput?.addEventListener('keyup', () => {
  const value = searchInput.value.trim();
  renderProductsByCategory(value);
});

// 🔄 Run App
document.addEventListener('DOMContentLoaded', initApp);

// 🎤 Voice input (Speech Recognition)
if ('webkitSpeechRecognition' in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  micBtn?.addEventListener('click', () => {
    recognition.start();
    micBtn.disabled = true;
    micBtn.classList.add('listening');
    micBtn.innerText = '🎙️ Listening...';
  });

// When speech recognition stops
recognition.addEventListener('end', () => {
    micBtn.disabled = false;
    micBtn.classList.remove('listening');
    micBtn.innerText = '🎙️ Start';
});

  recognition.onresult = (event) => {
    const spoken = event.results[0][0].transcript.toLowerCase().trim();
    micBtn.disabled = false;
    micBtn.innerText = '🎤';

    if (spoken.startsWith('add ')) {
      const productName = spoken.replace('add ', '').replace('to cart', '').trim();
      const match = allProducts.find(p => p.name.toLowerCase().includes(productName));
      if (match) {
        addToCart(match.id);
        speak(`${match.name} added to cart`);
      } else {
        speak(`Could not find ${productName}`);
      }
      return;
    }

    if (spoken.startsWith('remove ')) {
      const name = spoken.replace('remove ', '').trim();
      removeItemByName(name);
      return;
    }

    if (spoken.includes('check out')) {
      speak("Going to checkout");
      setTimeout(() => window.location.assign('cartPage.html'), 1000);
      return;
    }

    if (spoken.includes('show cart')) {
      document.body.classList.add('showCart');
      speak("Showing cart");
      return;
    }

    if (spoken.includes('close cart')) {
      document.body.classList.remove('showCart');
      speak("Closing cart");
      return;
    }

    // Default: Treat spoken words as a search
if (searchInput) {
  searchInput.value = spoken;
  const event = new Event('keyup');
  searchInput.dispatchEvent(event);
  speak(`Searching for ${spoken}`);
    }
  };

  recognition.onerror = (e) => {
    console.error('Voice error:', e);
    micBtn.disabled = false;
    micBtn.innerText = '🎤';
  };

  recognition.onend = () => {
    micBtn.disabled = false;
    micBtn.innerText = '🎤';
  };
}

// Handles dropdown click for ALL screen sizes
document.querySelectorAll(".dropdown .dropbtn").forEach(btn => {
  btn.addEventListener("click", function(e) {

    // Stop navigation
    e.preventDefault();
    e.stopPropagation();

    const dropdown = this.parentElement;

    // Close other open dropdowns
    document.querySelectorAll(".dropdown.open").forEach(d => {
      if (d !== dropdown) d.classList.remove("open");
    });

    // Toggle current dropdown
    dropdown.classList.toggle("open");
  });
});

// Close dropdown when clicking outside
document.addEventListener("click", function() {
  document.querySelectorAll(".dropdown.open").forEach(d => d.classList.remove("open"));
});

function toggleMenu() {
  const nav = document.getElementById('myTopnav');  // or whatever element is your nav
  if (nav) {
    nav.classList.toggle('responsive');
  }
}

 let lastScrollTop = 0;
  const locator = document.querySelector('.locator');

  window.addEventListener('scroll', function () {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop) {
      // Scrolling down
      locator.style.transform = 'translateY(-200%)'; // hide
    } else {
      // Scrolling up
      locator.style.transform = 'translateY(0)'; // show
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }, false);

// 🔘 Navigation Dropdowns
function myFunction() {
    const x = document.getElementById("myTopnav");
    x.className = x.className === "topnav" ? "topnav responsive" : "topnav";
}

function information() {
    const x = document.getElementById("Informationdropdown");
    x.className = x.className === "informationdropdown" ? "informationdropdown responsive" : "informationdropdown";
}

function myAcount() {
    const x = document.getElementById("myaccountdropdown");
    x.className = x.className === "myaccountdropdown" ? "myaccountdropdown responsive" : "myaccountdropdown";
}

// Toggle dropdowns
function toggleDropdown(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("responsive");
}

// ⭐ AUTO-CLOSE NAV + DROPDOWN ON SCROLL
window.addEventListener("scroll", () => {
    const topnav = document.getElementById("myTopnav");
    const dropdown = document.querySelector(".dropdown");

    // Close hamburger
    if (topnav && topnav.classList.contains("responsive")) {
        topnav.classList.remove("responsive");
    }

    // Close dropdown
    if (dropdown && dropdown.classList.contains("open")) {
        dropdown.classList.remove("open");
    }
});

// ⭐ AUTO-CLOSE DROPDOWN WHEN HAMBURGER OPENS
const topnav = document.getElementById("myTopnav");
const dropdownBtn = document.querySelector(".dropdown .dropbtn");
const dropdownBox = document.querySelector(".dropdown");

function closeHamburger() {
    if (topnav.classList.contains("responsive")) {
        topnav.classList.remove("responsive");
    }
}

function closeDropdown() {
    if (dropdownBox.classList.contains("open")) {
        dropdownBox.classList.remove("open");
    }
}

// When YOU OPEN the dropdown → close hamburger
dropdownBtn?.addEventListener("click", () => {
    // dropdown toggling happens in your existing code
    // So just close hamburger AFTER toggle
    setTimeout(() => {
        if (dropdownBox.classList.contains("open")) {
            closeHamburger();
        }
    }, 50);
});

// When YOU OPEN hamburger → close dropdown
function myFunction() {
    topnav.classList.toggle("responsive");

    // If hamburger just opened, close dropdown
    if (topnav.classList.contains("responsive")) {
        closeDropdown();
    }
}

document.addEventListener("DOMContentLoaded", () => {
  // Load the modal HTML dynamically
  fetch("newsletter-modal.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("modalContainer").innerHTML = html;
      setupNewsletterModal();
    })
    .catch(err => console.error("Modal failed to load:", err));
});

function setupNewsletterModal() {
  const modal = document.getElementById("newsletterModal");
  const closeBtn = modal.querySelector(".close");
  const form = modal.querySelector("#newsletterForm");
  const thankYou = modal.querySelector("#thankYouMessage");
  const existsMsg = modal.querySelector("#existsMessage");

  // Handle ALL .subscribeBtn buttons across page
  document.querySelectorAll(".subscribeBtn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      modal.classList.add("show");
    });
  });

  closeBtn.addEventListener("click", () => modal.classList.remove("show"));
  window.addEventListener("click", e => {
    if (e.target === modal) modal.classList.remove("show");
  });

  const getSubs = () => JSON.parse(localStorage.getItem("subscribers") || "[]");
  const saveSubs = subs => localStorage.setItem("subscribers", JSON.stringify(subs));

  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = form.subscriberName.value.trim();
    const email = form.subscriberEmail.value.trim().toLowerCase();
    const subs = getSubs();

    thankYou.style.display = "none";
    existsMsg.style.display = "none";

    if (subs.includes(email)) {
      existsMsg.style.display = "block";
      return;
    }

    subs.push(email);
    saveSubs(subs);

    form.style.display = "none";
    thankYou.style.display = "block";

    setTimeout(() => {
      modal.classList.remove("show");
      thankYou.style.display = "none";
      form.style.display = "block";
      form.reset();
    }, 3000);
  });
}


