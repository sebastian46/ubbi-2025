import csv
import os
from datetime import datetime, timedelta
from app import create_app, db
from app.models import User, Set, UserSelection
import random

def parse_time(time_string, base_date):
    """Convert time string to a datetime object on the given base date"""
    # Parse the time string format (like "10:45:00 PM")
    time_format = "%I:%M:%S %p"
    time_obj = datetime.strptime(time_string, time_format)
    
    # Combine with base date
    result = base_date.replace(
        hour=time_obj.hour,
        minute=time_obj.minute,
        second=time_obj.second
    )
    
    # Adjust for midnight (next day)
    if time_string.endswith("AM") and time_obj.hour == 12:
        result += timedelta(days=1)
    
    return result

def seed_data():
    # Create the app context
    app = create_app()
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()
        
        # Create sample users
        users = [
            User(name="Alice"),
            User(name="Bob"),
            User(name="Charlie"),
            User(name="David"),
            User(name="Eva"),
            User(name="Frank"),
            User(name="Grace"),
            User(name="Hannah")
        ]
        db.session.add_all(users)
        db.session.commit()
        
        # Read sets from CSV file
        sets = []
        
        # Try multiple possible locations for the CSV file
        csv_paths = [
            "/app/lineup.csv",  # Docker container root
            "lineup.csv",       # Current directory
            "../lineup.csv"     # Project root
        ]
        
        csv_path = None
        for path in csv_paths:
            if os.path.exists(path):
                csv_path = path
                break
        
        if not csv_path:
            print("Warning: lineup.csv not found. Using fallback data.")
            # Fallback to basic set data if CSV not found
            base_date = datetime(2025, 4, 26, 0, 0, 0).replace(tzinfo=None)  # April 26 2025 00:00:00 CST
            sets = [
                Set(
                    artist="Subtronics",
                    stage="Ubbi's Stage",
                    start_time=base_date + timedelta(hours=10, minutes=45),
                    end_time=base_date + timedelta(hours=12),
                    description="Performance by Subtronics"
                ),
                Set(
                    artist="Fisher",
                    stage="Ubbi's Stage",
                    start_time=base_date + timedelta(days=1, hours=8, minutes=30),
                    end_time=base_date + timedelta(days=1, hours=10),
                    description="Performance by Fisher"
                )
            ]
        else:
            print(f"Using lineup data from: {csv_path}")
            # Set base dates for the festival
            day1_date = datetime(2025, 4, 26, 0, 0, 0).replace(tzinfo=None)  # April 26 2025 00:00:00 CST
            day2_date = day1_date + timedelta(days=1)
            
            with open(csv_path, 'r') as csv_file:
                csv_reader = csv.DictReader(csv_file)
                
                for i, row in enumerate(csv_reader):
                    # Skip empty rows
                    if not row['artist'] or row['artist'].strip() == '':
                        continue
                    
                    # Determine if this is day 1 or day 2 based on row position
                    # Assuming day 1 ends at row 25 (where there's an empty row in the CSV)
                    base_date = day1_date if i <= 25 else day2_date
                    
                    try:
                        # Parse start and end times
                        start_time = parse_time(row['start_time'], base_date)
                        end_time = parse_time(row['end_time'], base_date)
                        
                        # Handle midnight crossing to next day
                        if end_time < start_time:
                            end_time += timedelta(days=1)
                        
                        new_set = Set(
                            artist=row['artist'],
                            stage=row['stage'],
                            start_time=start_time,
                            end_time=end_time,
                            description=f"Performance by {row['artist']} at {row['stage']}"
                        )
                        sets.append(new_set)
                    except Exception as e:
                        print(f"Error processing row {i+1}: {row}")
                        print(f"Error: {e}")
        
        db.session.add_all(sets)
        db.session.commit()
        
        # Create random user selections
        selections = []
        
        # For each user, select 3-8 random sets to attend
        for user in users:
            # Select a random number of sets for this user
            num_selections = random.randint(3, 8)
            
            # Get random sets without duplicates
            user_sets = random.sample(sets, min(num_selections, len(sets)))
            
            for set_obj in user_sets:
                selection = UserSelection(
                    user_id=user.id,
                    set_id=set_obj.id
                )
                selections.append(selection)
        
        db.session.add_all(selections)
        db.session.commit()
        
        print("Database seeded successfully!")
        print(f"Created {len(users)} users")
        print(f"Created {len(sets)} sets")
        print(f"Created {len(selections)} user selections")

if __name__ == "__main__":
    seed_data() 