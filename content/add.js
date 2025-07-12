// add.js
// ---------
// Purpose: Handles the add/edit/delete form logic for responses. Interacts with backend via HTTP requests to save, update, or delete entries from MongoDB.

document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const entryId = urlParams.get("id");
  
    // ===== Edit Mode =====
    // If editing an existing entry, fetches the entry and populates the form fields
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
                  // After save or delete, return to window.html with a marker
                  window.location.href = 'window.html?fromEdit=1'; 
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
                  // After save or delete, return to window.html with a marker
                  window.location.href = 'window.html?fromEdit=1';   
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
                    // After save or delete, return to window.html with a marker
                  window.location.href = 'window.html?fromEdit=1'; 
                } else {
                    console.error('Failed to delete entry.');
                }
            })
            .catch(error => console.error('Error:', error));
        }
    });

    fetchAllTags().then(allTags => {
  return suggestTagsForContent(contentText, allTags);
}).then(suggestedTags => {
  document.getElementById("tag").value = suggestedTags.join(", ");
});

        const suggestBtn = document.getElementById("suggest-tags-btn");
    if (suggestBtn) {
        suggestBtn.addEventListener("click", async function () {
    const contentDiv = document.getElementById("content");
    const contentText = contentDiv ? contentDiv.innerText : "";

    // 1. Fetch all tags
    const allTags = await fetchAllTags();

    // 2. Ask your server for suggested tags
    suggestBtn.disabled = true;
    suggestBtn.textContent = "Suggesting...";
    try {
        const suggestedTags = await suggestTagsForContent(contentText, allTags);
        // 3. Fill the tag input with the suggested tags (comma separated)
        document.getElementById("tag").value = suggestedTags.join(", ");
    } catch (err) {
        alert("Failed to get tag suggestions: " + (err.message || err));
    }
    suggestBtn.disabled = false;
    suggestBtn.textContent = "Suggest";
});
    }
  });