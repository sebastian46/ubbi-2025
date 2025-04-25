import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import UserProfile from './UserProfile';
import ArtistInfoCard from './ArtistInfoCard';

const API_URL = process.env.REACT_APP_API_URL || 'https://ubbi.fromseb.com:5000/api';

// Simple theme object to centralize styling
const theme = {
  colors: {
    primary: {
      light: 'bg-blue-50 dark:bg-blue-900/30 dark:text-blue-200',
      medium: 'bg-blue-100 text-blue-600 dark:bg-blue-800/50 dark:text-blue-300',
      standard: 'bg-blue-600 text-white',
      hover: 'hover:bg-blue-700',
      active: 'active:bg-blue-800',
      border: 'border-blue-600 dark:border-blue-500'
    },
    secondary: {
      light: 'bg-gray-50 dark:bg-gray-800',
      medium: 'bg-gray-100 dark:bg-gray-700',
      standard: 'bg-gray-600 dark:bg-gray-500',
      hover: 'hover:bg-gray-700 dark:hover:bg-gray-600', 
      border: 'border-gray-200 dark:border-gray-700'
    },
    success: {
      light: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      standard: 'bg-green-600 text-white',
      hover: 'hover:bg-green-700'
    },
    danger: {
      light: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
      medium: 'bg-red-200 dark:bg-red-800/40',
      standard: 'bg-red-500 text-white',
      hover: 'hover:bg-red-600',
      active: 'active:bg-red-700'
    }
  },
  stages: {
    "Ubbi's Stage": 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    "Zoom Room": 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    "Dubbi's Stage": 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  components: {
    card: {
      base: 'border rounded-lg overflow-hidden shadow cursor-pointer',
      selected: 'border-blue-500 border-2 dark:border-blue-400',
      unselected: 'border-gray-200 dark:border-gray-700'
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
      header: 'sticky top-0 py-3 px-4 bg-purple-900 dark:bg-purple-950 text-white font-semibold z-10 shadow-sm'
    }
  }
};

// Helper function to get stage color classes
const getStageColorClass = (stageName) => {
  return theme.stages[stageName] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

function SetList({ userId, isVisible }) {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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
        
        // Only set the first stage as active by default if no active stage is set
        if (cachedSetsByDay[selectedDay].length > 0) {
          const stages = [...new Set(cachedSetsByDay[selectedDay].map(set => set.stage))];
          
          if (stages.length > 0 && !activeStage) {
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
          
          // Only set the first stage as active when:
          // 1. There's no active stage already set, or
          // 2. The selected day has changed (we know this because we're not using cached data)
          if (stages.length > 0 && (!activeStage || !cachedSetsByDay[selectedDay])) {
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
  }, [selectedDay, userId, initialLoading, cachedSetsByDay, cachedSelectionsByDay, activeStage]);

  // Fetch attendee counts for all sets in a day with a single request
  const fetchAttendeeCounts = useCallback(async (date) => {
    try {
      const response = await axios.get(`${API_URL}/sets/attendee-counts`, {
        params: { date }
      });
      // console.log('Attendee counts response:', response.data);
      setAttendeeCounts(response.data);
    } catch (error) {
      console.error('Error fetching attendee counts:', error);
      // Set empty object as fallback
      setAttendeeCounts({});
    }
  }, []);

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
        
        // Fetch fresh user selections data instead of manually updating state
        await fetchUserSelections();
        
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
        
        // Fetch fresh user selections data instead of manually updating state
        await fetchUserSelections();
        
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
    // Reset the active stage when explicitly changing days
    // if (date !== selectedDay) {
    //   setActiveStage(null);
    // }
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

  // Function to fetch just the user selections
  const fetchUserSelections = useCallback(async () => {
    if (!selectedDay || !userId) return;
    
    try {
      const response = await axios.get(`${API_URL}/users/${userId}/selections`, {
        params: { date: selectedDay }
      });
      
      // Update state with the fresh data
      setUserSelections(response.data);
      
      // Update the cache
      setCachedSelectionsByDay(prev => ({
        ...prev,
        [selectedDay]: response.data
      }));
      
    } catch (error) {
      console.error('Error fetching user selections:', error);
    }
  }, [userId, selectedDay]);

  // Fetch user selections when the tab becomes visible
  useEffect(() => {
    if (isVisible && selectedDay && !initialLoading) {
      fetchUserSelections();
      fetchAttendeeCounts(selectedDay);
    }
  }, [isVisible, selectedDay, initialLoading, fetchUserSelections, fetchAttendeeCounts]);

  // Add handler for document visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && selectedDay) {
        fetchUserSelections();
        fetchAttendeeCounts(selectedDay);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedDay, fetchUserSelections, fetchAttendeeCounts]);

  // Function to handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsSearching(value.trim() !== '');
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
  };

  // Filter sets based on search term
  const getSearchResults = () => {
    if (!searchTerm.trim()) return [];
    
    const normalizedSearch = searchTerm.toLowerCase().trim();
    return sets.filter(set => 
      set.artist.toLowerCase().includes(normalizedSearch)
    );
  };

  if (initialLoading) return <div className="text-center py-4 dark:text-gray-300">Loading festival days...</div>;
  if (loading) return <div className="text-center py-4 dark:text-gray-300">Loading sets...</div>;
  if (error) return <div className="text-center text-red-500 dark:text-red-400 py-4">{error}</div>;

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
        <div className="h-32 relative bg-gray-200 dark:bg-gray-700">
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
            <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-2xl font-bold">
              {set.artist.charAt(0)}
            </div>
          )}
        </div>
        
        <div className={theme.colors.secondary.light + " p-2 flex-grow"}>
          <h3 className="font-bold text-sm truncate">{set.artist}</h3>
          {viewMode === 'stage' ? (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              <p className="truncate">{formatTimeRange(set.start_time, set.end_time)}</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {friendCount} {friendCount === 1 ? 'friend' : 'friends'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              <p className="truncate">{set.stage}</p>
            </div>
          )}
        </div>
        
        <div className="p-1 bg-white dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
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
        <div className="h-40 relative bg-gray-200 dark:bg-gray-700">
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
            <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-4xl font-bold">
              {set.artist.charAt(0)}
            </div>
          )}
        </div>
        
        <div className={theme.colors.secondary.light + " p-3 sm:p-4"}>
          <h3 className="font-bold text-base sm:text-lg truncate">{set.artist}</h3>
          {viewMode === 'stage' ? (
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              <p>Time: {formatTimeRange(set.start_time, set.end_time)}</p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {friendCount} {friendCount === 1 ? 'friend' : 'friends'} attending
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              <p>Stage: {set.stage}</p>
            </div>
          )}
        </div>
          
        <div className="p-2 sm:p-3 bg-white dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
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
          isArtistSelected 
            ? theme.colors.primary.light 
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
      >
        <div className="flex items-center flex-grow">
          {/* Artist Image */}
          <div className="flex-shrink-0 mr-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
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
                <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold">
                  {set.artist.charAt(0)}
                </div>
              )}
            </div>
          </div>
          
          {/* Artist Info */}
          <div className="flex-grow">
            <div className="font-medium text-base">{set.artist}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              <span className={`${theme.components.tag.base} ${stageColorClass}`}>
                {set.stage}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
            {friendCount} {friendCount === 1 ? 'friend' : 'friends'}
          </div>
          
          <div>
            {isSelected(set.id) ? (
              <button
                onClick={(e) => handleToggleSelection(set.id, e)}
                className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-800/40 active:bg-red-300 font-medium transition-colors duration-150"
              >
                Remove
              </button>
            ) : (
              <button
                onClick={(e) => handleToggleSelection(set.id, e)}
                className="px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/40 active:bg-blue-300 font-medium transition-colors duration-150"
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
  const searchResults = isSearching ? getSearchResults() : [];

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
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
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
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                }`}
              >
                By Stage
              </button>
              <button
                onClick={() => toggleViewMode('time')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  viewMode === 'time' 
                    ? theme.colors.primary.standard
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 border-l-0'
                }`}
              >
                By Time
              </button>
            </div>
          </div>
          
          {/* Search bar */}
          <div className="mt-3 mb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search artists..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Clear search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Stage selector tabs - only show in stage view and not when searching */}
      {viewMode === 'stage' && !isSearching && (
        <div className="mb-4 overflow-x-auto">
          <div className="flex space-x-2 pb-1">
            {stages.map(stage => (
              <button
                key={stage}
                onClick={() => handleStageSelect(stage)}
                className={`px-3 py-2 text-sm whitespace-nowrap rounded-t ${
                  activeStage === stage 
                    ? `bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 ${theme.colors.primary.border} font-medium shadow-sm` 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500'
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Search results */}
      {isSearching ? (
        <div>
          {searchResults.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
              <p className="text-gray-500 dark:text-gray-400">No artists match your search.</p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">Found {searchResults.length} artist{searchResults.length !== 1 ? 's' : ''}</p>
              
              {/* Mobile view for search results - always show stage, time, and friend count */}
              <div className="grid grid-cols-1 sm:hidden gap-2">
                {searchResults.map(set => {
                  const isArtistSelected = isSelected(set.id);
                  const friendCount = parseInt(attendeeCounts[set.id] || 0);
                  
                  return (
                    <div 
                      key={set.id}
                      onClick={() => handleSetClick(set)}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex p-3">
                        <div className="w-16 h-16 flex-shrink-0 bg-gray-200 dark:bg-gray-700 mr-3">
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
                            <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold">
                              {set.artist.charAt(0)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-grow">
                          <h3 className="font-bold text-sm">{set.artist}</h3>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            <p>{set.stage}</p>
                            <p>{formatTimeRange(set.start_time, set.end_time)}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                              {friendCount} {friendCount === 1 ? 'friend' : 'friends'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="ml-2 flex items-start">
                          <button 
                            onClick={(e) => handleToggleSelection(set.id, e)}
                            className={`px-2 py-1 text-xs rounded-full ${
                              isArtistSelected
                                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/40"
                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/40"
                            }`}
                          >
                            {isArtistSelected ? 'Remove' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Desktop view for search results */}
              <div className="hidden sm:block">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {searchResults.map(set => {
                      const isArtistSelected = isSelected(set.id);
                      const friendCount = parseInt(attendeeCounts[set.id] || 0);
                      
                      return (
                        <div 
                          key={set.id}
                          onClick={() => handleSetClick(set)}
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                        >
                          <div className="flex items-center">
                            {set.image_url && (
                              <div className="w-12 h-12 mr-4 flex-shrink-0 overflow-hidden rounded-lg">
                                <img 
                                  src={set.image_url} 
                                  alt={set.artist} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null; 
                                    e.target.src = "https://via.placeholder.com/100?text=" + encodeURIComponent(set.artist.charAt(0));
                                  }}
                                />
                              </div>
                            )}
                            
                            <div className="flex-grow">
                              <h3 className="font-medium text-base">{set.artist}</h3>
                              <div className="flex flex-wrap items-center mt-1 gap-3">
                                <span className={`${theme.components.tag.base} ${getStageColorClass(set.stage)}`}>
                                  {set.stage}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatTimeRange(set.start_time, set.end_time)}
                                </span>
                                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                  {friendCount} {friendCount === 1 ? 'friend' : 'friends'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="ml-4">
                              <button
                                onClick={(e) => handleToggleSelection(set.id, e)}
                                className={`px-3 py-1.5 text-sm rounded-full ${
                                  isArtistSelected
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/40 active:bg-red-300 dark:active:bg-red-700/50"
                                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/40 active:bg-blue-300 dark:active:bg-blue-700/50"
                                } font-medium transition-colors duration-150`}
                              >
                                {isArtistSelected ? 'Remove' : 'Add'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : sets.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No sets available for this day.</p>
      ) : viewMode === 'stage' ? (
        // Stage view
        filteredSets.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No sets for {activeStage}.</p>
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
            <p className="p-4 text-sm text-gray-500 dark:text-gray-400">No scheduled sets found for this day.</p>
          ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              {Object.entries(setsByTime)
                .sort(([timeA], [timeB]) => new Date(timeA) - new Date(timeB))
                .map(([timeSlot, setsAtTime], timeIndex) => (
                  <div key={timeSlot} className={timeIndex > 0 ? "mt-4" : ""}>
                    <div className={theme.components.time.header}>
                      {formatTimeOnly(timeSlot)}
                      </div>
                      <div className="border-l border-r border-gray-200 dark:border-gray-700 rounded-b-lg overflow-hidden">
                      {setsAtTime.map((set, setIndex) => {
                          const attendeesCount = attendeeCounts[set.id] || 0;
                          return (
                            <div key={set.id} className={setIndex > 0 ? "border-t border-gray-200 dark:border-gray-700" : ""}>
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