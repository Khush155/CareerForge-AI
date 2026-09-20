# Computer Networks & Transport Protocols

## Summary
Understanding network layers (OSI and TCP/IP models), socket handshakes, congestion control, and transport protocols enables backend engineers to optimize API latency and diagnose connectivity bottlenecks.

## Key Concepts
- **TCP Architecture**: 3-way handshake (SYN, SYN-ACK, ACK), 4-way termination (FIN, ACK, FIN, ACK), Sequence & Acknowledgment numbers, Sliding Window flow control, and Congestion Control (Slow Start, Congestion Avoidance).
- **TCP vs UDP**: Connection-oriented reliable ordered delivery vs connectionless fast packet streaming (DNS, VoIP, gaming).
- **HTTP Evolution**: HTTP/1.1 (persistent connections, head-of-line blocking), HTTP/2 (binary framing, stream multiplexing over 1 TCP connection), HTTP/3 (QUIC protocol over UDP, eliminating TCP head-of-line blocking).
- **DNS & Routing**: Recursive vs Iterative resolution, DNS records (A, AAAA, CNAME, MX, TXT), TTL caching, and BGP routing basics.

## Worked Example: Python Non-blocking TCP Socket Client
```python
import socket

def ping_tcp_port(host: str, port: int, timeout: float = 2.0) -> bool:
    """Verify TCP 3-way handshake connectivity with custom timeout."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        sock.connect((host, port))
        return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False
    finally:
        sock.close()
```

## Common Interview Questions
1. *What happens step-by-step when you type https://google.com into your browser?* (Browser checks DNS cache -> recursive DNS query -> TCP 3-way handshake -> TLS 1.3 cryptographic handshake -> HTTP GET request -> Server response -> Browser rendering pipeline).
2. *Why does HTTP/2 still suffer from Head-of-Line (HoL) blocking at the TCP layer?* (All HTTP/2 streams share one TCP connection; if a single TCP packet is dropped, the entire connection halts until retransmission completes).
3. *What is the difference between Symmetric and Asymmetric Cryptography in TLS?* (Asymmetric cryptography like RSA/ECC is used during TLS handshake to authenticate and securely exchange a symmetric session key; fast symmetric encryption like AES-GCM encrypts the actual payload data).

## Documentation & Official Resources
- [Cloudflare Learning - Computer Networks](https://www.cloudflare.com/learning/network-layer/what-is-the-network-layer/)
- [RFC 9000 - QUIC Protocol](https://datatracker.ietf.org/doc/html/rfc9000)
