import sys
from pathlib import Path
import paramiko


HOST = "123.57.181.242"
USER = "root"
PASSWORD = "D193852x."


def run_commands(commands):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=20)
    try:
        for command in commands:
            print(f"$ {command}")
            stdin, stdout, stderr = client.exec_command(command, get_pty=True)
            exit_code = stdout.channel.recv_exit_status()
            out = stdout.read().decode("utf-8", errors="replace")
            err = stderr.read().decode("utf-8", errors="replace")
            if out.strip():
                print(out.strip())
            if err.strip():
                print(err.strip(), file=sys.stderr)
            print(f"[exit {exit_code}]")
    finally:
        client.close()


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "--file":
      command_file = Path(sys.argv[2])
      commands = [
          line.strip()
          for line in command_file.read_text(encoding="utf-8").splitlines()
          if line.strip()
      ]
      run_commands(commands)
    else:
      run_commands(sys.argv[1:])
