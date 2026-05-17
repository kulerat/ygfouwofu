const http = require('http')
const fs = require('fs')
const path = require('path')
const { Server } = require('socket.io')

const server = http.createServer((req, res) => {
    let filePath;

    if (req.url === '/') {
        filePath = path.join(__dirname, 'static', 'index.html');
    } else if (req.url === '/socket.io/socket.io.js') {
        filePath = path.join(__dirname, 'node_modules', 'socket.io', 'client-dist', 'socket.io.js');
    } else {
        filePath = path.join(__dirname, 'static', req.url);
    }

    const fileExt = path.extname(filePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/html');
            res.end('<h1>404 Not Found</h1>');
            return;
        }

        const contentTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.map': 'application/json'
        };

        res.setHeader('Content-Type', contentTypes[fileExt] || 'text/plain');
        res.end(data);
    });
})

const io = new Server(server);
const users = {};
const names = new Set();

function randomUserName() {
    let name;
    do {
        name = `User-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (names.has(name));
    return name;
}

io.on('connection', (socket) => {
    let assignedName = null;

    socket.on('set name', (name) => {
        if (!name || typeof name !== 'string') {
            socket.emit('name rejected', 'Имя не может быть пустым.');
            return;
        }

        name = name.trim();
        if (name.length < 2) {
            socket.emit('name rejected', 'Имя должно быть минимум 2 символа.');
            return;
        }

        if (names.has(name)) {
            socket.emit('name rejected', 'Это имя уже занято. Попробуйте другое.');
            return;
        }

        if (assignedName) {
            names.delete(assignedName);
        }

        assignedName = name;
        names.add(name);
        users[socket.id] = name;
        console.log(`${name} connected`);

        socket.emit('name accepted', name);
        io.emit('user connected', name);
    });

    socket.on('random name', () => {
        const name = randomUserName();
        if (assignedName) {
            names.delete(assignedName);
        }
        assignedName = name;
        names.add(name);
        users[socket.id] = name;

        console.log(`${name} connected`);
        socket.emit('name accepted', name);
        io.emit('user connected', name);
    });

    socket.on('chat message', (msg) => {
        const sender = users[socket.id];
        if (!sender) {
            socket.emit('chat error', 'Сначала выберите имя.');
            return;
        }
        io.emit('chat message', { name: sender, text: msg, timestamp: new Date() });
    });

    socket.on('disconnect', () => {
        if (assignedName) {
            io.emit('user disconnected', assignedName);
            console.log(`${assignedName} disconnected`);
            names.delete(assignedName);
            delete users[socket.id];
        }
    });
});

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
let currentPort = DEFAULT_PORT;

function startServer() {
    server.listen(currentPort, () => {
        console.log(`Server running on port ${currentPort}`);
    });
}

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${currentPort} busy, trying port ${currentPort + 1}...`);
        currentPort += 1;
        if (currentPort <= DEFAULT_PORT + 10) {
            startServer();
        } else {
            console.error('No available ports found. Stop other server or set PORT environment variable.');
            process.exit(1);
        }
    } else {
        throw err;
    }
});

startServer();
