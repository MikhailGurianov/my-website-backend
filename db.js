const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database', 'website.db');

let db;

// Инициализация базы данных
async function initDatabase() {
    try {
        const SQL = await initSqlJs();
        
        // Проверяем, существует ли файл БД
        if (fs.existsSync(dbPath)) {
            const fileBuffer = fs.readFileSync(dbPath);
            db = new SQL.Database(fileBuffer);
            console.log('✅ SQLite база загружена из файла');
        } else {
            db = new SQL.Database();
            console.log('✅ Создана новая SQLite база');
        }
        
        // Создаём таблицы
        initTables();
        
    } catch (err) {
        console.error('❌ Ошибка инициализации БД:', err);
    }
}

function initTables() {
    try {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                login TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                role TEXT DEFAULT 'reader' CHECK(role IN ('reader', 'author', 'editor', 'admin')),
                registration_date DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS authors (
                author_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                full_name TEXT,
                biography TEXT,
                avatar TEXT,
                contacts TEXT,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS categories (
                category_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL
            )
        `);
        
        db.run(`
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
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS media (
                media_id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id INTEGER,
                file_path TEXT NOT NULL,
                type TEXT,
                size INTEGER,
                FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS tasks (
                task_id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                deadline DATETIME,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
                assigner_id INTEGER,
                executor_id INTEGER,
                FOREIGN KEY (assigner_id) REFERENCES users(user_id),
                FOREIGN KEY (executor_id) REFERENCES users(user_id)
            )
        `);
        
        // Сохраняем БД на диск
        saveDatabase();
        
        console.log('✅ Таблицы созданы/проверены');
    } catch (err) {
        console.error('❌ Ошибка создания таблиц:', err.message);
    }
}

// Функция сохранения БД на диск
function saveDatabase() {
    try {
        const data = db.export();
        const buffer = Buffer.from(data);
        
        // Создаём папку database, если нет
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        
        fs.writeFileSync(dbPath, buffer);
    } catch (err) {
        console.error('❌ Ошибка сохранения БД:', err);
    }
}

// Обёртки для совместимости с твоим кодом
const dbWrapper = {
    run(sql, params = [], callback) {
        try {
            db.run(sql, params);
            saveDatabase();
            if (callback) callback.call({ lastID: db.exec("SELECT last_insert_rowid()")[0].values[0][0] }, null);
        } catch (err) {
            if (callback) callback(err);
        }
    },
    
    get(sql, params = [], callback) {
        try {
            const stmt = db.prepare(sql);
            stmt.bind(params);
            if (stmt.step()) {
                const row = stmt.getAsObject();
                if (callback) callback(null, row);
            } else {
                if (callback) callback(null, undefined);
            }
            stmt.free();
        } catch (err) {
            if (callback) callback(err);
        }
    },
    
    all(sql, params = [], callback) {
        try {
            const stmt = db.prepare(sql);
            stmt.bind(params);
            const results = [];
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            stmt.free();
            if (callback) callback(null, results);
        } catch (err) {
            if (callback) callback(err);
        }
    }
};

// Инициализируем при загрузке
initDatabase();

module.exports = { db: dbWrapper };