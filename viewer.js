document.addEventListener("DOMContentLoaded", () => {
  const contentDiv = document.getElementById("content");
  const addButton = document.getElementById("add-button");
  const tagSearch = document.getElementById("tag-search"); // Get search input field

  let allResponses = []; // Store all responses for filtering

  addButton.addEventListener("click", () => {
    window.location.href = "add.html";
  });

  function formatText(text) {
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+|mailto:[^\)]+)\)/g;
    text = text.replace(linkRegex, (match, displayText, url) => {
      return `<a href="${url}" target="_blank">${displayText}</a>`;
    });

    const boldRegex = /\*\*([^\*]+)\*\*/g;
    text = text.replace(boldRegex, (match, boldText) => {
      return `<strong>${boldText}</strong>`;
    });

    return text;
  }

  function renderResponses(responses) {
    contentDiv.innerHTML = ""; // Clear previous content

    responses.forEach((entry, index) => {
        const entryDiv = document.createElement("div");
        entryDiv.className = "entry";

        const title = document.createElement("div");
        title.className = "title";
        title.textContent = entry.title;

        const content = document.createElement("div");
        content.className = "content";
        content.innerHTML = formatText(entry.content);

        const tag = document.createElement("div");
        tag.className = "tag";
        tag.textContent = `Tags: ${entry.tags ? entry.tags.join(", ") : "No Tags"}`;

        // Create Edit Button
        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.style.marginTop = "10px";
        editButton.addEventListener("click", () => {
            // Navigate to add.html but in edit mode
            window.location.href = `add.html?id=${entry._id}`;
        });

        entryDiv.appendChild(title);
        entryDiv.appendChild(content);
        entryDiv.appendChild(tag);
        entryDiv.appendChild(editButton);
        contentDiv.appendChild(entryDiv);
    });
}

function renderTagList(responses) {
  const tagListDiv = document.getElementById("tag-list");
  tagListDiv.innerHTML = ""; // Clear previous tags

  const tagCounts = {}; // Object to store tag counts

  responses.forEach((entry) => {
    if (entry.tags && Array.isArray(entry.tags)) {
      entry.tags.forEach((tag) => {
        tag = tag.trim(); // Normalize spacing
        if (tagCounts[tag]) {
          tagCounts[tag]++; // Increase count if tag exists
        } else {
          tagCounts[tag] = 1; // Initialize count
        }
      });
    }
  });

  // Convert object to an array and sort by count (highest first)
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  // Create a list of tags with counts
  sortedTags.forEach(([tag, count]) => {
    const tagItem = document.createElement("div");
    tagItem.textContent = `${count} - ${tag}`;
    tagItem.style.cursor = "pointer";
    tagItem.style.padding = "5px";
    tagItem.style.borderBottom = "1px solid #ccc";

    // Add click event to filter by tag when clicked
    tagItem.addEventListener("click", () => {
      tagSearch.value = tag; // Fill search input with selected tag
      tagSearch.dispatchEvent(new Event("input")); // Trigger search
    });

    tagListDiv.appendChild(tagItem);
  });
}

  // Fetch JSON data from the local server
  fetch("http://localhost:3001/json")
    .then((response) => response.json())
    .then((data) => {
      allResponses = data.responses; // Store all responses

      // Sort newest first by _id
      allResponses.sort((a, b) => {
        if (a._id < b._id) return 1;
        if (a._id > b._id) return -1;
        return 0;
      });

      renderResponses(allResponses);
      renderTagList(allResponses);

    })
    .catch((error) => {
      console.error("Error fetching JSON:", error);
      contentDiv.textContent = "Failed to load data.";
    });

  // Add event listener for tag search
  tagSearch.addEventListener("input", function () {
    const searchValue = tagSearch.value.trim().toLowerCase();

    if (searchValue === "") {
        renderResponses(allResponses); // Show all if search is empty
        return;
    }

    const searchTags = searchValue.split(",").map(tag => tag.trim().toLowerCase());

    const filteredResponses = allResponses.filter((entry) => 
        entry.tags && entry.tags.some(tag => searchTags.includes(tag.toLowerCase()))
    );

    renderResponses(filteredResponses);
});
});