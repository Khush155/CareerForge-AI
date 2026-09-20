# Docker Containers & DevOps Pipelines

## Summary
Containerization packages applications with their exact runtime dependencies, ensuring deterministic deployment across developer workstations, CI/CD runners, and production clusters.

## Key Concepts
- **Docker Architecture**: Daemon, client, images, containers, registries, multi-stage builds, and storage layers (copy-on-write).
- **Networking & Volumes**: Bridge networks, host networking, named volumes, bind mounts, and container DNS resolution.
- **CI/CD Pipelines**: GitHub Actions workflows, linting, automated unit/integration test gates, container scanning, and automated artifact publishing.
- **Security Best Practices**: Non-root container users, minimal base images (Alpine/Distroless), secrets management (no hardcoded envs in Dockerfile), and pinned image digests.

## Worked Example: Multi-Stage Production Dockerfile
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 reactapp
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
USER reactapp
EXPOSE 3000
CMD ["npm", "run", "serve"]
```

## Common Interview Questions
1. *What is the difference between `CMD` and `ENTRYPOINT` in a Dockerfile?* (`ENTRYPOINT` defines the executable that always runs; `CMD` provides default arguments that can be overridden at runtime).
2. *How do multi-stage Docker builds reduce image size?* (Build dependencies and source files remain in temporary build stages; only compiled binaries and production runtimes are copied to the final minimal image).
3. *Explain the difference between a container and a virtual machine.* (VMs virtualize hardware and run complete guest operating systems; containers share the host Linux kernel and isolate user space processes via cgroups and namespaces).

## Documentation & Official Resources
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
