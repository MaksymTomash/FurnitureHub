const catalogButton = document.getElementById('catalog');
const catalogItems = document.getElementById('menu-wrap');

catalogButton.addEventListener('click', () => {
    catalogItems.classList.toggle('open');
});

//Слайдер топ товарів
let products = [];
let tagProducts=[];
let currentIndex = 0;
const itemsPerPage = 3;

// Завантажуємо дані про продукти
function getProductsData() {
    return fetch('products.json')
        .then(response => response.json())
        .then(data => {
            products = data.furniture;
            console.log('Дані продуктів:', products);
            generateSlider();
        })
        .catch(error => console.error('Помилка при завантаженні товарів:', error));
}

// Генерація слайдера
function generateSlider() {
    const offerList = document.querySelector('.offer-list');
    offerList.innerHTML = '';

    for (let i = 0; i < products.length; i++) {
        if (!products[i].tags || products[i].tags.length === 0) continue;
        tagProducts.push(products[i]);
    }

    for (let i = currentIndex; i < currentIndex + itemsPerPage; i++) {
        if (i >= tagProducts.length) break;
        const product = tagProducts[i];

        const offerItem = document.createElement('div');
        offerItem.classList.add('offer-item');

        let badgesHTML = '';
        product.tags.forEach(tag => {
            if (tag.startsWith("-")) {
                badgesHTML += `<div class="discount-badge">${tag}</div>`;
            } else if (tag === "Хіт") {
                badgesHTML += `<div class="hit-badge">${tag}</div>`;
            } else if (tag === "Новинка") {
                badgesHTML += `<div class="new-arrival-badge">${tag}</div>`;
            }
        });

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

document.addEventListener("DOMContentLoaded", function() {
    getProductsData();
});

//функція для загрузки всіх товарів для категорії
document.addEventListener("DOMContentLoaded", function () {
    const productsContainer = document.getElementById("products-container");
    const categoryTitle = document.getElementById("category-title");

    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");

    fetch('products.json')
        .then(response => response.json())
        .then(data => {
            const parsedData = parseFurnitureData(data, category);
            categoryTitle.textContent = category.replace("-", " ");

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
                            <h3>${product.title}</h3>
                            <p>${product.price}</p>
                            ${badgesHTML} 
                            <a href="${product.link}">Детальніше</a>
                        </div>
                    `;
                }).join("");
            } else {
                productsContainer.innerHTML = "<p>Товари не знайдені!</p>";
            }
        })
        .catch(error => {
            console.error("Помилка при завантаженні JSON:", error);
        });
});

//Парсинг JSON
function parseFurnitureData(jsonData, category) {
    if (!Array.isArray(jsonData.furniture)) {
        console.error("Очікується масив у 'furniture', але отримано:", jsonData.furniture);
        return [];
    }

    return jsonData.furniture.filter(product => product.category === category)
        .map(product => ({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            link: product.link,
            tags: product.tags
        }));
}

//Загрузка інфи про товар
document.addEventListener("DOMContentLoaded", function() {
    const productTitle = document.getElementById("product-title");
    const productImage = document.getElementById("product-image");
    const productPrice = document.getElementById("product-price");
    const productCharacteristics = document.getElementById("product-characteristics");

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("product_id");

    if (productId) {
        fetch('products.json')
            .then(response => response.json())
            .then(data => {
                const product = data.furniture.find(item => item.id === productId);

                if (product) {
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
            })
            .catch(error => {
                console.error("Помилка при завантаженні даних:", error);
            });
    } else {
        productTitle.textContent = "Немає ID товару в URL";
    }
});


//Authorization
const userName = document.getElementById('userName');
const userFirstName = document.getElementById('userFirstName');
const userEmail = document.getElementById('userEmail');
const userPassword = document.getElementById('userPassword');
const profileInfo = document.getElementById('profile');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

function getUsersData() {
    return fetch('users.json')
        .then(response => response.json())
        .then(data => data.users)
        .catch(error => console.error('Помилка при завантаженні користувачів:', error));
}

function checkUserLogin() {
    const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');

    if (loggedInUserEmail) {
        getUsersData().then(users => {
            const user = users.find(user => user.email === loggedInUserEmail);
            if (user) {
                userName.value = user.name;
                userEmail.value = user.email;
                userFirstName.value=user.firstname;
                userPassword.value=user.password;
                profileInfo.style.display = 'block';
                loginForm.style.display = 'none';
                registerForm.style.display = 'none';
            }
        });
    } else {
        profileInfo.style.display = 'none';
        loginForm.style.display = 'block';
    }
}

function showRegisterForm() {
    profileInfo.style.display = 'none'
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
}


function showLoginForm() {
    profileInfo.style.display = 'none'
    loginForm.style.display = 'none';
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

function registerUser(event) {
    event.preventDefault();

    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const name = document.getElementById('registerName').value;
    const firstname = document.getElementById('registerFirstName').value;

    getUsersData().then(users => {
        const userExists = users.find(user => user.email === email);
        if (userExists) {
            alert("Цей email вже використовується.");
        } else {
            const newUser = [{ email:email, password: password, name:name, firstname:firstname }];
            alert("Реєстрація успішна! Тепер ви можете увійти.");

            showLoginForm();
        }
    });
}


function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    getUsersData().then(users => {
        const user = users.find(user => user.email === email && user.password === password);
        if (user) {
            localStorage.setItem('loggedInUserEmail', email);
            showUserProfile(user);
        } else {
            alert("Невірний email або пароль.");
        }
    });
}


function logoutUser() {
    localStorage.removeItem('loggedInUserEmail');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';

    profileInfo.style.display = 'none';
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
}

document.getElementById('login-form').addEventListener('submit', loginUser);
document.getElementById('register-form').addEventListener('submit', registerUser);

checkUserLogin();








