// 🛒 Global Variables
let listProducts = [];
let allProducts = [];
let carts = [];

// 📦 DOM Elements
const iconCart = document.querySelector('.icon-cart');
const iconCartSpan = document.querySelector('.icon-cart span');
const closeCart = document.querySelector('.close');
const body = document.querySelector('body');
const listCartHTML = document.querySelector('.listCart');
const micBtn = document.getElementById('micBtn');
const searchInput = document.getElementById('homepageSearchInput');

// 🔍 Search Form Handler
document.getElementById('homepageSearchForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const searchValue = searchInput?.value.trim();
    if (searchValue) {
        window.location.href = `mainshop.html?search=${encodeURIComponent(searchValue)}`;
    }
});

// 📁 Product Files
const productFiles = [
    'mainshop-products.json',
    'vegetable-products.json',
    'chicken-products.json',
    'dogfood&tissues-products.json'
];

// 🚀 Load all products
const loadAllProducts = async () => {
    let combined = [];
    for (const file of productFiles) {
        try {
            const res = await fetch(file);
            const data = await res.json();
            combined = combined.concat(data);
        } catch (error) {
            console.error(`❌ Failed to load ${file}`, error);
        }
    }
    allProducts = combined;
};

// 🧠 Load page-specific products
const loadPageProducts = async (file) => {
    try {
        const res = await fetch(file);
        listProducts = await res.json();
    } catch (err) {
        console.error("❌ Failed to load page products:", err);
    }
};

// 💾 Save cart to localStorage
const addCartToMemory = () => {
    localStorage.setItem('cart', JSON.stringify(carts));
};

// 🖼️ Render Cart HTML
const addCartToHTML = () => {
    if (!iconCartSpan) return;

    let totalQuantity = 0;
    let grandTotal = 0;
    listCartHTML.innerHTML = '';

    const fullCartItems = carts.map(cart => {
        const product = allProducts.find(p => p.id === cart.product_id);
        return product ? { ...cart, product } : null;
    }).filter(Boolean);

    fullCartItems.sort((a, b) => a.product.name.localeCompare(b.product.name));

    fullCartItems.forEach(cart => {
        const { product, quantity } = cart;
        const totalPrice = product.price * quantity;
        totalQuantity += quantity;
        grandTotal += totalPrice;

        const item = document.createElement('div');
        item.className = 'item';
        item.dataset.id = cart.product_id;
        item.innerHTML = `
            <div class="image"><img src="${product.image}" alt=""></div>
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

    const grandTotalDiv = document.querySelector('.cart-grandtotal');
    if (grandTotalDiv) {
        grandTotalDiv.innerHTML = `
            <hr/>
            <div class="totalRow">
                <strong>Total:</strong>
                <span>R${grandTotal}</span>
            </div>
        `;
    }
};

// ➕➖ Modify Quantity
const changeQuantity = (product_id, type) => {
    const index = carts.findIndex(item => item.product_id === product_id);
    if (index >= 0) {
        if (type === 'plus') {
            carts[index].quantity += 1;
        } else if (type === 'minus') {
            carts[index].quantity -= 1;
            if (carts[index].quantity <= 0) {
                carts.splice(index, 1);
            }
        }
        addCartToMemory();
        addCartToHTML();
    }
};

// 🛒 Add to Cart
function addToCart(product_id) {
    const index = carts.findIndex(item => item.product_id === product_id);
    if (index !== -1) {
        carts[index].quantity += 1;
    } else {
        carts.push({ product_id, quantity: 1 });
    }
    addCartToMemory();
    addCartToHTML();
}

// ❌ Clear Cart
function clearCart() {
    carts = [];
    addCartToMemory();
    addCartToHTML();
    speak("Cart cleared");
}

// 🎤 Speak
function speak(text) {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    synth.speak(utter);
}

// 🖱️ Quantity Click Handler
document.addEventListener('click', (e) => {
    const item = e.target.closest('.listCart .item');
    const product_id = item?.dataset?.id;
    if (!product_id) return;

    if (e.target.classList.contains('minus')) {
        changeQuantity(product_id, 'minus');
    } else if (e.target.classList.contains('plus')) {
        changeQuantity(product_id, 'plus');
    }
});

// 🛒 Cart Icon Click (Responsive)
iconCart?.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.innerWidth <= 800) {
        window.location.href = 'cartPage.html';
    } else {
        body.classList.toggle('showCart');
    }
});

// ❌ Close Cart Sidebar
closeCart?.addEventListener('click', () => {
    body.classList.remove('showCart');
});

// 🔄 Cart Sync Across Tabs
window.addEventListener('storage', (event) => {
    if (event.key === 'cart') {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            carts = JSON.parse(storedCart);
            addCartToHTML();
        }
    }
});

// 🚀 Init App
const initApp = async () => {
    await loadAllProducts();
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        carts = JSON.parse(storedCart);
    }
    addCartToHTML();
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// 🗣️ Read My Cart (Voice)
function readMyCart() {
    // Ensure cart & products are loaded
    if (!Array.isArray(carts) || carts.length === 0) {
        speak("Your cart is empty");
        return;
    }

    let message = "You have ";
    let total = 0;

    carts.forEach((item, index) => {
        const product = allProducts.find(p => p.id === item.product_id);
        if (!product) return;

        const itemTotal = product.price * item.quantity;
        total += itemTotal;

        message += `${item.quantity} ${product.name}`;

        if (index < carts.length - 1) {
            message += ", ";
        }
    });

    message += `. Your total is ${total.toFixed(2)} rand.`;

    speak(message);
}

// 🎤 Voice Recognition
if ('webkitSpeechRecognition' in window && micBtn) {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    micBtn.addEventListener('click', () => {
    recognition.start();
    micBtn.disabled = true;
    micBtn.innerHTML = '🎙️ <span class="listening-text">Listening...</span>';
        });

    recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript.toLowerCase().trim();
        micBtn.disabled = false;
        micBtn.innerText = '🎤';

        if (spoken.includes('check out') || spoken.includes('checkout')) {
            speak("Going to checkout");
            setTimeout(() => window.location.assign('cartPage.html'), 1000);
        } else if (spoken.includes('show cart')) {
            document.body.classList.add('showCart');
            speak("Showing cart");
        } else if (spoken.includes('close cart')) {
            document.body.classList.remove('showCart');
            speak("Closing cart");
         } else if (
             spoken.includes('read my card') ||
             spoken.includes("what's in my cart") ||
             spoken.includes('what is in my cart')
         ){
         readMyCart();
            
        } else if (spoken.startsWith('add ')) {
            const name = spoken.replace('add ', '').replace('to cart', '').trim();
            const match = allProducts.find(p => p.name.toLowerCase().includes(name));
            if (match) {
                addToCart(match.id);
                speak(`Added ${match.name} to cart`);
            } else {
                speak(`Couldn't find ${name}`);
            }
        } else if (spoken.includes('clear cart')) {
            clearCart();
        } else {
            // Default: Search
            searchInput.value = spoken;
            speak(`Searching for ${spoken}`);
            setTimeout(() => {
                window.location.href = `mainshop.html?search=${encodeURIComponent(spoken)}`;
            }, 1000);
        }
    };

    recognition.onerror = () => {
        micBtn.disabled = false;
        micBtn.innerText = '🎤';
        speak("Voice recognition error");
    };

    recognition.onend = () => {
        micBtn.disabled = false;
        micBtn.innerText = '🎤';
    };
} else {
    console.warn("Voice recognition not supported.");
}

function removeItemByName(name) {
  // Make sure cart and product data are loaded
  if (!Array.isArray(carts) || !Array.isArray(allProducts)) return;

  // Find the cart item that matches by product name (case-insensitive)
  const index = carts.findIndex(item => {
    const product = allProducts.find(p => p.id === item.product_id);
    return product && product.name.toLowerCase().includes(name.toLowerCase());
  });

  // If found, remove it and update UI + storage
  if (index !== -1) {
    const removedProduct = allProducts.find(p => p.id === carts[index].product_id);
    carts.splice(index, 1);
    addCartToMemory();   // Save to localStorage
    addCartToHTML();     // Update cart view
    if (typeof speak === 'function') {
      speak(`${removedProduct.name} removed from cart`);
    }
  } else {
    if (typeof speak === 'function') {
      speak(`No product found matching "${name}"`);
    }
  }
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
  const form = document.getElementById("newsletterForm");
  const thankYou = document.getElementById("thankYouMessage");
  const existsMsg = document.getElementById("existsMessage");

  const getSubs = () =>
    JSON.parse(localStorage.getItem("subscribers") || "[]");

  const saveSubs = subs =>
    localStorage.setItem("subscribers", JSON.stringify(subs));

  form.addEventListener("submit", e => {
    e.preventDefault();

    const email = document
      .getElementById("subscriberEmail")
      .value.trim()
      .toLowerCase();

    thankYou.style.display = "none";
    existsMsg.style.display = "none";

    if (!email) return;

    const subs = getSubs();

    if (subs.includes(email)) {
      existsMsg.style.display = "block";
      return;
    }

    subs.push(email);
    saveSubs(subs);

    thankYou.style.display = "block";
    form.reset();
  });
});
