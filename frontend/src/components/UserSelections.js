import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import UserProfile from './UserProfile';
import ArtistInfoCard from './ArtistInfoCard';

const API_URL = process.env.REACT_APP_API_URL || 'https://ubbi.fromseb.com:5000/api';

function UserSelections({ userId, isVisible }) {
  const [selections, setSelections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSet, setSelectedSet] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [festivalDays, setFestivalDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [filteredSelections, setFilteredSelections] = useState([]);
  const [viewMode, setViewMode] = useState('time'); // 'time' or 'stage'
  const [stageGroups, setStageGroups] = useState({});

  // Function to fetch festival days
  const fetchFestivalDays = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/festival-days`);
      setFestivalDays(response.data);
      
      // Set the first day as default selected day if we don't have one yet
      if (response.data.length > 0 && !selectedDay) {
        setSelectedDay(response.data[0].date);
      }
    } catch (error) {
      console.error('Error fetching festival days:', error);
    }
  }, []);

  // Function to fetch the most recent selections
  const fetchSelections = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/users/${userId}/selections`);
      setSelections(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching selections:', error);
      setError('Failed to load your selections');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchFestivalDays();
    fetchSelections();
  }, [fetchFestivalDays, fetchSelections]);

  // Filter selections based on selected day
  useEffect(() => {
    if (selectedDay && selections.length > 0) {
      // Convert selectedDay to YYYY-MM-DD format for comparison
      const selectedDateStr = selectedDay.split('T')[0];
      
      // Filter selections where the start_time date matches the selected day
      const filtered = selections.filter(set => {
        // Extract just the date part of the set's start time for comparison
        const setDateStr = set.start_time.split('T')[0];
        return setDateStr === selectedDateStr;
      });
      
      setFilteredSelections(filtered);
      // console.log(`Filtering for date: ${selectedDateStr}, found ${filtered.length} selections`);
    } else {
      setFilteredSelections(selections);
    }
  }, [selectedDay, selections]);

  // Fetch when the component becomes visible (e.g., when switching tabs)
  useEffect(() => {
    if (isVisible) {
      fetchSelections();
      fetchFestivalDays();
    }
  }, [isVisible, fetchSelections, fetchFestivalDays]);

  // Add event listener for visibility changes to always fetch fresh data when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSelections();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchSelections]);

  // Clear feedback message after 3 seconds
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => {
        setActionFeedback(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  const handleDaySelect = (dayDate) => {
    setSelectedDay(dayDate);
  };

  const toggleViewMode = (mode) => {
    setViewMode(mode);
    // When switching to stage view, organize selections by stage
    if (mode === 'stage') {
      organizeSelectionsByStage();
    }
  };

  // Group selections by stage
  const organizeSelectionsByStage = () => {
    const groups = {};
    
    filteredSelections.forEach(set => {
      if (!groups[set.stage]) {
        groups[set.stage] = [];
      }
      groups[set.stage].push(set);
    });
    
    // Sort sets within each stage by start time
    Object.keys(groups).forEach(stage => {
      groups[stage].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    });
    
    setStageGroups(groups);
  };

  // Whenever filteredSelections changes, organize by stage if in stage view
  useEffect(() => {
    if (viewMode === 'stage') {
      organizeSelectionsByStage();
    }
  }, [filteredSelections, viewMode]);

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

  // Render festival day tabs
  const renderDayTabs = () => {
    if (festivalDays.length === 0) return null;

    return (
      <div className="inline-flex rounded-md shadow-sm" role="group">
        {festivalDays.map((day, index) => {
          // Extract just the day name (e.g., "Saturday") from the full label
          const dayName = day.label.split(',')[0];
          const isSelected = selectedDay === day.date;
          const isFirst = index === 0;
          const isLast = index === festivalDays.length - 1;
          
          return (
            <button
              key={day.date}
              onClick={() => handleDaySelect(day.date)}
              className={`
                px-4 py-2 text-sm font-medium
                ${isFirst ? 'rounded-l-lg' : ''}
                ${isLast ? 'rounded-r-lg' : ''}
                ${!isFirst ? 'border-l-0' : ''}
                ${isSelected 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}
              `}
            >
              {dayName}
            </button>
          );
        })}
      </div>
    );
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

  // Check if filtered selections is empty for the selected day
  const noSelectionsForDay = selectedDay && filteredSelections.length === 0;

  // Mobile-friendly card view
  const renderMobileCards = () => {
    if (noSelectionsForDay) {
      return (
        <div className="md:hidden bg-white p-4 rounded-lg shadow text-center">
          <p className="text-sm text-gray-600">No selections for this day.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 md:hidden">
        {filteredSelections.map(set => {
          const isConfirmingRemoval = pendingRemoval === set.id;
          
          return (
            <div 
              key={set.id} 
              className="bg-white p-3 rounded-lg shadow hover:bg-gray-50 cursor-pointer transition-colors duration-150"
              onClick={() => handleArtistClick(set)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-blue-600">
                  {set.artist}
                </div>
                
                {isConfirmingRemoval ? (
                  <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSelection(set.id);
                    }}
                    className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 active:bg-red-300"
                    aria-label="Remove"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {set.image_url && (
                  <img 
                    src={set.image_url} 
                    alt={set.artist} 
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
                <div className="text-sm text-gray-500">
                  <p>{set.stage}</p>
                  <p>{formatDateTime(set.start_time)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Desktop table view
  const renderDesktopTable = () => {
    if (noSelectionsForDay) {
      return (
        <div className="hidden md:block bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-600">No selections for this day.</p>
        </div>
      );
    }

    return (
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Artist
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
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
            {filteredSelections.map(set => {
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
                    {set.image_url && (
                      <img 
                        src={set.image_url} 
                        alt={set.artist} 
                        className="w-10 h-10 object-cover rounded"
                        onError={(e) => e.target.style.display = 'none'} 
                      />
                    )}
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
      
      {/* Navigation controls */}
      <div className="mb-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          {/* Festival day tabs */}
          {renderDayTabs()}
          
          {/* View toggle */}
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => toggleViewMode('time')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                viewMode === 'time' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              By Time
            </button>
            <button
              onClick={() => toggleViewMode('stage')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                viewMode === 'stage' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 border-l-0'
              }`}
            >
              By Stage
            </button>
          </div>
        </div>
      </div>
      
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
      
      {noSelectionsForDay ? (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow text-center">
          <p className="text-sm sm:text-base text-gray-600">No selections for this day.</p>
        </div>
      ) : viewMode === 'time' ? (
        /* Time-based view (original view) */
        <>
          {renderMobileCards()}
          {renderDesktopTable()}
        </>
      ) : (
        /* Stage-based view */
        <div>
          {Object.keys(stageGroups).length === 0 ? (
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-sm text-gray-600">No selections to display.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(stageGroups).map(([stage, stageSets]) => (
                <div key={stage} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="sticky top-0 py-3 px-4 bg-blue-600 text-white font-semibold z-10 shadow-sm">
                    {stage}
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {stageSets.map(set => {
                      const isConfirmingRemoval = pendingRemoval === set.id;
                      
                      return (
                        <div 
                          key={set.id} 
                          className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                          onClick={() => handleArtistClick(set)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-3">
                              {set.image_url && (
                                <img 
                                  src={set.image_url} 
                                  alt={set.artist} 
                                  className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded"
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              )}
                              <div>
                                <div className="font-medium text-blue-600">
                                  {set.artist}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatDateTime(set.start_time)}
                                </div>
                              </div>
                            </div>
                            
                            {isConfirmingRemoval ? (
                              <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSelection(set.id);
                                }}
                                className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 active:bg-red-300"
                                aria-label="Remove"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserSelections; 