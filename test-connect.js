const sql = require('mssql');

const config = {
    server: 'localhost\\SQLEXPRESS',  // ← ИЗМЕНЕНО: полный путь вместо '.\\SQLEXPRESS'
    database: 'MyWebsiteDB',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function test() {
    try {
        console.log('🔄 Подключение к SQL Server...');
        console.log('📍 Сервер:', 'localhost\\SQLEXPRESS');
        
        await sql.connect(config);
        console.log('✅ УСПЕХ! Подключено к базе MyWebsiteDB!');
        
        const result = await sql.query`
            SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Users'
        `;
        
        if (result.recordset[0].count > 0) {
            console.log('✅ Таблица Users найдена!');
        } else {
            console.log('⚠️  Таблица Users не найдена. Создайте таблицы через SSMS.');
        }
        
        await sql.close();
        console.log('\n🎉 Всё работает! Теперь запустите: node server.js');
        
    } catch (err) {
        console.error('❌ Ошибка подключения:', err.message);
        console.log('\n💡 Проверьте:');
        console.log('   1. Служба MSSQL$SQLEXPRESS запущена (services.msc)');
        console.log('   2. База MyWebsiteDB создана в SSMS');
        console.log('   3. TCP/IP включён для SQLEXPRESS');
    }
}

test();