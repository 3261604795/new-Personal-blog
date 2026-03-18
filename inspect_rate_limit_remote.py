import paramiko


HOST = "123.57.181.242"
USER = "root"
PASSWORD = "D193852x."


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
    return code


client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=20)

try:
    run(client, "sed -n '1,20p' /www/server/panel/vhost/nginx/extension/personal-blog-rate-limit.conf | cat -vet")
    run(client, "grep -n \"personal-blog-rate-limit\" /www/server/nginx/conf/nginx.conf")
finally:
    client.close()
