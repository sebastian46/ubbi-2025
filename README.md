# Festival Organizer

A simple web application for festival groups to organize which sets they want to see.

## Features

- User profiles (no login required)
- List of festival sets with time and location
- Add/remove sets to your personal schedule
- View which sets are popular among the group

## Tech Stack

- **Backend**: Python, Flask, SQLite, SQLAlchemy
- **Frontend**: React, Tailwind CSS
- **Containerization**: Docker, Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your system

### Running the Application with Docker

1. Clone this repository
2. Navigate to the project directory
3. Build and start the containers:

```bash
docker-compose up -d
```

4. Seed the database with sample data:

```bash
docker exec -it festival-backend python seed.py
```

5. Access the application:
   - Frontend: http://localhost:3003
   - Backend API: http://localhost:5000/api

### Running Without Docker

#### Backend

1. Navigate to the backend directory
2. Create a virtual environment and activate it:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Run the application:

```bash
python wsgi.py
```

5. Seed the database with sample data (in a separate terminal):

```bash
python seed.py
```

#### Frontend

1. Navigate to the frontend directory
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

4. Access the frontend at http://localhost:3000

## API Endpoints

### Users

- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get a specific user

### Sets

- `GET /api/sets` - Get all sets
- `POST /api/sets` - Create a new set
- `GET /api/sets/:id` - Get a specific set

### Selections

- `GET /api/selections` - Get all selections
- `POST /api/selections` - Create a new selection
- `GET /api/users/:id/selections` - Get selections for a specific user
- `GET /api/sets/:id/users` - Get users who selected a specific set
- `DELETE /api/users/:user_id/selections/:set_id` - Remove a user's selection 