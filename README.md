# FinAI Budget Planning Agent

FinAI is a full-stack, intelligent budget planning agent that helps users set up, analyze, and manage monthly/yearly budgets using a conversational interface and a visual dashboard. 

The application offers two stack architectures:
1. **Node.js Stack (Option A):** A unified Node.js/Express server that serves both the static frontend assets and the backend REST API (storing data in a local `db.json` database).
2. **Split Stack (Option B):** A Python FastAPI REST API server coupled with an Nginx reverse proxy serving the static frontend files and proxying API endpoints to FastAPI.

---

## Prerequisites
Ensure you have the following installed on your machine:
- [Docker](https://www.docker.com/) (Version 20.10+ recommended)
- [Docker Compose](https://docs.docker.com/compose/)

---

## Project Structure
```text
.
├── backend/
│   ├── main.py              # Python FastAPI entry point
│   ├── database.py          # MongoDB/Firestore/JSON Database Manager
│   ├── models.py            # Pydantic Schemas
│   ├── requirements.txt     # Python Dependencies
│   └── Dockerfile           # Python FastAPI Container definition
├── nginx/
│   └── nginx.conf           # Nginx Configuration (Reverse proxy setup)
├── public/
│   ├── index.html           # HTML5 Frontend
│   ├── app.js               # Javascript State & Logic
│   └── style.css            # Custom Premium UI Styles
├── .dockerignore            # Files ignored in Docker context
├── Dockerfile               # Node.js Full-stack Container definition
├── docker-compose.yml       # Docker Compose definition (Offers both stacks)
├── db.json                  # Local persistent JSON database
└── README.md                # This documentation
```

---

## Configuration (`.env`)

Create or update the `.env` file in the root directory. This file will be read by both Docker Compose setups:

```env
PORT=8080
JWT_SECRET=finai-secure-token-secret-key-99887766
GEMINI_API_KEY=your_gemini_api_key_here
# Optional Python specific DB variables:
# MONGODB_URI=your_mongodb_connection_string
# FIREBASE_CREDENTIALS_JSON=path_to_firebase_creds_inside_container
```

*Note: If `GEMINI_API_KEY` is not provided, the application will gracefully fall back to a local intelligent rule-based chat engine.*

---

## Option A: Run Node.js Full-Stack App (Default)

This option spins up the single Node.js container hosting both the Express API and frontend.

### 1. Build and Run
To start the Node.js application, run:
```bash
docker compose up -d node-app
```

### 2. Access the Application
Open your browser and navigate to:
- **Frontend & API:** [http://localhost:8080](http://localhost:8080)

### 3. Database Persistence
The application uses local database storage in `db.json`. The `docker-compose.yml` file is configured with a bind mount (`./db.json:/app/db.json`), which syncs any updates made inside the container directly to your host machine.

---

## Option B: Run Split Stack (Python FastAPI + Nginx)

This option spins up the FastAPI API container and Nginx container. Nginx serves the frontend files and routes API requests to the Python container.

### 1. Build and Run
To start the Python and Nginx services, run:
```bash
docker compose up -d nginx-frontend api-python
```

### 2. Access the Application
Open your browser and navigate to:
- **Frontend (Nginx):** [http://localhost:8081](http://localhost:8081)
- **API (FastAPI docs):** [http://localhost:8080/docs](http://localhost:8080/docs) (Direct FastAPI container exposure is disabled by default in Compose; if you want to access the FastAPI container directly, expose its port or navigate to the Swagger docs at the proxy port if routes are configured).

### 3. Database Persistence
Similar to Option A, the Python container mounts the host's `db.json` at `/app/backend/db.json`, ensuring your budgets are saved and shared across runs.

---

## Common Commands

### View Logs
Check container logs to monitor API traffic or AI status:
```bash
# For Node.js app
docker compose logs -f node-app

# For Python API
docker compose logs -f api-python

# For Nginx
docker compose logs -f nginx-frontend
```

### Rebuild Containers
If you make changes to the source files or dependencies, rebuild the images:
```bash
# Rebuild everything
docker compose build

# Rebuild a specific service
docker compose build node-app
```

### Stop Services
To stop and remove containers (while keeping your data in `db.json` safe):
```bash
docker compose down
```