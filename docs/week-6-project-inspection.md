# Student Records Manager — Week 6 Project Inspection Report

**Project:** Student Records Manager  
**Intern:** Abdullah Aslam  
**Organization:** Verstech Labs 2026  
**Track:** Software Development (MERN Stack)  
**Date:** November 19, 2026  
**Current Git Branch:** `week-5-testing-debugging`  
**Inspection Type:** Pre-implementation Architecture & Deployment Readiness Audit  

---

## 1. Current Project Status

The **Student Records Manager** is in a stable, well-structured, and verified state following the completion of Week 5 Quality Assurance:
* **Architecture:** Decoupled MERN stack (MongoDB, Express 5, React 18, Node.js 22+).
* **Git Tree:** Pristine working tree on branch `week-5-testing-debugging` (commit `736ce5d`), fully synchronized with GitHub remote `origin/week-5-testing-debugging`.
* **Database State:** MongoDB Community Server running locally with validated schemas (`User`, `Student`, `Marks`).
* **Frontend State:** Single-page React application bundled with Vite, with client-side routing, authentication state management, and responsive CSS styling.
* **Backend State:** Express API modularized across config, controllers, models, middleware, and routes with central error handling and request logging.

---

## 2. Completed Features

* [x] **User Authentication (FR-01):**
  * User registration for `admin` and `teacher` roles (`POST /api/auth/register`).
  * User login with credential verification (`POST /api/auth/login`).
  * Passwords hashed using `bcryptjs` with 10 salt rounds (never stored in plaintext).
  * Stateless session handling with signed JSON Web Tokens (JWT) with 24-hour expiration.
  * Current user profile retrieval (`GET /api/auth/me`) and client-side logout (`POST /api/auth/logout`).
* [x] **Role-Based Authorization (FR-02):**
  * `protect` middleware verifying JWT signatures and attaching authenticated user documents.
  * `authorize` middleware enforcing strict role boundaries between **Admin** and **Teacher**.
  * Deletion permission restricted exclusively to `admin` (`403 Forbidden` for teachers).
* [x] **Student Record Management (FR-03):**
  * Create student (`POST /api/students`) with duplicate roll number prevention (`409 Conflict`).
  * List all students (`GET /api/students`).
  * Retrieve single student by ID (`GET /api/students/:id`) with ObjectId format validation (`400 Bad Request`) and existence checks (`404 Not Found`).
  * Update student details (`PUT /api/students/:id`) with duplicate roll number protection.
  * Delete student (`DELETE /api/students/:id`) with cascading cleanup of associated academic marks.
* [x] **Student Search Engine (FR-04):**
  * Real-time querying (`GET /api/students?search=...`) matching student name, roll number, or class name.
  * Defensive regex escaping (`[.*+?^${}()|[\]\\]`) preventing regex injection or server crashes.
* [x] **Dashboard Analytics Pipeline (FR-07):**
  * Real-time calculation endpoint (`GET /api/dashboard/stats`).
  * Aggregates total students, total academic evaluations, overall average percentage, pass rate percentage, and 5 recent student registrations.
* [x] **React Frontend Core:**
  * Login portal with error alerts and loading spinners.
  * Centralized `AuthContext` maintaining authentication tokens and user profiles in `localStorage`.
  * Navigation bar with active tab indicators and role badges.
  * Students table with search bar, clear search button, Create modal, Edit modal, and Admin-only Delete confirmation.
* [x] **Defensive Security & Validation:**
  * Length validations on student input fields (Name <= 100, Roll <= 30, Class <= 50 characters).
  * Strict JWT secret verification in production (`getJwtSecret()` fast-fail).
  * Sensitive password fields stripped from all API outputs.
  * `.env` file isolated from version control via `.gitignore`.

---

## 3. Remaining Features (Week 6 Core Scope)

* [ ] **Subject-Wise Marks Management REST APIs (FR-05):**
  * `POST /api/marks`: Create a subject mark record for a student with validation (`0 <= obtainedMarks <= totalMarks`).
  * `GET /api/marks/student/:studentId`: Retrieve all subject marks for a specific student.
  * `PUT /api/marks/:id`: Update subject score or maximum marks.
  * `DELETE /api/marks/:id`: Delete a subject mark record.
* [ ] **Automatic Results & Grade Calculation (FR-06):**
  * Calculate total obtained marks across all subjects for a student.
  * Calculate total maximum marks.
  * Calculate cumulative percentage (`(totalObtained / totalMax) * 100`).
  * Standardized letter grade calculation (`A+`, `A`, `B`, `C`, `D`, `F`) based on documented grading rules.
  * Pass / Fail status determination (Pass threshold: 50%).
  * Academic report card endpoint (`GET /api/students/:id/report-card`).
* [ ] **Frontend Marks Management & Report Card UI:**
  * Interactive "Marks & Grades" modal accessible from the Students table.
  * Subject marks list with options to add, edit, and delete marks.
  * Visual report card display showing subject breakdown, total scores, percentage, letter grade badge, and pass/fail banner.
* [ ] **Dashboard Dynamic Synchronization:**
  * Ensure dashboard metrics immediately update when new marks are added, updated, or removed.
* [ ] **Unified Production Deployment:**
  * Express server configuration to statically serve compiled React SPA (`client/dist`) in production mode.
  * Root start script for cloud hosting.

---

## 4. Week 5 Testing Status

* **Automated Tests:** **60 / 60 tests passing (100%)** via Node.js native test runner (`node:test` & `node:assert/strict`):
  * `tests/models.test.js`: 27 tests passing (Schema constraints, bounds, regex validations).
  * `tests/studentCrud.test.js`: 13 tests passing (API CRUD, duplicate roll conflict, ID formats).
  * `tests/auth.test.js`: 10 tests passing (Auth flows, JWT, RBAC boundaries, Search, Dashboard).
  * `tests/edgeCases.test.js`: 10 tests passing (String length limits, regex injection, token tampering, negative marks).
* **Manual Scenarios:** 28 scenarios executed and verified with zero server crashes or 500 errors.
* **Documentation:** Official report published in `docs/Week-5-Testing-and-Debugging-Report.md`.
* **Identified & Fixed Issues:**
  * Hardcoded JWT fallback replaced with strict environment checking.
  * Missing input length boundaries on student name, roll number, and class enforced.

---

## 5. Prioritized Week 6 Implementation Checklist

### **Phase 1: Branch Setup & Backend Marks Module (FR-05 & FR-06)**
- [ ] Create Git branch `week-6-final-deployment`.
- [ ] Create `server/controllers/marksController.js` with functions:
  - `addMark`: Validate student ID, ensure subject is not duplicated for student, validate scores, persist mark.
  - `getMarksByStudent`: Retrieve all marks for student, compute summary (total obtained, total possible, percentage, letter grade, pass/fail status).
  - `updateMark`: Modify existing mark with re-validation.
  - `deleteMark`: Remove mark record.
  - `getStudentReportCard`: Return structured report card payload.
- [ ] Define standardized grading rule:
  * **90% — 100%:** Grade **A+** (GPA 4.0) — Pass (Outstanding)
  * **80% — 89.9%:** Grade **A** (GPA 3.7) — Pass (Excellent)
  * **70% — 79.9%:** Grade **B** (GPA 3.0) — Pass (Good)
  * **60% — 69.9%:** Grade **C** (GPA 2.0) — Pass (Satisfactory)
  * **50% — 59.9%:** Grade **D** (GPA 1.0) — Pass
  * **Below 50%:** Grade **F** (GPA 0.0) — Fail
- [ ] Create `server/routes/marksRoutes.js` with RBAC protection (`protect`, `authorize("admin", "teacher")`).
- [ ] Mount `/api/marks` in `server/server.js`.

### **Phase 2: Frontend Marks & Report Card UI**
- [ ] Add "📊 Marks" button in the actions column of `client/src/pages/StudentsPage.jsx`.
- [ ] Implement interactive Marks Modal:
  - View existing marks for selected student.
  - Inline or modal form to add a new subject mark (`subject`, `obtainedMarks`, `totalMarks`).
  - Delete subject mark action.
  - Real-time display of total marks, percentage, letter grade badge, and pass/fail status.
- [ ] Add modal styles and grade card aesthetics in `client/src/index.css`.

### **Phase 3: Automated Testing Extension**
- [ ] Create `tests/marks.test.js` covering:
  - Adding marks with valid values.
  - Rejecting duplicate subject for the same student (`409 Conflict`).
  - Rejecting `obtainedMarks > totalMarks` (`400 Bad Request`).
  - Rejecting negative marks (`400 Bad Request`).
  - Automatic total, percentage, and grade calculation verification.
  - Updating and deleting marks.
  - Cascading delete verification when student is deleted.
- [ ] Integrate into `server/package.json` test scripts (`npm test` runs all suites).

### **Phase 4: Unified Production Deployment Setup**
- [ ] Configure `server/server.js` to serve `client/dist` static assets when in production (`NODE_ENV === "production"` or when `client/dist` exists).
- [ ] Add catch-all route sending `client/dist/index.html` for single-page client routing.
- [ ] Test production build locally (`npm run build` in `client/` and `npm start` in `server/`).

### **Phase 5: Documentation & Presentation**
- [ ] Create `docs/Week-6-Final-Project-and-Deployment-Report.md`.
- [ ] Update `README.md` with complete API reference, grading scale, screenshots, and deployment instructions.
- [ ] Prepare live demo script and presentation outline.

---

## 6. Recommended Deployment Approach

* **Deployment Pattern:** **Unified Full-Stack Monorepo Service**
  * Rather than deploying frontend and backend to separate hosting providers (which introduces CORS latency and configuration overhead), the compiled React SPA (`client/dist`) is served directly by the Express production server.
* **Target Platforms:**
  * **Render.com** (Free Web Service) connected to **MongoDB Atlas** (Free M0 Cluster).
  * **Alternative:** **Railway.app** or Dockerized container.
* **Environment Variables Required:**
  * `NODE_ENV=production`
  * `PORT=5000` (or dynamically assigned by host `$PORT`)
  * `MONGO_URI=<mongodb_atlas_connection_string>`
  * `JWT_SECRET=<cryptographically_secure_random_string>`
  * `JWT_EXPIRE=24h`
* **Local Verification Workflow:**
  ```bash
  cd client && npm run build
  cd ../server && node server.js
  ```
  Accessing `http://localhost:5000` serves both the React application and API endpoints seamlessly.

---

## 7. Files Likely to Require Changes

| File Path | Type | Planned Changes |
| :--- | :--- | :--- |
| `server/controllers/marksController.js` | **New File** | Implement marks CRUD, grade calculation, and report cards |
| `server/routes/marksRoutes.js` | **New File** | Define protected REST endpoints for marks management |
| `server/server.js` | **Modification** | Mount `/api/marks` router and add static file serving for `client/dist` |
| `client/src/pages/StudentsPage.jsx` | **Modification** | Add Marks & Report Card modal, action button, and API bindings |
| `client/src/index.css` | **Modification** | Add styling for report cards, grade badges, and marks table |
| `tests/marks.test.js` | **New File** | Automated test suite for marks management and grading rules |
| `server/package.json` | **Modification** | Bump version to `1.0.0`, update test script to include marks tests |
| `README.md` | **Modification** | Final project documentation, API reference, and deployment guide |
| `docs/Week-6-Final-Project-and-Deployment-Report.md` | **New File** | Final Week 6 implementation, deployment, and presentation report |

---

*Report prepared by Senior MERN Stack Developer & Software Project Lead for Verstech Labs Internship Week 6.*
