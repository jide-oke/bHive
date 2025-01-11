chrome.action.onClicked.addListener(() => {
    chrome.windows.create({
      url: "window.html",
      type: "popup",
      focused: true,
      width: 800,
      height: 600
    });
  });