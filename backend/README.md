# Flask PostgreSQL Backend

A simple backend API built with Flask and PostgreSQL.

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up PostgreSQL:
   - Create a database
   - Update the DATABASE_URL in .env file

5. Initialize the database:
   ```
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

6. Run the application:
   ```
   flask run
   ```

## API Endpoints

- GET /api/items - Get all items
- GET /api/items/<id> - Get specific item
- POST /api/items - Create new item
- PUT /api/items/<id> - Update item
- DELETE /api/items/<id> - Delete item
