//This page controls how a response is added to the MongoDB via Node & HTTPS Requests

document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const entryId = urlParams.get("id");
  
    if (entryId !== null) {
        // Edit Mode: Fetch the existing entry data
        fetch("http://localhost:3001/json")
            .then(response => response.json())
            .then(data => {
                const entry = data.responses.find(r => r._id === entryId);
  
                document.getElementById("entry-id").value = entryId; // Store index
                document.getElementById("title").value = entry.title;
                document.getElementById("content").innerHTML = entry.content;
                document.getElementById("tag").value = entry.tags.join(", "); // Convert array to string
            })
            .catch(error => console.error("Error fetching entry:", error));
    }
  
    // Handle form submission (Save)
    document.getElementById('add-response-form').addEventListener('submit', function (event) {
        event.preventDefault();
  
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').innerHTML;
        const tags = document.getElementById('tag').value
                     .split(",")
                     .map(tag => tag.trim()) 
                     .filter(tag => tag !== ""); 
  
        const entryId = document.getElementById("entry-id").value;
  
        if (entryId) {
          // Update existing entry
          fetch(`http://localhost:3001/json`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ id: entryId, title, content, tags }),
          })
          .then(response => {
              if (response.ok) {
                  console.log('Entry updated successfully.');
                  window.location.href = 'window.html';
              } else {
                  console.error('Failed to update entry.');
              }
          })
          .catch(error => console.error('Error:', error));
      } else {
          // Create new entry
          fetch(`http://localhost:3001/json`, {
              method: 'POST', // Use POST for new entries
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ title, content, tags }),
          })
          .then(response => {
              if (response.ok) {
                  console.log('New entry created successfully.');
                  window.location.href = 'window.html';
              } else {
                  console.error('Failed to create new entry.');
              }
          })
          .catch(error => console.error('Error:', error));
      }
    });
  
    // Handle Delete Button Click
    document.getElementById('delete-button').addEventListener('click', function () {
        const entryId = document.getElementById("entry-id").value;
        if (!entryId) return; // No entry to delete
  
        if (confirm("Are you sure you want to delete this entry?")) {
            fetch(`http://localhost:3001/json`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: entryId }),
            })
            .then(response => {
                if (response.ok) {
                    console.log('Entry deleted successfully.');
                    window.location.href = 'window.html'; // Go back to the main view
                } else {
                    console.error('Failed to delete entry.');
                }
            })
            .catch(error => console.error('Error:', error));
        }
    });
  });