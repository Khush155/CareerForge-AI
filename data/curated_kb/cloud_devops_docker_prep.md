# Cloud Computing, Docker & DevOps Preparation Guide

## Overview
Containerization, infrastructure as code, and cloud deployments are essential competencies for software engineers in cloud-native environments.

## Core Topics
1. **Containerization with Docker**:
   - Dockerfile best practices: Layer caching, order of instructions, avoiding root user.
   - Multi-stage builds: Compiling in build image, running in lightweight runtime image (e.g. Alpine/Distroless).
   - Docker Compose: Multi-container orchestration for local development and integration tests.

2. **Cloud Fundamentals (Azure / AWS)**:
   - Compute: Virtual Machines vs Container Instances vs Managed Kubernetes (AKS/EKS).
   - Networking: Virtual Networks (VNets/VPCs), Subnets, Security Groups, Load Balancers.
   - Storage: Blob/S3 object storage, Managed Block storage, Serverless databases.

3. **CI/CD Pipelines & Automation**:
   - GitHub Actions workflows: triggers, jobs, steps, environment secrets, artifacts.
   - Automated testing, linting gates, and zero-downtime deployment strategies.

## Practice Resources
- Docker Official Documentation: [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- Microsoft Learn: [Azure Fundamentals AZ-900 Learning Path](https://learn.microsoft.com/en-us/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/)
- Roadmap.sh: [DevOps Roadmap](https://roadmap.sh/devops)
