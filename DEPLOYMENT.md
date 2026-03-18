# 部署到阿里云轻量服务器

下面这套流程适合你的当前情况：

- 服务器已经有一个服务在跑：`openclaw`
- 已知公网 IP：`123.57.181.242`
- 已占用端口：`15415`
- 这个博客建议单独跑在 `3001` 端口，再按需用 Nginx 反代

## 推荐部署方式

直接使用 `PM2 + Node.js` 部署。

原因：

- 这个项目本身是 `Express + SQLite`
- 依赖少，没必要先上 Docker
- 和现有 `openclaw` 共存最简单

## 1. 登录服务器

```bash
ssh root@123.57.181.242
```

如果你不是 `root`，把用户名替换成你自己的。

## 2. 安装 Node.js 和基础工具

Ubuntu / Debian:

```bash
apt update
apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
```

检查版本：

```bash
node -v
npm -v
pm2 -v
```

## 3. 拉取项目

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/3261604795/Personal-blog.git personal-blog
cd /var/www/personal-blog
```

## 4. 安装依赖

```bash
npm install --production
```

## 5. 配置环境变量

```bash
cp .env.example .env
nano .env
```

建议改成：

```env
PORT=3001
SESSION_SECRET=换成你自己生成的长随机字符串
DATABASE_PATH=./database/blog.db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=换成你自己的后台密码
```

生成随机密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 6. 初始化数据库

```bash
npm run init-db
```

说明：

- 项目现在会自动创建 `database/` 目录
- 初始化时会按照 `.env` 里的 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 建默认管理员

## 7. 启动服务

推荐直接使用仓库里的 `PM2` 配置：

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

查看运行状态：

```bash
pm2 status
pm2 logs personal-blog --lines 100
```

## 8. 开放端口

如果你暂时不配 Nginx，至少要放行 `3001`：

```bash
ufw allow 3001/tcp
ufw reload
```

如果阿里云轻量应用服务器控制台里有防火墙规则，也要额外放行 `3001`。

## 9. 直接访问

部署完成后可先测试：

- 前台：`http://123.57.181.242:3001`
- 后台：`http://123.57.181.242:3001/admin/login`

## 10. 如果你想继续使用 15415

因为 `15415` 已经被 `openclaw` 占用，这个博客不要直接再绑定这个端口。

你有两个安全选择：

### 方案 A：博客跑 `3001`

直接访问：

```text
http://123.57.181.242:3001
```

这是最省事的方案。

### 方案 B：用 Nginx 反向代理

如果你已经装了 Nginx，可以把博客挂到独立域名，或者挂到某个路径上。

示例：反代到 `3001`

```nginx
server {
    listen 80;
    server_name 123.57.181.242;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

检查并重载：

```bash
nginx -t
systemctl reload nginx
```

## 常用维护命令

更新代码：

```bash
cd /var/www/personal-blog
git pull
npm install --production
pm2 restart personal-blog
```

查看日志：

```bash
pm2 logs personal-blog --lines 100
```

重启：

```bash
pm2 restart personal-blog
```

停止：

```bash
pm2 stop personal-blog
```

## 数据位置

- 数据库：`/var/www/personal-blog/database/blog.db`
- 上传文件：`/var/www/personal-blog/uploads`

备份时把这两个位置一起保留即可。

## 我已经为部署补上的内容

- 支持通过 `DATABASE_PATH` 指定数据库路径
- 数据库目录不存在时自动创建
- 初始化管理员账号改为从环境变量读取
- 增加 `ecosystem.config.js`，可直接用 `PM2` 启动
- `.env.example` 默认改成更适合服务器共存的 `3001`

## 如果你要我继续“直接帮你部署”

我还差一个条件：你需要给我这台服务器的 SSH 登录方式，比如：

- SSH 用户名
- 密码，或私钥登录方式

有了这个我就能继续把线上部署步骤替你走完。
