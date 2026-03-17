// Global Variables
let listProducts = [];
let allProducts = [];
let currentPage = 0;

// DOM Elements
const pages = document.querySelectorAll(".page");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const indicator = document.getElementById("pageIndicator");
const book = document.querySelector('.book');
const flipSound = new Audio('assets/flip.mp3');

// Load All Products (dynamic)
const productFiles = [
  'mainshop-products.json', 
  'vegetable-products.json', 
  'chicken-products.json', 
  'dogfood&tissues-products.json'
];

const loadAllProducts = async () => {
  let combined = [];
  for (const file of productFiles) {
    try {
      const res = await fetch(file);
      const data = await res.json();
      combined = combined.concat(data);
    } catch (error) {
      console.error(`❌ Failed to load ${file}, error: ${error}`);
    }
  }
  allProducts = combined;
};

// Load Category Products
const loadCategoryProducts = async (file, containerId) => {
  const res = await fetch(file);
  const data = await res.json();
  const container = document.getElementById(containerId);
  data.forEach(product => {
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `<img src="${product.image}" alt=""> <p>${product.name}</p>`;
    container.appendChild(div);
  });
};

// Initialize App
const initApp = async () => {
  await loadAllProducts();
  loadCategoryProducts('vegetable-products.json', 'page1');
  loadCategoryProducts('chicken-products.json', 'page2');
  loadCategoryProducts('dogfood&tissues-products.json', 'page3');
};

// Page Update
const updatePages = () => {
  pages.forEach((page, index) => {
    page.classList.remove("active", "flipped");
    if (index === currentPage) {
      page.classList.add("active");
    } else if (index < currentPage) {
      page.classList.add("flipped");
    }
  });
  indicator.textContent = `${currentPage + 1} / ${pages.length}`;
};

// Handle Swipe Gestures (Mobile)
let touchStartX = 0;
let touchEndX = 0;

book.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
});

book.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipeGesture();
});

const handleSwipeGesture = () => {
  const threshold = 50;
  if (touchEndX < touchStartX - threshold) {
    if (currentPage < pages.length - 1) currentPage++;
  }
  if (touchEndX > touchStartX + threshold) {
    if (currentPage > 0) currentPage--;
  }
  updatePages();
  playFlipSound();
};

// Flip Sound
const playFlipSound = () => {
  flipSound.currentTime = 0;
  flipSound.play();
};

// Button Clicks
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

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
