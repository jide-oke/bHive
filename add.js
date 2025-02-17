document.getElementById('add-response-form').addEventListener('submit', function (event) {
  event.preventDefault();

  document.getElementById("content").addEventListener("input", function () {
      const contentDiv = this;
      contentDiv.innerHTML = contentDiv.innerHTML.replace(
          /(https?:\/\/[^\s]+)/g, 
          '<a href="$1" target="_blank">$1</a>'
      );
  });

  const title = document.getElementById('title').value;
  const content = document.getElementById('content').innerHTML;  // Capture rich text (including links). It used to be document.getElementById('content').value;
  const tags = document.getElementById('tag').value
                 .split(",") // Split input into an array
                 .map(tag => tag.trim()) // Remove extra spaces
                 .filter(tag => tag !== ""); // Remove empty entries

  // Send the new response to the server with tag included
  fetch('http://localhost:3000/json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content, tags }), // // Store tags as an array
  })
  .then((response) => {
    console.log('Response Status:', response.status); // Log status code
    if (response.ok) {
      console.log('Response successfully sent to the server.');
      window.location.href = 'window.html'; // Navigate back to the viewer
    } else {
      console.error('Failed to send response to the server.');
    }
  })
  .catch((error) => {
    console.error('Error:', error); // Log any network errors
  });
});