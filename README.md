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
- API testing: Postman
- Version control: Git and GitHub

## Repository structure
- `client/`: React frontend (later weeks)
- `server/`: Express backend skeleton
  - `config/db.js`: MongoDB connection
  - `models/`: User, Student and Marks schemas
  - `controllers/` and `routes/`: placeholders for Week 3 CRUD
  - `server.js`: app entry point and `/health` endpoint
  - `.env.example`: sample environment variables
- `tests/`: model and integration checks
- `docs/`: proposal, requirements, Week 2 design and ER diagram

## Week 2 setup
1. Install and start MongoDB locally.
2. Copy `server/.env.example` to `server/.env` and keep the URI pointing at your own database.
3. From `server/` run `npm install` then `npm start`.
4. Open `http://127.0.0.1:5000/health`. A successful response includes `"database": "connected"`.

The HTTP server starts only after the MongoDB connection succeeds. Do not commit `server/.env`.

Model checks:

```bash
node --test tests/models.test.js
```

## Internship progress
- **Week 1:** project proposal, requirements documentation and initial repository structure
- **Week 2:** database design, ER diagram, MongoDB connection and Express skeleton
- **Week 3:** core CRUD and business logic
- **Week 4:** authentication and advanced features
- **Week 5:** testing and debugging
- **Week 6:** deployment and final presentation

## Documentation
- [Project Proposal](docs/Project_Proposal.pdf)
- [Requirements Document](docs/Requirements_Document.pdf)
- [Week 2 Database Design](docs/Week_02_Database_Design.pdf)
- [ER Diagram](docs/ER_Diagram.png)
