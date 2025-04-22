import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function UserList({ onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/users`, { name: newUserName });
      setUsers([...users, response.data]);
      setNewUserName('');
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to create user');
    }
  };

  if (loading) return <div className="text-center py-4">Loading users...</div>;
  if (error) return <div className="text-center text-red-500 py-4">{error}</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Select or Create Profile</h2>
      
      <form onSubmit={handleCreateUser} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="Enter your name"
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button 
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Profile
          </button>
        </div>
      </form>
      
      <h3 className="font-medium mb-2">Existing Profiles</h3>
      {users.length === 0 ? (
        <p className="text-gray-500">No profiles yet. Create one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {users.map(user => (
            <div 
              key={user.id}
              onClick={() => onSelectUser(user)}
              className="bg-gray-100 p-3 rounded cursor-pointer hover:bg-gray-200 transition"
            >
              <p className="font-medium">{user.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserList; 