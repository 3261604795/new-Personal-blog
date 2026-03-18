const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3002;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  store: new SQLiteStore({
    dir: db.dbDir,
    db: 'sessions.db'
  }),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

const authMiddleware = require('./middleware/auth');

app.use('/', require('./routes/public'));
app.use('/poppis-console', require('./routes/admin'));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
