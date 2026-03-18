const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/poppis-console/dashboard');
  }
  res.render('admin/login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) {
      return res.render('admin/login', { error: '用户名或密码错误' });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
        return res.render('admin/login', { error: '用户名或密码错误' });
      }

      req.session.userId = user.id;
      res.redirect('/poppis-console/dashboard');
    });
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

router.get('/dashboard', authMiddleware, (req, res) => {
  db.get('SELECT COUNT(*) as count FROM posts', (err, postCount) => {
    db.get('SELECT COUNT(*) as count FROM categories', (err, categoryCount) => {
      db.get('SELECT COUNT(*) as count FROM tags', (err, tagCount) => {
        res.render('admin/dashboard', {
          user: req.user,
          stats: {
            posts: postCount?.count || 0,
            categories: categoryCount?.count || 0,
            tags: tagCount?.count || 0
          }
        });
      });
    });
  });
});

router.get('/posts', authMiddleware, (req, res) => {
  db.all(`SELECT p.*, c.name as category_name 
    FROM posts p 
    LEFT JOIN categories c ON p.category_id = c.id 
    ORDER BY p.created_at DESC`, (err, posts) => {
    if (err) return res.status(500).send('Database error');
    res.render('admin/posts', { user: req.user, posts });
  });
});

router.get('/posts/new', authMiddleware, (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
    db.all('SELECT * FROM tags ORDER BY name', (err, tags) => {
      res.render('admin/post-form', {
        user: req.user,
        categories,
        tags,
        post: null,
        selectedTags: [],
        error: null
      });
    });
  });
});

router.get('/posts/:id/edit', authMiddleware, (req, res) => {
  db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, post) => {
    if (err || !post) return res.status(404).send('Post not found');

    db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
      db.all('SELECT * FROM tags ORDER BY name', (err, tags) => {
        db.all('SELECT tag_id FROM post_tags WHERE post_id = ?', [post.id], (err, postTags) => {
          const selectedTags = postTags.map(pt => pt.tag_id);
          res.render('admin/post-form', {
            user: req.user,
            categories,
            tags,
            post,
            selectedTags,
            error: null
          });
        });
      });
    });
  });
});

router.post('/posts', authMiddleware, upload.single('cover_image'), (req, res) => {
  const { title, slug, content, excerpt, category_id, status, tags } = req.body;
  const cover_image = req.file ? `/uploads/${req.file.filename}` : null;

  db.run(`INSERT INTO posts (title, slug, content, excerpt, cover_image, category_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, slug, content, excerpt, cover_image, category_id || null, status || 'published'],
    function(err) {
      if (err) {
        console.error(err);
        return db.all('SELECT * FROM categories ORDER BY name', (categoryErr, categories) => {
          if (categoryErr) return res.status(500).send('Database error');
          db.all('SELECT * FROM tags ORDER BY name', (tagErr, allTags) => {
            if (tagErr) return res.status(500).send('Database error');
            res.render('admin/post-form', {
              user: req.user,
              categories,
              tags: allTags,
              post: req.body,
              selectedTags: Array.isArray(tags) ? tags.map(Number) : tags ? [Number(tags)] : [],
              error: '创建文章失败，请检查 slug 是否重复'
            });
          });
        });
      }

      if (tags && Array.isArray(tags)) {
        tags.forEach(tagId => {
          db.run('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [this.lastID, tagId]);
        });
      }

      res.redirect('/poppis-console/posts');
    }
  );
});

router.post('/posts/:id', authMiddleware, upload.single('cover_image'), (req, res) => {
  const { title, slug, content, excerpt, category_id, status, tags } = req.body;
  
  let updateQuery = `UPDATE posts SET title = ?, slug = ?, content = ?, excerpt = ?, category_id = ?, status = ?`;
  let params = [title, slug, content, excerpt, category_id || null, status || 'published'];

  if (req.file) {
    updateQuery += `, cover_image = ?`;
    params.push(`/uploads/${req.file.filename}`);
  }

  updateQuery += ` WHERE id = ?`;
  params.push(req.params.id);

  db.run(updateQuery, params, (err) => {
    if (err) {
      console.error(err);
      return db.all('SELECT * FROM categories ORDER BY name', (categoryErr, categories) => {
        if (categoryErr) return res.status(500).send('Database error');
        db.all('SELECT * FROM tags ORDER BY name', (tagErr, allTags) => {
          if (tagErr) return res.status(500).send('Database error');
          res.render('admin/post-form', {
            user: req.user,
            categories,
            tags: allTags,
            post: {
              ...req.body,
              id: req.params.id,
              cover_image: req.file ? `/uploads/${req.file.filename}` : null
            },
            selectedTags: Array.isArray(tags) ? tags.map(Number) : tags ? [Number(tags)] : [],
            error: '更新文章失败，请检查 slug 是否重复'
          });
        });
      });
    }

    db.run('DELETE FROM post_tags WHERE post_id = ?', [req.params.id], () => {
      if (tags && Array.isArray(tags)) {
        tags.forEach(tagId => {
          db.run('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [req.params.id, tagId]);
        });
      }
    });

    res.redirect('/poppis-console/posts');
  });
});

router.post('/posts/:id/delete', authMiddleware, (req, res) => {
  db.run('DELETE FROM posts WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send('Database error');
    res.redirect('/poppis-console/posts');
  });
});

router.get('/categories', authMiddleware, (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
    if (err) return res.status(500).send('Database error');
    res.render('admin/categories', { user: req.user, categories, error: null });
  });
});

router.post('/categories', authMiddleware, (req, res) => {
  const { name, slug } = req.body;
  db.run('INSERT INTO categories (name, slug) VALUES (?, ?)', [name, slug], (err) => {
    if (err) {
      return db.all('SELECT * FROM categories ORDER BY name', (listErr, categories) => {
        if (listErr) return res.status(500).send('Database error');
        res.render('admin/categories', {
          user: req.user,
          categories,
          error: '创建分类失败，请检查名称或 URL 别名是否重复'
        });
      });
    }
    res.redirect('/poppis-console/categories');
  });
});

router.post('/categories/:id/delete', authMiddleware, (req, res) => {
  db.run('DELETE FROM categories WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send('Database error');
    res.redirect('/poppis-console/categories');
  });
});

router.get('/tags', authMiddleware, (req, res) => {
  db.all('SELECT * FROM tags ORDER BY name', (err, tags) => {
    if (err) return res.status(500).send('Database error');
    res.render('admin/tags', { user: req.user, tags, error: null });
  });
});

router.post('/tags', authMiddleware, (req, res) => {
  const { name, slug } = req.body;
  db.run('INSERT INTO tags (name, slug) VALUES (?, ?)', [name, slug], (err) => {
    if (err) {
      return db.all('SELECT * FROM tags ORDER BY name', (listErr, tags) => {
        if (listErr) return res.status(500).send('Database error');
        res.render('admin/tags', {
          user: req.user,
          tags,
          error: '创建标签失败，请检查名称或 URL 别名是否重复'
        });
      });
    }
    res.redirect('/poppis-console/tags');
  });
});

router.post('/tags/:id/delete', authMiddleware, (req, res) => {
  db.run('DELETE FROM tags WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send('Database error');
    res.redirect('/poppis-console/tags');
  });
});

router.get('/about', authMiddleware, (req, res) => {
  db.get('SELECT * FROM about WHERE id = 1', (err, about) => {
    if (err) return res.status(500).send('Database error');
    res.render('admin/about', { user: req.user, about: about || { content: '' } });
  });
});

router.post('/about', authMiddleware, (req, res) => {
  const { content } = req.body;
  db.run(`UPDATE about SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`, [content], (err) => {
    if (err) return res.status(500).send('Database error');
    res.redirect('/poppis-console/about');
  });
});

router.post('/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
