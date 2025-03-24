const catalogButton = document.getElementById('catalog');
const catalogItems = document.getElementById('menu-wrap');


catalogButton.addEventListener('click', () => {
    catalogItems.classList.toggle('open');
});


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
                productsContainer.innerHTML = parsedData.map(product => `
                    <div class="product-item">
                        <img src="${product.image}" alt="${product.title}">
                        <h3>${product.title}</h3>
                        <p>${product.price}</p>
                        <a href="${product.link}">Детальніше</a>
                    </div>
                `).join("");
            } else {
                productsContainer.innerHTML = "<p>Товари не знайдені!</p>";
            }
        })
        .catch(error => {
            console.error("Помилка при завантаженні JSON:", error);
        });
});

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


