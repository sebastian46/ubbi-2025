from flask import Blueprint, jsonify, request
from app import db
from app.models import User, Set, UserSelection
from datetime import datetime, date
from sqlalchemy import func

api = Blueprint('api', __name__, url_prefix='/api')

# User routes
@api.route('/users', methods=['GET', 'POST'])
def handle_users():
    if request.method == 'POST':
        data = request.json
        if not data or 'name' not in data:
            return jsonify({'error': 'Name is required'}), 400
        
        new_user = User(name=data['name'])
        db.session.add(new_user)
        db.session.commit()
        return jsonify(new_user.to_dict()), 201
    
    # GET method
    users = User.query.order_by(User.name).all()
    return jsonify([user.to_dict() for user in users])

@api.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

# Festival days route
@api.route('/festival-days', methods=['GET'])
def get_festival_days():
    # Query unique dates from the sets table
    distinct_dates = db.session.query(
        db.func.date(Set.start_time).label('date')
    ).distinct().order_by('date').all()
    
    # Format the dates
    formatted_days = []
    for day in distinct_dates:
        day_date = day.date
        # Convert to Python date object if it isn't already
        if not isinstance(day_date, date):
            day_date = datetime.strptime(day_date, '%Y-%m-%d').date()
        
        formatted_days.append({
            'date': day_date.isoformat(),
            'label': day_date.strftime('%A, %B %d, %Y')
        })
    
    return jsonify(formatted_days)

# Set routes
@api.route('/sets', methods=['GET', 'POST'])
def handle_sets():
    if request.method == 'POST':
        data = request.json
        if not data or not all(k in data for k in ['artist', 'stage', 'start_time', 'end_time']):
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Parse datetime strings to datetime objects
        try:
            start_time = datetime.fromisoformat(data['start_time'])
            end_time = datetime.fromisoformat(data['end_time'])
        except ValueError:
            return jsonify({'error': 'Invalid datetime format'}), 400
            
        new_set = Set(
            artist=data['artist'],
            stage=data['stage'],
            start_time=start_time,
            end_time=end_time,
            description=data.get('description', '')
        )
        db.session.add(new_set)
        db.session.commit()
        return jsonify(new_set.to_dict()), 201
    
    # GET method with optional date filter
    date_filter = request.args.get('date')
    
    if date_filter:
        try:
            # Create datetime objects for the start and end of the specified date
            filter_date = datetime.fromisoformat(date_filter)
            start_of_day = datetime(filter_date.year, filter_date.month, filter_date.day, 0, 0, 0)
            end_of_day = datetime(filter_date.year, filter_date.month, filter_date.day, 23, 59, 59)
            
            sets = Set.query.filter(
                Set.start_time >= start_of_day,
                Set.start_time <= end_of_day
            ).order_by(Set.stage, Set.start_time).all()
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    else:
        sets = Set.query.order_by(Set.stage, Set.start_time).all()
    
    return jsonify([s.to_dict() for s in sets])

@api.route('/sets/<int:set_id>', methods=['GET'])
def get_set(set_id):
    set = Set.query.get_or_404(set_id)
    return jsonify(set.to_dict())

# New endpoint to get attendee counts for all sets in one request
@api.route('/sets/attendee-counts', methods=['GET'])
def get_all_attendee_counts():
    date_filter = request.args.get('date')
    
    # Base query to count attendees per set
    query = db.session.query(
        UserSelection.set_id,
        func.count(UserSelection.user_id).label('count')
    ).group_by(UserSelection.set_id)
    
    if date_filter:
        try:
            # Create datetime objects for the start and end of the specified date
            filter_date = datetime.fromisoformat(date_filter)
            start_of_day = datetime(filter_date.year, filter_date.month, filter_date.day, 0, 0, 0)
            end_of_day = datetime(filter_date.year, filter_date.month, filter_date.day, 23, 59, 59)
            
            # Filter by date through a subquery
            set_ids = db.session.query(Set.id).filter(
                Set.start_time >= start_of_day,
                Set.start_time <= end_of_day
            )
            
            query = query.filter(UserSelection.set_id.in_(set_ids))
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    
    # Execute the query and format the results
    counts = query.all()
    result = {str(set_id): count for set_id, count in counts}
    
    return jsonify(result)

# User Selection routes
@api.route('/selections', methods=['GET', 'POST'])
def handle_selections():
    if request.method == 'POST':
        data = request.json
        if not data or not all(k in data for k in ['user_id', 'set_id']):
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Check if selection already exists
        existing = UserSelection.query.filter_by(
            user_id=data['user_id'], 
            set_id=data['set_id']
        ).first()
        
        if existing:
            return jsonify({'error': 'Selection already exists'}), 400
            
        selection = UserSelection(
            user_id=data['user_id'],
            set_id=data['set_id']
        )
        db.session.add(selection)
        db.session.commit()
        return jsonify(selection.to_dict()), 201
    
    # GET method
    selections = UserSelection.query.all()
    return jsonify([selection.to_dict() for selection in selections])

@api.route('/users/<int:user_id>/selections', methods=['GET'])
def get_user_selections(user_id):
    User.query.get_or_404(user_id)  # Check if user exists
    
    # Get date filter parameter
    date_filter = request.args.get('date')
    
    # Base query
    query = db.session.query(Set)\
        .join(UserSelection, UserSelection.set_id == Set.id)\
        .filter(UserSelection.user_id == user_id)
    
    # Apply date filter if provided
    if date_filter:
        try:
            # Create datetime objects for the start and end of the specified date
            filter_date = datetime.fromisoformat(date_filter)
            start_of_day = datetime(filter_date.year, filter_date.month, filter_date.day, 0, 0, 0)
            end_of_day = datetime(filter_date.year, filter_date.month, filter_date.day, 23, 59, 59)
            
            query = query.filter(
                Set.start_time >= start_of_day,
                Set.start_time <= end_of_day
            )
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    
    # Execute the query and order by start_time
    sets = query.order_by(Set.start_time).all()
    
    return jsonify([s.to_dict() for s in sets])

@api.route('/sets/<int:set_id>/users', methods=['GET'])
def get_set_users(set_id):
    Set.query.get_or_404(set_id)  # Check if set exists
    
    selections = UserSelection.query.filter_by(set_id=set_id).all()
    users = [selection.user for selection in selections]
    return jsonify([user.to_dict() for user in users])

@api.route('/users/<int:user_id>/selections/<int:set_id>', methods=['DELETE'])
def delete_user_selection(user_id, set_id):
    selection = UserSelection.query.filter_by(
        user_id=user_id, 
        set_id=set_id
    ).first_or_404()
    
    db.session.delete(selection)
    db.session.commit()
    return '', 204 