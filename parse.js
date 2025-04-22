const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');

// Read the HTML file
const htmlFilePath = 'Lineup - Ubbi Dubbi Festival 2025.html';
const outputCsvPath = 'parsed.csv';

try {
  console.log(`Reading file: ${htmlFilePath}`);
  const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
  
  // Parse the HTML content
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;
  
  // Find the schedule tab
  const scheduleTab = document.getElementById('schedule_tab');
  if (!scheduleTab) {
    throw new Error('Could not find schedule_tab element');
  }
  
  // Find the schedule-artists section
  const scheduleArtists = scheduleTab.querySelector('.schedule-artists');
  if (!scheduleArtists) {
    throw new Error('Could not find schedule-artists element');
  }
  
  // Extract data for both days
  const day1 = scheduleArtists.querySelector('#day1saturday');
  const day2 = scheduleArtists.querySelector('#day2sunday');
  
  if (!day1 || !day2) {
    throw new Error('Could not find day1saturday or day2sunday elements');
  }
  
  // Function to format artist name in proper case
  function toProperCase(name) {
    // Remove any HTML tags and handle special cases
    name = name.replace(/SPAN|FONT-BOLD/g, '').trim();
    
    // Handle special cases for artists with stylized names
    const specialCases = {
      'B2B': 'B2B'      // Keep uppercase for abbreviation
    };
    
    // Check if the name matches any special cases exactly
    if (specialCases[name]) {
      return specialCases[name];
    }
    
    // Split the name into words
    return name.split(' ')
      .map(word => {
        // Check if this word is a special case
        if (specialCases[word]) {
          return specialCases[word];
        }
        // Otherwise apply proper case (first letter caps, rest lower)
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
  
  // Function to extract artist data
  function extractArtistData(dayElement, dayName) {
    const artists = [];
    
    // Find all stage sections
    const stageSections = dayElement.querySelectorAll('.stage-section');
    
    stageSections.forEach(stageSection => {
      // Find all artist boxes
      const artistBoxes = stageSection.querySelectorAll('.performance-artist-box');
      
      artistBoxes.forEach(artistBox => {
        // Extract artist data
        const artistData = artistBox.querySelector('.performance-artist-data');
        if (!artistData) return;
        
        // Extract artist name
        const artistTitle = artistData.querySelector('.performance-artist-title');
        const artistName = artistTitle ? 
          artistTitle.textContent.trim().replace(/\s+/g, ' ') : 'Unknown Artist';
        
        // Extract stage directly from the artist data
        const stageElement = artistData.querySelector('.performance-artist-stage');
        const stageName = stageElement ? 
          stageElement.textContent.trim() : 'Unknown Stage';
        
        // Extract time
        const timeElement = artistData.querySelector('.performance-artist-time');
        let startTime = '';
        let endTime = '';
        
        if (timeElement) {
          const timeText = timeElement.textContent.trim();
          const timeParts = timeText.split('-').map(t => t.trim());
          
          if (timeParts.length === 2) {
            startTime = timeParts[0];
            endTime = timeParts[1];
          }
        }
        
        // Extract image URL if it exists
        let imageUrl = '';
        const thumbnailElement = artistBox.querySelector('.artist-thumbnail-item img');
        if (thumbnailElement && thumbnailElement.src) {
          imageUrl = thumbnailElement.src;
        }
        
        // Create artist entry
        const artistEntry = {
          artist: toProperCase(artistName),
          stage: stageName,
          start_time: startTime,
          end_time: endTime,
          day: dayName,
          image_url: imageUrl
        };
        
        // Clean up the data
        Object.keys(artistEntry).forEach(key => {
          if (key !== 'image_url') { // Don't modify URLs with the text cleanup
            artistEntry[key] = artistEntry[key]
              .replace(/[""'']/g, '')
              .replace(/\s+/g, ' ')
              .trim();
          }
        });
        
        artists.push(artistEntry);
      });
    });
    
    return artists;
  }
  
  // Extract artist data from both days
  const day1Artists = extractArtistData(day1, 'Saturday');
  const day2Artists = extractArtistData(day2, 'Sunday');
  
  // Combine artist data
  const allArtists = [...day1Artists, ...day2Artists];
  
  // Create CSV content
  const headers = ['artist', 'stage', 'start_time', 'end_time', 'day', 'image_url'];
  const csvContent = [
    // Headers
    headers.join(','),
    // Data rows
    ...allArtists.map(artist => 
      headers.map(header => 
        // Wrap values in quotes to handle commas in data
        `"${artist[header] || ''}"`
      ).join(',')
    )
  ].join('\n');
  
  // Write to CSV file
  fs.writeFileSync(outputCsvPath, csvContent, 'utf-8');
  
  console.log(`Successfully extracted ${allArtists.length} artists (${day1Artists.length} on Saturday, ${day2Artists.length} on Sunday)`);
  console.log(`Data saved to ${outputCsvPath}`);
  
} catch (error) {
  console.error('Error parsing HTML:', error.message);
  if (error.code === 'ENOENT') {
    console.error(`File not found: ${htmlFilePath}`);
    console.error('Make sure the file exists in the correct location.');
  }
}
