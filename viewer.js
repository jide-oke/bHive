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

    responses.forEach((entry) => {
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

        entryDiv.appendChild(title);
        entryDiv.appendChild(content);
        entryDiv.appendChild(tag);
        contentDiv.appendChild(entryDiv);
    });
}

  // Fetch JSON data from the local server
  fetch("http://localhost:3000/json")
    .then((response) => response.json())
    .then((data) => {
      allResponses = data.responses; // Store all responses
      renderResponses(allResponses);
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