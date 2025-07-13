async function fetchAllTags() {
  const response = await fetch('http://localhost:3001/json/tags');
  const data = await response.json();
  return data.tags; // should be an array of all tags
}

async function suggestTagsForContent(contentText, allTags) {
  const response = await fetch('http://localhost:3001/suggest-tags', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentText, allTags })
  });
  const data = await response.json();
  return data.tags || [];
}