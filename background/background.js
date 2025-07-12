// background.js
// -------------
// Purpose: Controls how the Chrome Extension window is launched. Manages popup state, ensures only one bHive window is open, and focuses/reopens as needed.


let bhiveWindowId = null;

chrome.storage.session.get('bhiveWindowId', ({ bhiveWindowId: storedId }) => {
  if (storedId) {
    bhiveWindowId = storedId;
  }
});

chrome.action.onClicked.addListener(() => {
  // ===== Extension Icon Click Handler =====
  // Opens main extension window, or focuses it if already open 
  if (bhiveWindowId !== null) {
    // Focus existing window if present
    chrome.windows.update(bhiveWindowId, { focused: true, state: "normal" }, function(win) {
      if (chrome.runtime.lastError || !win) {
        // If the window no longer exists, create a new one
        createBhiveWindow();
      }
    });
  } else {
    createBhiveWindow();
  }
});

// ===== Helper: Create bHive Window =====
function createBhiveWindow() {
  // Opens the popup window for the extension and saves its window ID
  chrome.windows.create(
    {
      url: "ui/window.html",
      type: "popup",
      focused: true,
      width: 800,
      height: 600,
    },
    function (win) {
      bhiveWindowId = win.id;
      // Listen for window close event to reset window ID
      chrome.storage.session.set({ bhiveWindowId: win.id });
      chrome.windows.onRemoved.addListener(function listener(closedId) {
        if (closedId === bhiveWindowId) {
          bhiveWindowId = null;
          chrome.storage.session.remove('bhiveWindowId');
          chrome.windows.onRemoved.removeListener(listener);
        }
      });
    }
  );
}