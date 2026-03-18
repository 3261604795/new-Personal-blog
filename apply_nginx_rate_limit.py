from pathlib import Path

import paramiko


HOST = "123.57.181.242"
USER = "root"
PASSWORD = "D193852x."
BASE = Path(__file__).resolve().parent
VHOST_CONF = (BASE / "personal-blog-ip.conf", "/www/server/panel/vhost/nginx/personal-blog-ip.conf")
RATE_LIMIT_REMOTE = "/www/server/panel/vhost/nginx/extension/personal-blog-rate-limit.conf"
RATE_LIMIT_CONTENT = (
    "limit_req_zone $binary_remote_addr zone=blog_global:10m rate=10r/s;\n"
    "limit_req_zone $binary_remote_addr zone=blog_admin:10m rate=5r/s;\n"
    "limit_req_zone $binary_remote_addr zone=blog_login:10m rate=2r/s;\n"
)


def run(client, command):
    print(f"$ {command}")
    stdin, stdout, stderr = client.exec_command(command, get_pty=True)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    text = out
    if err.strip():
        text = f"{text}\n{err}" if text else err
    safe_text = text.strip().encode("gbk", errors="replace").decode("gbk", errors="replace")
    if safe_text:
        print(safe_text)
    if code != 0:
        raise RuntimeError(f"Command failed ({code}): {command}")


client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=20)

try:
    run(client, "mkdir -p /www/server/panel/vhost/nginx/extension")

    sftp = client.open_sftp()
    try:
        sftp.put(str(VHOST_CONF[0]), VHOST_CONF[1])
        with sftp.file(RATE_LIMIT_REMOTE, "w") as remote_file:
            remote_file.write(RATE_LIMIT_CONTENT)
    finally:
        sftp.close()

    run(
        client,
        "python3 - <<'PY'\n"
        "from pathlib import Path\n"
        "path = Path('/www/server/nginx/conf/nginx.conf')\n"
        "text = path.read_text(encoding='utf-8')\n"
        "needle = \"\\t\\tinclude proxy.conf;\\n\"\n"
        "insert = needle + \"\\t\\tinclude /www/server/panel/vhost/nginx/extension/personal-blog-rate-limit.conf;\\n\"\n"
        "if 'personal-blog-rate-limit.conf' not in text:\n"
        "    text = text.replace(needle, insert, 1)\n"
        "    path.write_text(text, encoding='utf-8')\n"
        "PY"
    )

    run(client, "nginx -t")
    run(client, "systemctl reload nginx")
    run(client, "curl -I --max-time 15 -H 'Host: 123.57.181.242' http://127.0.0.1/")
    run(client, "curl -I --max-time 15 -H 'Host: 123.57.181.242' http://127.0.0.1/admin/login")
finally:
    client.close()
