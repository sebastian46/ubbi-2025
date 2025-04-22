import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserProfile from './UserProfile';
import ArtistInfoCard from './ArtistInfoCard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SetList({ userId }) {
  const [sets, setSets] = useState([]);
  const [userSelections, setUserSelections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSet, setSelectedSet] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [activeStage, setActiveStage] = useState(null);
  const [viewMode, setViewMode] = useState('stage'); // 'stage' or 'time'
  const [timeSlots, setTimeSlots] = useState([]);
  const [attendeeCounts, setAttendeeCounts] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [setsResponse, selectionsResponse] = await Promise.all([
          axios.get(`${API_URL}/sets`),
          axios.get(`${API_URL}/users/${userId}/selections`)
        ]);
        
        // Log the raw response data
        console.log('API Response - Sets:', setsResponse.data);
        console.log('API Response - User Selections:', selectionsResponse.data);
        
        // Sort sets by stage and time
        const sortedSets = setsResponse.data.sort((a, b) => {
          // First compare stage names
          if (a.stage < b.stage) return -1;
          if (a.stage > b.stage) return 1;
          
          // If same stage, compare by start time
          return new Date(a.start_time) - new Date(b.start_time);
        });
        
        setSets(sortedSets);
        setUserSelections(selectionsResponse.data);
        
        // Fetch attendee counts for all sets
        const countsPromises = sortedSets.map(async (set) => {
          try {
            const response = await axios.get(`${API_URL}/sets/${set.id}/users`);
            return { setId: set.id, count: response.data.length };
          } catch (error) {
            console.error(`Error fetching attendees for set ${set.id}:`, error);
            return { setId: set.id, count: 0 };
          }
        });
        
        const countResults = await Promise.all(countsPromises);
        const countsMap = countResults.reduce((acc, { setId, count }) => {
          acc[setId] = count;
          return acc;
        }, {});
        
        setAttendeeCounts(countsMap);
        console.log('Attendee counts:', countsMap);
        
        // Set the first stage as active by default
        if (sortedSets.length > 0) {
          const stages = [...new Set(sortedSets.map(set => set.stage))];
          console.log('Unique stages:', stages);
          
          if (stages.length > 0) {
            setActiveStage(stages[0]);
          }
          
          // Generate time slots
          const uniqueTimes = [...new Set(sortedSets.map(set => set.start_time))];
          const sortedTimes = uniqueTimes.sort((a, b) => new Date(a) - new Date(b));
          console.log('Time slots:', sortedTimes.map(time => formatTimeOnly(time)));
          setTimeSlots(sortedTimes);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load festival sets');
        setLoading(false);
      }
    };

    fetchData();
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

  const isSelected = (setId) => {
    return userSelections.some(selection => selection.id === setId);
  };

  const handleToggleSelection = async (setId, event) => {
    // Prevent the card click event from firing
    event.stopPropagation();
    
    try {
      if (isSelected(setId)) {
        // Directly remove the selection without confirmation
        await axios.delete(`${API_URL}/users/${userId}/selections/${setId}`);
        setUserSelections(userSelections.filter(selection => selection.id !== setId));
        setActionFeedback({
          type: 'success',
          message: 'Removed from your schedule'
        });
        
        // Update the friend count for this set
        setAttendeeCounts(prev => ({
          ...prev,
          [setId]: Math.max(0, (prev[setId] || 0) - 1)
        }));
        
        // If this set is currently selected and showing attendees, refresh the list
        if (selectedSet && selectedSet.id === setId) {
          fetchAttendees(setId);
        }
      } else {
        // Add selection
        await axios.post(`${API_URL}/selections`, { user_id: userId, set_id: setId });
        const setData = sets.find(s => s.id === setId);
        setUserSelections([...userSelections, setData]);
        setActionFeedback({
          type: 'success', 
          message: 'Added to your schedule'
        });
        
        // Update the friend count for this set
        setAttendeeCounts(prev => ({
          ...prev,
          [setId]: (prev[setId] || 0) + 1
        }));
        
        // If this set is currently selected and showing attendees, refresh the list
        if (selectedSet && selectedSet.id === setId) {
          fetchAttendees(setId);
        }
      }
    } catch (error) {
      console.error('Error updating selection:', error);
      setActionFeedback({
        type: 'error',
        message: 'Failed to update selection'
      });
    }
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

  const handleSetClick = (set) => {
    // Simply open the modal with the selected set
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

  const handleStageSelect = (stage) => {
    setActiveStage(stage);
  };

  const toggleViewMode = (mode) => {
    setViewMode(mode);
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

  // Format time-only string for time slots
  const formatTimeOnly = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Get unique stages from sets
  const getStages = () => {
    return [...new Set(sets.map(set => set.stage))];
  };

  // Filter sets by active stage
  const getFilteredSets = () => {
    if (!activeStage) return [];
    return sets.filter(set => set.stage === activeStage);
  };

  // Get sets organized by time
  const getSetsByTime = () => {
    const setsByTime = {};
    
    console.log('Building time-based view with timeSlots:', timeSlots);
    
    timeSlots.forEach(timeSlot => {
      // Create a Date object from the timeSlot string
      const timeSlotDate = new Date(timeSlot);
      
      // Filter sets that match this time (using hours and minutes comparison)
      const setsAtTime = sets.filter(set => {
        const setDate = new Date(set.start_time);
        return setDate.getHours() === timeSlotDate.getHours() && 
               setDate.getMinutes() === timeSlotDate.getMinutes();
      });
      
      console.log(`Sets at ${formatTimeOnly(timeSlot)}:`, setsAtTime.map(s => s.artist));
      
      if (setsAtTime.length > 0) {
        setsByTime[timeSlot] = setsAtTime;
      }
    });
    
    console.log('Final setsByTime structure:', Object.keys(setsByTime).map(k => formatTimeOnly(k)));
    return setsByTime;
  };

  if (loading) return <div className="text-center py-4">Loading sets...</div>;
  if (error) return <div className="text-center text-red-500 py-4">{error}</div>;

  // If viewing a specific user's profile
  if (viewingUserId) {
    return <UserProfile userId={viewingUserId} onBack={handleBackFromUserProfile} />;
  }

  // Create a compact card for mobile view
  const renderArtistCard = (set) => {
    const isArtistSelected = isSelected(set.id);
    const friendCount = attendeeCounts[set.id] || 0;

  return (
      <div 
        key={set.id}
        onClick={() => handleSetClick(set)}
        className={`border rounded-lg overflow-hidden shadow cursor-pointer h-full flex flex-col ${
          isArtistSelected ? 'border-blue-500 border-2' : 'border-gray-200'
        }`}
      >
        <div className="bg-gray-50 p-2 flex-grow">
          <h3 className="font-bold text-sm truncate">{set.artist}</h3>
          {viewMode === 'stage' ? (
            <div className="text-xs text-gray-600 mt-1">
              <p className="truncate">{formatDateTime(set.start_time)}</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-blue-600 font-medium">
                  {friendCount} {friendCount === 1 ? 'friend' : 'friends'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-600 mt-1">
              <p className="truncate">{set.stage}</p>
            </div>
          )}
        </div>
        
        <div className="p-1 bg-white border-t border-gray-200">
            <button 
            onClick={(e) => handleToggleSelection(set.id, e)}
            className={`w-full py-2 rounded text-xs ${
              isArtistSelected
                ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
            }`}
          >
            {isArtistSelected ? 'Remove' : 'Add'}
            </button>
          </div>
      </div>
    );
  };

  // Tablet/desktop card
  const renderDesktopCard = (set) => {
    const isArtistSelected = isSelected(set.id);
    const friendCount = attendeeCounts[set.id] || 0;
    
    return (
      <div 
        key={set.id}
        onClick={() => handleSetClick(set)}
        className={`border rounded-lg overflow-hidden shadow cursor-pointer ${
          isArtistSelected ? 'border-blue-500 border-2' : 'border-gray-200'
        }`}
      >
        <div className="bg-gray-50 p-3 sm:p-4">
          <h3 className="font-bold text-base sm:text-lg truncate">{set.artist}</h3>
          {viewMode === 'stage' ? (
            <div className="text-xs sm:text-sm text-gray-600 mt-1">
              <p>Time: {formatDateTime(set.start_time)}</p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-blue-600 font-medium">
                  {friendCount} {friendCount === 1 ? 'friend' : 'friends'} attending
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-gray-600 mt-1">
              <p>Stage: {set.stage}</p>
            </div>
          )}
        </div>
          
        <div className="p-2 sm:p-3 bg-white border-t border-gray-200">
          <button
            onClick={(e) => handleToggleSelection(set.id, e)}
            className={`w-full py-2 rounded text-sm ${
              isArtistSelected
                ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
            }`}
          >
            {isArtistSelected ? 'Remove' : 'Add to My Schedule'}
          </button>
        </div>
      </div>
    );
  };

  // Time view list item
  const renderTimeListItem = (set, attendeesCount) => {
    const isArtistSelected = isSelected(set.id);
    
    return (
      <div 
        onClick={() => handleSetClick(set)}
        className={`p-4 flex justify-between items-center cursor-pointer transition-colors duration-150 ${
          isArtistSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex-grow">
          <div className="font-medium text-base">{set.artist}</div>
          <div className="text-sm text-gray-600 mt-1">
            <span className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs">
              {set.stage}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-blue-600 whitespace-nowrap">
            {attendeesCount} {attendeesCount === 1 ? 'friend' : 'friends'}
          </div>
          
          <div>
            {isSelected(set.id) ? (
              <button
                onClick={(e) => handleToggleSelection(set.id, e)}
                className="px-3 py-1.5 text-xs bg-red-100 text-red-600 rounded-full hover:bg-red-200 active:bg-red-300 font-medium transition-colors duration-150"
              >
                Remove
              </button>
            ) : (
              <button
                onClick={(e) => handleToggleSelection(set.id, e)}
                className="px-3 py-1.5 text-xs bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 active:bg-blue-300 font-medium transition-colors duration-150"
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const stages = getStages();
  const filteredSets = getFilteredSets();
  const setsByTime = getSetsByTime();

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Festival Sets</h2>
      
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
      
      {/* View toggle */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => toggleViewMode('stage')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              viewMode === 'stage' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            By Stage
          </button>
          <button
            onClick={() => toggleViewMode('time')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              viewMode === 'time' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 border-l-0'
            }`}
          >
            By Time
          </button>
        </div>
      </div>
      
      {/* Stage selector tabs - only show in stage view */}
      {viewMode === 'stage' && (
        <div className="mb-4 overflow-x-auto">
          <div className="flex space-x-2 pb-1">
            {stages.map(stage => (
              <button
                key={stage}
                onClick={() => handleStageSelect(stage)}
                className={`px-3 py-2 text-sm whitespace-nowrap rounded-t ${
                  activeStage === stage 
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600 font-medium shadow-sm' 
                    : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300'
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {sets.length === 0 ? (
        <p className="text-sm text-gray-500">No sets available yet.</p>
      ) : viewMode === 'stage' ? (
        // Stage view
        filteredSets.length === 0 ? (
          <p className="text-sm text-gray-500">No sets for {activeStage}.</p>
        ) : (
          <>
            {/* Mobile view - 2 artists per row */}
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              {filteredSets.map(set => renderArtistCard(set))}
            </div>
            
            {/* Tablet and desktop view */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
              {filteredSets.map(set => renderDesktopCard(set))}
            </div>
          </>
        )
      ) : (
        // Time view
        <div className="bg-white rounded-lg shadow">
          {Object.keys(setsByTime).length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No scheduled sets found.</p>
          ) : (
            Object.entries(setsByTime).map(([time, timeSets], timeIndex) => (
              <div key={time} className={timeIndex > 0 ? "mt-4" : ""}>
                <div className="sticky top-0 bg-blue-600 text-white px-4 py-3 font-medium border-t border-b border-gray-200 shadow-sm rounded-t-lg">
                  {formatTimeOnly(time)}
                </div>
                <div className="border-l border-r border-gray-200 rounded-b-lg overflow-hidden">
                  {timeSets.map((set, setIndex) => {
                    const attendeesCount = attendeeCounts[set.id] || 0;
                    return (
                      <div key={set.id} className={setIndex > 0 ? "border-t border-gray-200" : ""}>
                        {renderTimeListItem(set, attendeesCount)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default SetList; 