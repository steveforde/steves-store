"use strict";

let cart = [];
try {
    cart = JSON.parse(localStorage.getItem('shopping-cart')) || [];
} catch (error) {
    console.error("Error parsing cart from localStorage:", error);
    cart = [];
}

const products = [
    { id: 1, name: "MacBook Pro 14-inch", brand: "Apple", price: 1999.99, image: "images/mbp14.jpeg" },
    { id: 2, name: "Dell XPS 16", brand: "Dell", price: 1599.99, image: "images/xps16.jpg" },
    { id: 3, name: "Lenovo ThinkPad X1", brand: "Lenovo", price: 1499.99, image: "images/lenavo.jpg" },
    { id: 4, name: "HP Spectre x360", brand: "HP", price: 1399.99, image: "images/spectre.jpg" },
    { id: 5, name: "ASUS ROG Gaming", brand: "ASUS", price: 1899.99, image: "images/gamer.jpg" },
    { id: 6, name: "Razer Blade 15", brand: "Razer", price: 1799.99, image: "images/blade18.jpg" },
    { id: 7, name: "Microsoft Surface Laptop", brand: "Microsoft", price: 1199.99, image: "images/micro.jpg" },
    { id: 8, name: "Acer Predator", brand: "Acer", price: 1599.99, image: "images/predator.jpg" },
    { id: 9, name: "MSI Creator", brand: "MSI", price: 1699.99, image: "images/msi.jpg" },
    { id: 10, name: "LG Gram 16", brand: "LG", price: 1299.99, image: "images/Basic.jpg" },
    { id: 11, name: "Alienware m15", brand: "Dell", price: 1999.99, image: "images/laptop.jpg" },
    { id: 12, name: "Samsung Galaxy Book", brand: "Samsung", price: 999.99, image: "images/galaxy.jpg" }
];

fetch("/config")
    .then(response => response.json())
    .then(data => {
        const stripe = Stripe(data.publishableKey);
    })
    .catch(error => console.error("Error fetching Stripe key:", error));


document.addEventListener('DOMContentLoaded', function() {
    if (typeof AOS !== 'undefined') {
        AOS.init();
    } else {
        console.warn("AOS is not defined. Make sure it's included in your project.");
    }
    console.log("DOMContentLoaded event fired."); // DEBUG
    const urlParams = new URLSearchParams(window.location.search);

    // Event listeners for filters and search (these are safe here)
    document.getElementById('priceRange').addEventListener('change', filterAndSortProducts);
    document.getElementById('brandFilter').addEventListener('change', filterAndSortProducts);
    document.getElementById('sortOption').addEventListener('change', filterAndSortProducts);
    document.getElementById('searchInput').addEventListener('input', filterAndSortProducts);

    // Newsletter form handling
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = document.getElementById('newsletterEmail');
            showNotification('Thanks for subscribing!');
            if (emailInput) {
                emailInput.value = '';
            }
        });
    }

    // Scroll to top button
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    if (scrollToTopBtn) {
        window.onscroll = function() {
            if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
                scrollToTopBtn.style.display = "block";
            } else {
                scrollToTopBtn.style.display = "none";
            }
        };

        scrollToTopBtn.onclick = function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        };
    }

     
    // Initialize page
    displayProducts(); // Call to create the product list AND add event listeners
    updateCartDisplay();
    updateCartHeaderDisplay(); // Update header cart
    updateCartCount();
    console.log("Initial cart:", cart); // DEBUG: Check cart on load


    // Handle successful checkout from localstorage
    if (urlParams.get('checkout') === 'success') {
        console.log("✅ Checkout completed, clearing cart...");
        localStorage.removeItem('shopping-cart');
        cart = [];
        updateCartDisplay();
        updateCartHeaderDisplay();
        updateCartCount();
        showNotification('Thank you for your purchase!');
    }
});
     

  //Event Listener for cart modal
    const cartItemsContainer = document.getElementById('cart-items');
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('remove-btn')) {
                const productId = parseInt(event.target.dataset.id);
                removeFromCart(productId);
            } else if (event.target.classList.contains('cart-plus')) {
                const productId = parseInt(event.target.dataset.id);
                updateCartItemQuantity(productId, 1);
            } else if (event.target.classList.contains('cart-minus')) {
                const productId = parseInt(event.target.dataset.id);
                updateCartItemQuantity(productId, -1);
            }
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        const checkoutButton = document.getElementById('checkout-btn');
        if (checkoutButton) {
            checkoutButton.addEventListener('click', handleStripeCheckout);
        }
    });
      const cartItemsHeader = document.getElementById('cart-items-header');
    if (cartItemsHeader) {
        cartItemsHeader.addEventListener('click', function(event) {
            if (event.target.classList.contains('remove-btn-header')) {
                const productId = parseInt(event.target.dataset.id);
                removeFromCart(productId);
            }
        });
    }
    // *** ADD THE EVENT DELEGATION CODE HERE, INSIDE DOMContentLoaded ***
    document.addEventListener('click', function(event) {
        if (event.target && event.target.id === 'checkout-btn-header') {
            handleStripeCheckout(event);
        }
    });

     document.addEventListener('click', function(event) {
        if(event.target && event.target.id === 'checkout-btn'){
            handleStripeCheckout();
        }
    });


function displayProducts() {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) {
        console.error("Product grid container (product-grid) is missing in HTML!");
        return;
    }

    console.log("displayProducts called. products:", products); // DEBUGGING

    productGrid.innerHTML = ''; // Clear existing content

    if (products.length === 0) {
        productGrid.innerHTML = `<h3 class="text-center">No products available</h3>`;
        return;
    }

    let productHTML = products.map(product => {
        console.log("  Processing product:", product); // DEBUGGING
        return `
            <div class="col-md-4 mb-4" data-id="${product.id}">
                <div class="card product-card">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">€${product.price.toFixed(2)}</p>
                        <div class="quantity-controls mb-3">
                            <button class="btn btn-sm btn-outline-secondary btn-minus" data-product-id="${product.id}">-</button>
                            <span class="mx-2 quantity">1</span>
                            <button class="btn btn-sm btn-outline-secondary btn-plus" data-product-id="${product.id}">+</button>
                        </div>
                        <button class="btn btn-primary w-100 addToCartBtn" data-product-id="${product.id}">ADD TO CART</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    console.log("Generated productHTML:", productHTML); // DEBUGGING
    productGrid.innerHTML = productHTML;

    // Event Delegation (as before)
    productGrid.addEventListener('click', function(event) {
        const target = event.target;
        if (target.classList.contains('btn-plus')) {
            const quantityElement = target.parentElement.querySelector('.quantity');
            quantityElement.textContent = Math.max(1, parseInt(quantityElement.textContent) + 1);
        } else if (target.classList.contains('btn-minus')) {
            const quantityElement = target.parentElement.querySelector('.quantity');
            let quantity = parseInt(quantityElement.textContent);
            quantityElement.textContent = Math.max(1, quantity - 1);
        } else if (target.classList.contains('addToCartBtn')) {
            const productId = parseInt(target.dataset.productId);
            addToCart(productId);
        }
    });
}

// Filter and sort products (now calls displayFilteredProducts)
function filterAndSortProducts() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const priceRange = document.getElementById('priceRange').value;
    const brand = document.getElementById('brandFilter').value.toLowerCase();
    const sortOption = document.getElementById('sortOption').value;

    let filteredProducts = products.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(searchTerm);
        const brandMatch = product.brand.toLowerCase().includes(searchTerm);
        return nameMatch || brandMatch;
    });

    if (priceRange !== 'all') {
        const [min, max] = priceRange.split('-').map(Number);
        filteredProducts = filteredProducts.filter(product =>
            product.price >= min && product.price <= max
        );
    }

    if (brand !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.brand.toLowerCase() === brand);
    }

    switch (sortOption) {
        case 'priceLow':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'priceHigh':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }

    displayFilteredProducts(filteredProducts); // Corrected call
}

function displayFilteredProducts(filteredProducts) {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) {
        console.error("Product grid container (product-grid) is missing in HTML!");
        return;
    }

    console.log("displayFilteredProducts called. filteredProducts:", filteredProducts); // DEBUGGING

    productGrid.innerHTML = '';

    if (filteredProducts.length === 0) {
        productGrid.innerHTML = `
            <div class="col-12 text-center">
                <h3>No products found</h3>
            </div>
        `;
        return;
    }

    let productHTML = filteredProducts.map(product => {
        console.log("  Processing filtered product:", product);  //DEBUGGING
        return `
            <div class="col-md-4 mb-4" data-aos="fade-up" data-id="${product.id}">
                <div class="card product-card">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">€${product.price.toFixed(2)}</p>
                        <div class="quantity-controls mb-3">
                            <button class="btn btn-sm btn-outline-secondary btn-minus" data-product-id="${product.id}">-</button>
                            <span class="mx-2 quantity">1</span>
                            <button class="btn btn-sm btn-outline-secondary btn-plus" data-product-id="${product.id}">+</button>
                        </div>
                        <button class="btn btn-primary w-100 addToCartBtn" data-product-id="${product.id}">ADD TO CART</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

     console.log("Generated productHTML:", productHTML); // DEBUGGING
    productGrid.innerHTML = productHTML;

    // Event Delegation (same as in displayProducts)
    productGrid.addEventListener('click', function(event) {
        const target = event.target;
        if (target.classList.contains('btn-plus')) {
            const quantityElement = target.parentElement.querySelector('.quantity');
            quantityElement.textContent = Math.max(1, parseInt(quantityElement.textContent) + 1);
        } else if (target.classList.contains('btn-minus')) {
            const quantityElement = target.parentElement.querySelector('.quantity');
            let quantity = parseInt(quantityElement.textContent);
            quantityElement.textContent = Math.max(1, quantity - 1);
        } else if (target.classList.contains('addToCartBtn')) {
            const productId = parseInt(target.dataset.productId);
            addToCart(productId);
        }
    });
}

// Add to Cart function
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

     // Get quantity from the product card (using data-product-id).
    const productCard = document.querySelector(`.col-md-4[data-id="${productId}"]`);
    if (!productCard) {
        console.error("Could not find product card for product ID:", productId);
        return; // Exit if the card isn't found
    }
    const quantitySpan = productCard.querySelector('.quantity');
     const quantityToAdd = parseInt(quantitySpan.textContent, 10);

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantityToAdd;
    } else {
        cart.push({ ...product, quantity: quantityToAdd });
    }
     // Reset quantity on the card to 1
     quantitySpan.textContent = 1;

    updateCartDisplay();
    updateCartHeaderDisplay();  // Update header cart
    updateCartCount();
    showNotification('Item added to cart!');
    localStorage.setItem('shopping-cart', JSON.stringify(cart));
}

function updateCartDisplay() {
    const cartTable = document.getElementById('cart-items');
    const cartTotalContainer = document.getElementById('cart-total'); // Use a container

    console.log("updateCartDisplay called. cart:", cart); // DEBUG

    if (!cartTable || !cartTotalContainer) {
        console.error("Cart elements not found! cartTable:", cartTable, "cartTotalContainer:", cartTotalContainer);
        return;
    }

    cartTable.innerHTML = ''; // Clear previous content
    let total = 0;  // INITIALIZE total - THIS IS THE MISSING LINE

    if (cart.length === 0) {
        console.log("Cart is empty."); // DEBUG
        cartTable.innerHTML = `<tr><td colspan="6" class="text-center">Your cart is empty.</td></tr>`;
        cartTotalContainer.innerHTML = '€0.00'; // Update container, not textContent directly
    } else {
        console.log("Cart has items:", cart); // DEBUG
        cart.forEach(item => {
            console.log("  Processing item:", item); // DEBUG
            const itemTotal = item.price * item.quantity;
            total += itemTotal;  // total will now work correctly
            const rowHTML = `
                <tr>
                    <td><img src="${item.image}" width="50"></td>
                    <td>${item.name}</td>
                    <td>€${item.price.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary cart-minus" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="btn btn-sm btn-secondary cart-plus" data-id="${item.id}">+</button>
                    </td>
                    <td>€${itemTotal.toFixed(2)}</td>
                    <td><button class="btn btn-sm btn-danger remove-btn" data-id="${item.id}">Remove</button></td>
                </tr>`;
            console.log("    Generated rowHTML:", rowHTML); // DEBUG
            cartTable.innerHTML += rowHTML;
        });

        // Add total AND checkout button to the cartTotalContainer
        cartTotalContainer.innerHTML = `
            <h4>Total: €${total.toFixed(2)}</h4>
            <button id="checkout-btn" class="btn btn-success w-100 mt-2">Checkout with Stripe</button>
        `;
        console.log("Added total and checkout. cartTotalContainer:", cartTotalContainer.innerHTML); //DEBUG
    }
    console.log("updateCartDisplay finished."); // DEBUG
}
function updateCartHeaderDisplay() {
    const cartDropdown = document.getElementById('cart-items-header');

    console.log("updateCartHeaderDisplay called. cart:", cart); // DEBUG

    if (!cartDropdown) {
        console.warn("Header cart element not found! cartDropdown:", cartDropdown);
        return;
    }

    cartDropdown.innerHTML = ''; // Clear previous content
    let total = 0;

    if (cart.length === 0) {
        cartDropdown.innerHTML = `<li class="dropdown-item text-center">Your cart is empty.</li>`;
    } else {
        // Add each item to the dropdown list
        cart.forEach(item => {
            console.log("Header-Processing item:", item); // DEBUG
            total += item.price * item.quantity;
            cartDropdown.innerHTML += `
                <li class="dropdown-item d-flex justify-content-between align-items-center">
                    <img src="${item.image}" style="width: 40px; height: auto;">
                    <span>${item.name} x${item.quantity}</span>
                    <span>€${(item.price * item.quantity).toFixed(2)}</span>
                     <button class="btn btn-sm btn-danger remove-btn-header" data-id="${item.id}">X</button>
                </li>`;
        });

        // Add the total AND the checkout button as the LAST items in the dropdown
        cartDropdown.innerHTML += `
            <li class="dropdown-item text-center">
                <strong>Total: €${total.toFixed(2)}</strong>
            </li>
            <li class="dropdown-item text-center">
                <button id="checkout-btn-header" class="btn btn-primary w-100">Checkout with Stripe</button>
            </li>
        `;
    }
     console.log("updateCartHeaderDisplay finished."); // DEBUG
}

function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    }
}


function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'alert alert-success position-fixed top-0 end-0 m-3';
    notification.style.zIndex = '1000';  // Ensure it's on top
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
    updateCartHeaderDisplay();
    updateCartCount();
    localStorage.setItem('shopping-cart', JSON.stringify(cart));
}

function updateCartItemQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity < 1) {
            removeFromCart(productId); // Remove if quantity becomes 0
        } else {
            updateCartDisplay();
            updateCartHeaderDisplay();
            updateCartCount();
            localStorage.setItem('shopping-cart', JSON.stringify(cart));
        }
    }
}

async function handleStripeCheckout() {
    console.log("handleStripeCheckout called! Cart:", cart);
    if (!Array.isArray(cart) || cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const cartItems = cart.map(item => ({
        name: item.name,
        price: parseFloat(item.price),
        quantity: item.quantity,
        image: item.image.startsWith('http') ? item.image : `http://localhost:3000/${item.image}`
    }));

    const customerEmail = "sforde08@gmail.com"; // Hardcoded for now

    try {
        const response = await fetch("/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cartItems, customerEmail })
        });

        const session = await response.json();
        if (!response.ok) throw new Error(session.error || "Checkout failed");
        window.location.href = session.url;
    } catch (error) {
        console.error("Checkout Error:", error);
        alert("Checkout failed, please try again.");
    }
}