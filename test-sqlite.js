const { db } = require('./db');
const bcrypt = require('bcrypt');

console.log('🧪 Тестирование SQLite...\n');

// Тест 1: Проверяем таблицы
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('❌ Ошибка:', err.message);
        return;
    }
    
    console.log('✅ Таблицы в базе:');
    tables.forEach(t => console.log(`   - ${t.name}`));

    // Тест 2: Создаём тестового пользователя
    const hash = bcrypt.hashSync('test123', 10);
    
    db.run(
        `INSERT INTO users (login, password_hash, email, role) VALUES (?, ?, ?, 'reader')`,
        ['testuser', hash, 'test@example.com'],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    console.log('⚠️  Тестовый пользователь уже существует');
                } else {
                    console.error('❌ Ошибка создания пользователя:', err.message);
                }
            } else {
                console.log(`\n✅ Создан тестовый пользователь ID: ${this.lastID}`);
            }

            // Тест 3: Читаем пользователя
            db.get(`SELECT * FROM users WHERE email = ?`, ['test@example.com'], (err, user) => {
                if (err) {
                    console.error('❌ Ошибка чтения:', err.message);
                } else if (user) {
                    console.log(`✅ Пользователь найден: ${user.email} (роль: ${user.role})`);
                    console.log('\n🎉 SQLite работает отлично!');
                    console.log('🚀 Теперь запустите: node server.js\n');
                }
            });
        }
    );
});