//This page is for how the content is viewed in the Chrome Extension. The main page as of right now

document.addEventListener("DOMContentLoaded", () => {
  const contentDiv = document.getElementById("content");
  const addButton = document.getElementById("add-button");

  addButton.addEventListener("click", () => {
    window.location.href = "add.html";
  });

  // Utility function to process special formatting (links, mailto links, and bold text)
  function formatText(text) {
    // Replace [text](url) and [text](mailto:email) with clickable hyperlinks
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+|mailto:[^\)]+)\)/g;
    text = text.replace(linkRegex, (match, displayText, url) => {
      return `<a href="${url}" target="_blank">${displayText}</a>`;
    });

    // Replace **bold** with <strong>bold</strong>
    const boldRegex = /\*\*([^\*]+)\*\*/g;
    text = text.replace(boldRegex, (match, boldText) => {
      return `<strong>${boldText}</strong>`;
    });

    return text;
  }

  function renderResponses(responses) {
    responses.forEach((entry) => {
      const entryDiv = document.createElement("div");
      entryDiv.className = "entry";

      const title = document.createElement("div");
      title.className = "title";
      title.textContent = entry.title;

      const content = document.createElement("div");
      content.className = "content";

      // Format text to include clickable links, mailto links, and bold text
      content.innerHTML = formatText(entry.content);

      entryDiv.appendChild(title);
      entryDiv.appendChild(content);
      contentDiv.appendChild(entryDiv);
    });
  }

  // Fetch JSON data from the local server
  fetch("http://localhost:3000/json")
    .then((response) => response.json())
    .then((data) => {
      // Render the JSON data
      data.responses.forEach((entry) => {
        const entryDiv = document.createElement("div");
        entryDiv.className = "entry";

        const title = document.createElement("div");
        title.className = "title";
        title.textContent = entry.title;

        const content = document.createElement("div");
        content.className = "content";

        // Format text to include clickable links, mailto links, and bold text
        content.innerHTML = formatText(entry.content);

        entryDiv.appendChild(title);
        entryDiv.appendChild(content);
        contentDiv.appendChild(entryDiv);
      });
    })
    .catch((error) => {
      console.error("Error fetching JSON:", error);
      contentDiv.textContent = "Failed to load data.";
    });
});