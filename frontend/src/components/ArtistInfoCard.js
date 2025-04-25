import React, { useEffect } from 'react';
import AttendeesList from './AttendeesList';

function ArtistInfoCard({ 
  artistSet, 
  attendees, 
  attendeesLoading, 
  onClose, 
  onUserClick, 
  formatDateTime 
}) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Close modal when clicking outside or pressing Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-bold truncate pr-2">Artist Profile</h3>
          <button 
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 focus:outline-none"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            {artistSet.image_url && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-4 flex-shrink-0">
                <img 
                  src={artistSet.image_url} 
                  alt={artistSet.artist} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "https://via.placeholder.com/100?text=" + encodeURIComponent(artistSet.artist.charAt(0));
                  }}
                />
              </div>
            )}
            <div>
              <h4 className="text-lg font-bold">{artistSet.artist}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stage: {artistSet.stage}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Start: {formatDateTime(artistSet.start_time)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">End: {formatDateTime(artistSet.end_time)}</p>
            </div>
          </div>
          
          {artistSet.description && (
            <p className="mt-3 text-sm sm:text-base">{artistSet.description}</p>
          )}
        </div>
        
        <div className="p-4">
          <AttendeesList
            attendees={attendees}
            loading={attendeesLoading}
            onUserClick={onUserClick}
          />
        </div>
      </div>
    </div>
  );
}

export default ArtistInfoCard; 