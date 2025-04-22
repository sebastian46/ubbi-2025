import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ArtistInfoCard from './ArtistInfoCard';

const API_URL = process.env.REACT_APP_API_URL || 'https://ubbi.fromseb.com:5000/api';

function UserProfile({ userId, onBack }) {
  const [user, setUser] = useState(null);
  const [userSets, setUserSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSet, setSelectedSet] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userResponse, setsResponse] = await Promise.all([
          axios.get(`${API_URL}/users/${userId}`),
          axios.get(`${API_URL}/users/${userId}/selections`)
        ]);
        
        setUser(userResponse.data);
        setUserSets(setsResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const fetchAttendees = async (setId) => {
    setAttendeesLoading(true);
    try {
      const response = await axios.get(`${API_URL}/sets/${setId}/users`);
      setAttendees(response.data);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    } finally {
      setAttendeesLoading(false);
    }
  };

  const handleSetClick = (set) => {
    setSelectedSet(set);
    fetchAttendees(set.id);
  };

  const handleCloseArtistInfo = () => {
    setSelectedSet(null);
    setAttendees([]);
  };

  // For viewing other users from the attendees list - we'll just pass onBack
  const handleViewUser = (attendeeId, event) => {
    event.stopPropagation();
    onBack(); // Go back to the main view first
    // We could implement nested user profiles, but for simplicity we'll just go back
  };

  // Format datetime string to readable format
  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="text-center py-4">Loading user profile...</div>;
  if (error) return <div className="text-center text-red-500 py-4">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-0 truncate">{user.name}'s Schedule</h2>
        <button 
          onClick={onBack}
          className="px-3 py-1 sm:px-4 sm:py-2 bg-gray-200 rounded hover:bg-gray-300 active:bg-gray-400 text-sm sm:text-base"
        >
          Back
        </button>
      </div>

      {selectedSet && (
        <ArtistInfoCard
          artistSet={selectedSet}
          attendees={attendees}
          attendeesLoading={attendeesLoading}
          onClose={handleCloseArtistInfo}
          onUserClick={handleViewUser}
          formatDateTime={formatDateTime}
        />
      )}

      {userSets.length === 0 ? (
        <p className="text-sm sm:text-base text-gray-500 text-center py-4">
          {user.name} hasn't selected any sets yet.
        </p>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {userSets.map(set => (
            <div 
              key={set.id} 
              className="border rounded-lg overflow-hidden cursor-pointer hover:border-blue-300 active:bg-blue-50 transition-colors"
              onClick={() => handleSetClick(set)}
            >
              <div className="bg-gray-50 p-3 sm:p-4">
                <h3 className="font-bold text-base sm:text-lg truncate text-blue-600">{set.artist}</h3>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                  <p>Stage: {set.stage}</p>
                  <p>Time: {formatDateTime(set.start_time)}</p>
                  {set.description && <p className="mt-1 line-clamp-2">{set.description}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserProfile; 