import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserProfile from './UserProfile';
import ArtistInfoCard from './ArtistInfoCard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Simple theme object to centralize styling
const theme = {
  colors: {
    primary: {
      light: 'bg-blue-50',
      medium: 'bg-blue-100 text-blue-600',
      standard: 'bg-blue-600 text-white',
      hover: 'hover:bg-blue-700',
      active: 'active:bg-blue-800',
      border: 'border-blue-600'
    },
    secondary: {
      light: 'bg-gray-50',
      medium: 'bg-gray-100',
      standard: 'bg-gray-600',
      hover: 'hover:bg-gray-700', 
      border: 'border-gray-200'
    },
    success: {
      light: 'bg-green-100 text-green-800',
      standard: 'bg-green-600 text-white',
      hover: 'hover:bg-green-700'
    },
    danger: {
      light: 'bg-red-100 text-red-600',
      medium: 'bg-red-200',
      standard: 'bg-red-500 text-white',
      hover: 'hover:bg-red-600',
      active: 'active:bg-red-700'
    }
  },
  stages: {
    "Ubbi’s Stage": 'bg-orange-100 text-orange-800',
    "Zoom Room": 'bg-purple-100 text-purple-800',
    "Dubbi’s Stage": 'bg-green-100 text-green-800',
  },
  components: {
    card: {
      base: 'border rounded-lg overflow-hidden shadow cursor-pointer',
      selected: 'border-blue-500 border-2',
      unselected: 'border-gray-200'
    },
    button: {
      base: 'rounded text-white',
      primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white',
      danger: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white',
      small: 'text-xs py-2',
      medium: 'text-sm py-2'
    },
    tag: {
      base: 'inline-block px-2 py-0.5 rounded text-xs'
    },
    time: {
      header: 'sticky top-0 py-3 px-4 bg-purple-900 text-white font-semibold z-10 shadow-sm'
    }
  }
};

// Helper function to get stage color classes
const getStageColorClass = (stageName) => {
  return theme.stages[stageName] || 'bg-gray-100 text-gray-800';
};

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
  const [festivalDays, setFestivalDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [cachedSetsByDay, setCachedSetsByDay] = useState({});
  const [cachedSelectionsByDay, setCachedSelectionsByDay] = useState({});

  // Fetch festival days on initial load
  useEffect(() => {
    const fetchFestivalDays = async () => {
      try {
        const response = await axios.get(`${API_URL}/festival-days`);
        // console.log('Festival days:', response.data);
        
        if (response.data.length > 0) {
          setFestivalDays(response.data);
          // Set the first day as selected by default
          setSelectedDay(response.data[0].date);
        }
        setInitialLoading(false);
      } catch (error) {
        console.error('Error fetching festival days:', error);
        setError('Failed to load festival days');
        setInitialLoading(false);
      }
    };

    fetchFestivalDays();
  }, []);

  // Fetch sets and user selections when selectedDay changes
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDay) return;
      
      // Check if we already have cached data for this day
      if (cachedSetsByDay[selectedDay] && cachedSelectionsByDay[selectedDay]) {
        // console.log('Using cached data for', selectedDay);
        setSets(cachedSetsByDay[selectedDay]);
        setUserSelections(cachedSelectionsByDay[selectedDay]);
        
        // Set the first stage as active by default
        if (cachedSetsByDay[selectedDay].length > 0) {
          const stages = [...new Set(cachedSetsByDay[selectedDay].map(set => set.stage))];
          
          if (stages.length > 0) {
            setActiveStage(stages[0]);
          }
          
          // Generate time slots
          const uniqueTimes = [...new Set(cachedSetsByDay[selectedDay].map(set => set.start_time))];
          const sortedTimes = uniqueTimes.sort((a, b) => new Date(a) - new Date(b));
          setTimeSlots(sortedTimes);
          
          // Always fetch attendee counts for better accuracy, even with cached data
          fetchAttendeeCounts(selectedDay);
        }
        
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const [setsResponse, selectionsResponse, attendeesResponse] = await Promise.all([
          axios.get(`${API_URL}/sets`, { 
            params: { date: selectedDay } 
          }),
          axios.get(`${API_URL}/users/${userId}/selections`, { 
            params: { date: selectedDay } 
          }),
          axios.get(`${API_URL}/sets/attendee-counts`, {
            params: { date: selectedDay }
          })
        ]);
        
        // Log the raw response data
        // console.log('API Response - Sets:', setsResponse.data);
        // console.log('API Response - User Selections:', selectionsResponse.data);
        // console.log('API Response - Attendee Counts:', attendeesResponse.data);
        
        // Sort sets by stage and time
        const sortedSets = setsResponse.data.sort((a, b) => {
          // First compare stage names
          if (a.stage < b.stage) return -1;
          if (a.stage > b.stage) return 1;
          
          // If same stage, compare by start time
          return new Date(a.start_time) - new Date(b.start_time);
        });
        
        // Cache the data
        setCachedSetsByDay(prev => ({
          ...prev,
          [selectedDay]: sortedSets
        }));
        
        setCachedSelectionsByDay(prev => ({
          ...prev,
          [selectedDay]: selectionsResponse.data
        }));
        
        setSets(sortedSets);
        setUserSelections(selectionsResponse.data);
        
        // Set attendee counts from the single endpoint
        setAttendeeCounts(attendeesResponse.data);
        
        // Set the first stage as active by default
        if (sortedSets.length > 0) {
          const stages = [...new Set(sortedSets.map(set => set.stage))];
          // console.log('Unique stages:', stages);
          
          if (stages.length > 0) {
            setActiveStage(stages[0]);
          }
          
          // Generate time slots
          const uniqueTimes = [...new Set(sortedSets.map(set => set.start_time))];
          const sortedTimes = uniqueTimes.sort((a, b) => new Date(a) - new Date(b));
          // console.log('Time slots:', sortedTimes.map(time => formatTimeOnly(time)));
          setTimeSlots(sortedTimes);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load festival sets');
        setLoading(false);
      }
    };

    if (!initialLoading) {
    fetchData();
    }
  }, [selectedDay, userId, initialLoading, cachedSetsByDay, cachedSelectionsByDay]);

  // Fetch attendee counts for all sets in a day with a single request
  const fetchAttendeeCounts = async (date) => {
    try {
      const response = await axios.get(`${API_URL}/sets/attendee-counts`, {
        params: { date }
      });
      console.log('Attendee counts response:', response.data);
      setAttendeeCounts(response.data);
    } catch (error) {
      console.error('Error fetching attendee counts:', error);
      // Set empty object as fallback
      setAttendeeCounts({});
    }
  };

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
        
        // Update local state
        setUserSelections(userSelections.filter(selection => selection.id !== setId));
        
        // Update cache
        if (selectedDay) {
          setCachedSelectionsByDay(prev => ({
            ...prev,
            [selectedDay]: prev[selectedDay]?.filter(selection => selection.id !== setId) || []
          }));
        }
        
        setActionFeedback({
          type: 'success',
          message: 'Removed from your schedule'
        });
        
        // Fetch updated attendee counts for all sets with a single request
        fetchAttendeeCounts(selectedDay);
        
        // If this set is currently selected and showing attendees, refresh the list
        if (selectedSet && selectedSet.id === setId) {
          fetchAttendees(setId);
        }
      } else {
        // Add selection
        await axios.post(`${API_URL}/selections`, { user_id: userId, set_id: setId });
        const setData = sets.find(s => s.id === setId);
        
        // Update local state
        setUserSelections([...userSelections, setData]);
        
        // Update cache
        if (selectedDay && setData) {
          setCachedSelectionsByDay(prev => ({
            ...prev,
            [selectedDay]: [...(prev[selectedDay] || []), setData]
          }));
        }
        
        setActionFeedback({
          type: 'success', 
          message: 'Added to your schedule'
        });
        
        // Fetch updated attendee counts for all sets with a single request
        fetchAttendeeCounts(selectedDay);
        
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
      setAttendees([]);
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

  const handleDaySelect = (date) => {
    setSelectedDay(date);
  };

  // Format datetime string to readable format
  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      // month: 'short', 
      // day: 'numeric',
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

  // Format time range (start to end)
  const formatTimeRange = (startTimeStr, endTimeStr) => {
    const startDate = new Date(startTimeStr);
    const endDate = new Date(endTimeStr);
    
    return `${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
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
    
    // console.log('Building time-based view with timeSlots:', timeSlots);
    
    timeSlots.forEach(timeSlot => {
      // Create a Date object from the timeSlot string
      const timeSlotDate = new Date(timeSlot);
      
      // Filter sets that match this time (using hours and minutes comparison)
      const setsAtTime = sets.filter(set => {
        const setDate = new Date(set.start_time);
        return setDate.getHours() === timeSlotDate.getHours() && 
               setDate.getMinutes() === timeSlotDate.getMinutes();
      });
      
      // console.log(`Sets at ${formatTimeOnly(timeSlot)}:`, setsAtTime.map(s => s.artist));
      
      if (setsAtTime.length > 0) {
        setsByTime[timeSlot] = setsAtTime;
      }
    });
    
    // console.log('Final setsByTime structure:', Object.keys(setsByTime).map(k => formatTimeOnly(k)));
    return setsByTime;
  };

  if (initialLoading) return <div className="text-center py-4">Loading festival days...</div>;
  if (loading) return <div className="text-center py-4">Loading sets...</div>;
  if (error) return <div className="text-center text-red-500 py-4">{error}</div>;

  // If viewing a specific user's profile
  if (viewingUserId) {
    return <UserProfile userId={viewingUserId} onBack={handleBackFromUserProfile} />;
  }

  // Create a compact card for mobile view
  const renderArtistCard = (set) => {
    const isArtistSelected = isSelected(set.id);
    const friendCount = parseInt(attendeeCounts[set.id] || 0);

  return (
      <div 
        key={set.id}
        onClick={() => handleSetClick(set)}
        className={`${theme.components.card.base} h-full flex flex-col ${
          isArtistSelected ? theme.components.card.selected : theme.components.card.unselected
        }`}
      >
        {/* Artist image section */}
        <div className="h-32 relative bg-gray-200">
          {set.image_url ? (
            <img 
              src={set.image_url} 
              alt={set.artist} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = "https://via.placeholder.com/100?text=" + encodeURIComponent(set.artist.charAt(0));
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-2xl font-bold">
              {set.artist.charAt(0)}
            </div>
          )}
        </div>
        
        <div className={theme.colors.secondary.light + " p-2 flex-grow"}>
          <h3 className="font-bold text-sm truncate">{set.artist}</h3>
          {viewMode === 'stage' ? (
            <div className="text-xs text-gray-600 mt-1">
              <p className="truncate">{formatTimeRange(set.start_time, set.end_time)}</p>
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
            className={`w-full ${theme.components.button.small} ${
              isArtistSelected
                ? theme.components.button.danger
                : theme.components.button.primary
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
    const friendCount = parseInt(attendeeCounts[set.id] || 0);
    
    return (
      <div 
        key={set.id}
        onClick={() => handleSetClick(set)}
        className={`${theme.components.card.base} ${
          isArtistSelected ? theme.components.card.selected : theme.components.card.unselected
        }`}
      >
        {/* Artist image section */}
        <div className="h-40 relative bg-gray-200">
          {set.image_url ? (
            <img 
              src={set.image_url} 
              alt={set.artist} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = "https://via.placeholder.com/200?text=" + encodeURIComponent(set.artist.charAt(0));
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-4xl font-bold">
              {set.artist.charAt(0)}
            </div>
          )}
        </div>
        
        <div className={theme.colors.secondary.light + " p-3 sm:p-4"}>
          <h3 className="font-bold text-base sm:text-lg truncate">{set.artist}</h3>
          {viewMode === 'stage' ? (
            <div className="text-xs sm:text-sm text-gray-600 mt-1">
              <p>Time: {formatTimeRange(set.start_time, set.end_time)}</p>
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
            className={`w-full ${theme.components.button.medium} ${
              isArtistSelected
                ? theme.components.button.danger
                : theme.components.button.primary
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
    const stageColorClass = getStageColorClass(set.stage);
    const friendCount = parseInt(attendeesCount);
    
    return (
      <div 
        onClick={() => handleSetClick(set)}
        className={`p-4 flex justify-between items-center cursor-pointer transition-colors duration-150 ${
          isArtistSelected ? theme.colors.primary.light : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center flex-grow">
          {/* Artist Image */}
          <div className="flex-shrink-0 mr-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
              {set.image_url ? (
                <img 
                  src={set.image_url} 
                  alt={set.artist} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "https://via.placeholder.com/100?text=" + encodeURIComponent(set.artist.charAt(0));
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                  {set.artist.charAt(0)}
                </div>
              )}
            </div>
          </div>
          
          {/* Artist Info */}
          <div className="flex-grow">
            <div className="font-medium text-base">{set.artist}</div>
            <div className="text-sm text-gray-600 mt-1">
              <span className={`${theme.components.tag.base} ${stageColorClass}`}>
                {set.stage}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-blue-600 whitespace-nowrap">
            {friendCount} {friendCount === 1 ? 'friend' : 'friends'}
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
          actionFeedback.type === 'success' ? theme.colors.success.standard : theme.colors.danger.standard
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
      
      {/* Integrated navigation controls */}
      {festivalDays.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            {/* Day selector as pills */}
            <div className="inline-flex rounded-md shadow-sm" role="group">
              {festivalDays.map(day => {
                // Extract just the weekday name from the label
                const weekdayName = day.label.split(',')[0];
                return (
                  <button
                    key={day.date}
                    onClick={() => handleDaySelect(day.date)}
                    className={`px-4 py-2 text-sm font-medium ${
                      festivalDays.indexOf(day) === 0 ? 'rounded-l-lg' : ''
                    } ${
                      festivalDays.indexOf(day) === festivalDays.length - 1 ? 'rounded-r-lg' : ''
                    } ${
                      selectedDay === day.date
                        ? theme.colors.primary.standard
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    } ${
                      festivalDays.indexOf(day) > 0 ? 'border-l-0' : ''
                    }`}
                  >
                    {weekdayName}
                  </button>
                );
              })}
            </div>
            
            {/* View toggle as pills */}
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => toggleViewMode('stage')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              viewMode === 'stage' 
                ? theme.colors.primary.standard
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            By Stage
          </button>
          <button
            onClick={() => toggleViewMode('time')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              viewMode === 'time' 
                ? theme.colors.primary.standard
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 border-l-0'
            }`}
          >
            By Time
          </button>
        </div>
      </div>
        </div>
      )}
      
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
                    ? `bg-white text-blue-600 border-b-2 ${theme.colors.primary.border} font-medium shadow-sm` 
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
        <p className="text-sm text-gray-500">No sets available for this day.</p>
      ) : viewMode === 'stage' ? (
        // Stage view
        filteredSets.length === 0 ? (
          <p className="text-sm text-gray-500">No sets for {activeStage}.</p>
        ) : (
          <>
                {/* Mobile view - 2 artists per row */}
                <div className="grid grid-cols-2 gap-2 sm:hidden">
              {filteredSets.map(set => (
                <div key={set.id}>
                  {renderArtistCard(set)}
                </div>
              ))}
                </div>
                
                {/* Tablet and desktop view */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
              {filteredSets.map(set => (
                <div key={set.id}>
                  {renderDesktopCard(set)}
                </div>
              ))}
              </div>
          </>
        )
      ) : (
        // Time view
        <div>
          {Object.keys(setsByTime).length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No scheduled sets found for this day.</p>
          ) : (
                <div className="bg-white rounded-lg shadow">
              {Object.entries(setsByTime)
                .sort(([timeA], [timeB]) => new Date(timeA) - new Date(timeB))
                .map(([timeSlot, setsAtTime], timeIndex) => (
                  <div key={timeSlot} className={timeIndex > 0 ? "mt-4" : ""}>
                    <div className={theme.components.time.header}>
                      {formatTimeOnly(timeSlot)}
                      </div>
                      <div className="border-l border-r border-gray-200 rounded-b-lg overflow-hidden">
                      {setsAtTime.map((set, setIndex) => {
                          const attendeesCount = attendeeCounts[set.id] || 0;
                          return (
                            <div key={set.id} className={setIndex > 0 ? "border-t border-gray-200" : ""}>
                              {renderTimeListItem(set, attendeesCount)}
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

export default SetList; 