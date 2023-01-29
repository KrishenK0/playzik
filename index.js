const { env } = require('dotenv').config();
const express = require('express');
const api = require('./routes/api');
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

// Route
app.use('/api', api);

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port : ${port}`));