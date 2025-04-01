const catalogButton = document.getElementById('catalog');
const catalogItems = document.getElementById('menu-wrap');
const buttons = document.querySelectorAll('.add-to-cart');
const searchButtons=document.querySelectorAll('.btn-search');

catalogButton.addEventListener('click', () => {
    catalogItems.classList.toggle('open');
});

searchButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const searchInput = document.getElementById("searchInput").value.toLowerCase();
        window.location.assign(`catalog-category.html?search=${searchInput}`);
    })
})

buttons.forEach(button => {
    button.addEventListener('click',  function(event) {
        const user=JSON.parse(localStorage.getItem("user"))
        if(!user){
            window.location.assign("profile.html");
            return;
        }
        const email=user.email;
        const product = event.target.closest('.product-container');
        const productId = product.getAttribute('data-id');

        addCart(email,productId);
    });
});

let cart=[];
let products =[]
let tagProducts=[];
let favorites=[];
let currentIndex = 0;
const itemsPerPage = 3;

document.addEventListener("DOMContentLoaded", async function() {
    const path = window.location.pathname;
    products = await getProductsData();
    console.log("Продукти завантажені:", products);
    const user=JSON.parse(localStorage.getItem("user"))
    if(user){
        const userEmail=user.email;
        cart=await getCart(userEmail);
        favorites=await getFavorites(userEmail);
        countCartItems();
    }
    if (path.includes("index.html")) {
        generateSlider();
    } else if (path.includes("product.html")) {
        loadProductInfo();
    } else if(path.includes("catalog.html")){
        generateSlider()
    }
    else if (path.includes("catalog-category.html")) {
        loadCategory();
    } else if (path.includes("cart.html")) {
        if(user){
            loadCart();
        }
        else  window.location.assign("profile.html");
    } else if (path.includes("favorites.html")) {
        if(user){
            loadFavorites();
        }
        else  window.location.assign("profile.html");
    } else if(path.includes("profile.html")) {
        document.getElementById('login-form').addEventListener('submit', loginUser);
        document.getElementById('register-form').addEventListener('submit', registerUser);
        checkUserLogin();
    }

});

function countCartItems() {
    document.getElementById("cart-total").innerText=cart.length.toString();
}

async function addCart(email, productId, quantity=1) {
    const response = await fetch("http://localhost:3000/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, productId, quantity })
    });

    const data = await response.json();
    if (response.ok) {
        alert(data.message);
        let product = cart.find(item => item.productId === productId);

        if (product) {
            product.quantity += quantity;
        } else {
            cart.push({ productId, quantity });
        }
        countCartItems();
    } else {
        alert(data.message);
    }
}

async function getCart(userEmail) {
    try {
        const response = await fetch(`http://localhost:3000/cart/${userEmail}`);
        const data = await response.json();
        return  data.items;
    } catch (error) {
        console.error('Помилка при завантаженні товарів:', error);
        return [];
    }
}

async function processOrder() {
    const email = JSON.parse(localStorage.getItem("user")).email;
    const response = await fetch("http://localhost:3000/order", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email})
    });

    const data = await response.json();
    if (response.ok) {
        alert(data.message);
        cart=[];
        countCartItems();
        loadCart();
    } else {
        alert(data.message);
        alert(data.error);
    }
}

function buttonAddFavorites(){
    const user=JSON.parse(localStorage.getItem("user"))
    if(!user){
        window.location.assign("profile.html");
        return;
    }
    const email=user.email;
    const product = document.querySelectorAll('.product-container')
    const productId = product[0].getAttribute('data-id');

    addFavorites(email,productId);
}

async function addFavorites(email, productId) {
    let product = favorites.find(item => item.productId === productId);
    if (product) {
        await removeFromFavorites(productId);
        return;
    }
    else {
        const response = await fetch("http://localhost:3000/favorites", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email, productId})
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            favorites.push({productId});
        } else {
            alert(data.message);
        }
    }
}

async function getFavorites(userEmail) {
    try {
        const response = await fetch(`http://localhost:3000/favorites/${userEmail}`);
        const data = await response.json();
        return  data.items;
    } catch (error) {
        console.error('Помилка при завантаженні товарів:', error);
        return [];
    }
}

async function removeFromCart(productId) {
    await fetch('http://localhost:3000/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: JSON.parse(localStorage.getItem("user")).email,
            productId: productId
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Товар видалено') {
                cart = cart.filter(item => item.productId !== productId);
                loadCart();
                console.log('Товар успішно видалено з кошика!');
            } else {
                console.error('Помилка:', data.message);
            }
        })
        .catch(error => console.error('Помилка сервера:', error));
}

function loadCart() {
    let cartContainer = document.getElementById("cart-items");
    let totalPrice = 0;
    cartContainer.innerHTML = '';

    if (cart.length < 1) {
        document.getElementById("cart-items").innerHTML = "<p>Кошик порожній</p>";
        document.getElementById("total-price").innerText = "0";
        document.getElementById("checkout-btn").style.display = "none";
        return;
    }

    cart.forEach(cartItem => {
        let product = products.find(p => p.id === cartItem.productId);
        if (!product) return;

        let item = document.createElement("li");
        item.classList.add("cart-item");
        item.dataset.id = cartItem.productId;
        item.innerHTML = `
        <a class="item-link" href=${product.link}>
        <img src="${product.image}" alt="${product.title}">
        <div class="item-details">
            <p class="item-title">${product.title}</p>
            <p class="item-price">${product.price}</p>
        </div>
        </a>
         <div class="quantity-controls">
            <button class="quantity-btn quantity-btn-minus" onclick="updateQuantity('${cartItem.productId}', -1)">-</button>
            <input type="number" class="quantity-input" data-id=${cartItem.productId}  value="${cartItem.quantity}" min="1" onchange="changeQuantity('${cartItem.productId}', this.value)">
            <button class="quantity-btn quantity-btn-plus" onclick="updateQuantity('${cartItem.productId}', 1)">+</button>
        </div>
        <button class="remove-btn" onclick="removeFromCart('${cartItem.productId}')">Видалити</button>
    `;
        cartContainer.appendChild(item);

        let priceString = product.price.replace(/\s+/g, '');
        totalPrice += parseFloat(priceString) * parseFloat(cartItem.quantity);
    });

    document.getElementById("total-price").innerText = totalPrice.toLocaleString('uk-UA');
}

function updateQuantity(productId, quantity) {
    let inputField = document.querySelector(`.quantity-input[data-id='${productId}']`);
    if (!inputField) return;

    inputField.value = Math.max(1, +inputField.value + quantity);
    inputField.dispatchEvent(new Event('change'));
}

function updateTotalPrice() {
    let totalPrice = 0;
    cart.forEach(cartItem => {
        let product = products.find(p => p.id === cartItem.productId);
        if (!product) return;

        let priceString = product.price.replace(/\s+/g, '');
        totalPrice += parseFloat(priceString) * parseFloat(cartItem.quantity);
    });

    document.getElementById("total-price").innerText = totalPrice.toLocaleString('uk-UA');
}

async function changeQuantity(productId, quantity) {
    if(quantity>0) {
        let cartItem = cart.find(item => item.productId === productId);

        await fetch('http://localhost:3000/cart/update-quantity', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: JSON.parse(localStorage.getItem("user")).email,
                productId: productId,
                quantity: quantity,
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Кількість оновлено') {
                    console.log('Кількість товару успішно оновлена!');
                } else {
                    console.error('Помилка:', data.message);
                }
            })
            .catch(error => console.error('Помилка сервера:', error));
        cartItem.quantity = quantity;
        updateTotalPrice();
    }
    else {
        let inputField = document.querySelector(`.quantity-input[data-id='${productId}']`)
        if (!inputField) return;
        inputField.value = 1;
    }
}

function loadFavorites() {
    const container = document.getElementById('favorites-items');
    container.innerHTML = '';

    if (favorites.length === 0) {
        container.innerHTML = '<p>У вас немає улюблених товарів.</p>';
    } else {
        favorites.forEach(favoriteItem => {
            let product = products.find(p => p.id === favoriteItem.productId);
            if (!product) return;

            const item = document.createElement('li');
            item.classList.add('favorited-item');
            item.dataset.id = favoriteItem.productId;
            item.innerHTML = `
                <a class="item-link" href=${product.link}>
                <img src="${product.image}" alt="${product.name}">
                 <div class="item-details">
                    <p class="item-title">${product.title}</p>
                    <p class="item-price">${product.price}</p>
                </div>
                </a>
                <button class="remove-btn" onclick="removeFromFavorites('${favoriteItem.productId}')">Видалити з улюблених</button>
            `;
            container.appendChild(item);
        });
    }
}

async function removeFromFavorites(productId) {
    await fetch('http://localhost:3000/favorites', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            email: JSON.parse(localStorage.getItem("user")).email,
            productId: productId
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Товар видалено') {
                favorites = favorites.filter(item => item.productId !== productId);
                loadFavorites();
                console.log('Товар успішно видалено з улюблених!');
            } else {
                console.error('Помилка:', data.message);
            }
        })
        .catch(error => console.error('Помилка сервера:', error));


}

// Завантажуємо дані про продукти
async function getProductsData() {
    try {
        const response = await fetch('http://localhost:3000/products');
        const data = await response.json();
        return data.furniture;
    } catch (error) {
        console.error('Помилка при завантаженні товарів:', error);
        return [];
    }
}

// Генерація слайдера
function generateSlider() {
    const offerList = document.querySelector('.offer-list');
    offerList.innerHTML = '';
    if(window.location.pathname.includes("index.html")) {
        for (let i = 0; i < products.length; i++) {
            if (!products[i].tags || products[i].tags.length === 0) continue;
            tagProducts.push(products[i]);
        }
    }
    else {
        const viewHistory=getViewHistory();
        tagProducts=products.filter(item => viewHistory.includes(item.id));
        console.log(tagProducts);
    }
    if(tagProducts.length === 0) {
        document.querySelector('.prev').style.display = 'none';
        document.querySelector('.next').style.display = 'none';
    }

    for (let i = currentIndex; i < currentIndex + itemsPerPage; i++) {
        if (i >= tagProducts.length) break;
        const product = tagProducts[i];

        const offerItem = document.createElement('div');
        offerItem.classList.add('offer-item');

        let badgesHTML = '';
        if (product.tags && product.tags.length > 0) {
            product.tags.forEach(tag => {
                if (tag.startsWith("-")) {
                    badgesHTML += `<div class="discount-badge">${tag}</div>`;
                } else if (tag === "Хіт") {
                    badgesHTML += `<div class="hit-badge">${tag}</div>`;
                } else if (tag === "Новинка") {
                    badgesHTML += `<div class="new-arrival-badge">${tag}</div>`;
                }
            });
        }

        offerItem.innerHTML = `
            <div class="offer-item__image">
                <img src="${product.image}" alt="${product.title}">
            </div>
            <h3>${product.title}</h3>
            <p>${product.price}</p>
            ${badgesHTML} 
            <a href="${product.link}">Переглянути товар</a>
        `;
        offerList.appendChild(offerItem);
    }
}

// Функція для переміщення слайду
function moveSlide(direction) {
    const totalSlides = tagProducts.length;

    currentIndex += direction * itemsPerPage;

    if (currentIndex < 0) {
        currentIndex = totalSlides - itemsPerPage;
    } else if (currentIndex >= totalSlides) {
        currentIndex = 0;
    }

    generateSlider();
}

//функція для загрузки всіх товарів для категорії
function loadCategory(){
    const productsContainer = document.getElementById("products-container");
    const categoryTitle = document.getElementById("category-title");

    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    let parsedData;
            if(category) {
                parsedData = parseFurnitureData(products, category);
                categoryTitle.textContent = category.replace("-", " ");
            }
            else {
                const search=params.get("search");
                parsedData = parseSearchFurnitureData(products, search);
                document.getElementById("category-p").innerHTML = "Товари за запитом: <span id=\"category-title\"></span>";
                document.getElementById("category-title").textContent = search;
            }

            if (parsedData.length > 0) {
                productsContainer.innerHTML = parsedData.map(product => {
                    let badgesHTML = '';

                    if (product.tags && product.tags.length > 0) {
                        product.tags.forEach(tag => {
                            if (tag.startsWith("-")) {
                                badgesHTML += `<div class="discount-badge">${tag}</div>`;
                            } else if (tag === "Хіт") {
                                badgesHTML += `<div class="hit-badge">${tag}</div>`;
                            } else if (tag === "Новинка") {
                                badgesHTML += `<div class="new-arrival-badge">${tag}</div>`;
                            }
                        });
                    }

                    return `
                        <div class="offer-item">
                            <img src="${product.image}" alt="${product.title}">
                            <h3 class="product-title">${product.title}</h3>
                            <p class="product-price">${product.price}</p>
                            ${badgesHTML} 
                            <a href="${product.link}">Детальніше</a>
                        </div>
                    `;
                }).join("");
            } else {
                productsContainer.innerHTML = "<p>Товари не знайдені!</p>";
            }
}

function searchFurniture() {
    const searchInput = document.getElementById("searchInput").value.toLowerCase();
    const suggestionsList = document.getElementById("suggestions");
    const moreResults = document.getElementById("moreResults");
    suggestionsList.innerHTML = '';
    moreResults.innerHTML = '';
    suggestionsList.style.display = "none";
    moreResults.style.display = 'none';

    if (!searchInput) {
        return;
    }


    const filteredProducts = parseSearchFurnitureData(products, searchInput);

    const maxSuggestions = 5;

    filteredProducts.slice(0, maxSuggestions).forEach(product => {
        const suggestionItem = document.createElement("li");
        suggestionItem.classList.add("suggestion-item");

        const img = document.createElement("img");
        img.src = product.image;
        img.alt = product.title;

        const text = document.createElement("span");
        text.textContent = `${product.title} - ${product.price} грн`;

        suggestionItem.appendChild(img);
        suggestionItem.appendChild(text);
        suggestionItem.onclick = () => window.location.href = product.link;

        suggestionsList.appendChild(suggestionItem);
    });

    if(filteredProducts.length > 0) {
        suggestionsList.style.display = "block";
    }
    if (filteredProducts.length > maxSuggestions) {
        const resultText = `Знайдено ${filteredProducts.length} товарів`;
        moreResults.innerHTML = `<span onclick="window.location.href='catalog-category.html?search=${searchInput}'" class="more-results">${resultText}</span>`;
        moreResults.style.display = 'block';
    }
}

function hideSuggestions() {
    setTimeout(() => {
        const suggestionsList = document.getElementById("suggestions");
        suggestionsList.style.display = "none";
    }, 200);
}

function parseSearchFurnitureData(jsonData, search) {
    return jsonData.filter(product => product.title.toLowerCase().includes(search.toLowerCase()));
}

//Парсинг JSON
function parseFurnitureData(jsonData, category) {
    return jsonData.filter(product => product.category === category);
}

//Загрузка інфи про товар
function loadProductInfo(){
    const productContainer = document.querySelectorAll(".product-container");
    const productTitle = document.getElementById("product-title");
    const productImage = document.getElementById("product-image");
    const productPrice = document.getElementById("product-price");
    const productCharacteristics = document.getElementById("product-characteristics");
    document.getElementById('return-btn').addEventListener('click', function() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'index.html';
        }
    });

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("product_id");

    if (productId) {
        addToViewHistory(productId);
                const product = products.find(item => item.id === productId);
                if (product) {
                    productContainer[0].setAttribute("data-id", productId);
                    productTitle.textContent = product.title;
                    productImage.src = product.image;
                    productImage.alt = product.title;
                    productPrice.textContent = product.price;

                    const characteristics = product.characteristics;
                    for (const [key, value] of Object.entries(characteristics)) {
                        const listItem = document.createElement("li");
                        listItem.textContent = `${key}: ${value}`;
                        productCharacteristics.appendChild(listItem);
                    }
                } else {
                    productTitle.textContent = "Товар не знайдений";
                }
    } else {
        productTitle.textContent = "Немає ID товару в URL";
    }
}

function addToViewHistory(productId) {
    let viewHistory = JSON.parse(localStorage.getItem('viewHistory')) || [];

    if (!viewHistory.includes(productId)) {
        viewHistory.push(productId);

        localStorage.setItem('viewHistory', JSON.stringify(viewHistory));
    }
}

function getViewHistory() {
    let viewHistory = JSON.parse(localStorage.getItem('viewHistory')) || [];

    console.log(viewHistory);
    return viewHistory;
}


//Authorization
const userName = document.getElementById('userName');
const userFirstName = document.getElementById('userFirstName');
const userEmail = document.getElementById('userEmail');
const userPassword = document.getElementById('userPassword');
const profileInfo = document.getElementById('profile');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

function checkUserLogin() {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
        const user=JSON.parse(loggedInUser);
                userName.value = user.name;
                userEmail.value = user.email;
                userFirstName.value=user.firstname;
                userPassword.value=user.password;
                profileInfo.style.display = 'block';
                loginForm.style.display = 'none';
                registerForm.style.display = 'none';

    } else {
        profileInfo.style.display = 'none';
        loginForm.style.display = 'block';
    }
}

function showRegisterForm() {
    profileInfo.style.display = 'none'
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
}


function showLoginForm() {
    profileInfo.style.display = 'none'
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
}

function showUserProfile(user) {
    profileInfo.style.display = 'block';
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    userName.value = user.name;
    userEmail.value = user.email;
    userFirstName.value=user.firstname;
    userPassword.value=user.password;
}

async function registerUser(event) {
    event.preventDefault();

    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const name = document.getElementById('registerName').value;
    const firstname = document.getElementById('registerFirstName').value;


    const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, firstname })
    });

    const data = await response.json();
    if (response.ok) {
        alert(data.message);
        localStorage.setItem("user", JSON.stringify(data.newUser));
        showUserProfile(data.newUser);
    } else {
        alert(data.message);
    }
}


async function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
        alert(data.message);
        localStorage.setItem("user", JSON.stringify(data.user));
        showUserProfile(data.user);
    } else {
        alert(data.message);
    }
}

function editProfile() {
    const userFirstName=document.getElementById('userFirstName');
    const userName=document.getElementById('userName');
    const userPassword=document.getElementById('userPassword');
    userFirstName.disabled = false;
    userName.disabled = false;
    userPassword.disabled = false;
    document.getElementById("edit-profile").style.display = "none";
    document.getElementById("save-cancel-buttons").style.display = "block";
}

function saveProfile() {
    let firstname = document.getElementById("userFirstName").value;
    let name = document.getElementById("userName").value;
    let email=document.getElementById("userEmail").value;
    let password = document.getElementById("userPassword").value;


    fetch('http://localhost:3000/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstname, email, name, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Профіль оновлено") {
                alert("Дані успішно оновлені!");
                localStorage.setItem("user", JSON.stringify({ email, password, name, firstname}));
                cancelEdit();
            } else {
                alert("Помилка при оновленні профілю!");
            }
        })
        .catch(error => console.error('Помилка:', error));
}

function cancelEdit() {
    checkUserLogin();
    document.getElementById("userFirstName").disabled = true;
    document.getElementById("userName").disabled = true;
    document.getElementById("userEmail").disabled = true;
    document.getElementById("userPassword").disabled = true;

    document.getElementById("edit-profile").style.display = "block";
    document.getElementById("save-cancel-buttons").style.display = "none";
}


function logoutUser() {
    localStorage.removeItem('user');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';

    profileInfo.style.display = 'none';
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
}










