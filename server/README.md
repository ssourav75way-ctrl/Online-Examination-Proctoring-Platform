# Online Examination Proctoring Platform - Server

This is the backend REST API for the Online Examination Proctoring Platform. It handles data management, authentication, and core business logic for exam administration, test-taking, and secure proctoring.

## Features

- **Role-Based Access Control (RBAC):** Supports hierarchical roles including Super Admin, Admin, Examiner, Proctor, and Candidate with distinct permissions.
- **Institution Management:** Manage departments, global and institution-specific roles and memberships.
- **Question Bank Engine:** APIs to manage question pools, version tracking, and multiple question types (including evaluating coding problems via specialized runtimes).
- **Exam Engine:** Handling exam scheduling, dynamic test allocation, randomized delivery of questions, and strict time constraints (start/end boundaries).
- **Live Proctoring Services:** Endpoints to manage live session status, flag suspicious activities during exams, and calculate final integrity scores.
- **Result Processing:** Auto-grading workflows for MCQs and structured questions, handling code execution results, and managing manual review workflows for re-evaluation requests.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Active PostgreSQL database instance

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and update the database connection string and other application secrets:
   ```bash
   cp .env.example .env
   ```

### Database Setup

Run the following commands to initialize the Prisma database and schema:

```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations to the database
npx prisma migrate dev
```

To seed the database with initial users and data (if a seed script is provided):

```bash
npm run seed
```

### Running the Application

To run the server in development mode (with hot reloading via nodemon):

```bash
npm run dev
```

To build and run the application in production mode:

```bash
npm run build
npm start
```
