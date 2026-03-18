const db = require('../config/database');

// 插入一篇测试博客文章
db.run(`INSERT INTO posts (title, slug, content, excerpt, category_id, status)
  VALUES (?, ?, ?, ?, ?, ?)`,
  ['测试博客', 'test-post', '这是一篇测试博客文章，用于演示博客功能。\n\n这是第二段内容，展示博客的格式。', '这是测试博客的摘要', 1, 'published'],
  function(err) {
    if (err) {
      console.error('创建文章失败:', err.message);
    } else {
      console.log('测试博客文章创建成功，ID:', this.lastID);
      
      // 关联标签
      db.run('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [this.lastID, 1], (err) => {
        if (err) {
          console.error('关联标签失败:', err.message);
        } else {
          console.log('标签关联成功');
        }
      });
    }
  }
);
