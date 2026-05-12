let listProducts = [];
let allProducts = [];
let carts = [];

const iconCart = document.querySelector('.icon-cart');
const closeCart = document.querySelector('.close');
const body = document.querySelector('body');
const listProductHTML = document.querySelector('.listProduct');

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
const createProductElement = (product, leaflet = false) => {

    const item = document.createElement('div');

    item.classList.add('item');

    item.dataset.id = product.id;

    item.innerHTML = `
    
        <img src="${product.image}" alt="${product.name}">

        <h2>${product.name}</h2>

        ${
            leaflet
            ? ''
            : `
                <hr/>
                <div class="price">R${product.price}</div>
                <button class="addCart">Add to Cart</button>
            `
        }

    `;

    return item;
};

const addDataToHTML = () => {

    /* NORMAL SHOP VIEW */

    const normalContainer = document.querySelector('.container .listProduct');

    if(normalContainer){

        normalContainer.innerHTML = '';

        listProducts.forEach(product => {

            normalContainer.appendChild(
                createProductElement(product)
            );

        });
    }

    /* LEAFLET VIEW */

    const categorySections = {

        "Chicken":
        document.getElementById("section-Chicken"),

        "Eggs":
        document.getElementById("section-Eggs"),

        "Chicken Feed":
        document.getElementById("section-ChickenFeed")
    };

    const categories = [

        {
            name: "Chicken",
            keywords: [
                "broiler",
                "hard body",
                "red star",
                "intestines",
                "chicken"
            ]
        },

        {
            name: "Eggs",
            keywords: [
                "egg",
                "eggs"
            ]
        },

        {
            name: "Chicken Feed",
            keywords: [
                "feed",
                "mash",
                "starter",
                "grower",
                "finisher"
            ]
        }
    ];

    /* CLEAR OLD */

    Object.values(categorySections).forEach(section => {

        if(section){
            section.innerHTML = '';
        }

    });

    /* ADD PRODUCTS */

    listProducts.forEach(product => {

        const productName = product.name.toLowerCase();

        for(const category of categories){

            const matched = category.keywords.some(keyword =>
                productName.includes(keyword)
            );

            if(matched){

                const section = categorySections[category.name];

                if(section){

                    section.appendChild(
                        createProductElement(product, true)
                    );

                }

                break;
            }
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

const btn = document.getElementById("leafletBtn");

btn.addEventListener("click", () => {

    document.body.classList.toggle("leaflet-mode");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});

/* ================================= */
/* 📖 FLIPBOOK */
/* ================================= */

const pages = document.querySelectorAll('.page');

const nextBtn = document.getElementById('nextPage');

const prevBtn = document.getElementById('prevPage');

let currentPage = 0;

function updateBook(){

    pages.forEach((page, index) => {

        page.classList.remove('active');

        page.classList.remove('flipped');

        if(index < currentPage){
            page.classList.add('flipped');
        }

    });

    pages[currentPage].classList.add('active');

}

/* NEXT */

nextBtn.addEventListener('click', () => {

    if(currentPage < pages.length - 1){

        currentPage++;

        updateBook();

    }

});

/* PREVIOUS */

prevBtn.addEventListener('click', () => {

    if(currentPage > 0){

        currentPage--;

        updateBook();

    }

});

/* MOBILE SWIPE */

let startX = 0;

document.querySelector('.flipbook').addEventListener('touchstart', e => {

    startX = e.changedTouches[0].screenX;

});

document.querySelector('.flipbook').addEventListener('touchend', e => {

    let endX = e.changedTouches[0].screenX;

    if(endX < startX - 50){

        if(currentPage < pages.length - 1){

            currentPage++;

            updateBook();

        }

    }

    if(endX > startX + 50){

        if(currentPage > 0){

            currentPage--;

            updateBook();

        }

    }

});

updateBook();

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
