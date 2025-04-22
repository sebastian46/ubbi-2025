import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserProfile from './UserProfile';
import ArtistInfoCard from './ArtistInfoCard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function UserSelections({ userId }) {
  const [selections, setSelections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSet, setSelectedSet] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  useEffect(() => {
    const fetchSelections = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/${userId}/selections`);
        setSelections(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching selections:', error);
        setError('Failed to load your selections');
        setLoading(false);
      }
    };

    fetchSelections();
  }, [userId]);

  // Clear feedback message after 3 seconds
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => {
        setActionFeedback(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  const handleRemoveSelection = async (setId) => {
    try {
      // If this is the first click on remove, show confirmation
      if (pendingRemoval !== setId) {
        // If we're already confirming removal for another set, reset it
        if (pendingRemoval) {
          setPendingRemoval(null);
        }
        setPendingRemoval(setId);
        return;
      }
      
      // This is the confirmation click, proceed with removal
      await axios.delete(`${API_URL}/users/${userId}/selections/${setId}`);
      setSelections(selections.filter(set => set.id !== setId));
      setPendingRemoval(null);
      setActionFeedback({
        type: 'success',
        message: 'Removed from your schedule'
      });
      
      if (selectedSet && selectedSet.id === setId) {
        setSelectedSet(null);
        setAttendees([]);
      }
    } catch (error) {
      console.error('Error removing selection:', error);
      setActionFeedback({
        type: 'error',
        message: 'Failed to remove selection'
      });
    }
  };

  const cancelRemoval = (event) => {
    if (event) event.stopPropagation();
    setPendingRemoval(null);
  };

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

  const handleArtistClick = (set) => {
    // Don't open modal if we have a pending removal confirmation
    if (pendingRemoval) {
      setPendingRemoval(null);
      return;
    }
    
    // Open the modal and fetch attendees
    setSelectedSet(set);
    fetchAttendees(set.id);
  };

  const handleViewUser = (attendeeId, event) => {
    event.stopPropagation();
    setViewingUserId(attendeeId);
    // Close the artist info modal when viewing a user profile
    setSelectedSet(null);
  };

  const handleBackFromUserProfile = () => {
    setViewingUserId(null);
  };

  const handleCloseArtistInfo = () => {
    setSelectedSet(null);
    setAttendees([]);
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

  if (loading) return <div className="text-center py-4">Loading your selections...</div>;
  if (error) return <div className="text-center text-red-500 py-4">{error}</div>;

  // If viewing a specific user's profile
  if (viewingUserId) {
    return <UserProfile userId={viewingUserId} onBack={handleBackFromUserProfile} />;
  }

  if (selections.length === 0) {
    return (
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">My Selections</h2>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow text-center">
          <p className="text-sm sm:text-base text-gray-600">You haven't selected any sets yet.</p>
          <p className="mt-2 text-sm sm:text-base">Go to the Festival Sets tab to select artists you want to see.</p>
        </div>
      </div>
    );
  }

  // Mobile-friendly card view
  const renderMobileCards = () => {
    return (
      <div className="space-y-3 md:hidden">
        {selections.map(set => {
          const isConfirmingRemoval = pendingRemoval === set.id;
          
          return (
            <div 
              key={set.id} 
              className="bg-white p-3 rounded-lg shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <button 
                  onClick={() => handleArtistClick(set)}
                  className="font-medium text-blue-600 hover:text-blue-800 active:text-blue-900 focus:outline-none text-left"
                >
                  {set.artist}
                </button>
                
                {isConfirmingRemoval ? (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleRemoveSelection(set.id)}
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 active:bg-red-700"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={cancelRemoval}
                      className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400 active:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRemoveSelection(set.id)}
                    className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 active:bg-red-300"
                    aria-label="Remove"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-500">
                <p>{set.stage}</p>
                <p>{formatDateTime(set.start_time)}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Desktop table view
  const renderDesktopTable = () => {
    return (
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Artist
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stage
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {selections.map(set => {
              const isConfirmingRemoval = pendingRemoval === set.id;
              
              return (
                <tr key={set.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleArtistClick(set)}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline focus:outline-none transition-colors duration-200"
                    >
                      {set.artist}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{set.stage}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDateTime(set.start_time)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {isConfirmingRemoval ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRemoveSelection(set.id)}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={cancelRemoval}
                          className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRemoveSelection(set.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">My Selections</h2>
      
      {/* Action feedback toast notification */}
      {actionFeedback && (
        <div className={`fixed bottom-16 sm:bottom-4 left-0 right-0 mx-auto w-64 p-2 rounded-lg shadow-lg text-center text-white text-sm z-50 ${
          actionFeedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {actionFeedback.message}
        </div>
      )}
      
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
      
      {renderMobileCards()}
      {renderDesktopTable()}
    </div>
  );
}

export default UserSelections; 