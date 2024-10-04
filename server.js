const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');
const cors = require('cors'); // Import cors

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: 'http://localhost:3000', // Allow requests from this origin
        methods: ['GET', 'POST'],
    }
});

// Use cors middleware
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from this origin
}));

const PORT = 3001;
const chatDataFile = './chatData.json';
const usersDataFile = './users.json';

const loadUsers = () => {
    if (fs.existsSync(usersDataFile)) {
        const data = fs.readFileSync(usersDataFile);
        return JSON.parse(data);
    }
    return [];
};

const saveUsers = (users) => {
    fs.writeFileSync(usersDataFile, JSON.stringify(users, null, 2));
};

const loadChatMessages = () => {
    if (fs.existsSync(chatDataFile)) {
        const data = fs.readFileSync(chatDataFile);
        return JSON.parse(data);
    }
    return [];
};

const saveChatMessages = (messages) => {
    fs.writeFileSync(chatDataFile, JSON.stringify(messages, null, 2));
};

let chatMessages = loadChatMessages();
let users = loadUsers();

io.on('connection', (socket) => {

    const user_id = socket.handshake.query.userId;
    console.log(`User ${user_id} connected`);
    console.log('Socket connected:', socket.id);

    const userIndex = users.findIndex(user => user.id === user_id);

    if (userIndex !== -1) {
        users[userIndex].socket = socket.id;
        saveUsers(users);
        console.log(`Updated socket for user ${user_id}: ${socket.id}`);
    } else {
        console.log(`User with ID ${user_id} not found in users.json`);
    }

    socket.on('new-message', (data) => {
        const newMessage = {
            id: socket.id,
            text: data.message
        };

        chatMessages.push(newMessage);
        saveChatMessages(chatMessages);

        // io.emit('new-message', newMessage);

        const recipientUser = users.find(user => user.id === data.userId);

        console.log(recipientUser)

        if (recipientUser && recipientUser.socket) {
            console.log('here')
            io.to(recipientUser.socket).emit('new-message', newMessage);
        } else {
            console.log(`User with ID ${data.userId} not found or not connected.`);
        }

    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
