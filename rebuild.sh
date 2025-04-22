#!/bin/bash

echo "Stopping existing containers..."
docker-compose down

echo "Removing old images..."
docker-compose rm -f

echo "Building new images with no cache..."
docker-compose build --no-cache

echo "Starting services with recreation..."
docker-compose up -d --force-recreate

echo "Done! The application is now available at:"
echo "- Frontend: http://localhost:3003"
echo "- Backend API: http://localhost:5000/api"

echo ""
echo "Run the following command to seed the database with sample data (if needed):"
echo "docker exec -it festival-backend python seed.py"

echo ""
echo "To view logs:"
echo "docker-compose logs -f" 