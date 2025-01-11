document.addEventListener("DOMContentLoaded", () => {
    const contentDiv = document.getElementById("content");
  
    // Fetch the JSON data
    fetch(chrome.runtime.getURL("Database1.json"))
      .then(response => response.json())
      .then(data => {
        data.responses.forEach(entry => {
          const entryDiv = document.createElement("div");
          entryDiv.className = "entry";
  
          const title = document.createElement("div");
          title.className = "title";
          title.textContent = entry.title;
  
          const content = document.createElement("div");
          content.className = "content";
          content.textContent = entry.content;
  
          entryDiv.appendChild(title);
          entryDiv.appendChild(content);
          contentDiv.appendChild(entryDiv);
        });
      })
      .catch(error => {
        contentDiv.textContent = "Failed to load data: " + error.message;
      });
  });