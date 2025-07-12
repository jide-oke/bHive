

export async function fetchAllTags() {
  const response = await fetch('http://localhost:3001/json/tags');
  const data = await response.json();
  return data.tags; // Array of tag strings
}