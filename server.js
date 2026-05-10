const http = require('http')
const fs = require ('fs')
const path = require('path') 
const { Server } = require('socket.io')
const filePath = path.join(__dirname, 'static' , 'index.html');
const indexHtmlFile = fs.readFileSync(filePath, 'utf-8');
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        return res.end(indexHtmlFile);
    }
    res.statusCode = 404;
    res.end('error 404');
})

const io = new Server(server);

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
})
