# 🚀 FinAI – AI-Powered Budget Planning Agent

> **"Plan Smarter. Save Better. Grow Faster."**

FinAI is an intelligent personal finance assistant that transforms budgeting into an interactive conversation. Instead of manually tracking expenses in spreadsheets, users simply chat with FinAI to create budgets, analyze spending habits, receive AI-powered financial insights, and achieve their savings goals.

---

## 🌟 Why FinAI?

Managing personal finances can be overwhelming. FinAI simplifies this process by combining Artificial Intelligence, data visualization, and personalized recommendations into one seamless platform.

Whether you're a student, working professional, or freelancer, FinAI helps you make informed financial decisions.

---

## ✨ Core Features

* 🤖 AI Financial Assistant
* 💬 Conversational Budget Planning
* 📊 Interactive Dashboard
* 💸 Expense Categorization
* 🎯 Savings Goal Tracker
* 📈 Monthly & Yearly Reports
* 🧠 Smart Spending Insights
* 📂 Persistent Data Storage
* 🔒 Secure Authentication Ready
* 📱 Responsive Design

---

# 🏗 Architecture

```text
                User
                  │
        ┌─────────▼─────────┐
        │  HTML • CSS • JS  │
        └─────────┬─────────┘
                  │
         REST API Requests
                  │
      ┌───────────▼───────────┐
      │ Node.js / FastAPI API │
      └───────────┬───────────┘
                  │
        Gemini AI Integration
                  │
      ┌───────────▼───────────┐
      │ Budget Recommendation │
      └───────────┬───────────┘
                  │
      JSON / MongoDB / Firebase
```

---

# 💻 Technology Stack

| Layer           | Technology                          |
| --------------- | ----------------------------------- |
| Frontend        | HTML5, CSS3, JavaScript             |
| Backend         | Node.js, Express.js, Python FastAPI |
| AI              | Google Gemini API                   |
| Database        | JSON, MongoDB, Firebase             |
| Deployment      | Docker, Docker Compose, Nginx       |
| Version Control | Git & GitHub                        |

---

# 📂 Project Structure

```text
FinAI
│
├── backend/
├── public/
├── nginx/
├── Dockerfile
├── docker-compose.yml
├── db.json
└── README.md
```

---

# 🚀 Quick Start

### Run with Docker

```bash
docker compose up --build
```

Open:

```text
http://localhost:8080
```

---

# 📊 What FinAI Can Do

✅ Create personalized budgets

✅ Analyze income vs expenses

✅ Recommend monthly savings

✅ Detect unnecessary spending

✅ Track financial goals

✅ Generate yearly budget reports

✅ Answer finance questions using AI

---

# 📈 Future Roadmap

* 📄 PDF Budget Reports
* 🏦 Bank API Integration
* 📷 Bill & Receipt Scanner
* 📱 Android/iOS App
* 📊 Investment Portfolio Tracking
* 🌍 Multi-Currency Support
* 🔔 Smart Spending Alerts

## ⭐ Support

If you found this project useful, please ⭐ the repository and contribute by opening issues or submitting pull requests.

Together, let's make financial planning smarter with AI.


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
