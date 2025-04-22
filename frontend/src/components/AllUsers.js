import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserProfile from './UserProfile';

const API_URL = process.env.REACT_APP_API_URL || 'https://ubbi.fromseb.com:5000/api';

function AllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/users`);
        setUsers(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleViewProfile = (userId) => {
    setSelectedUserId(userId);
  };

  const handleBackToList = () => {
    setSelectedUserId(null);
  };

  if (loading) return <div className="text-center py-4">Loading users...</div>;
  if (error) return <div className="text-center text-red-500 py-4">{error}</div>;

  if (selectedUserId) {
    return <UserProfile userId={selectedUserId} onBack={handleBackToList} />;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">All Festival Attendees</h2>
      
      {users.length === 0 ? (
        <p className="text-gray-500">No users yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {users.map(user => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewProfile(user.id)}
            >
              <div className="p-4">
                <h3 className="font-medium text-lg">{user.name}</h3>
                <p className="text-sm text-blue-600 mt-2">View schedule</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AllUsers; 