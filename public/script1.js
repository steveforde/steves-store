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

const stripe = Stripe("pk_test_51QqzbDQRh7jNBCuPmcSjXha8QMXWHVFE55ZBVPmCsUS8iGpBbJgJe0xWdQVKylHggAezdRDUZo4qlnVkfhQYdl3T00Uj2u1HZW");

document.addEventListener('DOMContentLoaded', function() {
    if (typeof AOS !== 'undefined') {
        AOS.init();
    } else {
        console.warn("AOS is not defined. Make sure it's included in your project.");
    }

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

     // Event listener for checkout button (safe here)
    const checkoutButton = document.getElementById('checkout-btn');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', handleStripeCheckout);
    }


    // Initialize page
    displayProducts(); // Call to create the product list AND add event listeners
    updateCartDisplay();
    updateCartHeaderDisplay(); // Update header cart
    updateCartCount();

    // Handle successful checkout from localstorage
    if (localStorage.getItem('checkout-success') === 'true') {
        localStorage.removeItem('shopping-cart');
        cart = [];
        updateCartDisplay();
        updateCartHeaderDisplay();
        updateCartCount();
        showNotification('Thank you for your purchase!');
        localStorage.removeItem('checkout-success');
    }

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
      const cartItemsHeader = document.getElementById('cart-items-header');
    if (cartItemsHeader) {
        cartItemsHeader.addEventListener('click', function(event) {
            if (event.target.classList.contains('remove-btn-header')) {
                const productId = parseInt(event.target.dataset.id);
                removeFromCart(productId);
            }
        });
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

// Update Cart Display (Main Cart) - CORRECTED
function updateCartDisplay() {
    const cartTable = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    if (!cartTable || !cartTotal) {
        console.warn("Cart elements not found!");
        return;
    }

    cartTable.innerHTML = ''; // Clear previous content
    let total = 0;

    if (cart.length === 0) {
        cartTable.innerHTML = `<tr><td colspan="6" class="text-center">Your cart is empty.</td></tr>`; // colspan="6"
        cartTotal.textContent = '0.00';
    } else {
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            // Correctly use template literals here:
            cartTable.innerHTML += `
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
        });
        cartTotal.textContent = total.toFixed(2);
    }
}

// Update Header Cart Display - CORRECTED
function updateCartHeaderDisplay() {
    const cartDropdown = document.getElementById('cart-items-header');
    const cartTotalHeader = document.getElementById('cart-total-header');

    if (!cartDropdown || !cartTotalHeader) {
        console.warn("Header cart elements not found!");
        return;
    }

    cartDropdown.innerHTML = ''; // Clear previous content
    let total = 0;

    if (cart.length === 0) {
        cartDropdown.innerHTML = `<li class="dropdown-item text-center">Your cart is empty.</li>`;
        cartTotalHeader.textContent = 'Total: €0.00';
    } else {
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            // Correctly use template literals here:
            cartDropdown.innerHTML += `
                <li class="dropdown-item d-flex justify-content-between align-items-center">
                    <img src="${item.image}" style="width: 40px; height: auto;">
                    <span>${item.name} x${item.quantity}</span>
                    <span>€${itemTotal.toFixed(2)}</span>
                     <button class="btn btn-sm btn-danger remove-btn-header" data-id="${item.id}">X</button>
                </li>`;
        });
        cartTotalHeader.textContent = `Total: €${total.toFixed(2)}`;
    }
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
    console.log("handleStripeCheckout called! cart:", cart); // DEBUG: Check function call and cart

    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }

    try {
        const cartItems = cart.map(item => ({
            name: item.name,
            price: parseFloat(item.price),
            quantity: parseInt(item.quantity, 10),
            image: item.image.startsWith('http') ? item.image : `<span class="math-inline">\{window\.location\.origin\}/</span>{item.image}`
        }));

        const response = await fetch("/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: cartItems }),
        });

        const session = await response.json();

        if (!response.ok) throw new Error(session.error || 'Payment failed');

        const stripe = Stripe("pk_test_51QqzbDQRh7jNBCuPmcSjXha8QMXWHVFE55ZBVPmCsUS8iGpBbJgJe0xWdQVKylHggAezdRDUZo4qlnVkfhQYdl3T00Uj2u1HZW");
        const result = await stripe.redirectToCheckout({ sessionId: session.id });

        if (result.error) {
            console.error("Checkout Error:", result.error);
            showNotification(`Error during checkout: ${result.error.message}`);
        }
    } catch (error) {
        console.error("Checkout Error:", error);
        showNotification(`Error during checkout: ${error.message}`);
    }
}
