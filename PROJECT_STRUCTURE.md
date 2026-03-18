# 项目结构说明

## 目录结构

```
personal-blog/
│
├── config/                      # 配置文件目录
│   └── database.js              # SQLite数据库连接配置
│
├── middleware/                  # 中间件目录
│   ├── auth.js                 # 鉴权中间件（保护后台路由）
│   └── upload.js               # 文件上传中间件（带安全限制）
│
├── public/                      # 静态资源目录
│   ├── css/                     # 样式文件
│   │   ├── style.css           # 前台页面样式
│   │   └── admin.css           # 后台管理样式
│   └── uploads/                # 上传的图片文件
│       └── .gitkeep
│
├── routes/                      # 路由目录
│   ├── admin.js                # 后台管理路由
│   │   ├── GET  /admin/login           # 登录页面
│   │   ├── POST /admin/login           # 登录处理
│   │   ├── GET  /admin/logout          # 退出登录
│   │   ├── GET  /admin/dashboard       # 仪表盘
│   │   ├── GET  /admin/posts            # 文章列表
│   │   ├── GET  /admin/posts/new        # 新建文章
│   │   ├── POST /admin/posts            # 创建文章
│   │   ├── GET  /admin/posts/:id/edit   # 编辑文章
│   │   ├── POST /admin/posts/:id        # 更新文章
│   │   ├── POST /admin/posts/:id/delete # 删除文章
│   │   ├── GET  /admin/categories       # 分类管理
│   │   ├── POST /admin/categories       # 创建分类
│   │   ├── POST /admin/categories/:id/delete # 删除分类
│   │   ├── GET  /admin/tags             # 标签管理
│   │   ├── POST /admin/tags             # 创建标签
│   │   ├── POST /admin/tags/:id/delete  # 删除标签
│   │   ├── GET  /admin/about            # 关于我编辑
│   │   ├── POST /admin/about            # 更新关于我
│   │   └── POST /admin/upload           # 图片上传
│   │
│   └── public.js               # 前台页面路由
│       ├── GET  /                      # 首页（文章列表）
│       ├── GET  /post/:slug            # 文章详情
│       ├── GET  /category/:slug         # 分类筛选
│       ├── GET  /tag/:slug              # 标签筛选
│       └── GET  /about                  # 关于我页面
│
├── scripts/                     # 脚本目录
│   └── init-db.js               # 数据库初始化脚本
│
├── views/                       # 视图模板目录（EJS）
│   ├── admin/                   # 后台页面
│   │   ├── login.ejs           # 登录页面
│   │   ├── dashboard.ejs       # 仪表盘
│   │   ├── posts.ejs           # 文章列表
│   │   ├── post-form.ejs       # 新建/编辑文章
│   │   ├── categories.ejs      # 分类管理
│   │   ├── tags.ejs            # 标签管理
│   │   └── about.ejs           # 关于我编辑
│   │
│   ├── index.ejs                # 首页
│   ├── post.ejs                 # 文章详情页
│   ├── category.ejs             # 分类页面
│   ├── tag.ejs                  # 标签页面
│   └── about.ejs                # 关于我页面
│
├── database/                    # 数据库文件目录
│   └── blog.db                 # SQLite数据库文件（运行时生成）
│
├── package.json                 # 项目配置和依赖
├── server.js                    # 服务器入口文件
├── README.md                    # 项目说明文档
├── .gitignore                   # Git忽略文件
├── .env.example                 # 环境变量示例
└── PROJECT_STRUCTURE.md         # 本文件

```

## 核心文件说明

### 服务器入口
- **server.js**: Express服务器配置，包含中间件设置、路由配置、静态文件服务

### 数据库
- **config/database.js**: SQLite数据库连接
- **scripts/init-db.js**: 数据库表结构创建和初始数据插入

### 中间件
- **middleware/auth.js**: Session鉴权中间件，保护后台路由
- **middleware/upload.js**: Multer文件上传配置，包含文件类型和大小限制

### 路由
- **routes/admin.js**: 后台管理所有路由（需要鉴权）
- **routes/public.js**: 前台公开访问路由

### 视图
- **views/admin/**: 后台管理界面
- **views/**: 前台展示页面

### 静态资源
- **public/css/style.css**: 前台页面样式（响应式设计）
- **public/css/admin.css**: 后台管理样式
- **public/uploads/**: 用户上传的图片文件

## 数据流程

### 用户访问流程
1. 用户访问前台页面 → routes/public.js → 查询数据库 → 渲染EJS模板
2. 用户访问后台页面 → routes/admin.js → auth.js鉴权 → 查询数据库 → 渲染EJS模板

### 管理员操作流程
1. 管理员登录 → 验证用户名密码 → 创建Session
2. 访问后台页面 → 验证Session → 允许访问
3. 执行CRUD操作 → 更新数据库 → 重定向或返回结果

### 文件上传流程
1. 管理员选择文件 → upload.js验证（类型、大小） → 保存到uploads目录 → 返回文件路径

## 安全特性

1. **鉴权保护**: 所有后台路由都需要通过auth.js中间件验证
2. **密码加密**: 使用bcryptjs加密存储密码
3. **文件上传限制**: 
   - 只允许图片格式（JPEG, JPG, PNG, GIF, WEBP）
   - 文件大小限制5MB
4. **Session管理**: 使用express-session管理用户会话

## 响应式设计

- **前台**: 使用CSS Grid和Flexbox实现响应式布局
- **后台**: 侧边栏在移动端自动调整布局
- **断点**: 768px（平板）、576px（手机）
