# Cybersecurity & Penetration Testing Placement Preparation Guide

## Summary
Cybersecurity and penetration testing safeguard enterprise assets, applications, and cloud infrastructures against adversarial attacks, unauthorized data access, and regulatory non-compliance. In modern software engineering and security operations (SecOps), security is shifting left into the development lifecycle, demanding proactive vulnerability assessments, ethical exploitation simulations, and continuous threat modeling.

For campus placements and security engineering interviews, candidates are heavily evaluated on their grasp of attack vectors, defensive mitigations, network protocols, cryptographic primitives, and threat intelligence. Candidates must demonstrate hands-on familiarity with OWASP Top 10 web vulnerabilities, system exploitation frameworks, network reconnaissance techniques, and defense-in-depth security architectures.

Mastering offensive tactics and defensive hardening equips engineers to design robust systems resilient to remote code execution (RCE), SQL injection, privilege escalation, and zero-day exploits across hybrid cloud environments.

## Key Concepts
- **OWASP Top 10 & Web Application Security**: Deep mechanical understanding of Injection (SQLi, Command Injection), Broken Authentication (OAuth/JWT flaws), Cross-Site Scripting (Reflected, Stored, DOM-based XSS), Server-Side Request Forgery (SSRF), and Insecure Direct Object References (IDOR).
- **Network Reconnaissance & Protocol Auditing**: Active and passive scanning mechanics using tools like Nmap, Wireshark, and Masscan. Understanding TCP 3-way handshakes, SYN stealth scans, banner grabbing, firewall evasion, and subnet enumeration.
- **Exploitation Frameworks & Privilege Escalation**: Penetration testing methodology using Metasploit, Burp Suite Professional, and custom Python/Bash exploit payloads. Linux privilege escalation via SUID binaries, misconfigured sudoers, and cron jobs; Windows privilege escalation via token impersonation and unquoted service paths.
- **Applied Cryptography & Infrastructure Defense**: Public Key Infrastructure (PKI), TLS 1.3 handshakes, symmetric vs. asymmetric cipher selection (AES-256-GCM vs. RSA-4096 / ECC Curve25519), password hashing standards (Argon2id, bcrypt, PBKDF2), and Zero Trust network access (ZTNA).

## Worked Example: Automated Security Audit & Port Vulnerability Scanner
```python
"""Automated Multi-Threaded TCP Port Scanner & Banner Grabber for Security Audits.

Designed for authorized vulnerability assessment and infrastructure baseline verification.
"""
import socket
from concurrent.futures import ThreadPoolExecutor
from typing import NamedTuple


class ServiceBanner(NamedTuple):
    port: int
    service: str
    banner: str
    is_open: bool


def audit_port(host: str, port: int, timeout: float = 1.0) -> ServiceBanner:
    """Probes a single TCP port and attempts clean protocol banner acquisition."""
    service_name = "unknown"
    try:
        service_name = socket.getservbyport(port, "tcp")
    except OSError:
        pass

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(timeout)
        try:
            # Establish TCP handshake
            connection_result = sock.connect_ex((host, port))
            if connection_result != 0:
                return ServiceBanner(port, service_name, "", False)

            # Probe for protocol banner or HTTP header response
            banner_data = ""
            try:
                # Send polite probe string (HTTP HEAD / Generic CRLF)
                sock.sendall(b"HEAD / HTTP/1.0\r\n\r\n")
                raw_response = sock.recv(1024)
                banner_data = raw_response.decode("utf-8", errors="replace").split("\r\n")[0]
            except (socket.timeout, OSError):
                banner_data = "Open (No banner broadcasted)"

            return ServiceBanner(port, service_name, banner_data.strip(), True)
        except (socket.timeout, ConnectionRefusedError, OSError):
            return ServiceBanner(port, service_name, "", False)


def run_security_scan(target_host: str, ports: list[int], max_workers: int = 20) -> list[ServiceBanner]:
    """Scans target host across specified port ranges concurrently."""
    target_ip = socket.gethostbyname(target_host)
    print(f"[*] Commencing authorized security reconnaissance on {target_host} ({target_ip})")

    open_services: list[ServiceBanner] = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(audit_port, target_ip, p) for p in ports]
        for f in futures:
            res = f.result()
            if res.is_open:
                open_services.append(res)
                print(f"[+] Port {res.port:>5}/TCP open | Service: {res.service:<10} | Banner: {res.banner}")

    return open_services


if __name__ == "__main__":
    COMMON_PORTS = [21, 22, 25, 53, 80, 443, 3306, 5432, 6379, 8080, 8443]
    run_security_scan("127.0.0.1", COMMON_PORTS)
```

## Common Interview Questions
1. *What is the difference between Reflected, Stored, and DOM-based Cross-Site Scripting (XSS)?* (Stored XSS persists malicious scripts permanently in the server database executing for every viewing user; Reflected XSS reflects payloads off the current web request without persisting; DOM-based XSS executes entirely on client-side JavaScript modifying the DOM without changing server response HTML).
2. *Explain Server-Side Request Forgery (SSRF) and how to defend against cloud metadata extraction.* (SSRF occurs when an attacker forces a back-end application to initiate requests to an unintended destination, such as the cloud instance metadata IP `169.254.169.254`. Defenses include strict URL whitelisting, disabling HTTP redirects, enforcing IMDSv2 token headers, and private subnet egress firewalls).
3. *Why should Argon2id or bcrypt be used for password storage instead of SHA-256 or MD5?* (General cryptographic hashes like SHA-256 are engineered for speed, allowing billions of guesses per second on GPUs; password hashing functions like Argon2id and bcrypt introduce configurable work factors (time, memory, and parallelism cost) making brute-force and ASIC/GPU rainbow-table attacks infeasible).

## Documentation & Official Resources
- [OWASP Top 10 Web Application Security Risks](https://owasp.org/www-project-top-ten/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [MITRE ATT&CK Framework](https://attack.mitre.org/)
