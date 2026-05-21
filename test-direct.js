const sql = require('mssql');

const config = {
    server: '127.0.0.1',  // ← Прямой IP, без имени экземпляра
    port: 1433,           // ← Прямой порт
    database: 'MyWebsiteDB',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function test() {
    try {
        console.log('🔄 Прямое подключение к 127.0.0.1:1433...');
        await sql.connect(config);
        console.log('✅ УСПЕХ! База подключена.');
        
        const result = await sql.query`SELECT @@VERSION as ver`;
        console.log('📊 Версия:', result.recordset[0].ver.substring(0, 80) + '...');
        
        await sql.close();
        console.log('\n🎉 Работает! Обновите db.js и запустите server.js');
    } catch (err) {
        console.error('❌ Ошибка:', err.message);
        console.log('\n💡 Если ошибка "Timeout" или "Connection refused":');
        console.log('   1. Проверьте, что TCP/IP включён');
        console.log('   2. Запустите: netstat -ano | findstr :1433');
        console.log('   3. Если порт не слушается -> вернитесь к шагу с реестром');
    }
}

test();