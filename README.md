# Imizamo Yethu Aftercare Management System

**Part 2 – Implementation**  
**NovaTech Solutions**  
**INSY7315 – Work Integrated Learning**

---

## 🌍 Project Overview

The **Imizamo Yethu Aftercare Management System** is a full-stack web application developed and donated by **NovaTech Solutions** to support the daily operations of the Imizamo Yethu Aftercare.

The system replaces manual, paper-based processes with a centralised digital platform for managing:

- Learner attendance
- Digital learner sign-out
- Guardian verification
- Developmental observations
- Class and learner management
- Role-based access
- Management reporting
- Donor and organisational reporting

This implementation represents **Part 2 of the project** and realises the requirements, architecture, database design, design patterns, and non-functional requirements established during the Part 1 planning and design phase.

The application has been designed with simplicity and accessibility in mind, particularly considering that teachers primarily use smartphones while management requires more comprehensive access through laptops or other larger devices.

---

## 🚀 Live Application

### 🌐 Running Web Application

> **Live Application:**  
> https://imizamo-yethu-aftercare-webapp-c0graphudmaqe2aw.southafricanorth-01.azurewebsites.net

---

## 🎥 Demonstration Video

A demonstration of the completed application can be viewed below.

> **YouTube Demo:**  
> https://youtu.be/2XYmDj81yUY

The demonstration showcases the implemented functionality, user roles, navigation, attendance management, learner sign-out, observations, and management functionality.

---

# 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React (Vite) + Tailwind CSS |
| **Backend** | Node.js 22 + Express |
| **Database** | PostgreSQL |
| **Architecture** | Layered Architecture |
| **Design Patterns** | Repository Pattern, Middleware / Chain of Responsibility |
| **Monorepo** | npm Workspaces |
| **Authentication** | Role-Based Access Control |
| **Deployment** | Microsoft Azure |
| **Version Control** | Git + GitHub |

### Architecture

The application follows a layered architecture:

```text
Routes
   ↓
Controllers
   ↓
Services
   ↓
Repositories
   ↓
PostgreSQL Database
```

This separation ensures that routing, request handling, business logic, and database access remain independent and maintainable.

The architectural decisions, technology evaluation, cloud architecture, security measures, and design patterns are documented in the **Part 1 submission**.

---

# 📁 Repository Structure

```text
.
├── client/                         # React frontend (Vite + Tailwind CSS)
│   └── src/
│       ├── components/             # Reusable UI components
│       ├── pages/                  # Role-specific screens
│       │   ├── Teacher/
│       │   ├── Manager/
│       │   ├── Admin/
│       │   └── Guardian/
│       ├── hooks/                  # Custom React hooks
│       └── services/               # API client and authentication helpers
│
├── server/                         # Express backend API
│   └── src/
│       ├── routes/                 # API route definitions
│       ├── controllers/            # Request handling
│       ├── services/               # Business logic
│       ├── repositories/           # Database access layer
│       ├── middleware/             # Authentication, authorisation,
│       │                            # logging and error handling
│       ├── config/                 # Environment configuration
│       └── db/                     # Database-related scripts
│
│       └── db/                     # pool, migrations, seeds
│           ├── migrations/         # node-pg-migrate SQL files
│           └── legacy/             # old one-off migration history
│
├── package.json                    # Root workspace configuration
└── .nvmrc                          # Node.js version specification
```

The layered structure and middleware chain directly implement the **System Architecture** and **Design Patterns** specified in the Part 1 documentation.

---

# 👥 User Roles

The system implements role-based access control to ensure that users only have access to functionality appropriate to their responsibilities.

| Role | Access Level |
|---|---|
| **Master Administrator** | Full system configuration and development/handover functionality |
| **Administrator** | Organisation-wide reporting and high-level settings |
| **Manager** | Operational oversight across all classes |
| **Teacher** | Attendance, observations, learner management and digital sign-out |
| **Parent / Guardian** | Access to their own child/children's profiles, attendance and permissions |

---

# 💻 Prerequisites

Before running the application locally, ensure that the following software is installed:

- **Node.js 22**
- **npm 10+**
- **PostgreSQL**
- **Git**
- A code editor such as **Visual Studio Code**

The required Node.js version is also specified in the `.nvmrc` file.

---

# ⚙️ Local Setup

## 1. Clone the Repository

Link to Repository: https://github.com/INSY7315ImizamoYethuAftercare/Imizamo_Yethu_Aftercare.git

---

## 2. Install Dependencies

Install all dependencies from the repository root:

```bash
npm install
```

Because the project uses **npm workspaces**, this installs the required dependencies for both the frontend and backend.

---

## 3. Configure Environment Variables

Create the server environment file:

```bash
cp server/.env.example server/.env
```

Create the client environment file:

```bash
cp client/.env.example client/.env.local
```

Update the environment variables with the appropriate local PostgreSQL and application configuration.

> **Important:** Environment files containing credentials or secrets should never be committed to GitHub.

---

# 🗄️ Database Setup

The project uses **PostgreSQL** as its relational database.

## 1. Create the Development Database

From a PostgreSQL-enabled terminal:

```markdown
# 🗄️ Database Setup

The project uses **PostgreSQL** as its relational database.  
Schema changes are managed with **node-pg-migrate**. The baseline migration under `server/src/db/migrations/` is the source of truth.

## 1. Create the Development Database

From a PostgreSQL-enabled terminal:

```bash
psql -U postgres -c "CREATE DATABASE imizamo_dev;"

This only needs to be performed once.

## 2. Apply the Database Schema

```bash
psql -U postgres -d imizamo_dev -f database/schema.sql
```

The `database/schema.sql` file acts as the source of truth for the database structure.

---

# ▶️ Running the Application

The frontend and backend are run separately during local development.

### Terminal 1 — Backend

```bash
npm run dev:server
```

The API will run on:

```text
http://localhost:4000
```

### Terminal 2 — Frontend

```bash
npm run dev:client
```

The React application will run on:

```text
http://localhost:5173
```

The Vite development server proxies `/api/*` requests to the backend, helping to prevent CORS issues during local development.

---

# 🩺 API Health Check

Once the backend is running, the API can be tested using:

```bash
curl http://localhost:4000/api/health
```

A successful response should look similar to:

```json
{
  "status": "ok",
  "timestamp": "..."
}
```

---

# 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev:server` | Starts the Express API with hot reload |
| `npm run dev:client` | Starts the React/Vite development server |
| `npm run build:client` | Creates a production build of the frontend |
| `npm run start:server` | Starts the API in production mode |
| `npm test` | Runs the test suites across the workspaces |

---

# 🔑 Key Implementation Features

### Role-Based Access Control

Users are assigned roles that determine which areas of the application they can access. This ensures that sensitive functionality is restricted to authorised users.

### Attendance Management

Teachers can digitally record learner attendance, replacing the existing paper-based attendance registers.

### Digital Learner Sign-Out

The system supports digital learner sign-out with guardian verification, improving accountability and reducing the reliance on physical sign-out sheets.

### Developmental Observations

Teachers can record developmental observations about learners, allowing relevant information to be stored digitally and accessed by authorised users.

### Reporting

Managers and administrators can access information and reports to support operational decision-making and organisational oversight.

### Responsive Design

The frontend follows a mobile-first approach to accommodate teachers who primarily access the system using smartphones while still providing an effective experience on laptops and larger screens.

### Repository Pattern

Database access is isolated within repositories, preventing database-specific logic from being directly embedded within controllers or frontend components.

### Middleware / Chain of Responsibility

Middleware is used to process requests through a sequence of responsibilities including:

```text
Request
   ↓
Logging
   ↓
Authentication
   ↓
Authorisation
   ↓
Controller
   ↓
Service
   ↓
Repository
   ↓
Database
```

This improves separation of concerns, security, maintainability, and testability.

---

# 🔐 Security & Configuration

Sensitive configuration information is stored using environment variables rather than being hard-coded into the application.

Examples include:

```text
DATABASE_URL
JWT_SECRET
API configuration
Authentication credentials
```

Environment files are excluded from version control through `.gitignore`.

For the deployed Azure application, environment variables are configured through the **Azure App Service Environment Variables** rather than exposing credentials within the source code.

---

# ☁️ Deployment

The application is deployed using **Microsoft Azure**.

The deployed architecture consists of:

```text
User
  │
  ▼
Azure App Service
  │
  ├── React Frontend
  │
  └── Node.js / Express Backend
          │
          ▼
      PostgreSQL
```

The application is accessible through the live Azure deployment link provided at the beginning of this README.

---

# 📐 Relationship to Part 1

The Part 2 implementation corresponds directly to the artefacts and decisions produced during Part 1.

These include:

- User Roles
- User Stories
- Domain Class Diagram
- Design Class Diagram
- Entity Relationship Diagram
- Database Schema
- Sequence Diagrams
- State Diagrams
- System Architecture
- Cloud Architecture
- Design Patterns
- Non-Functional Requirements
- Security Requirements
- DevOps Decisions
- Cost Analysis
- Change Management Plan

The working application demonstrates the practical implementation and realisation of these design decisions.

---

# 📋 Non-Functional Requirements

The implementation considers the following non-functional requirements:

| Requirement | Implementation |
|---|---|
| **Performance** | Efficient API structure and database access |
| **Security** | Authentication, authorisation and environment-based secrets |
| **Usability** | Simple, responsive and role-specific interfaces |
| **Reliability** | Structured backend architecture and error handling |
| **Scalability** | Layered architecture and cloud deployment |
| **Maintainability** | Separation of controllers, services and repositories |
| **Portability** | Web-based application accessible across modern devices |

---

# 👨‍💻 Team

## NovaTech Solutions

| Student Number | Team Member |
|---|---|
| **ST10445500** | Isabelle Kathryn Devlin |
| **ST10068995** | Thomas Pheiffer |
| **ST10325652** | Michaela Ferraris |
| **ST10301146** | Nomsa Mkoka |
| **ST10280758** | Justin Fussell |

---

# 📚 Documentation

This README accompanies the **Part 2 – Implementation** submission.

For a complete explanation of the project's:

- Requirements analysis
- User research
- Design artefacts
- Architecture
- Technology evaluation
- Cloud architecture
- Security decisions
- Design patterns
- Non-functional requirements
- Cost projections
- Change management
- Implementation decisions

please refer to the **Part 1 planning and design document**.

---

# 🎬 Project Links

### 🌐 Live Web Application

https://imizamo-yethu-aftercare-webapp-c0graphudmaqe2aw.southafricanorth-01.azurewebsites.net 

### ▶️ YouTube Demonstration
App Demo Only: https://youtu.be/dpp4UZbB32g

Full Video: https://youtu.be/2XYmDj81yUY

---

## 💙 NovaTech Solutions

*Developed and donated by NovaTech Solutions to support the digital transformation of the Imizamo Yethu Aftercare.*

**INSY7315 – Work Integrated Learning | Part 2 – Implementation**
