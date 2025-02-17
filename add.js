document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const entryIndex = urlParams.get("index");

  if (entryIndex !== null) {
      // Edit Mode: Fetch the existing entry data
      fetch("http://localhost:3000/json")
          .then(response => response.json())
          .then(data => {
              const entry = data.responses[entryIndex];

              document.getElementById("entry-index").value = entryIndex; // Store index
              document.getElementById("title").value = entry.title;
              document.getElementById("content").innerHTML = entry.content;
              document.getElementById("tag").value = entry.tags.join(", "); // Convert array to string
          })
          .catch(error => console.error("Error fetching entry:", error));
  }
});

document.getElementById('add-response-form').addEventListener('submit', function (event) {
  event.preventDefault();

  const title = document.getElementById('title').value;
  const content = document.getElementById('content').innerHTML;
  const tags = document.getElementById('tag').value
               .split(",") // Convert input to an array
               .map(tag => tag.trim()) 
               .filter(tag => tag !== ""); 

  const entryIndex = document.getElementById("entry-index").value; // Get index if editing

  if (entryIndex) {
      // Update existing entry
      fetch(`http://localhost:3000/json`, {
          method: 'PUT', // Use PUT for updating
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ index: entryIndex, title, content, tags }),
      })
      .then(response => {
          if (response.ok) {
              console.log('Entry updated successfully.');
              window.location.href = 'window.html'; // Navigate back
          } else {
              console.error('Failed to update entry.');
          }
      })
      .catch(error => console.error('Error:', error));
  } else {
      // Create new entry
      fetch('http://localhost:3000/json', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, content, tags }),
      })
      .then(response => {
          if (response.ok) {
              console.log('Entry created successfully.');
              window.location.href = 'window.html'; // Navigate back
          } else {
              console.error('Failed to create entry.');
          }
      })
      .catch(error => console.error('Error:', error));
  }
});