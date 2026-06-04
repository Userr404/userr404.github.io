const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = 3000;

// Barcha kelgan requestlarni saqlash
let requests = [];

// Static fayllar uchun
app.use(express.static(__dirname));

// Barcha requestlarni qabul qilish (har qanday route)
app.all('*', (req, res) => {
    const requestData = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString('uz-UZ'),
        method: req.method,
        url: req.originalUrl,
        fullUrl: req.protocol + '://' + req.get('host') + req.originalUrl,
        headers: req.headers,
        query: req.query,
        body: req.body || {},
        ip: req.ip || req.connection.remoteAddress
    };

    // Saqlash
    requests.unshift(requestData); // Eng yangisi tepada

    // Agar 100 tadan ortiq bo‘lsa, eskilarini o‘chirish
    if (requests.length > 100) requests.pop();

    // WebSocket orqali barcha clientlarga yuborish
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'new_request',
                data: requestData
            }));
        }
    });

    // Javob qaytarish
    res.json({ status: "ok", message: "Request qabul qilindi" });
});

const server = app.listen(PORT, () => {
    console.log(`🚀 Monitor server ishga tushdi: http://localhost:${PORT}`);
});

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Yangi client ulandi');
    
    // Ulangan paytda hozirgacha bo‘lgan barcha requestlarni yuborish
    ws.send(JSON.stringify({
        type: 'history',
        data: requests
    }));
});
