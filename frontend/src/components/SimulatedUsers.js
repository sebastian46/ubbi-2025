import React, { useState, useEffect } from 'react';
import { useLocation } from './LocationContext';

function SimulatedUsers({ currentUser, allUsers }) {
  const { updateUserLocation } = useLocation();
  const [simulatedUsers, setSimulatedUsers] = useState([]);
  const [simulationRunning, setSimulationRunning] = useState(false);

  // Start simulation of random users sharing their location
  const startSimulation = () => {
    // Filter out current user
    const otherUsers = allUsers.filter(user => user.id !== currentUser.id);
    
    // Take up to 3 random users to simulate
    const randomUsers = [];
    const numUsers = Math.min(3, otherUsers.length);
    
    const usersCopy = [...otherUsers];
    for (let i = 0; i < numUsers; i++) {
      const randomIndex = Math.floor(Math.random() * usersCopy.length);
      randomUsers.push(usersCopy.splice(randomIndex, 1)[0]);
    }
    
    setSimulatedUsers(randomUsers);
    setSimulationRunning(true);
  };

  // Stop simulation
  const stopSimulation = () => {
    setSimulationRunning(false);
  };

  // Simulate location updates for selected users
  useEffect(() => {
    if (!simulationRunning || simulatedUsers.length === 0) return;
    
    // Generate a random location near the user's current location (would be based on real map in production)
    const generateRandomLocation = () => {
      // Random coordinate within ~1km of a central point
      // These are approximate values - in a real app would use proper geolocation
      const centerLat = 37.7749; // San Francisco as an example
      const centerLng = -122.4194;
      
      // 0.01 degree is approximately 1km
      const latOffset = (Math.random() - 0.5) * 0.02;
      const lngOffset = (Math.random() - 0.5) * 0.02;
      
      return {
        latitude: centerLat + latOffset,
        longitude: centerLng + lngOffset,
        accuracy: 10 + Math.random() * 30, // 10-40m accuracy
        timestamp: new Date().toISOString()
      };
    };
    
    // Update locations periodically
    const intervals = simulatedUsers.map((user) => {
      // Initial location update
      updateUserLocation(user.id, generateRandomLocation());
      
      // Set up interval for periodic updates
      return setInterval(() => {
        if (simulationRunning) {
          updateUserLocation(user.id, generateRandomLocation());
        }
      }, 5000 + Math.random() * 10000); // Random interval between 5-15 seconds
    });
    
    // Clean up intervals
    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [simulationRunning, simulatedUsers, updateUserLocation]);

  return (
    <div className="mb-6 p-4 bg-gray-100 rounded-lg">
      <h3 className="font-medium mb-3">Simulation Controls</h3>
      
      <div className="flex space-x-2">
        {!simulationRunning ? (
          <button
            onClick={startSimulation}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            disabled={allUsers.length <= 1}
          >
            Simulate Other Users
          </button>
        ) : (
          <button
            onClick={stopSimulation}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            Stop Simulation
          </button>
        )}
      </div>
      
      {simulationRunning && simulatedUsers.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium">Simulating {simulatedUsers.length} users:</p>
          <ul className="text-sm mt-1 ml-4 list-disc">
            {simulatedUsers.map(user => (
              <li key={user.id}>{user.name}</li>
            ))}
          </ul>
        </div>
      )}
      
      {allUsers.length <= 1 && (
        <p className="mt-2 text-sm text-gray-600">
          Need more users to start simulation.
        </p>
      )}
    </div>
  );
}

export default SimulatedUsers; 