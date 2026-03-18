# 个人博客系统

一个简洁、易部署的个人博客系统，支持Markdown写作，响应式设计。

## 功能特性

### 前台功能
- 首页文章列表（分页）
- 文章详情页
- 分类筛选
- 标签筛选
- 关于我页面
- 响应式设计（适配手机和电脑）

### 后台管理
- 管理员登录/退出
- 文章管理（新建、编辑、删除）
- 分类管理
- 标签管理
- 关于我页面编辑
- 图片上传（封面图和正文图片）

### 安全特性
- Session鉴权
- 后台路由保护
- 文件上传安全限制（仅允许图片，最大5MB）
- 密码加密存储

## 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite
- **模板引擎**: EJS
- **鉴权**: express-session + bcryptjs
- **文件上传**: multer
- **Markdown解析**: marked

## 项目结构

```
personal-blog/
├── config/
│   └── database.js          # 数据库配置
├── middleware/
│   ├── auth.js              # 鉴权中间件
│   └── upload.js            # 文件上传中间件
├── public/
│   ├── css/
│   │   ├── style.css        # 前台样式
│   │   └── admin.css        # 后台样式
│   └── uploads/             # 上传的图片目录
├── routes/
│   ├── admin.js             # 后台路由
│   └── public.js            # 前台路由
├── scripts/
│   └── init-db.js           # 数据库初始化脚本
├── views/
│   ├── admin/               # 后台页面
│   │   ├── about.ejs
│   │   ├── categories.ejs
│   │   ├── dashboard.ejs
│   │   ├── login.ejs
│   │   ├── post-form.ejs
│   │   ├── posts.ejs
│   │   └── tags.ejs
│   ├── about.ejs            # 关于我页面
│   ├── category.ejs         # 分类页面
│   ├── index.ejs            # 首页
│   ├── post.ejs             # 文章详情
│   └── tag.ejs              # 标签页面
├── database/                # SQLite数据库文件目录
├── package.json
└── server.js                # 服务器入口文件
```

## 数据库设计

### 表结构

#### users (用户表)
- id: 主键
- username: 用户名（唯一）
- password: 密码（bcrypt加密）
- created_at: 创建时间

#### categories (分类表)
- id: 主键
- name: 分类名称
- slug: URL别名
- created_at: 创建时间

#### tags (标签表)
- id: 主键
- name: 标签名称
- slug: URL别名
- created_at: 创建时间

#### posts (文章表)
- id: 主键
- title: 文章标题
- slug: URL别名（唯一）
- content: 文章内容（Markdown）
- excerpt: 摘要
- cover_image: 封面图片路径
- category_id: 分类ID（外键）
- status: 状态（published/draft）
- views: 阅读量
- created_at: 创建时间
- updated_at: 更新时间

#### post_tags (文章标签关联表)
- post_id: 文章ID
- tag_id: 标签ID
- 联合主键

#### about (关于我页面表)
- id: 主键
- content: 页面内容（HTML）
- updated_at: 更新时间

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
npm run init-db
```

这将创建数据库表并插入默认数据：
- 默认管理员账号来自环境变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- 如果未设置，回退为 `admin` / `admin123`
- 默认分类: 技术、生活、随笔
- 默认标签: JavaScript、Node.js、前端、后端

### 3. 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动，或者使用你通过环境变量指定的端口启动。

### 4. 访问后台

访问 `http://localhost:3000/admin/login`，使用初始化时设置的管理员账号登录。

**重要**: 首次登录后请立即修改密码！

## 修改管理员密码

推荐通过环境变量设置管理员账号：

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-new-password
npm run init-db
```

## 配置说明

### 端口配置

在 `server.js` 中修改端口：

```javascript
const PORT = process.env.PORT || 3000;
```

或通过环境变量设置：

```bash
PORT=8080 npm start
```

### Session密钥

在 `server.js` 中修改Session密钥：

```javascript
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  // ...
}));
```

建议使用环境变量设置：

```bash
SESSION_SECRET=your-random-secret-key npm start
```

### 数据库路径

默认数据库路径为 `./database/blog.db`，也可以通过环境变量修改：

```bash
DATABASE_PATH=./database/blog.db npm start
```

## 部署

### 本地部署

1. 克隆项目到服务器
2. 安装依赖: `npm install`
3. 初始化数据库: `npm run init-db`
4. 启动服务: `npm start`

### 使用PM2部署（推荐）

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 使用Nginx反向代理

配置Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 使用说明

### 写文章

1. 登录后台
2. 点击"新建文章"
3. 填写文章信息：
   - 标题：文章标题
   - URL别名：用于生成文章URL（如：my-first-post）
   - 摘要：文章摘要（可选）
   - 正文内容：支持Markdown语法
   - 封面图片：上传封面图（可选）
   - 分类：选择分类（可选）
   - 标签：选择标签（可选）
   - 状态：已发布或草稿
4. 点击"发布文章"

### Markdown语法示例

```markdown
# 一级标题
## 二级标题
### 三级标题

**粗体**
*斜体*

- 列表项1
- 列表项2

1. 有序列表1
2. 有序列表2

[链接文字](https://example.com)

![图片描述](/uploads/image.jpg)

`行内代码`

```
代码块
```

> 引用文本
```

### 上传图片

- 封面图片：在文章编辑页面上传
- 正文图片：在正文中使用Markdown语法引用已上传的图片

## 安全建议

1. **修改默认密码**: 首次登录后立即修改管理员密码
2. **使用HTTPS**: 生产环境建议使用HTTPS
3. **定期备份数据库**: 定期备份 `database/blog.db` 文件
4. **限制文件上传大小**: 已在代码中限制为5MB
5. **使用环境变量**: 敏感信息使用环境变量配置

## 常见问题

### 数据库文件在哪里？

数据库文件位于 `database/blog.db`，这是一个SQLite数据库文件。

### 如何备份数据？

直接复制 `database/blog.db` 文件即可备份。

### 如何修改网站标题？

在各个视图文件中修改标题文字，如 `views/index.ejs` 中的 `<title>` 标签。

### 如何自定义样式？

修改 `public/css/style.css`（前台）和 `public/css/admin.css`（后台）。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
