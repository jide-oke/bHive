document.getElementById('add-response-form').addEventListener('submit', function (event) {
    event.preventDefault();
  
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').innerHTML;  // Capture rich text (including links). It used to be document.getElementById('content').value;

    // Send the new response to the server
    fetch('http://localhost:3000/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content }),
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