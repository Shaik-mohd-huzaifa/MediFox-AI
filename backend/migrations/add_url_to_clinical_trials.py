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
            print("Starting migration to add URL column to clinical_trials table...")
            
            # Check if column already exists
            inspector = sa.inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('clinical_trials')]
            
            if 'url' not in columns:
                print("Adding 'url' column to 'clinical_trials' table...")
                db.session.execute(text("""
                ALTER TABLE clinical_trials 
                ADD COLUMN url VARCHAR(255);
                """))
                
                # Update existing records to have a URL based on their NCT ID
                db.session.execute(text("""
                UPDATE clinical_trials 
                SET url = 'https://clinicaltrials.gov/study/' || nct_id 
                WHERE nct_id IS NOT NULL;
                """))
                
                print("Added 'url' column to 'clinical_trials' table successfully!")
            else:
                print("Column 'url' already exists in 'clinical_trials' table, skipping...")
            
            # Commit the transaction
            db.session.commit()
            print("Migration completed successfully!")
            
        except Exception as e:
            db.session.rollback()
            print(f"Error during migration: {str(e)}")
            raise

if __name__ == "__main__":
    run_migration()
