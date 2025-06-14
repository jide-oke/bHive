// viewer.js
// ----------
// Purpose: Handles the main UI/logic for displaying, filtering, and searching responses in the main bHive extension window.
// Loads all responses, allows searching by content/tags, and triggers edit/add actions.



document.addEventListener("DOMContentLoaded", () => {
  // DOM refs and main state
  const contentDiv = document.getElementById("content");
  const addButton = document.getElementById("add-button");
  const tagSearch = document.getElementById("tag-search");
  let allResponses = [];
  const contentSearch = document.getElementById("content-search");

  const params = new URLSearchParams(window.location.search);
  if (params.get("fromEdit") === "1") {
    const lastTag = sessionStorage.getItem("lastTagSearch") || "";
    const lastContent = sessionStorage.getItem("lastContentSearch") || "";
    tagSearch.value = lastTag;
    contentSearch.value = lastContent;
    filterAndRender();
    // Optionally, clean up sessionStorage after restoring
    sessionStorage.removeItem("lastTagSearch");
    sessionStorage.removeItem("lastContentSearch");
  }

  
  // ===== Add Button =====
  // Navigates user to add.html for creating a new response
  addButton.addEventListener("click", () => {
    window.location.href = "add.html";
  });

  // ===== Scope Shortcut Button and Keyboard Shortcut =====
  // Handles scoping (scraping) Salesforce data into a new response
  const scopeShortcutBtn = document.getElementById("scope-shortcut");
// Keyboard shortcut: Ctrl+Shift+I triggers scope if available
document.addEventListener("keydown", function (e) {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
    if (scopeShortcutBtn && !scopeShortcutBtn.disabled) {
      e.preventDefault();
      scopeShortcutBtn.click();
    }
  }
});
// Scope button click handler (Salesforce scraping logic)
  if (scopeShortcutBtn) {
    scopeShortcutBtn.addEventListener("click", async () => {
      scopeShortcutBtn.textContent = "⏳ Scoping...";

      // 1. Find Salesforce tab
      const [sfTab] = await chrome.tabs.query({
        url: "https://getclever.lightning.force.com/lightning/*"
      });

      if (!sfTab) {
        alert("⚠️ No active Salesforce Lightning tab found.");
        scopeShortcutBtn.textContent = "Scope";
        return;
      }

      await chrome.tabs.update(sfTab.id, { active: true });

      // 2. Run the content scraping code
      chrome.scripting.executeScript({
        target: { tabId: sfTab.id },
        func: () => {
          try {
            const visibleViewport = document.querySelector(
              'body.desktop > div.desktop.container.forceStyle.oneOne.navexDesktopLayoutContainer.lafAppLayoutHost.forceAccess > div.viewport[aria-hidden="false"]'
            );
            if (!visibleViewport) return '❌ Could not find visible viewport container.';

            const tabPanel = visibleViewport.querySelector(
              'section.layoutContent.stage.panelSlide.hasFixedFooter > ' +
              'div.workspaceManager.navexWorkspaceManager > ' +
              'div.oneConsoleTabset.navexConsoleTabset > ' +
              'div.tabsetBody.main-content.mainContentMark.fullheight.active.fullRight > ' +
              'div.split-right > ' +
              'section.tabContent.active.oneConsoleTab[aria-expanded="true"]'
            );
            if (!tabPanel) return '❌ Active case tab not found.';

            const olElement = tabPanel.querySelector('ol');
            if (!olElement) return '❌ No <ol> found in active tab.';

            const messageItems = Array.from(olElement.querySelectorAll('li'));
            for (const li of messageItems) {
              const wrapper = li.querySelector('div.emailMessageBody');
              if (wrapper) {
                const rich = wrapper.querySelector('emailui-rich-text-output');
                if (rich) {
                  return JSON.stringify({
                    type: "email",
                    html: rich.outerHTML
                  });
                }
              }
              const noteDiv = li.querySelector('div.cuf-feedBodyText.forceChatterMessageSegments.forceChatterFeedBodyText');
              if (noteDiv) {
                const feedBodyInner = noteDiv.querySelector('div.feedBodyInner.Desktop.oneApp');
                if (feedBodyInner) {
                  return JSON.stringify({
                    type: "internalNote",
                    html: feedBodyInner.innerHTML
                  });
                }
              }
            }
            return '❌ No known message type found in recent items.';
          } catch (err) {
            return '🚨 Error: ' + err.message;
          }
        }
      }, (results) => {
        scopeShortcutBtn.textContent = "Scope";
        if (chrome.runtime.lastError || !results || !results[0]) {
          alert("🚫 Failed to extract content.");
          return;
        }
        const rawResult = results[0].result;
        if (rawResult && rawResult.startsWith("{")) {
          // Store the result in sessionStorage so add.html can read it!
          sessionStorage.setItem("scopedSalesforceContent", rawResult);
          window.location.href = "add.html?scoped=1";
        } else {
          alert(rawResult);
        }
      });
    });
  }

  
// ===== Utility: Formats markdown-style links and bold in content =====
  function formatText(text) {
    // Converts [text](url) to clickable links and **bold** to <strong>
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+|mailto:[^\)]+)\)/g;
    text = text.replace(linkRegex, (match, displayText, url) => {
      return `<a href="${url}" target="_blank">${displayText}</a>`;
    });

    const boldRegex = /\*\*([^\*]+)\*\*/g;
    text = text.replace(boldRegex, (match, boldText) => {
      return `<strong>${boldText}</strong>`;
    });

    return text;
  }
// ===== Render response entries to the UI =====
  function renderResponses(responses) {
    contentDiv.innerHTML = "";

    responses.forEach((entry, index) => {
        const entryDiv = document.createElement("div");
        entryDiv.className = "entry";

        const title = document.createElement("div");
        title.className = "title";
        title.textContent = entry.title;

        const content = document.createElement("div");
        content.className = "content";
        content.innerHTML = formatText(entry.content);

        const tag = document.createElement("div");
        tag.className = "tag";
        tag.textContent = `Tags: ${entry.tags ? entry.tags.join(", ") : "No Tags"}`;

        const buttonRow = document.createElement("div");
      buttonRow.style.marginTop = "10px";
      buttonRow.style.display = "flex";
      buttonRow.style.gap = "8px";
      buttonRow.style.alignItems = "center";

      // NEW: Plus counter and button
      const plusesLabel = document.createElement("span");
      plusesLabel.textContent = `+${entry.pluses || 0}`;
      plusesLabel.style.fontWeight = "bold";
      plusesLabel.style.marginRight = "3px";

      const plusButton = document.createElement("button");
      plusButton.textContent = "+1";
      plusButton.title = "Give this response a plus!";
      plusButton.style.background = "#ffca28";
      plusButton.style.color = "#222";
      plusButton.style.border = "none";
      plusButton.style.padding = "5px 10px";
      plusButton.style.borderRadius = "6px";
      plusButton.style.fontWeight = "bold";
      plusButton.style.cursor = "pointer";
      plusButton.addEventListener("click", () => {
        plusButton.disabled = true;
        fetch(`http://localhost:3001/json/pluses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: entry._id })
        })
          .then((response) => response.json())
          .then((data) => {
            entry.pluses = (entry.pluses || 0) + 1;
            plusesLabel.textContent = `+${entry.pluses}`;
            plusButton.disabled = false;
          })
          .catch((err) => {
            alert("Failed to add plus.");
            plusButton.disabled = false;
          });
      });

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.style.marginTop = "10px";
        editButton.addEventListener("click", () => {
          // Save current tag and content search before navigating to edit
        sessionStorage.setItem("lastTagSearch", tagSearch.value);
        sessionStorage.setItem("lastContentSearch", contentSearch.value);
            window.location.href = `add.html?id=${entry._id}`;
        });

        buttonRow.appendChild(plusesLabel);
      buttonRow.appendChild(plusButton);
      buttonRow.appendChild(editButton);

        entryDiv.appendChild(title);
        entryDiv.appendChild(content);
        entryDiv.appendChild(tag);
        entryDiv.appendChild(buttonRow);
        contentDiv.appendChild(entryDiv);
    });
  }
// ===== Render tag sidebar with tag counts =====
  function renderTagList(responses) {
    // Builds tag count sidebar; clicking tag filters results
    const tagListDiv = document.getElementById("tag-list");
    tagListDiv.innerHTML = "";

    const tagCounts = {};

    responses.forEach((entry) => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach((tag) => {
          tag = tag.trim();
          if (tagCounts[tag]) {
            tagCounts[tag]++;
          } else {
            tagCounts[tag] = 1;
          }
        });
      }
    });

    const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

    sortedTags.forEach(([tag, count]) => {
      const tagItem = document.createElement("div");
      tagItem.textContent = `${count} - ${tag}`;
      tagItem.style.cursor = "pointer";
      tagItem.style.padding = "5px";
      tagItem.style.borderBottom = "1px solid #ccc";
      tagItem.addEventListener("click", () => {
        tagSearch.value = tag;
        tagSearch.dispatchEvent(new Event("input"));
      });

      tagListDiv.appendChild(tagItem);
    });
  }

// ===== Data loading: Fetch all responses from backend =====
  fetch("http://localhost:3001/json")
    .then((response) => response.json())
    .then((data) => {
      allResponses = data.responses;

      allResponses.sort((a, b) => {
    const aPluses = typeof a.pluses === "number" ? a.pluses : 0;
    const bPluses = typeof b.pluses === "number" ? b.pluses : 0;
    if (bPluses !== aPluses) {
      return bPluses - aPluses;
    }
    if (a._id < b._id) return 1;
    if (a._id > b._id) return -1;
    return 0;
  });

      renderResponses(allResponses);
      renderTagList(allResponses);

    })
    .catch((error) => {
      console.error("Error fetching JSON:", error);
      contentDiv.textContent = "Failed to load data.";
    });
// ===== Filtering logic for tags and content =====
  tagSearch.addEventListener("input", filterAndRender);
contentSearch.addEventListener("input", filterAndRender);

// Filters responses by tag and content search fields, updates UI
function filterAndRender() {
  const tagValue = tagSearch.value.trim().toLowerCase();
  const contentValue = contentSearch.value.trim().toLowerCase();

  let filtered = allResponses;

  if (tagValue !== "") {
    const searchTags = tagValue.split(",").map(tag => tag.trim().toLowerCase());
    filtered = filtered.filter(entry =>
      entry.tags && entry.tags.some(tag => searchTags.includes(tag.toLowerCase()))
    );
  }

  if (contentValue !== "") {
    filtered = filtered.filter(entry =>
      entry.content && entry.content.toLowerCase().includes(contentValue)
    );
  }

  renderResponses(filtered);
}
});