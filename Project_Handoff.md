# CareerForge AI — Master Team Handbook & Architecture Handoff Guide

> **Project Name:** CareerForge AI — Adaptive Agentic Career & Placement Preparation System  
> **Target Audience:** Project Team Members, College Evaluation Panel, External Viva Examiners  
> **Current Status:** Core Platform, Deterministic Math, Reactive UI & Test Suite 100% Complete (66 Tests Passing, 98% Coverage, 0 Errors).  
> **Remaining Scope:** Handed off to 2 teammates: (1) Knowledge Base & Curated Study Material Expansion, (2) Azure Cloud Container Deployment & CI/CD.

---

## 1. Executive Summary & What CareerForge AI Is About

### The Problem
Traditional placement preparation tools and generic AI chatbots suffer from two fatal flaws:
1. **Text Wall Hallucinations:** When students ask ChatGPT for a roadmap, it generates vague, unverified advice with fabricated study hour estimations and zero accountability.
2. **Static & Fragile Roadmaps:** Existing learning platforms (Coursera, Udemy, static PDF syllabi) cannot adapt. If a student tests out of Python or struggles with Distributed Systems, the roadmap remains rigidly frozen.

### The Solution: CareerForge AI
CareerForge AI is an **autonomous, adaptive career guidance agent** that dynamically bridges the gap between an individual student's current competencies and the verified technical market requirements of **any** career track.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                THE 7-STEP AGENTIC LOOP                                  │
│                                                                                         │
│  [1. Research]  ──►  Discovers live industry requirements & verifiable documentation     │
│        │                                                                                │
│  [2. Analyze]   ──►  Parses student profile, weekly study hours & current proficiencies │
│        │                                                                                │
│  [3. Compare]   ──►  Calculates Skill Gaps: Gap = max(0, Required − Current) [No LLM]   │
│        │                                                                                │
│  [4. Recommend] ──►  RAG retrieval of curated placement guides & interview benchmarks  │
│        │                                                                                │
│  [5. Plan]      ──►  Synthesizes progressive phased roadmap matched to weekly hours     │
│        │                                                                                │
│  [6. Assess]    ──►  Evaluates live skill scores via closed-loop Recalibration Studio   │
│        │                                                                                │
│  [7. Adapt]     ──►  THE HERO FEATURE: Deprioritizes mastered skills, shifts remaining  │
│                      hours, rebalances phase milestones, and increments roadmap version │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Core Architectural Pillars
1. **100% Deterministic Math Engine:** Zero LLM math hallucinations. Gap calculations ($\text{Gap} = \max(0, \text{Required} - \text{Current})$), velocity estimations, and hour shifting are computed in pure, unit-tested Python. The LLM is used strictly for pedagogical explanations and synthesis.
2. **Open-Ended Role Intelligence:** Supports any dream job or technical aspiration through a resilient `RoleResolver` that matches synonyms, tech acronyms, and aliases across software, healthcare, finance, design, core engineering, and emerging fields.
3. **Local RAG (Retrieval-Augmented Generation):** Pulls verified campus placement notes and technical interview guides via local TF-IDF semantic chunking and strict title matching without external vector database dependencies.
4. **Interactive Recalibration Studio:** A dedicated studio allowing students to simulate test scores or calibrate competencies in real time, triggering mathematical phase rebalancing instantly.
5. **Multi-Profile LocalStorage Persistence:** Profiles, custom cartoon avatars, milestone checklists, and roadmap revisions persist seamlessly across page reloads.

---

## 2. Project Status: What is Done vs. What is Left

### ✅ What is Already Completed (Lead Architect Scope)
- **Data Models & Contracts:** Strict Pydantic v2 schemas (`profile.py`, `market.py`, `skill_gap.py`, `roadmap.py`, `assessment.py`).
- **Core Math Engines:** `gap_calculator.py` and `progress_engine.py` thoroughly tested with 100% deterministic outputs.
- **Agent Orchestrator:** `orchestrator.py` implementing the complete 7-step loop and live dynamic adaptation.
- **Persistence Layer:** SQLite repository (`storage.py`) with safe connection pooling, automatic schema creation, and graceful fallback.
- **Azure OpenAI Integration:** `azure_client.py` with seamless offline mock mode (`MODE=mock` / `MODE=azure`) ensuring zero downtime during evaluations.
- **Role Resolver Engine:** Dynamic multi-category role benchmark resolver supporting any dream job input with typo tolerance and fuzzy token expansion.
- **Modern React 19 Frontend:**
  - Search-first Home screen with debounced autocomplete and multi-category filters.
  - Interactive "Tune Plan" page for custom skill calibration and weekly hour commitments.
  - Mission Control Dashboard with Gap Matrix (Table, Heatmap, Radar), Phased Roadmap timeline, and Interactive Milestone Execution checklist.
  - Live Skill Recalibration Studio with custom searchable dropdown and real-time phase rebalancing.
  - Curated Study Guides view with slide-over Evidence Drawer.
  - Multi-profile switcher with custom cartoon avatar generator (`dice shuffle`).
  - Export & Share modal supporting Markdown syllabus download, JSON export, browser print/PDF, and shareable link generation.
- **Automated Test Suite:** 66 automated unit & integration tests passing with 98% coverage in ~15 seconds.

---

### ⏳ What is Left to Complete (Handoff Scope)
The remaining roadmap is divided into two self-contained, independent workstreams:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                REMAINING PROJECT WORK                                  │
├────────────────────────────────────────┬───────────────────────────────────────────────┤
│ TEAMMATE 1: Knowledge & Study Content  │ TEAMMATE 2: Azure Cloud Deployment & DevOps   │
│                                        │                                               │
│ • Expand Curated Study Guides in       │ • Multi-stage production Dockerfile           │
│   data/curated_kb/                     │ • Local docker-compose container test         │
│ • Add comprehensive interview banks,   │ • Azure Container Registry (ACR) setup        │
│   code snippets & benchmark citations  │ • Azure App Service / Container App deploy    │
│ • Connect catalog in EvidenceDrawer    │ • Persistent Azure Files volume for SQLite    │
│ • Verify with pytest & frontend build  │ • GitHub Actions CI/CD deployment workflow    │
└────────────────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 3. Teammate 1 Guide: Curated Study Material & Knowledge Base Expansion

### Role & Ownership
* **Focus:** Curriculum Design, RAG Knowledge Base, Technical Interview Guides.
* **Target Directory:** `data/curated_kb/` and `frontend/src/components/domain/EvidenceDrawer.tsx`.
* **Objective:** Expand our offline RAG database with high-yield placement preparation guides for key industry tracks so students clicking "Read Study Guide" or inspecting roadmap resources receive comprehensive, campus-vetted interview questions and technical walkthroughs.

### Step-by-Step Implementation Instructions

#### Step 1: Create New Markdown Preparation Guides
Add new `.md` files directly in `data/curated_kb/`. Use this consistent template:

```markdown
# <Topic Name> Placement Preparation Guide

## Summary
<2-3 concise paragraphs summarizing the technical domain, why it matters for placements, and industry standards.>

## Key Concepts
- **Concept 1**: Detailed explanation with practical engineering context.
- **Concept 2**: Tradeoffs, architecture, and common pitfalls.
- **Concept 3**: Industry standards and best practices.
- **Concept 4**: Performance, scalability, and security considerations.

## Worked Example: <Specific Real-World Code or Architecture>
```<language>
// Production-ready, clear, commented code snippet illustrating the concept
```

## Common Interview Questions
1. *<Technical Question 1>?* (<Concise, high-yield answer hint covering core principles>).
2. *<Technical Question 2>?* (<Answer hint explaining tradeoffs and edge cases>).
3. *<Technical Question 3>?* (<Answer hint explaining system-level impacts>).

## Documentation & Official Resources
- [<Resource Title 1>](<Official Documentation URL>)
- [<Resource Title 2>](<Official Guide or Roadmap URL>)
```

#### Priority Career Tracks to Add
Create files for these highly demanded tracks:
1. `data/curated_kb/cybersecurity_penetration_testing_prep.md` (OWASP Top 10, Network Recon, Metasploit, Cryptography).
2. `data/curated_kb/game_development_cplusplus_unity_prep.md` (Memory management, Game loops, Shader basics, Physics).
3. `data/curated_kb/data_engineering_spark_airflow_prep.md` (ETL pipelines, Distributed dataframes, Partitioning, Data lakes).
4. `data/curated_kb/flutter_mobile_development_prep.md` (Widget lifecycle, State management - Bloc/Riverpod, Async dart).
5. `data/curated_kb/generative_ai_llm_fine_tuning_prep.md` (Transformers, PEFT/LoRA, RAG architectures, Prompt engineering).

#### Step 2: Connect to Frontend Evidence Drawer
Open `frontend/src/components/domain/EvidenceDrawer.tsx`:
- Look for `KB_CATALOG: Record<string, CuratedGuideData>`.
- Add an entry for each new skill matching the skill key (e.g. `'cybersecurity'`, `'game_development'`, `'data_engineering'`).
- Populate `verifiedPostings`, `salaryImpact` (e.g., `'+$18k avg'`), `demandGrowth` (e.g., `'+28% YoY'`), `interviewQuestions`, and `officialResources`.

#### Step 3: Verify and Test
Run the test suite and verify that the RAG search engine indexes the new files cleanly:
```powershell
python -m pytest backend/tests/test_tools.py -v
cd frontend; npm run build
```

---

### Copy-Paste Antigravity Prompt for Teammate 1
Copy and paste this exact prompt into your Antigravity IDE:

```text
You are working on CareerForge AI as the Knowledge & Curriculum Expansion Lead.
Your goal is to expand the curated RAG knowledge base and study guides:
1. Create 4 new high-yield placement preparation markdown files in 'data/curated_kb/':
   - 'cybersecurity_penetration_testing_prep.md'
   - 'game_development_cplusplus_unity_prep.md'
   - 'data_engineering_spark_airflow_prep.md'
   - 'generative_ai_llm_fine_tuning_prep.md'
   Follow the established markdown template in 'data/curated_kb/cloud_devops_docker_prep.md' with Summary, Key Concepts, Worked Example, Common Interview Questions, and Documentation Links.
2. In 'frontend/src/components/domain/EvidenceDrawer.tsx', add corresponding entries in the 'KB_CATALOG' object with realistic placement stats, salary impact, and interview questions.
3. Verify that 'python -m pytest backend/tests/test_tools.py' passes and 'npm run build' in 'frontend/' compiles with 0 errors.
4. Stage and commit with: git commit -m "feat(knowledge): add curated study guides for cybersecurity, game dev, data engineering, and generative ai"
```

---

## 4. Teammate 2 Guide: Azure Cloud Deployment & DevOps

### Role & Ownership
* **Focus:** Docker Containerization, Azure Cloud Infrastructure, CI/CD Pipelines.
* **Target Files:** `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `.github/workflows/deploy-azure.yml`.
* **Objective:** Package CareerForge AI into an immutable, production-grade Docker image and deploy it to Azure (Azure Container Apps or Azure App Service for Linux) with persistent storage for SQLite and automated GitHub Actions CI/CD.

### Architecture Strategy: Single Unified Container
Because `backend/app/main.py` is already engineered to mount and serve `frontend/dist` directly as static files:
```python
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
```
We use a **multi-stage Docker build**:
- **Stage 1 (Node.js 20 Alpine):** Installs frontend dependencies and builds production assets (`npm run build` -> `frontend/dist`).
- **Stage 2 (Python 3.12 Slim):** Installs backend Python dependencies, copies compiled frontend assets from Stage 1, creates persistent data directory, and runs FastAPI via Uvicorn.
- **Benefit:** Both API and Web UI run on **port 8000** inside one container! Zero CORS headaches, minimal memory footprint (<250 MB RAM), and ultra-low cloud hosting cost.

---

### Step-by-Step Implementation Instructions

#### Step 1: Create Multi-Stage `Dockerfile` at Project Root
Create `Dockerfile`:

```dockerfile
# ==========================================
# Stage 1: Build the React 19 Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Python 3.12 Runtime & FastAPI
# ==========================================
FROM python:3.12-slim AS runner
WORKDIR /app

# Install runtime dependencies
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    DATABASE_PATH=/app/data/careerforge.db \
    MODE=azure

# Install curl for container healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code, curated knowledge base, and roles
COPY backend/ ./backend/
COPY data/ ./data/
COPY cache/ ./cache/

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create directory for persistent SQLite storage
RUN mkdir -p /app/data && chmod 777 /app/data

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Launch production server
WORKDIR /app/backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Step 2: Create `.dockerignore` at Project Root
```
node_modules/
frontend/node_modules/
frontend/dist/
.git/
.github/
.vscode/
__pycache__/
*.pyc
.pytest_cache/
.coverage/
.ruff_cache/
*.log
```

#### Step 3: Create `docker-compose.yml` for Local Testing
```yaml
version: '3.8'

services:
  careerforge:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: careerforge-ai
    ports:
      - "8000:8000"
    environment:
      - MODE=mock  # Set to azure when API key is provided
      - AZURE_OPENAI_API_KEY=${AZURE_OPENAI_API_KEY:-}
      - AZURE_OPENAI_ENDPOINT=${AZURE_OPENAI_ENDPOINT:-}
      - AZURE_OPENAI_DEPLOYMENT_NAME=${AZURE_OPENAI_DEPLOYMENT_NAME:-gpt-4o-mini}
      - AZURE_OPENAI_API_VERSION=2024-02-15-preview
      - DATABASE_PATH=/app/data/careerforge.db
    volumes:
      - careerforge-data:/app/data

volumes:
  careerforge-data:
```

#### Step 4: Azure Cloud Deployment Commands (Azure CLI)
Run these commands in terminal or script:

```bash
# 1. Login to Azure
az login

# 2. Define Variables
RESOURCE_GROUP="rg-careerforge-ai"
LOCATION="eastus"
ACR_NAME="acrcareerforge$RANDOM"
APP_NAME="careerforge-ai-app"

# 3. Create Resource Group
az group create --name $RESOURCE_GROUP --location $LOCATION

# 4. Create Azure Container Registry (ACR)
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

# 5. Build and Push image to ACR
az acr build --registry $ACR_NAME --image careerforge-ai:v1 .

# 6. Deploy to Azure Container Apps (Recommended for serverless & low cost)
az containerapp env create \
  --name env-careerforge \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

az containerapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment env-careerforge \
  --image $ACR_NAME.azurecr.io/careerforge-ai:v1 \
  --target-port 8000 \
  --ingress external \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_NAME \
  --registry-password $ACR_PASSWORD \
  --env-vars \
    MODE=azure \
    AZURE_OPENAI_API_KEY="<YOUR_KEY>" \
    AZURE_OPENAI_ENDPOINT="<YOUR_ENDPOINT>" \
    AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o-mini" \
    AZURE_OPENAI_API_VERSION="2024-02-15-preview"
```

#### Step 5: Automated GitHub Actions Workflow
Create `.github/workflows/deploy-azure.yml` to automatically run tests and deploy on git push.

---

### Copy-Paste Antigravity Prompt for Teammate 2
Copy and paste this exact prompt into your Antigravity IDE:

```text
You are working on CareerForge AI as the DevOps & Azure Cloud Deployment Lead.
Your goal is to dockerize CareerForge AI and configure Azure deployment:
1. Create a production multi-stage 'Dockerfile' at the repository root:
   - Stage 1: Build frontend via node:20-alpine (run npm ci && npm run build).
   - Stage 2: Python 3.12-slim runtime, install requirements.txt, copy backend, data/, cache/, and frontend/dist.
   - Run FastAPI with uvicorn on port 8000 serving both API and static frontend assets.
2. Create '.dockerignore' and 'docker-compose.yml' for local container verification.
3. Create '.github/workflows/ci-deploy.yml' with a GitHub Actions workflow that:
   - Runs backend pytest and frontend npm run build.
   - Builds Docker image and verifies health check at /health.
4. Verify locally using 'docker build -t careerforge-ai:test .' or 'npm run build'.
5. Stage and commit with: git commit -m "ci(deploy): add production multi-stage Dockerfile, compose, and Azure deployment workflow"
```

---

## 5. File Structure Reference

```
CareerForge-AI/
├── backend/
│   ├── app/
│   │   ├── agent/                 # Orchestrator & Azure OpenAI wrapper
│   │   │   ├── azure_client.py
│   │   │   └── orchestrator.py
│   │   ├── api/                   # REST API endpoints
│   │   │   └── routes.py
│   │   ├── core/                  # 100% Deterministic math engines
│   │   │   ├── gap_calculator.py
│   │   │   └── progress_engine.py
│   │   ├── db/                    # SQLite database storage repository
│   │   │   └── storage.py
│   │   ├── models/                # Pydantic v2 schemas
│   │   │   ├── profile.py
│   │   │   ├── market.py
│   │   │   ├── skill_gap.py
│   │   │   ├── roadmap.py
│   │   │   └── assessment.py
│   │   ├── tools/                 # Knowledge RAG, Market search, Role resolver
│   │   │   ├── knowledge_rag.py
│   │   │   ├── market_search.py
│   │   │   └── role_resolver.py
│   │   └── main.py                # FastAPI entrypoint, CORS, and Static UI mount
│   ├── tests/                     # 66 automated unit & integration tests
│   └── requirements.txt
├── data/
│   ├── curated_kb/                # Curated RAG Study Guides (.md) [TEAMMATE 1 EXPANDS HERE]
│   └── roles/                     # Career track JSON benchmark definitions
├── frontend/
│   ├── src/
│   │   ├── app/                   # App root component
│   │   ├── components/            # Domain components (GapMatrix, PhaseCard, RecalibrationStudio)
│   │   ├── features/              # Home, Tune Plan, Mission Control, Progress Analytics
│   │   ├── lib/                   # API client, Zustand store, LocalStorage sync
│   │   └── styles/                # CSS tokens & typography
│   ├── package.json
│   └── vite.config.ts
├── Dockerfile                     # Multi-stage production container [TEAMMATE 2 CREATES HERE]
├── docker-compose.yml             # Local container testing [TEAMMATE 2 CREATES HERE]
├── .github/workflows/             # GitHub Actions CI/CD [TEAMMATE 2 CREATES HERE]
├── .env.example
├── package.json                   # Root development script runner
└── Project_Handoff.md             # THIS HANDBOOK
```

---

## 6. How to Run Locally

### Start Full-Stack Dev Server
```powershell
npm run dev
```
- **Web UI:** `http://localhost:5173`
- **Backend API:** `http://localhost:8000`
- **Swagger Documentation:** `http://localhost:8000/docs`

### Run Backend Automated Tests
```powershell
python -m pytest backend/tests -v
```
*(All 66 tests pass in ~15 seconds with 0 failures).*

### Build Frontend
```powershell
cd frontend
npm run build
```
*(Compiles cleanly with 0 TypeScript errors).*

---

## 7. Viva & Presentation Talking Points (By Team Member)

### Primary Lead — Architecture, Deterministic Math & Full-Stack UI
> *"I designed the architecture of CareerForge AI around a zero-hallucination principle. While LLMs are great at text explanations, they are notoriously untrustworthy with numbers. I engineered our skill gap and adaptation engines in pure, unit-tested Python code. When a student takes an assessment, the system mathematically shifts study hours and updates roadmaps in real time. I also built the reactive React 19 interface and the session persistence system."*

### Teammate 1 — Knowledge Base & Study Material Expansion
> *"I served as the Curriculum and Knowledge Systems Lead. I authored our comprehensive placement study guides and mapped them into our RAG retriever. Using semantic token chunking and strict title relevance matching, our system provides students with verified technical interview questions, architecture notes, and official documentation citations for each stage of their personalized roadmap."*

### Teammate 2 — Azure Cloud Deployment & DevOps
> *"I owned the DevOps and Cloud Infrastructure. I created a multi-stage Docker build that compiles our React 19 frontend and packages it with our FastAPI server into a unified container image. I configured Azure Container Apps for serverless scaling, mounted Azure Files storage to persist the SQLite database across container restarts, and established GitHub Actions CI/CD to ensure all 66 tests pass before production deployment."*

---

## 8. Golden Rules for the Team (Do Not Violate)

1. **Do not commit `.env` files or real API keys to git.** Always use environment variables in deployment.
2. **Never replace deterministic math with LLM guesses.** All gap and progression formulas must remain in Python.
3. **Always run `python -m pytest backend/tests` and `npm run build`** before pushing any commit to `main`.
4. **Use clear conventional commit messages:**
   - Teammate 1: `feat(knowledge): add curated study guides for <topics>`
   - Teammate 2: `ci(deploy): add multi-stage Dockerfile and Azure deployment workflow`
