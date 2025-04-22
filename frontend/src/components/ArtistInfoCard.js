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
        className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-bold truncate pr-2">{artistSet.artist}</h3>
          <button 
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 focus:outline-none"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <p className="text-sm sm:text-base mb-2"><span className="font-medium">Stage:</span> {artistSet.stage}</p>
            <p className="text-sm sm:text-base mb-2"><span className="font-medium">Start:</span> {formatDateTime(artistSet.start_time)}</p>
            <p className="text-sm sm:text-base mb-2"><span className="font-medium">End:</span> {formatDateTime(artistSet.end_time)}</p>
            {artistSet.description && (
              <p className="mt-3 text-sm sm:text-base">{artistSet.description}</p>
            )}
          </div>
          
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