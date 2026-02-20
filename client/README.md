# Online Examination Proctoring Platform - Client

This is the frontend application for the Online Examination Proctoring Platform. It is built using modern web technologies to provide a secure, responsive, and intuitive interface for candidates, examiners, proctors, and administrators.

## Features

- **Candidate Dashboard:** View available exams, upcoming schedules, and past results.
- **Examiner Dashboard:** Create and manage question pools, add different types of questions (MCQ, Multi-select, Fill in the blanks, Short Answer, Coding Problems), schedule exams, and review candidate results.
- **Proctor Dashboard:** Live monitoring of active exam sessions, receiving flags/alerts for anomalous behavior, and managing live session integrity.
- **Admin Dashboard:** Manage institutions, departments, and onboarding examiners and proctors.
- **Exam Taking Interface:** Secure browser environment with live webcam proctoring, timer, and adaptive/fixed question delivery.

## Tech Stack

- **Framework:** React + Vite
- **Language:** TypeScript
- **State Management:** Redux Toolkit & RTK Query
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **Form Handling:** React Hook Form + Yup (Validation)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Copy the `.env.example` to `.env` and fill in the necessary environment variables:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port specified by Vite).

### Building for Production

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```
