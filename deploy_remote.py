import os
import posixpath
import secrets
import stat
from pathlib import Path

import paramiko


HOST = "123.57.181.242"
USER = "root"
PASSWORD = "D193852x."
LOCAL_ROOT = Path(__file__).resolve().parent
REMOTE_ROOT = "/var/www/personal-blog"
NODE20_ROOT = "/opt/node20-personal-blog"

EXCLUDE_DIRS = {
    ".git",
    "node_modules",
    "database",
    "__pycache__",
}
EXCLUDE_FILES = {
    "remote_exec.py",
    "deploy_remote.py",
    "remote_probe.txt",
}


def ssh_client():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=20)
    return client


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


def ensure_remote_dir(sftp, remote_dir):
    parts = remote_dir.strip("/").split("/")
    current = ""
    for part in parts:
        current = f"{current}/{part}"
        try:
            sftp.stat(current)
        except OSError:
            sftp.mkdir(current)


def upload_tree(sftp, local_dir, remote_dir):
    ensure_remote_dir(sftp, remote_dir)
    for entry in local_dir.iterdir():
        if entry.name in EXCLUDE_FILES:
            continue
        if entry.is_dir():
            if entry.name in EXCLUDE_DIRS:
                continue
            upload_tree(sftp, entry, posixpath.join(remote_dir, entry.name))
        else:
            remote_path = posixpath.join(remote_dir, entry.name)
            print(f"upload {entry} -> {remote_path}")
            sftp.put(str(entry), remote_path)


def main():
    session_secret = secrets.token_hex(32)
    admin_password = secrets.token_urlsafe(12)

    client = ssh_client()
    try:
        run(client, "mkdir -p /var/www/personal-blog")
        run(client, "mkdir -p /var/www/personal-blog/uploads")

        sftp = client.open_sftp()
        try:
            upload_tree(sftp, LOCAL_ROOT, REMOTE_ROOT)
        finally:
            sftp.close()

        env_content = "\n".join([
            "PORT=3001",
            f"SESSION_SECRET={session_secret}",
            "DATABASE_PATH=./database/blog.db",
            "ADMIN_USERNAME=admin",
            f"ADMIN_PASSWORD={admin_password}",
            "",
        ])

        sftp = client.open_sftp()
        try:
            with sftp.file(f"{REMOTE_ROOT}/.env", "w") as remote_file:
                remote_file.write(env_content)
        finally:
            sftp.close()

        run(client, f"mkdir -p {NODE20_ROOT}")
        run(
            client,
            f"curl -fsSL https://nodejs.org/dist/v20.20.0/node-v20.20.0-linux-x64.tar.xz | tar -xJf - --strip-components=1 -C {NODE20_ROOT}",
        )
        run(client, f"{NODE20_ROOT}/bin/node -v")
        run(client, f"rm -rf {REMOTE_ROOT}/node_modules")
        run(client, f"cd {REMOTE_ROOT} && {NODE20_ROOT}/bin/npm install --omit=dev")
        run(client, f"{NODE20_ROOT}/bin/npm install -g pm2")
        run(client, f"cd {REMOTE_ROOT} && set -a && source .env && set +a && PATH={NODE20_ROOT}/bin:$PATH npm run init-db")
        run(client, f"PATH={NODE20_ROOT}/bin:$PATH pm2 delete personal-blog || true")
        run(client, f"cd {REMOTE_ROOT} && PATH={NODE20_ROOT}/bin:$PATH pm2 start ecosystem.config.js --update-env")
        run(client, f"PATH={NODE20_ROOT}/bin:$PATH pm2 save")
        run(client, f"PATH={NODE20_ROOT}/bin:$PATH pm2 status")
        run(client, "systemctl is-active firewalld || true")
        run(client, "firewall-cmd --add-port=3001/tcp --permanent || true")
        run(client, "firewall-cmd --reload || true")
        run(client, "ss -ltnp | grep ':3001' || true")

        print(f"ADMIN_PASSWORD={admin_password}")
        print(f"SESSION_SECRET={session_secret}")
    finally:
        client.close()


if __name__ == "__main__":
    main()
