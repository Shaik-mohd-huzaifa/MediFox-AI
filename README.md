# Medifox Healthcare AI Assistant

Medifox is an AI-powered healthcare assistant application that helps patients assess their symptoms, get medical recommendations, and manage appointments. The application combines a React frontend with a Flask backend and uses OpenAI's GPT models to provide personalized healthcare assistance.

## Project Overview

Medifox offers the following key features:

- **Symptom Assessment**: AI-powered symptom analysis with urgency classification
- **Patient Profiles**: Management of patient health records and history
- **Appointment Scheduling**: Automatic appointment creation based on symptom severity
- **Medical References**: Integration with PubMed for evidence-based information
- **Conversational Interface**: Natural chat interface for patient interaction

## Tech Stack

### Frontend
- React (with TypeScript)
- TailwindCSS for styling
- React Hook Form for form management
- React Router for navigation
- Lucide React for icons
- React Markdown for content rendering

### Backend
- Flask (Python)
- SQLAlchemy for ORM
- PostgreSQL for database
- OpenAI API for symptom assessment
- Bio (Biopython) for PubMed integration
- Alembic for database migrations

## Project Structure

```
Nuverse Hackathon/
├── backend/                # Flask backend
│   ├── app/                # Main application code
│   │   ├── ai/             # AI integration (OpenAI, PubMed)
│   │   ├── appointments/   # Appointment management
│   │   ├── models.py       # Database models
│   │   └── routes.py       # API endpoints
│   ├── migrations/         # Database migrations
│   └── requirements.txt    # Python dependencies
└── frontend/               # React frontend
    ├── public/             # Static files
    ├── src/                # Source code
    │   ├── components/     # React components
    │   ├── hooks/          # Custom React hooks
    │   ├── pages/          # Page components
    │   └── services/       # API services
    └── package.json        # JavaScript dependencies
```

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- Python (v3.9+)
- PostgreSQL (v13+)
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory with the following variables:
   ```
   FLASK_APP=run.py
   FLASK_ENV=development
   DATABASE_URL=postgresql://username:password@localhost:5432/medifox
   OPENAI_API_KEY=your_openai_api_key
   PUBMED_API_EMAIL=your_email@example.com
   PUBMED_API_TOOL=medifox-symptom-assessment
   ```

5. Initialize the database:
   ```
   flask db upgrade
   ```

6. Load sample patient profiles (optional):
   ```
   python load_patient_profiles.py
   ```

7. Start the backend server:
   ```
   flask run
   # Or
   python run.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   # Or
   yarn install
   ```

3. Create a `.env` file in the frontend directory with the following variables:
   ```
   VITE_API_URL=http://localhost:5000
   ```

4. Start the development server:
   ```
   npm run dev
   # Or
   yarn dev
   ```

5. Access the application at `http://localhost:5173`

## Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| FLASK_APP | Entry point to the Flask app | run.py |
| FLASK_ENV | Environment mode | development |
| DATABASE_URL | PostgreSQL connection string | postgresql://username:password@localhost:5432/medifox |
| OPENAI_API_KEY | Your OpenAI API key | sk-... |
| PUBMED_API_EMAIL | Email for PubMed API calls | your_email@example.com |
| PUBMED_API_TOOL | Tool name for PubMed API | medifox-symptom-assessment |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | URL to the backend API | http://localhost:5000 |

## Running the Application

1. Start the backend server first (from the backend directory):
   ```
   flask run
   ```

2. Start the frontend development server (from the frontend directory):
   ```
   npm run dev
   ```

3. Access the application in your browser at `http://localhost:5173`

## Features

### Symptom Assessment
Enter your symptoms and receive an AI-powered assessment of urgency with recommendations.

### Patient Profiles
Create and manage patient profiles with medical history, conditions, and medication information.

### PubMed Integration
Get evidence-based medical information from PubMed references in assessment responses.

### Appointment Management
The system automatically creates appointments based on symptom urgency.
