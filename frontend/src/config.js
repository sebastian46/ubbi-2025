// Central configuration file with diagnostics
const config = {
  // Use the environment variable instead of hardcoding to "/api"
  API_URL: process.env.REACT_APP_API_URL || "/api"
};

// Print the API URL to the console for debugging
// console.log('Environment variables available:', {
//   NODE_ENV: process.env.NODE_ENV,
//   REACT_APP_API_URL: process.env.REACT_APP_API_URL
// });
// console.log('Using API URL:', config.API_URL);

export default config; 