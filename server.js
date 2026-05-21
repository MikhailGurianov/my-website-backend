const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const { db } = require('./db');

const app = express();

// ✅ Разрешаем CORS для Live Server
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json());

// 🟢 РЕГИСТРАЦИЯ
// 🟢 РЕГИСТРАЦИЯ
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Заполните все поля' });
        }

        const hash = await bcrypt.hash(password, 10);

        db.run(
            `INSERT INTO users (login, password_hash, email, role) VALUES (?, ?, ?, 'reader')`,
            [name, hash, email],  // ← ИСПРАВЛЕНО: name, hash, email
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(409).json({ error: 'Email уже зарегистрирован' });
                    }
                    console.error('Ошибка БД:', err.message);
                    return res.status(500).json({ error: 'Ошибка сервера' });
                }
                console.log('✅ Регистрация успешна, userId:', this.lastID);
                res.json({ success: true, userId: this.lastID });
            }
        );
    } catch (err) {
        console.error('Ошибка регистрации:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});
// 🟢 ПОЛУЧЕНИЕ ПРОФИЛЯ
app.get('/api/profile/:userId', (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        db.get(
            `SELECT user_id, login, email, role, registration_date FROM users WHERE user_id = ?`,
            [userId],
            (err, user) => {
                if (err) {
                    console.error('Ошибка БД:', err.message);
                    return res.status(500).json({ error: 'Ошибка сервера' });
                }
                if (!user) {
                    return res.status(404).json({ error: 'Пользователь не найден' });
                }
                res.json(user);
            }
        );
    } catch (err) {
        console.error('Ошибка профиля:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 🟢 ВХОД (LOGIN)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Введите email и пароль' });
        }

        db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
            if (err) {
                console.error('Ошибка БД:', err.message);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }
            if (!user) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }

            const valid = await bcrypt.compare(password, user.password_hash);
            if (!valid) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }

            res.json({ 
                success: true, 
                userId: user.user_id,
                email: user.email,
                role: user.role
            });
        });
    } catch (err) {
        console.error('Ошибка входа:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Бэкенд запущен: http://localhost:${PORT}`);
    console.log(`📁 База данных: ${path.join(__dirname, 'database', 'website.db')}`);
});