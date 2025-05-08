import sys
import os

# Add the parent directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Now import from the app package
from app import db, create_app
import sqlalchemy as sa
from sqlalchemy import text

app = create_app()

def run_migration():
    with app.app_context():
        try:
            print("Starting migration to add clinical_trials table...")
            
            # Check if table already exists
            inspector = sa.inspect(db.engine)
            tables = inspector.get_table_names()
            
            if 'clinical_trials' not in tables:
                print("Creating 'clinical_trials' table...")
                db.session.execute(text("""
                CREATE TABLE clinical_trials (
                    id SERIAL PRIMARY KEY,
                    assessment_id INTEGER NOT NULL,
                    nct_id VARCHAR(20),
                    title TEXT,
                    status VARCHAR(50),
                    phase VARCHAR(50),
                    summary TEXT,
                    conditions TEXT,
                    start_date VARCHAR(50),
                    completion_date VARCHAR(50),
                    url VARCHAR(255),
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
                    CONSTRAINT fk_assessment
                        FOREIGN KEY (assessment_id)
                        REFERENCES symptom_assessments (id)
                        ON DELETE CASCADE
                );
                """))
                print("Created 'clinical_trials' table successfully!")
            else:
                print("Table 'clinical_trials' already exists, skipping...")
            
            # Commit the transaction
            db.session.commit()
            print("Migration completed successfully!")
            
        except Exception as e:
            db.session.rollback()
            print(f"Error during migration: {str(e)}")
            raise

if __name__ == "__main__":
    run_migration()
