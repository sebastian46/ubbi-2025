import React, { createContext, useState, useEffect, useContext } from 'react';

const LocationContext = createContext();

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  const [myLocation, setMyLocation] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [userLocations, setUserLocations] = useState({});
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);

  // Function to get user's current location once
  const getMyLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = "Geolocation is not supported by your browser";
        setError(error);
        reject(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          setMyLocation(location);
          resolve(location);
        },
        (error) => {
          const errorMessage = `Error getting location: ${error.message}`;
          setError(errorMessage);
          reject(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // Function to start continuous location tracking
  const startSharingLocation = async () => {
    try {
      // First get an initial location
      await getMyLocation();
      
      // Then start tracking
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          setMyLocation(location);
          setError(null);
        },
        (error) => {
          setError(`Location tracking error: ${error.message}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
      
      setWatchId(id);
      setIsSharing(true);
      return true;
    } catch (error) {
      setError(`Failed to start location sharing: ${error}`);
      return false;
    }
  };

  // Function to stop location tracking
  const stopSharingLocation = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsSharing(false);
      return true;
    }
    return false;
  };

  // Function to update a user's location (simulated - in a real app this would come from a database)
  const updateUserLocation = (userId, location) => {
    setUserLocations(prev => ({
      ...prev,
      [userId]: {
        ...location,
        userId,
        timestamp: new Date().toISOString()
      }
    }));
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <LocationContext.Provider
      value={{
        myLocation,
        isSharing,
        userLocations,
        error,
        getMyLocation,
        startSharingLocation,
        stopSharingLocation,
        updateUserLocation
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;