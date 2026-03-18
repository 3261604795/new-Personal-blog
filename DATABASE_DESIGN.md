# 数据库设计文档

## 数据库类型
SQLite - 轻量级、无需额外服务的嵌入式数据库

## 数据库文件位置
`database/blog.db`

## 表结构设计

### 1. users (用户表)
存储管理员账号信息

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 用户ID |
| username | TEXT | UNIQUE NOT NULL | 用户名 |
| password | TEXT | NOT NULL | 密码（bcrypt加密） |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**初始数据**:
```sql
INSERT INTO users (username, password) VALUES ('admin', '$2a$10$...');
```
- 默认用户名: admin
- 默认密码: admin123

---

### 2. categories (分类表)
存储文章分类信息

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 分类ID |
| name | TEXT | UNIQUE NOT NULL | 分类名称 |
| slug | TEXT | UNIQUE NOT NULL | URL别名 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**初始数据**:
```sql
INSERT INTO categories (name, slug) VALUES 
  ('技术', 'tech'),
  ('生活', 'life'),
  ('随笔', 'essay');
```

**索引**:
- `slug` 索引（用于快速查询）

---

### 3. tags (标签表)
存储文章标签信息

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 标签ID |
| name | TEXT | UNIQUE NOT NULL | 标签名称 |
| slug | TEXT | UNIQUE NOT NULL | URL别名 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**初始数据**:
```sql
INSERT INTO tags (name, slug) VALUES 
  ('JavaScript', 'javascript'),
  ('Node.js', 'nodejs'),
  ('前端', 'frontend'),
  ('后端', 'backend');
```

**索引**:
- `slug` 索引（用于快速查询）

---

### 4. posts (文章表)
存储文章内容

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 文章ID |
| title | TEXT | NOT NULL | 文章标题 |
| slug | TEXT | UNIQUE NOT NULL | URL别名 |
| content | TEXT | NOT NULL | 文章内容（Markdown格式） |
| excerpt | TEXT | | 文章摘要 |
| cover_image | TEXT | | 封面图片路径 |
| category_id | INTEGER | FOREIGN KEY | 分类ID（关联categories.id） |
| status | TEXT | DEFAULT 'published' | 状态：published（已发布）/draft（草稿） |
| views | INTEGER | DEFAULT 0 | 阅读量 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**外键关系**:
- `category_id` → `categories(id)` ON DELETE SET NULL

**索引**:
- `slug` 唯一索引（用于生成文章URL）
- `status` 索引（用于筛选已发布文章）
- `created_at` 索引（用于按时间排序）

**示例数据**:
```sql
INSERT INTO posts (title, slug, content, excerpt, category_id, status) VALUES 
  ('我的第一篇博客', 'my-first-post', '# 你好世界\n\n这是我的第一篇博客文章...', '这是文章摘要...', 1, 'published');
```

---

### 5. post_tags (文章标签关联表)
多对多关系：一篇文章可以有多个标签，一个标签可以属于多篇文章

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| post_id | INTEGER | PRIMARY KEY, FOREIGN KEY | 文章ID（关联posts.id） |
| tag_id | INTEGER | PRIMARY KEY, FOREIGN KEY | 标签ID（关联tags.id） |

**外键关系**:
- `post_id` → `posts(id)` ON DELETE CASCADE
- `tag_id` → `tags(id)` ON DELETE CASCADE

**联合主键**: (post_id, tag_id)

**示例数据**:
```sql
INSERT INTO post_tags (post_id, tag_id) VALUES (1, 1), (1, 2);
```

---

### 6. about (关于我页面表)
存储"关于我"页面的内容

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY | 固定为1 |
| content | TEXT | NOT NULL | 页面内容（HTML格式） |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**初始数据**:
```sql
INSERT INTO about (id, content) VALUES (1, '<p>欢迎来到我的个人博客！</p>');
```

---

## 数据库关系图

```
users (1) ──────── (1) admin操作
                          │
                          ↓
                    posts (1) ─── (N) post_tags ─── (N) tags
                    │   │
                    │   └── (N) categories
                    │
                    └── (1) about
```

---

## 常用SQL查询

### 获取所有已发布文章（含分类和标签）
```sql
SELECT p.*, c.name as category_name,
  (SELECT GROUP_CONCAT(t.name) FROM tags t 
   INNER JOIN post_tags pt ON t.id = pt.tag_id 
   WHERE pt.post_id = p.id) as tags
FROM posts p 
LEFT JOIN categories c ON p.category_id = c.id 
WHERE p.status = 'published' 
ORDER BY p.created_at DESC;
```

### 获取单篇文章详情
```sql
SELECT p.*, c.name as category_name,
  (SELECT GROUP_CONCAT(t.name) FROM tags t 
   INNER JOIN post_tags pt ON t.id = pt.tag_id 
   WHERE pt.post_id = p.id) as tags
FROM posts p 
LEFT JOIN categories c ON p.category_id = c.id 
WHERE p.slug = ? AND p.status = 'published';
```

### 按分类筛选文章
```sql
SELECT p.*, c.name as category_name
FROM posts p 
LEFT JOIN categories c ON p.category_id = c.id 
WHERE c.slug = ? AND p.status = 'published' 
ORDER BY p.created_at DESC;
```

### 按标签筛选文章
```sql
SELECT p.*, c.name as category_name
FROM posts p 
LEFT JOIN categories c ON p.category_id = c.id 
INNER JOIN post_tags pt ON p.id = pt.post_id 
INNER JOIN tags t ON pt.tag_id = t.id 
WHERE t.slug = ? AND p.status = 'published' 
ORDER BY p.created_at DESC;
```

### 更新文章阅读量
```sql
UPDATE posts SET views = views + 1 WHERE id = ?;
```

### 获取统计数据
```sql
-- 文章总数
SELECT COUNT(*) as count FROM posts;

-- 已发布文章数
SELECT COUNT(*) as count FROM posts WHERE status = 'published';

-- 分类总数
SELECT COUNT(*) as count FROM categories;

-- 标签总数
SELECT COUNT(*) as count FROM tags;
```

---

## 数据库维护

### 备份数据库
```bash
# 复制数据库文件
cp database/blog.db database/blog.db.backup.$(date +%Y%m%d)
```

### 恢复数据库
```bash
# 恢复备份
cp database/blog.db.backup.20240101 database/blog.db
```

### 清理草稿文章
```sql
DELETE FROM posts WHERE status = 'draft';
```

### 重置阅读量
```sql
UPDATE posts SET views = 0;
```

---

## 性能优化建议

1. **定期VACUUM**: 清理数据库碎片
   ```bash
   sqlite3 database/blog.db "VACUUM;"
   ```

2. **添加索引**: 为常用查询字段添加索引
   ```sql
   CREATE INDEX idx_posts_status ON posts(status);
   CREATE INDEX idx_posts_created_at ON posts(created_at);
   CREATE INDEX idx_posts_slug ON posts(slug);
   ```

3. **定期备份**: 建议每天自动备份数据库

4. **监控数据库大小**: SQLite适合中小型应用，如果数据量过大考虑迁移到MySQL/PostgreSQL

---

## 安全注意事项

1. **数据库文件权限**: 确保 `database/blog.db` 文件权限正确，不允许Web服务器直接访问
2. **SQL注入防护**: 使用参数化查询（本项目已实现）
3. **敏感数据**: 密码使用bcrypt加密存储
4. **定期备份**: 防止数据丢失
