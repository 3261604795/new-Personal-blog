from pathlib import Path

import paramiko


HOST = "123.57.181.242"
USER = "root"
PASSWORD = "D193852x."
LOCAL_CONF = Path(__file__).resolve().parent / "personal-blog-ip.conf"
REMOTE_CONF = "/www/server/panel/vhost/nginx/personal-blog-ip.conf"


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
        sftp.put(str(LOCAL_CONF), REMOTE_CONF)
    finally:
        sftp.close()

    run(client, "nginx -t")
    run(client, "systemctl reload nginx")
    run(client, "curl -I --max-time 15 -H 'Host: 123.57.181.242' http://127.0.0.1/")
finally:
    client.close()
