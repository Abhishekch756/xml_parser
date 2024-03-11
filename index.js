const express = require("express");
const passport = require("passport");
const fs= require('fs');
const path= require('path');
const session = require('express-session');
const fileURLToPath = require('url');
const session = require("express-session");
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
require("dotenv").config();
require('./middleware/passportConfig');


const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const options = {
    key: fs.readFileSync(path.join(__dirname,'cert','key.pem')),
    cert: fs.readFileSync(path.join(__dirname,'cert','cert.pem'))
};
// Serve static files from the "public" directory
app.use(express.static('public'));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
// Routes
app.use('/', homeRoutes);
app.use('/auth', authRoutes);

// Handle other routes (if needed)
app.get('*', (req, res) => {
  res.status(404).send('Not Found');
});

https.createServer(options, app).listen(port, () => {
  console.log('Server running on https://localhost:3000');
});