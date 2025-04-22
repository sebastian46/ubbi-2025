from datetime import datetime, timedelta
from app import create_app, db
from app.models import User, Set, UserSelection

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
            User(name="David")
        ]
        db.session.add_all(users)
        db.session.commit()
        
        # Create sample sets
        # Starting from the current day
        base_date = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
        
        sets = [
            Set(
                artist="DJ Awesome",
                stage="Main Stage",
                start_time=base_date,
                end_time=base_date + timedelta(hours=1),
                description="Opening DJ set"
            ),
            Set(
                artist="Acoustic Singer",
                stage="Alternative Stage",
                start_time=base_date,
                end_time=base_date + timedelta(minutes=45),
                description="Unplugged acoustic session"
            ),
            Set(
                artist="Rock Band",
                stage="Main Stage",
                start_time=base_date + timedelta(hours=1, minutes=30),
                end_time=base_date + timedelta(hours=2, minutes=30),
                description="Headlining rock band"
            ),
            Set(
                artist="Pop Star",
                stage="Dance Tent",
                start_time=base_date + timedelta(hours=1),
                end_time=base_date + timedelta(hours=2),
                description="Chart-topping pop act"
            ),
            Set(
                artist="Indie Group",
                stage="Alternative Stage",
                start_time=base_date + timedelta(hours=2),
                end_time=base_date + timedelta(hours=3),
                description="Up and coming indie act"
            ),
            Set(
                artist="EDM Producer",
                stage="Dance Tent",
                start_time=base_date + timedelta(hours=2, minutes=30),
                end_time=base_date + timedelta(hours=4),
                description="Electronic dance music"
            ),
            Set(
                artist="Folk Duo",
                stage="Acoustic Lounge",
                start_time=base_date + timedelta(hours=2, minutes=30),
                end_time=base_date + timedelta(hours=3, minutes=15),
                description="Traditional folk music"
            ),
            Set(
                artist="Hip Hop Collective",
                stage="Main Stage",
                start_time=base_date + timedelta(hours=3),
                end_time=base_date + timedelta(hours=4),
                description="Hip hop showcase"
            ),
            Set(
                artist="Jazz Ensemble",
                stage="Alternative Stage",
                start_time=base_date + timedelta(hours=3, minutes=30),
                end_time=base_date + timedelta(hours=4, minutes=30),
                description="Jazz fusion performance"
            ),
            Set(
                artist="Metal Band",
                stage="Rock Stage",
                start_time=base_date + timedelta(hours=4),
                end_time=base_date + timedelta(hours=5),
                description="Heavy metal experience"
            )
        ]
        db.session.add_all(sets)
        db.session.commit()
        
        # Create some initial selections
        selections = [
            UserSelection(user_id=1, set_id=1),  # Alice likes DJ Awesome
            UserSelection(user_id=1, set_id=4),  # Alice likes Pop Star
            UserSelection(user_id=2, set_id=3),  # Bob likes Rock Band
            UserSelection(user_id=2, set_id=6),  # Bob likes EDM Producer
            UserSelection(user_id=3, set_id=5),  # Charlie likes Indie Group
            UserSelection(user_id=3, set_id=9),  # Charlie likes Jazz Ensemble
            UserSelection(user_id=4, set_id=8),  # David likes Hip Hop Collective
            UserSelection(user_id=4, set_id=10),  # David likes Metal Band
            UserSelection(user_id=1, set_id=2),  # Alice likes Acoustic Singer
            UserSelection(user_id=3, set_id=7),  # Charlie likes Folk Duo
        ]
        db.session.add_all(selections)
        db.session.commit()
        
        print("Database seeded successfully!")

if __name__ == "__main__":
    seed_data() 