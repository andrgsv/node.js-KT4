const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

const db = new sqlite3.Database('urls.db');

db.run(`
    CREATE TABLE IF NOT EXISTS urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        short TEXT UNIQUE,
        original TEXT
    )
`);

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`
        <h2>Сервис сокращения ссылок</h2>
        <form action="/create" method="GET">
            <input name="url" placeholder="Вставьте длинную ссылку" style="width:400px;padding:10px;font-size:16px" required>
            <button type="submit" style="padding:10px 20px;font-size:16px">Сократить</button>
        </form>
        <p><small>Пример: http://localhost:3000/create?url=https://youtube.com/watch?v=dQw4w9WgXcQ</small></p>
    `);
});

app.get('/create', (req, res) => {
    const originalUrl = req.query.url?.trim();
    if (!originalUrl || !originalUrl.startsWith('http')) {
        return res.send('Ошибка: введите правильную ссылку (с http:// или https://)');
    }

    const shortCode = Math.random().toString(36).substring(2, 8);

    db.run('INSERT INTO urls (short, original) VALUES (?, ?)', [shortCode, originalUrl], function(err) {
        if (err) {
            return res.send('Ошибка базы данных');
        }
        const shortUrl = `http://localhost:3000/${shortCode}`;
        res.send(`
            <h3>Готово!</h3>
            <p>Оригинал: <code>${originalUrl}</code></p>
            <p>Короткая: <a href="${shortUrl}" target="_blank"><b>${shortUrl}</b></a></p>
            <p><a href="/">← Создать ещё</a></p>
        `);
    });
});

app.get('/:code', (req, res) => {
    const code = req.params.code;

    db.get('SELECT original FROM urls WHERE short = ?', [code], (err, row) => {
        if (err || !row) {
            return res.status(404).send(`
                <h3>Ссылка не найдена</h3>
                <p>Короткая ссылка <b>/${code}</b> не существует.</p>
                <a href="/">← На главную</a>
            `);
        }
        
        console.log(`Переход: ${code} → ${row.original}`);
        res.redirect(row.original);
    });
});

app.listen(3000, () => {
    console.log('Сервис сокращения URL запущен!');
    console.log('Открой: http://localhost:3000');
});