const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к файлу базы данных
const dbPath = path.join(__dirname, 'database', 'website.db');

// Инициализируем базу данных
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Ошибка подключения к БД:', err.message);
    } else {
        console.log('✅ SQLite база подключена:', dbPath);
    }
});

// Включаем поддержку внешних ключей
db.run(`PRAGMA foreign_keys = ON`);

// Функция инициализации таблиц
function initTables() {
    return new Promise((resolve, reject) => {
        db.exec(`
            -- Таблица Users
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                login TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                role TEXT DEFAULT 'reader' CHECK(role IN ('reader', 'author', 'editor', 'admin')),
                registration_date DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Таблица Authors
            CREATE TABLE IF NOT EXISTS authors (
                author_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                full_name TEXT,
                biography TEXT,
                avatar TEXT,
                contacts TEXT,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );

            -- Таблица Categories
            CREATE TABLE IF NOT EXISTS categories (
                category_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL
            );

            -- Таблица Posts
            CREATE TABLE IF NOT EXISTS posts (
                post_id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                published_at DATETIME,
                status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
                views INTEGER DEFAULT 0,
                author_id INTEGER,
                category_id INTEGER,
                FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE SET NULL,
                FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
            );

            -- Таблица Media
            CREATE TABLE IF NOT EXISTS media (
                media_id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id INTEGER,
                file_path TEXT NOT NULL,
                type TEXT,
                size INTEGER,
                FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
            );

            -- Таблица Tasks
            CREATE TABLE IF NOT EXISTS tasks (
                task_id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                deadline DATETIME,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
                assigner_id INTEGER,
                executor_id INTEGER,
                FOREIGN KEY (assigner_id) REFERENCES users(user_id),
                FOREIGN KEY (executor_id) REFERENCES users(user_id)
            );
        `, (err) => {
            if (err) {
                console.error('❌ Ошибка создания таблиц:', err.message);
                reject(err);
            } else {
                console.log('✅ Таблицы созданы/проверены');
                resolve();
            }
        });
    });
}

// Инициализируем при загрузке
initTables();

module.exports = { db };