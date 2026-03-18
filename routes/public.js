const express = require('express');
const router = express.Router();
const db = require('../config/database');
const marked = require('marked');

const parseTags = (rawTags) => {
  if (!rawTags) return [];

  return rawTags.split('||').map((tag) => {
    const [name, slug] = tag.split('::');
    return { name, slug };
  });
};

router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  db.all(`SELECT p.*, c.name as category_name, 
    (SELECT GROUP_CONCAT(t.name || '::' || t.slug, '||') FROM tags t 
     INNER JOIN post_tags pt ON t.id = pt.tag_id 
     WHERE pt.post_id = p.id) as tags
    FROM posts p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.status = 'published' 
    ORDER BY p.created_at DESC 
    LIMIT ? OFFSET ?`, [limit, offset], (err, posts) => {
    if (err) return res.status(500).send('Database error');

    db.get('SELECT COUNT(*) as total FROM posts WHERE status = ?', ['published'], (err, result) => {
      if (err) return res.status(500).send('Database error');

      const totalPages = Math.ceil(result.total / limit);

      res.render('index', {
        posts: posts.map(post => ({
          ...post,
          tags: parseTags(post.tags)
        })),
        currentPage: page,
        totalPages: totalPages,
        user: req.session.userId
      });
    });
  });
});

router.get('/post/:slug', (req, res) => {
  db.get(`SELECT p.*, c.name as category_name,
    (SELECT GROUP_CONCAT(t.name || '::' || t.slug, '||') FROM tags t 
     INNER JOIN post_tags pt ON t.id = pt.tag_id 
     WHERE pt.post_id = p.id) as tags
    FROM posts p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.slug = ? AND p.status = 'published'`, [req.params.slug], (err, post) => {
    if (err || !post) return res.status(404).send('Post not found');

    db.run('UPDATE posts SET views = views + 1 WHERE id = ?', [post.id]);

    post.tags = parseTags(post.tags);
    post.content = marked.parse(post.content);

    res.render('post', { post, user: req.session.userId });
  });
});

router.get('/category/:slug', (req, res) => {
  db.all(`SELECT p.*, c.name as category_name,
    (SELECT GROUP_CONCAT(t.name || '::' || t.slug, '||') FROM tags t 
     INNER JOIN post_tags pt ON t.id = pt.tag_id 
     WHERE pt.post_id = p.id) as tags
    FROM posts p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE c.slug = ? AND p.status = 'published' 
    ORDER BY p.created_at DESC`, [req.params.slug], (err, posts) => {
    if (err) return res.status(500).send('Database error');

    res.render('category', {
      posts: posts.map(post => ({
        ...post,
        tags: parseTags(post.tags)
      })),
      categoryName: posts[0]?.category_name || req.params.slug,
      user: req.session.userId
    });
  });
});

router.get('/tag/:slug', (req, res) => {
  db.all(`SELECT p.*, c.name as category_name,
    (SELECT GROUP_CONCAT(t.name || '::' || t.slug, '||') FROM tags t 
     INNER JOIN post_tags pt ON t.id = pt.tag_id 
     WHERE pt.post_id = p.id) as tags
    FROM posts p 
    LEFT JOIN categories c ON p.category_id = c.id 
    INNER JOIN post_tags pt ON p.id = pt.post_id 
    INNER JOIN tags t ON pt.tag_id = t.id 
    WHERE t.slug = ? AND p.status = 'published' 
    ORDER BY p.created_at DESC`, [req.params.slug], (err, posts) => {
    if (err) return res.status(500).send('Database error');

    res.render('tag', {
      posts: posts.map(post => ({
        ...post,
        tags: parseTags(post.tags)
      })),
      tagName: req.params.slug,
      user: req.session.userId
    });
  });
});

router.get('/about', (req, res) => {
  db.get('SELECT * FROM about WHERE id = 1', (err, about) => {
    if (err) return res.status(500).send('Database error');
    res.render('about', { about: about || { content: '<p>暂无内容</p>' }, user: req.session.userId });
  });
});

module.exports = router;
