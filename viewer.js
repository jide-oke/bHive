document.addEventListener("DOMContentLoaded", () => {
    const contentDiv = document.getElementById("content");
  
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
  
          // Format text to include clickable links, mailto links, and bold text
          content.innerHTML = formatText(entry.content);
  
          entryDiv.appendChild(title);
          entryDiv.appendChild(content);
          contentDiv.appendChild(entryDiv);
        });
      })
      .catch(error => {
        contentDiv.textContent = "Failed to load data: " + error.message;
      });
  });