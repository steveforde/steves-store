"use strict"; // Enable strict mode

// Initialize cart from localStorage (with error handling)
let cart = [];
try {
    cart = JSON.parse(localStorage.getItem('shopping-cart')) || [];
} catch (error) {
    console.error("Error parsing cart from localStorage:", error);
    // Handle the error appropriately, e.g., by resetting the cart to an empty array
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

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS (if it's defined)
    if (typeof AOS !== 'undefined') {
        AOS.init();
    } else {
        console.warn("AOS is not defined. Make sure it's included in your project.");
    }
    
    
    // Add event listeners for filters
    document.getElementById('priceRange').addEventListener('change', filterAndSortProducts);
    document.getElementById('brandFilter').addEventListener('change', filterAndSortProducts);
    document.getElementById('sortOption').addEventListener('change', filterAndSortProducts);
    document.getElementById('searchInput').addEventListener('input', function() {
        console.log("Search input event triggered!");
        filterAndSortProducts(); 
    });

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
    let scrollToTopBtn = document.getElementById("scrollToTopBtn"); // More descriptive name
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
    displayProducts();
    updateCartDisplay();
    updateCartCount(); // Update cart count
});


function addQuantityEventListeners() {
    document.querySelectorAll('.btn-plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const quantityElement = this.previousElementSibling;
            quantityElement.textContent = Math.max(1, parseInt(quantityElement.textContent) + 1);
        });
    });

    document.querySelectorAll('.btn-minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const quantityElement = this.nextElementSibling;
            let quantity = parseInt(quantityElement.textContent);
            quantityElement.textContent = Math.max(1, quantity - 1);
        });
    });
}

function addAddToCartEventListeners() {
    document.querySelectorAll('.addToCartBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.dataset.productId);
            addToCart(productId);
        });
    });
}

// Filter and sort products
function filterAndSortProducts() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const priceRange = document.getElementById('priceRange').value;
    const brand = document.getElementById('brandFilter').value.toLowerCase(); // also lowercase the selected brand
    const sortOption = document.getElementById('sortOption').value;

    let filteredProducts = products.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(searchTerm);
        const brandMatch = product.brand.toLowerCase().includes(searchTerm);
        return nameMatch || brandMatch; // Match on either name or brand
    });

    if (priceRange !== 'all') {
        const [min, max] = priceRange.split('-').map(Number);
        filteredProducts = filteredProducts.filter(product =>
            product.price >= min && product.price <= max
        );
    }

    if (brand !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.brand.toLowerCase() === brand.toLowerCase());
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

    displayFilteredProducts(filteredProducts);
    console.log("🛍️ Filtered Products:", filteredProducts);
}


// Display filtered products
function displayFilteredProducts(filteredProducts) {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return; // Make sure the element exists

    productGrid.innerHTML = ''; // Clear previous results

    if (filteredProducts.length === 0) {
        productGrid.innerHTML = `
            <div class="col-12 text-center">
                <h3>No products found</h3>
            </div>
        `;
        return;
    }

    let productHTML = filteredProducts.map(product => {
        const { image, name, price, id } = product; // Destructuring for cleaner code
        return `
            <div class="col-md-4 mb-4" data-aos="fade-up" data-id="${id}">
                <div class="card product-card">
                    <img src="${image}" class="card-img-top" alt="${name}">
                    <div class="card-body">
                        <h5 class="card-title">${name}</h5>
                        <p class="card-text">€${price.toFixed(2)}</p>
                        <div class="quantity-controls mb-3">
                            <button class="btn btn-sm btn-outline-secondary btn-minus">-</button>
                            <span class="mx-2 quantity">1</span>
                            <button class="btn btn-sm btn-outline-secondary btn-plus">+</button>
                        </div>
                        <button class="btn btn-primary w-100 addToCartBtn" data-product-id="${id}">ADD TO CART</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    productGrid.innerHTML = productHTML; // Set the HTML of the product grid

    addQuantityEventListeners();
    addAddToCartEventListeners(); 
}
    // Add event listeners for new controls
    document.querySelectorAll('.btn-plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const quantityElement = this.previousElementSibling;
            quantityElement.textContent = parseInt(quantityElement.textContent) + 1;
        });
    });

    document.querySelectorAll('.btn-minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const quantityElement = this.nextElementSibling;
            const current = parseInt(quantityElement.textContent);
            if(current > 1) quantityElement.textContent = current - 1;
        });
    });

    document.querySelectorAll('.addToCartBtn').forEach(btn => {
      btn.addEventListener('click', function() {
          const productId = parseInt(this.dataset.productId); // Use data-product-id
          addToCart(productId);
      });
    });

document.querySelector('[data-bs-target="#cartModal"]').addEventListener('click', function() {
    updateCartHeaderDisplay(); // Ensure the cart updates when opened
});

function updateCartHeaderDisplay() {
    const cartItemsHeader = document.getElementById('cart-items-header');
    const cartTotalHeader = document.getElementById('cart-total-header');

    if (!cartItemsHeader || !cartTotalHeader) {
        console.error("Cart elements missing in modal!");
        return;
    }

    cartItemsHeader.innerHTML = ''; // Clear existing cart items
    let total = 0;

    if (cart.length === 0) {
        cartItemsHeader.innerHTML = `<tr><td colspan="5" class="text-center">Your cart is empty.</td></tr>`;
        cartTotalHeader.innerHTML = ''; // Hide checkout if cart is empty
    } else {
        cart.forEach(item => {
            total += item.price * item.quantity;
            cartItemsHeader.innerHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>€${item.price.toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>€${(item.price * item.quantity).toFixed(2)}</td>
                    <td><button class="btn btn-danger btn-sm remove-btn-header" data-id="${item.id}">Remove</button></td>
                </tr>
            `;
        });

        cartTotalHeader.innerHTML = `<h4>Total: €${total.toFixed(2)}</h4>`;
    }

    // Ensure remove buttons work inside modal
    document.querySelectorAll('.remove-btn-header').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.dataset.id);
            removeFromCart(productId);
            updateCartHeaderDisplay(); // Ensure modal updates after removal
        });
    });

    updateCartCount(); // Ensure cart count updates
}


function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const quantityElement = document.querySelector(`.col-md-4[data-id="${productId}"] .quantity`);
    let quantity = parseInt(quantityElement.textContent) || 1;

    quantity = Math.max(1, quantity);

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...product, quantity: quantity });
    }

    updateCartDisplay();
    updateCartHeaderDisplay(); // Ensure header cart updates
    updateCartCount();
    showNotification('Item added to cart!');
    localStorage.setItem('shopping-cart', JSON.stringify(cart));

    quantityElement.textContent = '1'; // Reset quantity
}



// Make sure removeFromCart is accessible globally
window.removeFromCart = function(productId) {
    const index = cart.findIndex(item => item.id === productId);
    if (index > -1) {
        cart.splice(index, 1);
        updateCartCount(); // Update cart count
        updateCartDisplay();
        showNotification('Item removed from cart!');
        localStorage.setItem('shopping-cart', JSON.stringify(cart));
    }
}

   
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'alert alert-success position-fixed top-0 end-0 m-3';
    notification.style.zIndex = '1000';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

window.checkout = function() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }

    alert('Thank you for your purchase!');

    // Clear the cart array
    cart = [];
    localStorage.removeItem('shopping-cart');

    // Update the cart display and count
    updateCartDisplay();
    updateCartCount();

    // Clear cart details in the header dropdown/modal
    const cartItems = document.getElementById('cart-items');
    if (cartItems) {
        cartItems.innerHTML = '<p>Your cart is empty.</p>';
    }

    // **Close the cart modal automatically**
    let cartModal = document.querySelector("#cartModal");
    if (cartModal) {
        let modalInstance = bootstrap.Modal.getInstance(cartModal);
        if (modalInstance) {
            modalInstance.hide();  // This closes the modal
        }
    }
};


document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const toggleRegister = document.getElementById("toggleRegister");
    const logoutBtn = document.getElementById("logoutBtn");
    const accountDropdown = document.getElementById("accountDropdown");

    // Toggle Login & Register Forms
    toggleRegister.addEventListener("click", function (e) {
        e.preventDefault();
        if (loginForm.style.display === "none") {
            loginForm.style.display = "block";
            registerForm.style.display = "none";
            toggleRegister.textContent = "Don't have an account? Register";
        } else {
            loginForm.style.display = "none";
            registerForm.style.display = "block";
            toggleRegister.textContent = "Already have an account? Login";
        }
    });

    // Handle Registration
    registerForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;

        // Save user to localStorage
        localStorage.setItem("user", JSON.stringify({ email, password }));

        alert("Registration successful! You can now log in.");
        window.location.reload();
    });

    // Handle Login
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        const storedUser = JSON.parse(localStorage.getItem("user"));

        if (storedUser && storedUser.email === email && storedUser.password === password) {
            localStorage.setItem("loggedInUser", email);
            alert("Login successful!");
            window.location.reload();
        } else {
            alert("Invalid email or password.");
        }
    });

    // Check if user is logged in
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (loggedInUser) {
        accountDropdown.innerHTML = `<i class="fas fa-user"></i> ${loggedInUser.split("@")[0]}`;
        logoutBtn.style.display = "block";
    } else {
        logoutBtn.style.display = "none";
    }

    // Handle Logout
    logoutBtn.addEventListener("click", function () {
        localStorage.removeItem("loggedInUser");
        alert("You have logged out.");
        window.location.reload();
    });
});



// Display all products
function displayProducts() {
    displayFilteredProducts(products);
}

function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}


// Fetch and Display Products
async function getProducts() {
    try {
      const response = await fetch('/api/products'); // Fetch from backend
      const products = await response.json();
  
      const productsContainer = document.getElementById('products-container');
      productsContainer.innerHTML = ''; // Clear previous content
  
      products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.classList.add('product');
        productElement.innerHTML = `
          <img src="${product.image || 'images/placeholder.jpg'}" alt="${product.name}">
          <h3>${product.name}</h3>
          <p>Price: €${product.price.toFixed(2)}</p>
          <p>${product.stock > 0 ? `In Stock: ${product.stock}` : '<span style="color:red;">Out of Stock</span>'}</p>
          <button ${product.stock <= 0 ? 'disabled' : ''} onclick="addToCart('${product._id}', '${product.name}', ${product.price})">
            Add to Cart
          </button>
        `;
        productsContainer.appendChild(productElement);
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      document.getElementById('products-container').innerHTML = '<p>Failed to load products.</p>';
    }
  }
  
  // Call getProducts on page load
  window.addEventListener('DOMContentLoaded', getProducts);
  


function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total'); // Ensure there's an element to display total

    if (!cartItems || !cartTotal) {
        console.error("Cart display element not found!");
        return;
    }

    let total = 0;
    cartItems.innerHTML = ''; // Clear old cart items

    if (cart.length === 0) {
        cartItems.innerHTML = `<tr><td colspan="5" class="text-center">Your cart is empty.</td></tr>`;
        cartTotal.innerHTML = ''; // Hide checkout button if cart is empty
    } else {
        cart.forEach(item => {
            total += item.price * item.quantity;
            cartItems.innerHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>€${item.price.toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>€${(item.price * item.quantity).toFixed(2)}</td>
                    <td><button class="btn btn-danger btn-sm remove-btn" data-id="${item.id}">Remove</button></td>
                </tr>
            `;
        });

        cartTotal.innerHTML = `
            <h4>Total: €${total.toFixed(2)}</h4>
            <button class="btn btn-success w-100 mt-2" onclick="checkout()">Checkout</button>
        `;
    }

    // Ensure remove buttons work
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.dataset.id);
            removeFromCart(productId);
        });
    });

    updateCartCount();
}

document.addEventListener("DOMContentLoaded", function () {
    const stripe = Stripe("pk_test_51QqzbDQRh7jNBCuPmcSjXha8QMXWHVFE55ZBVPmCsUS8iGpBbJgJe0xWdQVKylHggAezdRDUZo4qlnVkfhQYdl3T00Uj2u1HZW"); // 🔥 Replace with your Stripe test key
    const checkoutButton = document.getElementById("checkout-button");

    checkoutButton.addEventListener("click", async function () {
        const response = await fetch("/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: cart }), // 🛒 Pass cart items
        });

        const session = await response.json();

        // Redirect to Stripe Checkout
        stripe.redirectToCheckout({ sessionId: session.id });
    });
});
