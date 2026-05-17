const socket = io();

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const nameInput = document.getElementById('name-input');
const setNameBtn = document.getElementById('set-name');
const randomNameBtn = document.getElementById('random-name');
const nameError = document.getElementById('name-error');
const nameDisplay = document.querySelector('#my-name span');
let myName = '';

function addMessage(data) {
    const item = document.createElement('li');
    const senderSpan = document.createElement('strong');
    const senderLabel = data.name === myName ? 'You' : data.name;
    senderSpan.textContent = `${senderLabel}: `;
    senderSpan.style.marginRight = '8px';
    item.appendChild(senderSpan);
    item.appendChild(document.createTextNode(data.text));
    item.className = data.name === myName ? 'my-message' : 'other-message';
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
}

function setNameText(name) {
    myName = name;
    if (nameDisplay) {
        nameDisplay.textContent = name;
    }
    input.disabled = false;
    form.querySelector('button').disabled = false;
}

function showNameError(text) {
    nameError.textContent = text;
    nameError.style.display = text ? 'block' : 'none';
}

setNameBtn.addEventListener('click', function() {
    const name = nameInput.value.trim();
    if (!name) {
        showNameError('Введите имя.');
        return;
    }
    showNameError('');
    socket.emit('set name', name);
});

randomNameBtn.addEventListener('click', function() {
    showNameError('');
    socket.emit('random name');
});

form.addEventListener('submit', function(e) {
    e.preventDefault();
    const msg = input.value.trim();
    if (msg) {
        socket.emit('chat message', msg);
        input.value = '';
        input.focus();
    }
});

socket.on('name accepted', function(name) {
    setNameText(name);
    showNameError('');
});

socket.on('name rejected', function(reason) {
    showNameError(reason);
});

socket.on('chat message', function(data) {
    addMessage(data);
});

socket.on('chat error', function(message) {
    const item = document.createElement('li');
    item.textContent = message;
    item.className = 'system-message';
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});

socket.on('user connected', function(name) {
    const item = document.createElement('li');
    item.textContent = `${name} приєднався до чату`;
    item.className = 'system-message';
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});

socket.on('user disconnected', function(name) {
    const item = document.createElement('li');
    item.textContent = `${name} покинув чат`;
    item.className = 'system-message';
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});

const savedTheme = localStorage.getItem('darkTheme') === 'true';
if (savedTheme) {
    themeToggle.checked = true;
    body.classList.add('dark-theme');
}

input.disabled = true;
form.querySelector('button').disabled = true;

themeToggle.addEventListener('change', function() {
    const enabled = themeToggle.checked;
    body.classList.toggle('dark-theme', enabled);
    localStorage.setItem('darkTheme', enabled);
});
