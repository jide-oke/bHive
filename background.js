// This page controls how the Chrome Extension is launched. This page is small but important.

let bhiveWindowId = null;

chrome.action.onClicked.addListener(() => {
  // If window already exists, focus it
  if (bhiveWindowId !== null) {
    chrome.windows.update(bhiveWindowId, { focused: true, state: "normal" }, function(win) {
      if (chrome.runtime.lastError || !win) {
        // If it failed (maybe window was closed), open a new one
        createBhiveWindow();
      }
    });
  } else {
    createBhiveWindow();
  }
});

function createBhiveWindow() {
  chrome.windows.create(
    {
      url: "window.html",
      type: "popup",
      focused: true,
      width: 800,
      height: 600,
    },
    function (win) {
      bhiveWindowId = win.id;
      // Listen for window close to reset
      chrome.windows.onRemoved.addListener(function listener(closedId) {
        if (closedId === bhiveWindowId) {
          bhiveWindowId = null;
          chrome.windows.onRemoved.removeListener(listener);
        }
      });
    }
  );
}