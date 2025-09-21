// autotitle.js
// Suggest a title for the response content

document.addEventListener("DOMContentLoaded", () => {
  const suggestTitleBtn = document.getElementById("suggest-title-btn");
  if (!suggestTitleBtn) return;

  suggestTitleBtn.addEventListener("click", async () => {

console.log("👉 suggest-title button clicked");

    const contentDiv = document.getElementById("content");
    const contentText = contentDiv ? contentDiv.innerText : "";

    console.log("👉 contentText length:", contentText.length);
    console.log("👉 first 100 chars of contentText:", contentText.slice(0,100));

    suggestTitleBtn.disabled = true;
    suggestTitleBtn.textContent = "Suggesting...";

    try {
      console.log("👉 sending POST /suggest-title");
      const res = await fetch("http://localhost:3001/suggest-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentText })
      });
      console.log("👉 fetch finished, status:", res.status);

      const data = await res.json();
      console.log("👉 server response JSON:", data);

      if (data.title) {
        document.getElementById("title").value = data.title;
        console.log("👉 title field updated:", data.title);
      } else {
        alert("No title returned.");
      }
    } catch (err) {
      console.error("🚨 Failed to get title suggestion:", err);
      alert("Failed to get title suggestion: " + (err.message || err));
    }

    suggestTitleBtn.disabled = false;
    suggestTitleBtn.textContent = "suggest title";
  });
});