# Imizamo Yethu Aftercare Management System

**Final Project Submission – Part 3**  
**NovaTech Solutions**  
**INSY7315 – Work Integrated Learning**

A completed, full-stack aftercare management system developed and donated by NovaTech Solutions to support the daily operations of Imizamo Yethu Aftercare.

---

## Project Team

| Student Number | Team Member |
|---|---|
| ST10445500 | Isabelle Kathryn Devlin |
| ST10068995 | Thomas Pheiffer |
| ST10325652 | Michaela Ferraris |
| ST10301146 | Nomsa Mkoka |
| ST10280758 | Justin Fussell |

## Project Overview

The **Imizamo Yethu Aftercare Management System** replaces manual, paper-based processes with a centralised digital platform for managing:

- Learner attendance and digital sign-out
- Guardian verification and permissions
- Learner and class management
- Developmental observations
- Role-based access
- Operational and management reporting
- Donor and organisational reporting

The system was developed around the operational needs of the aftercare centre. Teachers primarily access the application on smartphones, while management users require broader functionality on laptops and larger screens. The interface and workflows were designed to prioritise usability, accessibility, and straightforward day-to-day operation.

This **Part 3 submission represents the final project stage**. System development and project documentation have been completed. The final deliverables bring together the original requirements and design work, the implemented application, testing and feedback review, and the handover documentation.

## Project Links

| Resource | Link |
|---|---|
| **Application** | [Open the Imizamo Yethu Aftercare application](https://imizamo-yethu-aftercare-webapp-c0graphudmaqe2aw.southafricanorth-01.azurewebsites.net) |
| **Full demonstration** | [Watch the project walkthrough](https://youtu.be/2XYmDj81yUY) |
| **Application-only demonstration** | [Watch the application demo](https://youtu.be/dpp4UZbB32g) |
| **GitHub repository** | [Imizamo Yethu Aftercare](https://github.com/INSY7315ImizamoYethuAftercare/Imizamo_Yethu_Aftercare) |

The demonstration videos provide a visual overview of the completed application, its user roles, navigation, attendance workflows, learner sign-out, observations, and management functionality.

> **Deployment note:** The application has an Azure deployment URL. The production database environment has been affected by the team's Azure student-credit limitations. Please refer to the deployment and handover documentation for the current environment status, configuration, and restoration steps. Local development and automated testing can be performed using PostgreSQL.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js 22, Express |
| Database | PostgreSQL |
| Architecture | Layered architecture |
| Design patterns | Repository Pattern; Middleware Chain / Chain of Responsibility |
| Workspace management | npm Workspaces |
| Authentication and authorisation | Role-Based Access Control (RBAC) |
| Deployment | Microsoft Azure |
| Version control and collaboration | Git and GitHub |

### Application Architecture

The backend separates responsibilities into distinct layers:

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

Routes define API endpoints, controllers handle requests, services contain business logic, and repositories manage database access. This separation supports maintainability, testing, and clear responsibility boundaries.

The middleware chain handles cross-cutting request responsibilities, including logging, authentication, authorisation, and error handling.

---

## Repository Structure

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
│       ├── controllers/             # Request handling
│       ├── services/                # Business logic
│       ├── repositories/             # Database access layer
│       ├── middleware/               # Authentication, authorisation,
│       │                             # logging and error handling
│       ├── config/                   # Environment configuration
│       └── db/
│           ├── migrations/            # node-pg-migrate migrations
│           └── legacy/                # Historical migration scripts
│
├── package.json                      # Root workspace configuration
└── .nvmrc                            # Required Node.js version
```

---

## User Roles and Access

Role-based access control restricts users to the functionality appropriate to their responsibilities.

| Role | Main Responsibilities |
|---|---|
| **Master Administrator** | System configuration and administrative handover functionality |
| **Administrator** | Organisation-wide reporting and high-level settings |
| **Manager** | Operational oversight across classes |
| **Teacher** | Attendance, observations, learner management, and digital sign-out |
| **Parent / Guardian** | Access to their own child or children's profiles, attendance, and permissions |

Access is controlled through the application's authentication and authorisation mechanisms.

## Key System Features

### Attendance Management
Teachers can record and manage learner attendance digitally, reducing reliance on paper registers.

### Digital Learner Sign-Out
The application supports digital sign-out and guardian verification to improve accountability and provide a centralised record of learner collection.

### Guardian Portal
Parents and guardians can access information and permissions associated with their own child or children.

### Developmental Observations
Authorised staff can record and review learner observations in a centralised system.

### Learner and Class Management
The system supports the management of learners, classes, and relevant staff information.

### Reporting
Management and administration users can access reports and operational information to support oversight and decision-making.

### Responsive, Role-Specific Interfaces
The interface is designed for mobile-first use by teachers while supporting larger-screen workflows for management and administration.

---

## Prerequisites

Install the following before setting up the application locally:

- **Node.js 22**
- **npm 10 or later**
- **PostgreSQL**
- **Git**
- A code editor such as Visual Studio Code

The required Node.js version is specified in the repository's `.nvmrc` file.

## Local Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/INSY7315ImizamoYethuAftercare/Imizamo_Yethu_Aftercare.git
cd Imizamo_Yethu_Aftercare
```

### 2. Install Dependencies

Run the following from the repository root:

```bash
npm install
```

The project uses npm Workspaces to manage frontend and backend dependencies.

### 3. Configure Environment Variables

Create the server environment file:

```bash
cp server/.env.example server/.env
```

Create the client environment file:

```bash
cp client/.env.example client/.env.local
```

Configure the values for the local database and application environment.

> **Security:** Do not commit environment files, passwords, tokens, or other secrets to version control. Use the provided example files as templates.

## Database Setup

The application uses **PostgreSQL**. Database schema changes are managed through **node-pg-migrate**, with the migration files in `server/src/db/migrations/` serving as the schema change history.

### 1. Create a Local Development Database

```bash
psql -U postgres -c "CREATE DATABASE imizamo_dev;"
```

### 2. Configure the Database Connection

Update the database connection details in `server/.env` to match the local PostgreSQL instance.

### 3. Apply Database Migrations

Use the project's migration command and instructions in the technical handover documentation to apply the migrations. Ensure the database is configured before starting the backend.

---

## Running the Application

Run the frontend and backend in separate terminals from the repository root.

### Terminal 1 — Backend

```bash
npm run dev:server
```

The API runs at:

```text
http://localhost:4000
```

### Terminal 2 — Frontend

```bash
npm run dev:client
```

The frontend runs at:

```text
http://localhost:5173
```

During local development, the Vite server proxies `/api/*` requests to the backend.

## API Health Check

With the backend running, check the API using:

```bash
curl http://localhost:4000/api/health
```

A successful response should contain a status of `ok` and a timestamp.

---

## API Documentation (OpenAPI)

The API is documented using an **OpenAPI 3.0** specification to support developers and external clients.

| Documentation | Deployed environment | Local environment |
|---|---|---|
| **Swagger UI** | [Open API documentation](https://imizamo-yethu-aftercare-webapp-c0graphudmaqe2aw.southafricanorth-01.azurewebsites.net/api/docs) | `http://localhost:4000/api/docs` |
| **OpenAPI JSON** | [View raw specification](https://imizamo-yethu-aftercare-webapp-c0graphudmaqe2aw.southafricanorth-01.azurewebsites.net/api/openapi.json) | `http://localhost:4000/api/openapi.json` |

The specification documents the project's 47 API endpoints, grouped by feature, including authentication, attendance, sign-out, guardian portal, observations, reports, learners, classes, teachers, and accounts.

For each endpoint, the specification includes relevant request parameters and validation rules, success responses, documented error responses, and permitted roles.

### Using Swagger UI

1. Open `/api/docs`.
2. Use **Try it out** on `POST /api/auth/login`.
3. Sign in with an authorised account so the session cookie is available to subsequent requests.
4. Test endpoints according to the permissions of the signed-in role.

### Maintaining the API Specification

The OpenAPI specification is maintained in:

```text
server/src/docs/openapi.yaml
```

The API documentation test is located at:

```text
server/tests/api/openapi.test.js
```

The test checks the specification against the route and role information maintained in the project. When an endpoint changes, update the OpenAPI specification and relevant tests alongside the implementation.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev:server` | Starts the Express API in development mode |
| `npm run dev:client` | Starts the React/Vite development server |
| `npm run build:client` | Builds the frontend for production |
| `npm run start:server` | Starts the backend in production mode |
| `npm test` | Runs the workspace test suites |

---

## Security and Configuration

The application uses environment variables for sensitive configuration rather than hard-coding credentials into the source code.

Examples of configuration values include:

```text
DATABASE_URL
JWT_SECRET
API configuration
Authentication credentials
```

Environment files are excluded from version control through `.gitignore`. For Azure deployment, application settings and secrets are configured through the App Service environment configuration.

The application also uses role-based access controls to restrict access to role-specific features and data.

---

## Deployment

The application was prepared for deployment through **Microsoft Azure App Service**, with PostgreSQL serving as the relational database.

The intended deployment architecture is:

```text
User
  │
  ▼
Microsoft Azure App Service
  ├── React Frontend
  └── Node.js / Express API
             │
             ▼
        PostgreSQL
```

### Azure Environment Status

The team's Azure student credits were exhausted, and the subscription was cancelled while the team pursued non-profit Azure credits and a suitable PostgreSQL hosting arrangement. As a result, a production Azure PostgreSQL instance was not available at the time this documentation was prepared.

The live application URL is retained above as the project deployment reference. The availability of database-dependent functionality may be affected by the production database status.

The system's local development and automated testing workflows remain available using PostgreSQL locally or in the CI environment. The handover documentation includes the environment configuration and database restoration considerations.

---

## Testing and Quality Assurance

Testing was carried out as part of implementation and final project completion. The project includes automated tests and API documentation validation.

The test suite can be run from the repository root:

```bash
npm test
```

The API health endpoint, role-specific access, and documented API workflows can also be checked locally or through Swagger UI using an appropriately authorised account.

Testing and demonstration evidence should be read alongside the final project documentation and demonstration video.

---

## Reviewing Feedback and Final Refinements

Feedback from the earlier project submission was reviewed during the final stage. The team used it to evaluate the system's usability, maintainability, responsiveness, and documentation. The following table records the main feedback themes and how they informed the final project review.

| Feedback area | Review and response |
|---|---|
| **Tailwind styling and page titles** | The feedback highlighted the value of consistent theme tokens instead of repeated hard-coded colour values, and meaningful page titles rather than generic labels. These points were included in the final UI review to support visual consistency and clearer navigation. |
| **Role-specific home pages and PDF reporting** | Role-specific landing pages and PDF reporting were recognised as useful features. The team retained the focus on role-appropriate workflows and reporting while reviewing the overall user experience. |
| **Large Reports and Observations components** | The feedback identified opportunities to break down larger components into smaller, more maintainable units. This was considered in the final maintainability review and handover documentation. |
| **Responsive design and device testing** | The feedback recommended wider-screen breakpoints and testing on tablet and desktop layouts in addition to mobile. This informed the final review of the mobile-first interface and its use across different screen sizes. |
| **Backend architecture and error handling** | The layered Express API, centralised error handling, and separation of responsibilities were recognised as strengths. These architectural decisions are documented to help future maintainers understand and extend the system. |
| **Automated testing** | The project's test coverage was positively recognised. Automated tests and API documentation validation are retained as part of the quality assurance and future maintenance workflow. |

The feedback review helped the team identify strengths to preserve and areas that future maintainers should consider when extending the system. The final project documentation records the implemented architecture, system behaviour, deployment considerations, and maintenance guidance.

---

## Collaboration and Contribution Evidence

The team collaborated throughout requirements planning, system development, testing, deployment preparation, documentation, and the final demonstration. **GitHub Insights was not used as the collaboration evidence source.** Instead, collaboration and project progress can be demonstrated through the project artefacts and activity records listed below.

| Evidence source | What it demonstrates |
|---|---|
| **Git commit history** | Contributions over time, implementation progress, fixes, and documentation updates. |
| **Git branches and pull requests, where available** | Work completed in separate branches and changes reviewed or integrated into the shared project. |
| **Repository file history and diffs** | Changes made to application code, tests, configuration, and documentation. |
| **Task allocation and project planning records** | Assigned responsibilities and the distribution of work across the team. |
| **Meeting notes and communication records** | Team discussions, decisions, progress updates, and coordination. |
| **Testing and issue-resolution records** | Shared troubleshooting, validation, and refinement of the application. |
| **Final documentation and handover artefacts** | Collaborative preparation of the technical, user, deployment, and project documentation. |
| **Demonstration video and presentation** | The completed system and the team's final presentation of its functionality. |

These sources provide a practical record of collaboration without relying on GitHub Insights. Supporting screenshots, extracts, or records are in a seperate document included in the Part 3 submission. 

---

## Relationship to Part 1 and Part 2

The final application builds on the planning and design work completed in Part 1 and the implementation work completed in Part 2.

The project maintains traceability between the original requirements and the completed system, including:

- User roles and user stories
- Domain and design class diagrams
- Entity Relationship Diagram (ERD)
- Database schema and data design
- Sequence and state diagrams
- System and cloud architecture
- Design patterns
- Security requirements
- Non-functional requirements
- DevOps and deployment decisions
- Cost analysis
- Change management planning

The completed application demonstrates the practical realisation of the project's design and implementation decisions.

## Non-Functional Requirements

| Requirement | Consideration in the system |
|---|---|
| **Performance** | Structured API and database access |
| **Security** | Authentication, authorisation, role-based access, and environment-based secrets |
| **Usability** | Simple, role-specific workflows and responsive interfaces |
| **Reliability** | Layered backend structure and error handling |
| **Scalability** | Separation of application layers and cloud deployment approach |
| **Maintainability** | Separation of routes, controllers, services, and repositories |
| **Portability** | Browser-based access across supported devices |

---

## Final Documentation and Handover

The Part 3 submission includes the completed system and its supporting documentation. The documentation is intended to help the aftercare organisation and future maintainers understand, operate, and maintain the application.

Refer to the accompanying final documentation for:

- User guidance for the relevant system roles
- Technical architecture and implementation details
- Database configuration and migration guidance
- Deployment and environment configuration
- Troubleshooting and maintenance guidance
- Backup, recovery, and restoration considerations
- API documentation and endpoint usage
- Handover and transition guidance

This README provides the repository overview and setup instructions. The accompanying documentation contains the more detailed operational and technical procedures.

---

## Project Completion

The system development and project documentation have been completed for the final **Part 3 – Work Integrated Learning** submission. The project brings together the planning and design from Part 1, implementation from Part 2, and final review, documentation, and handover work.

**NovaTech Solutions** developed and donated the Imizamo Yethu Aftercare Management System to support the organisation's digital operations and reduce reliance on manual paper-based processes.

---

## NovaTech Solutions

*Developed and donated by NovaTech Solutions to support the digital transformation of Imizamo Yethu Aftercare.*

**INSY7315 – Work Integrated Learning | Part 3 – Final Submission**
