const { env } = require('dotenv').config();
const express = require('express');
const api = require('./api');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');

const app = express();

// parsing incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(cookieParser());
app.use(sessions({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
    resave: false
}));

const whitelist = [
    '*'
];

app.use((req, res, next) => {
    const origin = req.get('referer');
    const isWhitelisted = whitelist.find((w) => origin && origin.includes(w));
    if (isWhitelisted) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization');
        res.setHeader('Access-Control-Allow-Credentials', true);
    }
    // Pass to next layer of middleware
    if (req.method === 'OPTIONS') res.sendStatus(200);
    else next();
});

const setContext = (req, res, next) => {
    if (!req.context) req.context = {};
    next();
};
app.use(setContext);

// Route
app.use('/api', api);

app.get('/', (req, res) => {
    res.send('Hello World!');
})


const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port : ${port}`));