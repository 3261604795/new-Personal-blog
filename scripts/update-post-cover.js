const db = require('../config/database');

// 更新测试博客文章的封面图片
db.run(`UPDATE posts SET cover_image = ? WHERE id = 1`,
  ['/uploads/IMG_20260316_123953.jpg'],
  function(err) {
    if (err) {
      console.error('更新封面图片失败:', err.message);
    } else {
      console.log('封面图片更新成功');
    }
  }
);
