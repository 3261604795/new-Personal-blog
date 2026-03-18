from pathlib import Path

import paramiko


HOST = "123.57.181.242"
USER = "root"
PASSWORD = "D193852x."
REMOTE_ROOT = "/var/www/personal-blog"
REMOTE_SCRIPT = f"{REMOTE_ROOT}/scripts/create-default-post.js"

SCRIPT_CONTENT = """const db = require('../config/database');

const title = '欢迎来到我的个人博客';
const slug = 'welcome-to-my-blog';
const excerpt = '这是博客上线后的第一篇默认欢迎文章，之后你可以在后台继续发布自己的内容。';
const content = `# 欢迎来到我的个人博客

这是一篇默认欢迎文章，说明博客已经成功部署并可以正常发布内容。

## 你现在可以做什么

- 登录后台继续写文章
- 新建分类和标签
- 上传封面图和正文图片
- 编辑“关于我”页面

## 写作建议

你可以先发布一篇自我介绍，再写几篇技术或生活随笔，让首页更完整。

如果你正在看到这篇文章，说明前台页面、数据库和后台发布链路都已经打通了。
`;

db.serialize(() => {
  db.get('SELECT id FROM posts WHERE slug = ?', [slug], (err, existingPost) => {
    if (err) {
      console.error(err.message);
      process.exit(1);
    }

    if (existingPost) {
      console.log('Post already exists');
      process.exit(0);
    }

    db.get('SELECT id FROM categories WHERE slug = ?', ['essay'], (categoryErr, category) => {
      if (categoryErr) {
        console.error(categoryErr.message);
        process.exit(1);
      }

      db.run(
        `INSERT INTO posts (title, slug, content, excerpt, category_id, status)
         VALUES (?, ?, ?, ?, ?, 'published')`,
        [title, slug, content, excerpt, category ? category.id : null],
        function(insertErr) {
          if (insertErr) {
            console.error(insertErr.message);
            process.exit(1);
          }

          const postId = this.lastID;
          db.all('SELECT id FROM tags WHERE slug IN (?, ?)', ['nodejs', 'javascript'], (tagErr, tags) => {
            if (tagErr) {
              console.error(tagErr.message);
              process.exit(1);
            }

            if (!tags || tags.length === 0) {
              console.log(`Created post ${postId}`);
              process.exit(0);
            }

            let remaining = tags.length;
            tags.forEach((tag) => {
              db.run('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tag.id], (mapErr) => {
                if (mapErr) {
                  console.error(mapErr.message);
                  process.exit(1);
                }

                remaining -= 1;
                if (remaining === 0) {
                  console.log(`Created post ${postId}`);
                  process.exit(0);
                }
              });
            });
          });
        }
      );
    });
  });
});
"""


def run(client, command):
    print(f"$ {command}")
    stdin, stdout, stderr = client.exec_command(command, get_pty=True)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out.strip():
        print(out.strip().encode("gbk", errors="replace").decode("gbk", errors="replace"))
    if err.strip():
        print(err.strip().encode("gbk", errors="replace").decode("gbk", errors="replace"))
    if code != 0:
        raise RuntimeError(f"Command failed ({code}): {command}")


client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=20)

try:
    sftp = client.open_sftp()
    try:
        with sftp.file(REMOTE_SCRIPT, "w") as remote_file:
            remote_file.write(SCRIPT_CONTENT)
    finally:
        sftp.close()

    run(client, f"cd {REMOTE_ROOT} && PATH=/opt/node20-personal-blog/bin:$PATH node scripts/create-default-post.js")
    run(client, f"rm -f {REMOTE_SCRIPT}")
    run(client, "curl --max-time 15 -H 'Host: 123.57.181.242' http://127.0.0.1/ | sed -n '1,120p'")
    run(client, "curl -I --max-time 15 -H 'Host: 123.57.181.242' http://127.0.0.1/post/welcome-to-my-blog")
finally:
    client.close()
