import React, { useState } from 'react';
import UserList from './components/UserList';
import SetList from './components/SetList';
import UserSelections from './components/UserSelections';
import AllUsers from './components/AllUsers';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('sets');
  
  const handleLogout = () => {
    setCurrentUser(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-3 sm:p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold">Festival Organizer</h1>
            {currentUser && (
              <div className="flex items-center">
                <p className="text-sm sm:text-base mr-3 hidden sm:block">Welcome, {currentUser.name}</p>
                <button
                  onClick={handleLogout}
                  className="px-2 py-1 sm:px-4 sm:py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 active:bg-red-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
          {currentUser && (
            <p className="mt-1 text-sm sm:hidden">Welcome, {currentUser.name}</p>
          )}
        </div>
      </header>
      
      <main className="container mx-auto p-3 sm:p-4">
        {!currentUser ? (
          <div className="max-w-md mx-auto mt-4 sm:mt-8">
            <UserList onSelectUser={setCurrentUser} />
          </div>
        ) : (
          <div className="mt-2 sm:mt-4">
            {/* Mobile navigation tabs */}
            <div className="flex overflow-x-auto pb-2 mb-3 sm:hidden">
              <button
                onClick={() => setActiveTab('sets')}
                className={`px-3 py-2 rounded-t mr-1 text-sm whitespace-nowrap ${
                  activeTab === 'sets' 
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600 font-medium' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Festival Sets
              </button>
              <button
                onClick={() => setActiveTab('mySelections')}
                className={`px-3 py-2 rounded-t mr-1 text-sm whitespace-nowrap ${
                  activeTab === 'mySelections' 
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600 font-medium' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                My Selections
              </button>
              <button
                onClick={() => setActiveTab('allUsers')}
                className={`px-3 py-2 rounded-t text-sm whitespace-nowrap ${
                  activeTab === 'allUsers' 
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600 font-medium' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                All Attendees
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
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Festival Sets
                </button>
                <button
                  onClick={() => setActiveTab('mySelections')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'mySelections' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  My Selections
                </button>
                <button
                  onClick={() => setActiveTab('allUsers')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'allUsers' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  All Attendees
                </button>
              </div>
            </div>
            
            {/* Keep components mounted but hidden when inactive */}
            <div style={{ display: activeTab === 'sets' ? 'block' : 'none' }}>
              <SetList userId={currentUser.id} />
            </div>
            
            <div style={{ display: activeTab === 'mySelections' ? 'block' : 'none' }}>
              <UserSelections userId={currentUser.id} />
            </div>
            
            <div style={{ display: activeTab === 'allUsers' ? 'block' : 'none' }}>
              <AllUsers />
            </div>
          </div>
        )}
      </main>

      {/* Mobile fixed bottom navigation */}
      {currentUser && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around z-10">
          <button
            onClick={() => setActiveTab('sets')}
            className={`flex-1 py-3 text-xs ${activeTab === 'sets' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            Festival Sets
          </button>
          <button
            onClick={() => setActiveTab('mySelections')}
            className={`flex-1 py-3 text-xs ${activeTab === 'mySelections' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            My Selections
          </button>
          <button
            onClick={() => setActiveTab('allUsers')}
            className={`flex-1 py-3 text-xs ${activeTab === 'allUsers' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            All Attendees
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