from flask import Blueprint, jsonify, request
from app import db
from app.models import User, Set, UserSelection
from datetime import datetime

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
    
    # GET method
    sets = Set.query.all()
    return jsonify([s.to_dict() for s in sets])

@api.route('/sets/<int:set_id>', methods=['GET'])
def get_set(set_id):
    set = Set.query.get_or_404(set_id)
    return jsonify(set.to_dict())

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
    
    # Use a join with the Set model and order by start_time in the database query
    sets = db.session.query(Set)\
        .join(UserSelection, UserSelection.set_id == Set.id)\
        .filter(UserSelection.user_id == user_id)\
        .order_by(Set.start_time)\
        .all()
    
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