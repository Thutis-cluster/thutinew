let listProducts = [];
let allProducts = [];
let carts = [];

const iconCart = document.querySelector('.icon-cart');
const closeCart = document.querySelector('.close');
const body = document.querySelector('body');
const listProductHTML = document.querySelector('.listProduct');
const listCartHTML = document.querySelector('.listCart');
const iconCartSpan = document.querySelector('.icon-cart span');

// Preloader
window.addEventListener('load', function () {
    const preloader = document.getElementById('preloader');
    preloader.style.transition = 'opacity 0.5s ease';
    preloader.style.opacity = '0';
    setTimeout(() => {
        preloader.style.display = 'none';
    }, 500);
});

// JSON file for current page
const jsonFile = 'chicken-products.json';

// Load all product JSONs so cart works across pages
const loadAllProducts = async () => {
    const files = [
        'mainshop-products.json',
        'vegetable-products.json',
        'chicken-products.json',
        'dogfood&tissues-products.json'
    ];
    let combined = [];

    for (const file of files) {
        try {
            const res = await fetch(file);
            const data = await res.json();
            combined = combined.concat(data);
        } catch (error) {
            console.error(`Failed to load ${file}`, error);
        }
    }
    allProducts = combined;
};

// Init
const initApp = async () => {
    const res = await fetch(jsonFile);
    listProducts = await res.json();
    addDataToHTML();

    await loadAllProducts();

    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        carts = JSON.parse(storedCart);
        addCartToHTML();
    } else {
        updateCartIcon(); // ensure icon updates even if empty
    }
};

// Search filter
$(document).ready(function () {
    const listContainer = $(".listProduct");
    const noResultsHtml = `<div class="no-results" style="color:red; padding:10px;">Search unavailable</div>`;

    $("#myinput").on("keyup", function () {
        const value = $(this).val().toLowerCase();
        let matchCount = 0;

        $(".listProduct .item").each(function () {
            const isMatch = $(this).text().toLowerCase().indexOf(value) > -1;
            $(this).toggle(isMatch);
            if (isMatch) matchCount++;
        });

        $(".listProduct .no-results").remove();
        if (matchCount === 0) {
            listContainer.append(noResultsHtml);
        }
    });
});

// Add products to HTML
const createProductElement = (product) => {
    const item = document.createElement('div');
    item.classList.add('item');
    item.dataset.id = product.id;
    item.innerHTML = `
        <img src="${product.image}" alt="">
        <h2>${product.name}</h2>
        <hr/>
        <div class="price">R${product.price}</div>
        <button class="addCart">Add to Cart</button>
    `;
    return item;
};

const addDataToHTML = () => {
    const categorySections = {
        "Chicken": document.getElementById("section-Chicken"),
        "Eggs": document.getElementById("section-Eggs"),
        "Chicken Feed": document.getElementById("section-ChickenFeed")
    };

    const categories = [
        { name: "Chicken", keywords: ["broiler", "hard body", "red star", "intestines"] },
        { name: "Eggs", keywords: ["egg", "eggs"] },
        { name: "Chicken Feed", keywords: ["feed", "lays mash", "finisher", "starter"] }
    ];

    // Clear old data
    Object.values(categorySections).forEach(section => section.innerHTML = '');

    listProducts.forEach(product => {
        const name = product.name.toLowerCase();
        let matched = false;

        for (const category of categories) {
            if (category.keywords.some(keyword => name.includes(keyword))) {
                const section = categorySections[category.name];
                if (section) {
                    section.appendChild(createProductElement(product));
                    matched = true;
                    break;
                }
            }
        }

        if (!matched) {
            console.warn(`Uncategorized product: ${product.name}`);
        }
    });
};

// Event delegation: add to cart
document.querySelectorAll('.listProduct').forEach(section => {
    section.addEventListener('click', (e) => {
        if (e.target.classList.contains('addCart')) {
            const product_id = e.target.closest('.item').dataset.id;
            addToCart(product_id);
        }
    });
});


// Add to cart logic
const addToCart = (product_id) => {
    const product = allProducts.find(p => p.id === product_id);
    if (!product) return;

    const index = carts.findIndex(item => {
        const cartProduct = allProducts.find(p => p.id === item.product_id);
        return cartProduct && cartProduct.name === product.name;
    });

    if (index === -1) {
        carts.push({ product_id, quantity: 1 });
    } else {
        carts[index].quantity += 1;
    }

    addCartToMemory();
    addCartToHTML();
};

// Save cart to memory
const addCartToMemory = () => {
    localStorage.setItem('cart', JSON.stringify(carts));
};

// Render cart items to HTML
const addCartToHTML = () => {
    listCartHTML.innerHTML = '';
    let totalQuantity = 0;
    let grandTotal = 0;

    const fullCartItems = carts.map(cart => {
        const product = allProducts.find(p => p.id === cart.product_id);
        return product ? { ...cart, product } : null;
    }).filter(item => item !== null);

    fullCartItems.sort((a, b) => a.product.name.localeCompare(b.product.name));

    fullCartItems.forEach(cart => {
        const { product, quantity } = cart;
        const totalPrice = product.price * quantity;
        grandTotal += totalPrice;
        totalQuantity += quantity;

        const item = document.createElement('div');
        item.classList.add('item');
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

    updateCartIcon(totalQuantity);

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

// Automatically update cart icon span
const updateCartIcon = (quantity = null) => {
    if (quantity === null) {
        // recalculate from stored cart if not passed
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            const parsedCart = JSON.parse(storedCart);
            quantity = parsedCart.reduce((sum, item) => sum + item.quantity, 0);
        } else {
            quantity = 0;
        }
    }
    iconCartSpan.innerText = quantity;
};

// Quantity change events
listCartHTML.addEventListener('click', (e) => {
    const product_id = e.target.closest('.item')?.dataset?.id;
    if (!product_id) return;

    if (e.target.classList.contains('minus')) {
        changeQuantity(product_id, 'minus');
    } else if (e.target.classList.contains('plus')) {
        changeQuantity(product_id, 'plus');
    }
});

// Increase/decrease item quantity
const changeQuantity = (product_id, type) => {
    const index = carts.findIndex(item => item.product_id === product_id);
    if (index >= 0) {
        if (type === 'plus') {
            carts[index].quantity += 1;
        } else {
            carts[index].quantity -= 1;
            if (carts[index].quantity <= 0) {
                carts.splice(index, 1);
            }
        }
        addCartToMemory();
        addCartToHTML();
    }
};

// Mobile vs Desktop cart behavior
iconCart.addEventListener('click', function (e) {
    e.preventDefault();
    if (window.innerWidth <= 800) {
        window.location.href = 'cartPage.html';
    } else {
        body.classList.toggle('showCart');
    }
});

closeCart.addEventListener('click', () => {
    body.classList.remove('showCart');
});

// 🔄 Sync cart icon across tabs/pages in real time
window.addEventListener('storage', (event) => {
    if (event.key === 'cart') {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            carts = JSON.parse(storedCart);
            addCartToHTML();
        }
    }
});

// NewsLetter Modal
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

// Voice commands
if ('webkitSpeechRecognition' in window) {
    const micBtn = document.getElementById('micBtn');
    const searchInput = document.getElementById('myinput');
    const recognition = new webkitSpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const speak = (text) => {
        const msg = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(msg);
    };

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
            const index = carts.findIndex(item => {
                const prod = allProducts.find(p => p.id === item.product_id);
                return prod && prod.name.toLowerCase().includes(name);
            });
            if (index !== -1) {
                const removed = allProducts.find(p => p.id === carts[index].product_id);
                carts.splice(index, 1);
                localStorage.setItem('cart', JSON.stringify(carts));
                addCartToHTML();
                speak(`${removed.name} removed from cart`);
            } else {
                speak(`No item called ${name} found in cart`);
            }
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

        // Default search
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
// ✅ Start App
initApp();
