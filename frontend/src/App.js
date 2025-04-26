import React, { useState, useEffect } from 'react';
import UserList from './components/UserList';
import SetList from './components/SetList';
import UserSelections from './components/UserSelections';
import AllUsers from './components/AllUsers';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    // Initialize from localStorage if available
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [activeTab, setActiveTab] = useState('sets');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Effect to initialize dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  // Save user to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);
  
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };
  
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setShowLogoutConfirm(false);
  };
  
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  
  // Handle setting the current user including persisting it
  const handleSelectUser = (user) => {
    setCurrentUser(user);
  };
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-white">
      <header className="bg-blue-600 dark:bg-gray-800 text-white p-3 sm:p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold">Festival Organizer</h1>
            <div className="flex items-center">
              {currentUser && (
                <>
                  <p className="text-sm sm:text-base mr-3 hidden sm:block">Welcome, {currentUser.name}</p>
                  <button
                    onClick={handleLogoutClick}
                    className="px-2 py-1 sm:px-4 sm:py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 active:bg-red-700 mr-2"
                  >
                    Logout
                  </button>
                </>
              )}
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-full ${
                  darkMode 
                    ? 'bg-blue-500 hover:bg-blue-600 text-yellow-300' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
          {currentUser && (
            <p className="mt-1 text-sm sm:hidden">Welcome, {currentUser.name}</p>
          )}
        </div>
      </header>
      
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Are you sure you want to log out, {currentUser.name}?
            </h3>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 active:bg-red-700"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
      
      <main className="container mx-auto p-3 sm:p-4">
        {!currentUser ? (
          <div className="max-w-md mx-auto mt-4 sm:mt-8">
            <UserList onSelectUser={handleSelectUser} />
          </div>
        ) : (
          <div className="mt-2 sm:mt-4">
            {/* Mobile navigation tabs */}
            <div className="flex overflow-x-auto pb-2 mb-3 sm:hidden">
              <button
                onClick={() => setActiveTab('sets')}
                className={`px-3 py-2 rounded-t mr-1 text-sm whitespace-nowrap ${
                  activeTab === 'sets' 
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-medium' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                All Sets
              </button>
              <button
                onClick={() => setActiveTab('mySelections')}
                className={`px-3 py-2 rounded-t mr-1 text-sm whitespace-nowrap ${
                  activeTab === 'mySelections' 
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-medium' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                My Selections
              </button>
              <button
                onClick={() => setActiveTab('allUsers')}
                className={`px-3 py-2 rounded-t text-sm whitespace-nowrap ${
                  activeTab === 'allUsers' 
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-medium' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                All Friends
              </button>
            </div>
            
            {/* Desktop navigation and logout */}
            <div className="hidden sm:flex justify-between items-center mb-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('sets')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'sets' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-gray-200'
                  }`}
                >
                  Festival Sets
                </button>
                <button
                  onClick={() => setActiveTab('mySelections')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'mySelections' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-gray-200'
                  }`}
                >
                  My Selections
                </button>
                <button
                  onClick={() => setActiveTab('allUsers')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'allUsers' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-gray-200'
                  }`}
                >
                  All Friends
                </button>
              </div>
            </div>
            
            {/* Keep components mounted but hidden when inactive */}
            <div style={{ display: activeTab === 'sets' ? 'block' : 'none' }}>
              <SetList userId={currentUser.id} isVisible={activeTab === 'sets'} />
            </div>
            
            <div style={{ display: activeTab === 'mySelections' ? 'block' : 'none' }}>
              <UserSelections userId={currentUser.id} isVisible={activeTab === 'mySelections'} />
            </div>
            
            <div style={{ display: activeTab === 'allUsers' ? 'block' : 'none' }}>
              <AllUsers />
            </div>
          </div>
        )}
      </main>

      {/* Mobile fixed bottom navigation */}
      {currentUser && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around z-10">
          <button
            onClick={() => setActiveTab('sets')}
            className={`flex-1 py-3 text-xs ${
              activeTab === 'sets' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Festival Sets
          </button>
          <button
            onClick={() => setActiveTab('mySelections')}
            className={`flex-1 py-3 text-xs ${
              activeTab === 'mySelections' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            My Selections
          </button>
          <button
            onClick={() => setActiveTab('allUsers')}
            className={`flex-1 py-3 text-xs ${
              activeTab === 'allUsers' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            All Friends
          </button>
        </div>
      )}

      {/* Add padding at the bottom on mobile to account for fixed navigation */}
      {currentUser && (
        <div className="h-12 sm:hidden"></div>
      )}
    </div>
  );
}

export default App; 