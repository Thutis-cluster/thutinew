let listProducts = [];
let allProducts = []; // 🆕 Master list of all products for cart
let carts = [];

const iconCart = document.querySelector('.icon-cart');
const closeCart = document.querySelector('.close');
const body = document.querySelector('body');
const listProductHTML = document.querySelector('.listProduct');
const listCartHTML = document.querySelector('.listCart');
const iconCartSpan = document.querySelector('.icon-cart span');

  window.addEventListener('load', function () {
    const preloader = document.getElementById('preloader');
    const content = document.getElementById('content');

    preloader.style.transition = 'opacity 0.5s ease';
    preloader.style.opacity = '0';

    setTimeout(() => {
      preloader.style.display = 'none';
      content.style.display = 'block';
    }, 500);
  });

// 👇 Change this line per page (as you're already doing)
const jsonFile = 'vegetable-products.json'; // e.g. 'vegetables.json', 'chickenproducts.json'

/**
 * Load all product JSONs so cart can recognize items across pages
 */
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

const initApp = async () => {
    // Load current page's products
    const res = await fetch(jsonFile);
    listProducts = await res.json();
renderCategorizedProducts();


    // Load all product data for the cart
    await loadAllProducts();

    // Load saved cart if exists
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        carts = JSON.parse(storedCart);
        addCartToHTML();
    }
};

$(document).ready(function () {
    const listContainer = $(".listProduct");
    const noResultsHtml = `
        <div class="no-results" style="color:red; padding:10px;">
            Search unavailable
        </div>
    `;

    $("#myinput").on("keyup", function () {
        const value = $(this).val().toLowerCase();
        let matchCount = 0;

        // Hide/show items based on match
        $(".listProduct .item").each(function () {
            const isMatch = $(this).text().toLowerCase().indexOf(value) > -1;
            $(this).toggle(isMatch);
            if (isMatch) matchCount++;
        });

        // Remove any existing no-results message
        $(".listProduct .no-results").remove();

        // If no matches found, show message
        if (matchCount === 0) {
            listContainer.append(noResultsHtml);
        }
    });
});



const addDataToHTML = () => {
    listProductHTML.innerHTML = '';
    listProducts.forEach(product => {
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
        listProductHTML.appendChild(item);
    });
};

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('addCart')) {
    const product_id = e.target.closest('.item')?.dataset?.id;
    if (product_id) addToCart(product_id);
  }
});

const addToCart = (product_id) => {
    const product = allProducts.find(p => p.id === product_id);
    if (!product) return;

    // Check if a product with the same name is already in the cart
    const index = carts.findIndex(item => {
        const cartProduct = allProducts.find(p => p.id === item.product_id);
        return cartProduct && cartProduct.name === product.name;
    });

    if (index === -1) {
        // Not found by name, add new
        carts.push({ product_id, quantity: 1 });
    } else {
        // Found by name, just increase quantity
        carts[index].quantity += 1;
    }

    addCartToMemory();
    addCartToHTML();
};

const addCartToMemory = () => {
    localStorage.setItem('cart', JSON.stringify(carts));
};

const addCartToHTML = () => {
    listCartHTML.innerHTML = '';
    let totalQuantity = 0;
    let grandTotal = 0;

    const fullCartItems = carts.map(cart => {
        const product = allProducts.find(p => p.id === cart.product_id);
        return product ? { ...cart, product } : null;
    }).filter(item => item !== null);

    // Sort alphabetically
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

    iconCartSpan.innerText = totalQuantity;

    // Update grand total display outside scrollable list
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

listCartHTML.addEventListener('click', (e) => {
    const product_id = e.target.closest('.item')?.dataset?.id;
    if (!product_id) return;

    if (e.target.classList.contains('minus')) {
        changeQuantity(product_id, 'minus');
    } else if (e.target.classList.contains('plus')) {
        changeQuantity(product_id, 'plus');
    }
});

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

iconCart.addEventListener('click', function (e) {
    e.preventDefault(); // Stop any default anchor behavior

    if (window.innerWidth <= 800) {
        // ✅ Corrected path and logic
        window.location.href = 'cartPage.html';
    } else {
        // ✅ Toggle cart sidebar on desktop only
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


const renderCategorizedProducts = () => {
  const categorySections = {
    "Vegetables": document.getElementById("section-Vegetables"),
    "Maize": document.getElementById("section-Maize")
  };

  // Clear all sections
  Object.values(categorySections).forEach(section => section.innerHTML = '');

  // Define category keywords
  const categories = [
    { name: "Vegetables", keywords: ["beetroot", "butternut", "cabbage", "carrot", "cucumbe", "green beans", "onions", "potato", "pumpkin", "tomato", "peppers", "lettuce", "sweet potato"] },
    { name: "Maize", keywords: ["maize", "mealies", "mielie", "white star"] }
  ];

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
      console.warn(`No category match for: ${product.name}`);
    }
  });
};

function createProductElement(product) {
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
}


// ✅ Voice Assistant Only — Does not change existing addToCart logic
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

    console.log('Heard:', spoken);

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
      setTimeout(() => {
        window.location.assign('cartPage.html');
      }, 1000);
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

    // Default: treat as search
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

  // Load modal dynamically
  fetch('modal.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('modalContainer').innerHTML = html;
      initNewsletterModal();
    });

  function initNewsletterModal() {
    const modal = document.getElementById("newsletterModal");
    const closeBtn = modal.querySelector(".close");
    const form = document.getElementById("newsletterForm");
    const messageDiv = document.getElementById("message");

    // Open modal
    document.querySelectorAll(".subscribeBtn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault();
        modal.style.display = "block";
      });
    });

    // Close modal
    closeBtn.addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

    // LocalStorage for subscribers
    const getSubscribers = () => JSON.parse(localStorage.getItem("subscribers") || "[]");
    const saveSubscribers = (subscribers) => localStorage.setItem("subscribers", JSON.stringify(subscribers));

    // Handle form submit
    form.addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("subscriberName").value.trim();
      const email = document.getElementById("subscriberEmail").value.trim().toLowerCase();

      if (!name || !email) return;

      let subscribers = getSubscribers();
      if (subscribers.includes(email)) {
        messageDiv.textContent = "This email is already subscribed!";
        messageDiv.style.color = "red";
        messageDiv.style.display = "block";
        return;
      }

      subscribers.push(email);
      saveSubscribers(subscribers);

      messageDiv.textContent = "Thanks for subscribing! 🎉";
      messageDiv.style.color = "green";
      messageDiv.style.display = "block";

      form.reset();

      // Close modal smoothly after 2s
      setTimeout(() => modal.style.display = "none", 2000);
    });
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

// 🚀 Start app
initApp();
