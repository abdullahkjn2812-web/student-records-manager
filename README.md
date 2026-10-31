# Student Records Manager

**Intern:** Abdullah Aslam  
**Track:** Software Development — Verstech Labs 2026

## Overview
A planned web application to help school and academy administrators and teachers manage student records, subject-wise marks, grades and summary statistics.

## Planned features
1. Student record management (create, view, update, delete)
2. Search by student name or roll number
3. Subject-wise marks management
4. Automatic total, percentage and grade calculation
5. User login and logout
6. Role-based access for administrators and teachers
7. Basic academic dashboard

## Technology stack
- Frontend: React (JavaScript) — later weeks
- Backend: Node.js and Express
- Database: MongoDB with Mongoose
- Environment: dotenv
- API testing: Postman / Native Test Runner
- Version control: Git and GitHub

## Repository structure
- `client/`: React frontend (later weeks)
- `server/`: Express backend
  - `config/db.js`: MongoDB connection
  - `models/`: User, Student and Marks schemas
  - `controllers/`: Student CRUD controller (`studentController.js`)
  - `routes/`: Student API routes (`studentRoutes.js`)
  - `server.js`: app entry point, `/health`, and route mounting
  - `.env.example`: sample environment variables
- `tests/`: model, CRUD, and integration checks
- `docs/`: proposal, requirements, Week 2 design, ER diagram, and Week 3 implementation report

## Setup & Running

1. Install and start MongoDB locally.
2. Copy `server/.env.example` to `server/.env` and keep the URI pointing at your own database.
3. From `server/` run `npm install` then `npm start`.
4. Open `http://127.0.0.1:5000/health`. A successful response includes `"database": "connected"`.

The HTTP server starts only after the MongoDB connection succeeds. Do not commit `server/.env`.

### API Endpoints (Week 3)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server and database health check |
| `POST` | `/api/students` | Create a new student record |
| `GET` | `/api/students` | Retrieve all student records |
| `GET` | `/api/students/:id` | Retrieve an individual student by ID |
| `PUT` | `/api/students/:id` | Update an existing student |
| `DELETE` | `/api/students/:id` | Delete an existing student |

### Running Tests

From `server/` directory:
```bash
npm test
```
Or from the project root:
```bash
node --test tests/models.test.js tests/studentCrud.test.js
```

## Internship progress
- **Week 1:** project proposal, requirements documentation and initial repository structure
- **Week 2:** database design, ER diagram, MongoDB connection and Express skeleton
- **Week 3:** core student CRUD operations, business logic, validation and automated testing
- **Week 4:** authentication and advanced features
- **Week 5:** testing and debugging
- **Week 6:** deployment and final presentation

## Documentation
- [Project Proposal](docs/Project_Proposal.pdf)
- [Requirements Document](docs/Requirements_Document.pdf)
- [Week 2 Database Design](docs/Week_02_Database_Design.pdf)
- [ER Diagram](docs/ER_Diagram.png)
- [Week 3 Implementation Report](docs/Week_03_Implementation_Report.md)
