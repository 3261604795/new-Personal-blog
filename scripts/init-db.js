const db = require('../config/database');
const bcrypt = require('bcryptjs');

const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

const initDatabase = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      cover_image TEXT,
      category_id INTEGER,
      status TEXT DEFAULT 'published',
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS post_tags (
      post_id INTEGER,
      tag_id INTEGER,
      PRIMARY KEY (post_id, tag_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS about (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`INSERT OR IGNORE INTO about (id, content) VALUES (1, '<p>欢迎来到我的个人博客！</p>')`);

    const defaultPassword = bcrypt.hashSync(adminPassword, 10);
    db.run(`INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`, [adminUsername, defaultPassword], (err) => {
      if (err) {
        console.error('Error creating default admin:', err.message);
      } else {
        console.log(`Default admin user ready (username: ${adminUsername})`);
      }
    });

    db.run(`INSERT OR IGNORE INTO categories (name, slug) VALUES 
      ('技术', 'tech'),
      ('生活', 'life'),
      ('随笔', 'essay')`);

    db.run(`INSERT OR IGNORE INTO tags (name, slug) VALUES 
      ('JavaScript', 'javascript'),
      ('Node.js', 'nodejs'),
      ('前端', 'frontend'),
      ('后端', 'backend')`);

    console.log('Database initialized successfully');
  });
};

initDatabase();
