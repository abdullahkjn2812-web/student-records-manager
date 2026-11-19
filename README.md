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
5. **Academic Marks Management:** Subject-wise marks recording, editing, and deletion with cascading cleanup on student removal.
6. **Automatic Results & Grade Calculation:** Dynamic calculation of total marks, cumulative percentages, GPA, letter grades (`A+`, `A`, `B`, `C`, `D`, `F`), and student report cards.
7. **Academic Dashboard:** Live dynamic statistics showing student counts, academic evaluations, average percentage, and passing rates.
8. **Modern React Frontend:** Single-page application built with React, featuring protected routes, authentication state, marks modal, search, and dashboard.
9. **Production Ready:** Unified Express static serving for compiled React assets (`client/dist`).

## Technology Stack
- **Frontend:** React (JavaScript, Vite)
- **Backend:** Node.js and Express 5
- **Database:** MongoDB with Mongoose
- **Security:** JSON Web Tokens (JWT), Bcrypt password hashing
- **Environment:** dotenv
- **Testing:** Node.js Native Test Runner (71 automated tests)
- **Version Control:** Git and GitHub

## Repository Structure
- `client/`: React frontend application
  - `src/context/`: Authentication context & token management
  - `src/components/`: Navigation bar, protected route wrappers
  - `src/pages/`: Login, Dashboard, and Student Management pages (with Marks & Report Card modal)
  - `vite.config.js`: Dev server & API proxy configuration
- `server/`: Express backend
  - `config/db.js`: MongoDB connection & index initialization
  - `models/`: User, Student and Marks schemas
  - `controllers/`: Auth, Student, Marks, and Dashboard controllers
  - `middleware/`: Request logger, JWT protection, and RBAC authorization
  - `routes/`: Auth, Student, Marks, and Dashboard API routers
  - `server.js`: App entry point, route mounting, and production static client serving
  - `.env.example`: Sample environment variables
- `tests/`: 71 automated tests (models, CRUD, auth, edge cases, marks & grades)
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
| `POST` | `/api/marks` | Protected (Admin/Teacher) | Record subject marks for a student |
| `GET` | `/api/marks/student/:studentId` | Protected | Retrieve student marks, calculated GPA, and grade |
| `GET` | `/api/marks/student/:studentId/report-card` | Protected | Retrieve student official academic report card |
| `PUT` | `/api/marks/:id` | Protected (Admin/Teacher) | Update subject marks record |
| `DELETE` | `/api/marks/:id` | Protected (Admin/Teacher) | Delete a subject marks record |

### Running Automated Tests

Run all 71 tests across models, CRUD, authentication, edge cases, and marks management:
```bash
cd server
npm test
```

## Grading Scale
| Percentage Range | Letter Grade | GPA Equivalent | Status |
| :---: | :---: | :---: | :---: |
| **90% — 100%** | **A+** | 4.0 | Pass (Outstanding) |
| **80% — 89.9%** | **A** | 3.7 | Pass (Excellent) |
| **70% — 79.9%** | **B** | 3.0 | Pass (Good) |
| **60% — 69.9%** | **C** | 2.0 | Pass (Satisfactory) |
| **50% — 59.9%** | **D** | 1.0 | Pass |
| **Below 50%** | **F** | 0.0 | Fail |

## Internship Progress
- **Week 1:** Project proposal, requirements documentation and initial repository structure (Completed)
- **Week 2:** Database design, ER diagram, MongoDB connection and Express skeleton (Completed)
- **Week 3:** Core student CRUD operations, business logic, validation and automated testing (Completed)
- **Week 4:** JWT authentication, role-based authorization, student search, dashboard statistics, and React frontend (Completed)
- **Week 5:** Testing and debugging (60 automated tests, edge-case hardening, security checks, and QA report) (Completed)
- **Week 6:** Final marks management, automatic grade cards, 71 automated tests, and deployment readiness (Completed)

## Documentation
- [Project Proposal](docs/Project_Proposal.pdf)
- [Requirements Document](docs/Requirements_Document.pdf)
- [Week 2 Database Design](docs/Week_02_Database_Design.pdf)
- [ER Diagram](docs/ER_Diagram.png)
- [Week 3 Implementation Report](docs/Week_03_Implementation_Report.md)
- [Week 4 Implementation Report](docs/Week_04_Implementation_Report.md)
- [Week 5 Testing and Debugging Report](docs/Week-5-Testing-and-Debugging-Report.md)
- [Week 6 Project Inspection](docs/week-6-project-inspection.md)
- [Week 6 Final Project and Deployment Report](docs/Week-6-Final-Project-and-Deployment-Report.md)
