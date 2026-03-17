// 🛒 Global Variables
let listProducts = [];
let allProducts = [];

// 📦 DOM Elements
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

const pages = document.querySelectorAll(".page");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const indicator = document.getElementById("pageIndicator");

let currentPage = 0;

function updatePages() {
    pages.forEach((page, index) => {
        page.classList.remove("active", "flipped");

        if (index === currentPage) {
            page.classList.add("active");
        } else if (index < currentPage) {
            page.classList.add("flipped");
        }
    });

    indicator.textContent = `${currentPage + 1} / ${pages.length}`;
}

nextBtn.onclick = () => {
    if (currentPage < pages.length - 1) {
        currentPage++;
        updatePages();
    }
};

prevBtn.onclick = () => {
    if (currentPage > 0) {
        currentPage--;
        updatePages();
    }
};

updatePages();

const loadCategory = async (file, containerId) => {
    const res = await fetch(file);
    const data = await res.json();

    const container = document.getElementById(containerId);

    data.forEach(product => {
        const div = document.createElement("div");
        div.className = "product";
        div.innerHTML = `
            <img src="${product.image}" alt="">
            <p>${product.name}</p>
        `;
        container.appendChild(div);
    });
};

// CALL THIS
loadCategory('vegetable-products.json', 'page1');
loadCategory('chicken-products.json', 'page2');
loadCategory('dogfood&tissues-products.json', 'page3');

let touchStartX = 0;
let touchEndX = 0;

const book = document.querySelector('.book');

book.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
});

book.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  handleGesture();
});

function handleGesture() {
  const threshold = 50; // minimum swipe distance
  if (touchEndX < touchStartX - threshold) { // swipe left → next
    if (currentPage < pages.length - 1) currentPage++;
  }
  if (touchEndX > touchStartX + threshold) { // swipe right → prev
    if (currentPage > 0) currentPage--;
  }
  updatePages();
  playFlipSound();
}

const flipSound = new Audio('assets/flip.mp3');

function playFlipSound() {
  flipSound.currentTime = 0;
  flipSound.play();
}

nextBtn.onclick = () => {
  if (currentPage < pages.length - 1) {
    currentPage++;
    updatePages();
    playFlipSound();
  }
};

prevBtn.onclick = () => {
  if (currentPage > 0) {
    currentPage--;
    updatePages();
    playFlipSound();
  }
};
                   
// 🎤 Speak
function speak(text) {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    synth.speak(utter);
}

// 🚀 Init App
const initApp = async () => {
    await loadAllProducts();
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

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

    // ONLY SEARCH — NO CART
if (searchInput) {
    searchInput.value = spoken;
}
    speak(`Searching for ${spoken}`);

    setTimeout(() => {
        window.location.href = `mainshop.html?search=${encodeURIComponent(spoken)}`;
    }, 1000);
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
