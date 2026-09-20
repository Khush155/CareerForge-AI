# Linux Systems & Command-Line Fundamentals

## Summary
Linux is the universal server operating system powering modern cloud clusters, container runtimes, and developer environments. Mastering the shell, permissions, process signals, and system diagnostics is required for any software engineer.

## Key Concepts
- **Filesystem Hierarchy**: `/etc` (configurations), `/var/log` (telemetry), `/proc` and `/sys` (pseudo-filesystems exposing kernel metrics and hardware state).
- **Permissions & Ownership**: Read/Write/Execute bits (rwx = 4+2+1), User/Group/Others, `chmod`, `chown`, and `umask`.
- **Process Signals & Daemons**: `SIGTERM` (15, graceful termination), `SIGKILL` (9, uncatchable immediate kill), `SIGHUP` (1, reload config), `ps aux`, `htop`, `systemd` unit files.
- **Pipes & Streams**: Standard In (0), Standard Out (1), Standard Error (2), redirection (`>`, `>>`, `2>&1`), and text manipulation tools (`grep`, `sed`, `awk`, `xargs`).

## Worked Example: Real-time Production Log Inspection
```bash
# Filter errors from Nginx access logs and count top offending client IPs
cat /var/log/nginx/access.log \
  | grep " 500 " \
  | awk '{print $1}' \
  | sort \
  | uniq -c \
  | sort -nr \
  | head -n 10
```

## Common Interview Questions
1. *What is the difference between a Hard Link and a Soft (Symbolic) Link?* (A hard link points directly to the file's disk inode, surviving target deletion; a soft link points to the filename path and breaks if the target file is renamed or removed).
2. *How do you inspect which process is holding a specific port?* (`lsof -i :8000` or `netstat -tulpn | grep 8000` or `ss -tulpn`).
3. *What is the difference between `SIGTERM` and `SIGKILL`?* (`SIGTERM` requests clean process shutdown, allowing handlers to close DB connections and flush buffers; `SIGKILL` forcefully terminates the process immediately without running cleanup).

## Documentation & Official Resources
- [Linux Journey](https://linuxjourney.com/)
- [Arch Linux Systemd Guide](https://wiki.archlinux.org/title/systemd)
