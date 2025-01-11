document.addEventListener("DOMContentLoaded", () => {
  const contentDiv = document.getElementById("content");
  const saveButton = document.createElement("button");
  saveButton.textContent = "Save Changes";
  saveButton.style.marginTop = "20px";
  contentDiv.appendChild(saveButton);

  let jsonData;

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

  // Fetch JSON data from the local server
  fetch("http://localhost:3000/json")
    .then((response) => response.json())
    .then((data) => {
      jsonData = data;

      // Render the JSON data
      jsonData.responses.forEach((entry, index) => {
        const entryDiv = document.createElement("div");
        entryDiv.className = "entry";

        const titleInput = document.createElement("input");
        titleInput.className = "title";
        titleInput.value = entry.title;

        const contentInput = document.createElement("textarea");
        contentInput.className = "content";
        contentInput.innerHTML = formatText(entry.content);

        entryDiv.appendChild(titleInput);
        entryDiv.appendChild(contentInput);
        contentDiv.insertBefore(entryDiv, saveButton);

        // Update JSON object when user edits
        titleInput.addEventListener("input", () => {
          jsonData.responses[index].title = titleInput.value;
        });

        contentInput.addEventListener("input", () => {
          jsonData.responses[index].content = contentInput.value;
        });
      });
    })
    .catch((error) => {
      console.error("Error fetching JSON:", error);
      contentDiv.textContent = "Failed to load data.";
    });

  // Save updated JSON data back to the server
  saveButton.addEventListener("click", () => {
    fetch("http://localhost:3000/json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jsonData),
    })
      .then((response) => {
        if (response.ok) {
          alert("Changes saved successfully!");
        } else {
          throw new Error("Failed to save changes");
        }
      })
      .catch((error) => {
        console.error("Error saving JSON:", error);
        alert("Failed to save changes.");
      });
  });
});