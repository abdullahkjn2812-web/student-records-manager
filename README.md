# Student Records Manager

**Intern:** Abdullah Aslam  
**Track:** Software Development — Verstech Labs 2026

## Overview
A web application to help school and academy administrators and teachers manage student records, subject-wise marks, grades and summary statistics with secure user authentication and role-based permissions.

## Features
1. **User Authentication & Security:** JWT-based login/logout with passwords hashed using `bcryptjs`.
2. **Role-Based Authorization:** Distinct access levels for `admin` (full permissions) and `teacher` (view, search, create, update).
3. **Student Records CRUD:** Complete Create, Read, Update, and Delete operations with duplicate roll number prevention.
4. **Student Search Engine:** Live search across student records by name, roll number, or class (`/api/students?search=...`).
5. **Academic Dashboard:** Live dynamic statistics showing student counts, academic evaluations, average percentage, and passing rates.
6. **Modern React Frontend:** Single-page application built with React, featuring protected routes, authentication state, search, and dashboard.

## Technology Stack
- **Frontend:** React (JavaScript, Vite)
- **Backend:** Node.js and Express 5
- **Database:** MongoDB with Mongoose
- **Security:** JSON Web Tokens (JWT), Bcrypt password hashing
- **Environment:** dotenv
- **Testing:** Node.js Native Test Runner (50 automated tests)
- **Version Control:** Git and GitHub

## Repository Structure
- `client/`: React frontend application
  - `src/context/`: Authentication context & token management
  - `src/components/`: Navigation bar, protected route wrappers
  - `src/pages/`: Login, Dashboard, and Student Management pages
  - `vite.config.js`: Dev server & API proxy configuration
- `server/`: Express backend
  - `config/db.js`: MongoDB connection & index initialization
  - `models/`: User, Student and Marks schemas
  - `controllers/`: Auth, Student, and Dashboard controllers
  - `middleware/`: Request logger, JWT protection, and RBAC authorization
  - `routes/`: Auth, Student, and Dashboard API routers
  - `server.js`: App entry point and route mounting
  - `.env.example`: Sample environment variables
- `tests/`: 50 automated tests (models, CRUD, auth & RBAC)
- `docs/`: Proposals, requirements, ER diagrams, screenshots, and weekly implementation reports

## Setup & Running

### 1. Database & Backend Server
```bash
# 1. Start MongoDB locally
# In PowerShell: Start-Service -Name MongoDB

# 2. Configure environment
cd server
cp .env.example .env

# 3. Install dependencies & run backend (port 5000)
npm install
npm start
```
Verify backend at `http://127.0.0.1:5000/health`.

### 2. Frontend Application (React)
In a separate terminal:
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | System & database health status |
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Protected | Get authenticated user profile |
| `POST` | `/api/auth/logout` | Public | Log out user |
| `GET` | `/api/dashboard/stats` | Protected | Get dynamic academic dashboard statistics |
| `GET` | `/api/students` | Protected | List all students or filter with `?search=<term>` |
| `POST` | `/api/students` | Protected (Admin/Teacher) | Create a new student record |
| `GET` | `/api/students/:id` | Protected | Retrieve individual student by ID |
| `PUT` | `/api/students/:id` | Protected (Admin/Teacher) | Update an existing student |
| `DELETE` | `/api/students/:id` | Protected (Admin only) | Delete an existing student |

### Running Automated Tests

Run all 50 tests across model validation, student CRUD, and authentication suites:
```bash
cd server
npm test
```

## Internship Progress
- **Week 1:** Project proposal, requirements documentation and initial repository structure
- **Week 2:** Database design, ER diagram, MongoDB connection and Express skeleton
- **Week 3:** Core student CRUD operations, business logic, validation and automated testing
- **Week 4:** JWT authentication, role-based authorization, student search, dashboard statistics, and React frontend
- **Week 5:** Testing and debugging
- **Week 6:** Deployment and final presentation

## Documentation
- [Project Proposal](docs/Project_Proposal.pdf)
- [Requirements Document](docs/Requirements_Document.pdf)
- [Week 2 Database Design](docs/Week_02_Database_Design.pdf)
- [ER Diagram](docs/ER_Diagram.png)
- [Week 3 Implementation Report](docs/Week_03_Implementation_Report.md)
- [Week 4 Implementation Report](docs/Week_04_Implementation_Report.md)
