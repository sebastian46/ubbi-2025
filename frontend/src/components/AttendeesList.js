import React from 'react';

function AttendeesList({ attendees, loading, onUserClick }) {
  return (
    <div>
      <h4 className="text-sm sm:text-base font-medium mb-2">Who's Going:</h4>
      {loading ? (
        <p className="text-sm dark:text-gray-300">Loading attendees...</p>
      ) : attendees.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No one has selected this set yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {attendees.map(user => (
            <div 
              key={user.id} 
              className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-center hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 cursor-pointer transition-colors duration-200"
              onClick={(e) => onUserClick(user.id, e)}
            >
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">View profile</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AttendeesList; 