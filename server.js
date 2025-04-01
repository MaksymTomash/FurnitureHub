const express = require('express');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const USERS_FILE = 'users.json';
const CART_FILE = 'cart.json';
const FAVORITES_FILE = 'favorites.json';
const PRODUCTS_FILE = 'products.json';

// Завантаження даних з файлу
const loadData = (file) => {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf8'));
};

// Збереження даних у файл
const saveData = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};



// Реєстрація користувача
app.post('/register', (req, res) => {
    const users= loadData(USERS_FILE);
    const { email, password, name, firstname } = req.body;

    if (users.find(user => user.email === email)) {
        return res.status(400).json({ message: 'Цей email вже використовується' });
    }

    const newUser = { email, password, name, firstname };
    users.push(newUser);
    saveData(USERS_FILE, users);

    res.json({ message: 'Реєстрація успішна', newUser });
});

// Логін
app.post('/login', (req, res) => {
    const users= loadData(USERS_FILE);
    const { email, password } = req.body;

    const user = users.find(user => user.email === email && user.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Невірний email або пароль' });
    }

    res.json({ message: 'Вхід успішний', user });
});


app.get('/', (req, res) => {
    res.json({ message: 'ОК' });
});

// Отримати список товарів
app.get('/products', (req, res) => {
    const products = loadData(PRODUCTS_FILE);
    res.json(products);
});

// Додавання до кошика
app.post('/cart', (req, res) => {
    const { email, productId, quantity } = req.body;

    let cartData = loadData(CART_FILE);

    let userCart = cartData.find(item => item.email === email);

    if (!userCart) {
        userCart = { email, items: [] };
        cartData.push(userCart);
    }

    let product = userCart.items.find(item => item.productId === productId);

    if (product) {
        product.quantity += quantity;
    } else {
        userCart.items.push({ productId, quantity });
    }

    saveData(CART_FILE, cartData);

    res.json({ message: 'Товар додано до кошика', cart: userCart });
});

app.get('/cart/:email', (req, res) => {
    const email = req.params.email;
    const cartData = loadData(CART_FILE);

    const userCart = cartData.find(item => item.email === email);

    if (!userCart||userCart.items.length < 1) {
        return res.json({ message: 'Кошик порожній', items: [] });
    }

    res.json(userCart);
});

app.delete('/cart', (req, res) => {
    const { email, productId } = req.body;

    let cartData = loadData(CART_FILE);

    let userCart = cartData.find(item => item.email === email);

    if (!userCart) {
        return res.status(404).json({ message: 'Кошик не знайдено' });
    }

    userCart.items = userCart.items.filter(item => item.productId !== productId);

    saveData(CART_FILE, cartData);

    res.json({ message: 'Товар видалено', cart: userCart });
});

app.put('/cart/update-quantity', (req, res) => {
    const { email, productId, quantity } = req.body;

    let cartData = loadData(CART_FILE);
    let userCart = cartData.find(item => item.email === email);

    if (!userCart) {
        return res.status(404).json({ message: 'Кошик не знайдено' });
    }

    let product = userCart.items.find(item => item.productId === productId);

    if (!product) {
        return res.status(404).json({ message: 'Товар не знайдено в кошику' });
    }

    product.quantity = quantity;

    saveData(CART_FILE, cartData);

    res.json({ message: 'Кількість оновлено', cart: userCart });
});

app.post('/order', async (req, res) => {
    const {email} = req.body;

    let cartData = loadData(CART_FILE);
    let productsData = loadData(PRODUCTS_FILE).furniture;

    let userCart = cartData.find(item => item.email === email);

    let totalSum = 0;
    let receipt = `Чек для ${email}:\n\n`;

    userCart.items.forEach(cartItem => {
        let product = productsData.find(prod => prod.id === cartItem.productId);
        if (!product) return;

        let priceString = product.price.replace(/\s+/g, '');
        let totalPrice = parseFloat(priceString) * parseFloat(cartItem.quantity);
        totalSum += totalPrice;

        receipt += `${product.title} - ${cartItem.quantity} шт. x ${product.price} грн = ${totalPrice} грн\n`;
    });
    receipt += `\nЗагальна сума: ${totalSum.toLocaleString('uk-UA')} грн`;

    try {
        await sendEmail(email, receipt);
    } catch (error) {
        return res.status(500).json({message: 'Помилка при надсиланні email', error});
    }

    userCart.items = [];
    saveData(CART_FILE, cartData);

    res.json({message: 'Чек надіслано, кошик очищено'});
});

async function sendEmail(to, receipt) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'maks.tomash4588@gmail.com',
            pass: 'jpjpqpwwkxxfidll'
        }
    });

    let htmlReceipt = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #333; text-align: center;">🛍️ Ваш чек</h2>
            <p><strong>Дякуємо за покупку!</strong> Ось ваш чек:</p>
            <pre style="background: #f8f8f8; padding: 10px; border-radius: 5px; white-space: pre-wrap;">${receipt}</pre>
            <hr>
            <p style="text-align: center; color: #666;">🛒 <strong>FurnitureHub</strong> – купуйте комфортно!</p>
        </div>
    `;

    let mailOptions = {
        from: 'FurnitureHub@gmail.com',
        to: to,
        subject: 'Ваш чек з FurnitureHub',
        html: htmlReceipt
    };

    await transporter.sendMail(mailOptions);
}


app.delete('/favorites', (req, res) => {
    const { email, productId } = req.body;

    let favoritesData = loadData(FAVORITES_FILE);

    let userFavorites = favoritesData.find(item => item.email === email);

    if (!userFavorites) {
        return res.status(404).json({ message: 'Улюблене не знайдено' });
    }

    userFavorites.items = userFavorites.items.filter(item => item.productId !== productId);

    saveData(FAVORITES_FILE, favoritesData);

    res.json({ message: 'Товар видалено', favorites: userFavorites });
});

app.post('/favorites', (req, res) => {
    const { email, productId } = req.body;

    let favoritesData = loadData(FAVORITES_FILE);

    let userFavorites = favoritesData.find(item => item.email === email);

    if (!userFavorites) {
        userFavorites = { email, items: [] };
        favoritesData.push(userFavorites);
    }

    userFavorites.items.push({ productId});

    saveData(FAVORITES_FILE, favoritesData);

    res.json({ message: 'Товар додано у улюблене' });
});

app.get('/favorites/:email', (req, res) => {
    const email = req.params.email;
    const favoritesData = loadData(FAVORITES_FILE);

    const userFavorites = favoritesData.find(item => item.email === email);

    if (!userFavorites||userFavorites.items.length < 1) {
        return res.json({ message: 'Улюблені порожні', items: [] });
    }

    res.json(userFavorites);
});

app.put('/update-profile', (req, res) => {
    const { firstname, email, name, password } = req.body;

    let userData = loadData(USERS_FILE);
    let profileData = userData.find(user => user.email === email);

    profileData.firstname = firstname;
    profileData.name = name;
    profileData.password = password;

    saveData(USERS_FILE, userData);

    res.json({ message: 'Профіль оновлено', profile: profileData });
});

app.listen(PORT, () => {
    console.log(`Сервер працює на http://localhost:${PORT}`);
});
