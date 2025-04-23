import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from './LocationContext';

function LocationSharing({ currentUser, allUsers }) {
  const mapRef = useRef(null);
  const {
    myLocation,
    isSharing,
    userLocations,
    error,
    startSharingLocation,
    stopSharingLocation
  } = useLocation();
  
  const [mapInitialized, setMapInitialized] = useState(false);
  const [markers, setMarkers] = useState({});

  // Initialize the map when component mounts
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Create a simple map using a div as a placeholder
    // In a real implementation, you would use a library like Leaflet or Google Maps
    if (!mapInitialized) {
      const mapContainer = mapRef.current;
      mapContainer.style.position = 'relative';
      mapContainer.style.overflow = 'hidden';
      mapContainer.style.backgroundColor = '#E6EAF0';
      mapContainer.style.borderRadius = '8px';
      mapContainer.style.border = '1px solid #D1D5DB';
      
      // Add a grid to simulate a map
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const gridLine = document.createElement('div');
          gridLine.style.position = 'absolute';
          gridLine.style.top = `${i * 20}%`;
          gridLine.style.left = '0';
          gridLine.style.width = '100%';
          gridLine.style.height = '1px';
          gridLine.style.backgroundColor = '#D1D5DB';
          mapContainer.appendChild(gridLine);
          
          const gridColumn = document.createElement('div');
          gridColumn.style.position = 'absolute';
          gridColumn.style.top = '0';
          gridColumn.style.left = `${j * 20}%`;
          gridColumn.style.width = '1px';
          gridColumn.style.height = '100%';
          gridColumn.style.backgroundColor = '#D1D5DB';
          mapContainer.appendChild(gridColumn);
        }
      }
      
      // Add compass to the top right
      const compass = document.createElement('div');
      compass.style.position = 'absolute';
      compass.style.top = '10px';
      compass.style.right = '10px';
      compass.style.width = '40px';
      compass.style.height = '40px';
      compass.style.borderRadius = '50%';
      compass.style.backgroundColor = 'white';
      compass.style.display = 'flex';
      compass.style.justifyContent = 'center';
      compass.style.alignItems = 'center';
      compass.style.fontSize = '14px';
      compass.style.fontWeight = 'bold';
      compass.style.border = '1px solid #D1D5DB';
      compass.innerHTML = 'N';
      mapContainer.appendChild(compass);
      
      setMapInitialized(true);
    }
  }, [mapInitialized]);

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current || !mapInitialized) return;
    
    const mapContainer = mapRef.current;
    
    // Clear existing markers
    Object.values(markers).forEach(marker => {
      if (marker && marker.parentNode === mapContainer) {
        mapContainer.removeChild(marker);
      }
    });
    
    const newMarkers = {};
    
    // Add my location marker if sharing
    if (myLocation && isSharing) {
      const myMarker = createMarker(currentUser.name, '#3B82F6', true);
      positionMarker(myMarker, 50, 50); // Center - in real app this would use actual coordinates
      mapContainer.appendChild(myMarker);
      newMarkers['me'] = myMarker;
    }
    
    // Add other users' markers
    Object.entries(userLocations).forEach(([userId, location]) => {
      if (userId === currentUser.id) return; // Skip self
      
      const user = allUsers.find(u => u.id === userId) || { name: 'Unknown User' };
      const marker = createMarker(user.name, '#EC4899');
      
      // In a real app, we would convert real coordinates to x,y positions
      // Here we're just using random positions for demonstration
      const x = 20 + Math.random() * 60; // 20% to 80% of map width
      const y = 20 + Math.random() * 60; // 20% to 80% of map height
      
      positionMarker(marker, x, y);
      mapContainer.appendChild(marker);
      newMarkers[userId] = marker;
    });
    
    setMarkers(newMarkers);
    
  }, [myLocation, userLocations, isSharing, mapInitialized, currentUser, allUsers]);

  // Helper to create a marker element
  const createMarker = (name, color, isMe = false) => {
    const marker = document.createElement('div');
    marker.style.position = 'absolute';
    marker.style.width = isMe ? '20px' : '16px';
    marker.style.height = isMe ? '20px' : '16px';
    marker.style.borderRadius = '50%';
    marker.style.backgroundColor = color;
    marker.style.border = '2px solid white';
    marker.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
    marker.style.transform = 'translate(-50%, -50%)';
    marker.style.zIndex = isMe ? '20' : '10';
    
    // Add pulsing effect for my location
    if (isMe) {
      marker.style.animation = 'pulse 2s infinite';
      // Add keyframes for the pulse animation
      if (!document.getElementById('pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'pulse-animation';
        style.innerHTML = `
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          }
        `;
        document.head.appendChild(style);
      }
    }
    
    // Add tooltip with name
    marker.title = name;
    
    // Add label
    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.top = '100%';
    label.style.left = '50%';
    label.style.transform = 'translateX(-50%)';
    label.style.backgroundColor = 'white';
    label.style.padding = '2px 4px';
    label.style.borderRadius = '4px';
    label.style.fontSize = '10px';
    label.style.whiteSpace = 'nowrap';
    label.style.marginTop = '4px';
    label.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
    label.innerText = name;
    marker.appendChild(label);
    
    return marker;
  };
  
  // Helper to position a marker on the map
  const positionMarker = (marker, x, y) => {
    marker.style.left = `${x}%`;
    marker.style.top = `${y}%`;
  };

  // Calculate distance between two points (would use real coordinates in a real app)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Simplified calculation for demo
    // In a real app, use the Haversine formula for accurate distances
    return Math.round(Math.random() * 1000); // Random distance in meters for demo
  };

  // Toggle location sharing
  const toggleLocationSharing = async () => {
    if (isSharing) {
      stopSharingLocation();
    } else {
      await startSharingLocation();
    }
  };

  // Format location data for display
  const formatLocation = (location) => {
    if (!location) return 'Unknown';
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">Location Sharing</h2>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Toggle sharing button */}
      <div className="mb-4">
        <button
          onClick={toggleLocationSharing}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isSharing ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isSharing ? 'Stop Sharing Location' : 'Start Sharing Location'}
        </button>
      </div>
      
      {/* My location info */}
      {myLocation && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <h3 className="font-medium text-blue-800">My Location</h3>
          <p className="text-sm mt-1">Coordinates: {formatLocation(myLocation)}</p>
          <p className="text-sm">Accuracy: {myLocation.accuracy ? `${Math.round(myLocation.accuracy)} meters` : 'Unknown'}</p>
          <p className="text-sm">Updated: {formatTimestamp(myLocation.timestamp)}</p>
          <p className="text-sm font-medium mt-2">
            Status: {isSharing ? 'Currently sharing' : 'Not sharing'}
          </p>
        </div>
      )}
      
      {/* Map */}
      <div className="mb-4">
        <h3 className="font-medium mb-2">Location Map</h3>
        <div 
          ref={mapRef}
          className="w-full h-64 bg-gray-100 rounded-md"
        >
          {!mapInitialized && <div className="flex items-center justify-center h-full">Initializing map...</div>}
        </div>
      </div>
      
      {/* Other users' locations */}
      <div>
        <h3 className="font-medium mb-2">Other Attendees</h3>
        {Object.keys(userLocations).length === 0 ? (
          <p className="text-gray-500 text-sm">No other users are sharing their location yet.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(userLocations).map(([userId, location]) => {
              if (userId === currentUser.id) return null;
              
              const user = allUsers.find(u => u.id === userId) || { name: 'Unknown User' };
              const distance = myLocation ? 
                calculateDistance(
                  myLocation.latitude, 
                  myLocation.longitude, 
                  location.latitude, 
                  location.longitude
                ) : null;
              
              return (
                <div key={userId} className="p-2 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm">Coordinates: {formatLocation(location)}</p>
                  <p className="text-sm">Updated: {formatTimestamp(location.timestamp)}</p>
                  {distance && (
                    <p className="text-sm font-medium text-blue-600">
                      {distance < 1000 ? 
                        `${distance} meters away` : 
                        `${(distance / 1000).toFixed(1)} km away`
                      }
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationSharing; 