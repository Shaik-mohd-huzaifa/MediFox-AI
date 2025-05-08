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
        # Use raw SQL execution to add columns safely
        try:
            print("Starting migration to add dos and donts columns...")
            
            # Check if columns already exist
            inspector = sa.inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('symptom_assessments')]
            
            # Add dos column if it doesn't exist
            if 'dos' not in columns:
                print("Adding 'dos' column...")
                db.session.execute(text("ALTER TABLE symptom_assessments ADD COLUMN dos TEXT"))
            else:
                print("Column 'dos' already exists, skipping...")
                
            # Add donts column if it doesn't exist
            if 'donts' not in columns:
                print("Adding 'donts' column...")
                db.session.execute(text("ALTER TABLE symptom_assessments ADD COLUMN donts TEXT"))
            else:
                print("Column 'donts' already exists, skipping...")
            
            # Commit the transaction
            db.session.commit()
            print("Migration completed successfully!")
            
        except Exception as e:
            db.session.rollback()
            print(f"Error during migration: {str(e)}")
            raise

if __name__ == "__main__":
    run_migration()
