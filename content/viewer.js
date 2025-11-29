console.log ("test");

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
  const EXPLOSION_PATH = "../current_images/explosion.gif";
  // NEW: Null mode button reference
const nullModeButton = document.getElementById("null-mode-button");
  // Preload (so it shows instantly on first click)
const _preloadExplosion = new Image();
_preloadExplosion.src = EXPLOSION_PATH;

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

      console.log("SF tab URL:", sfTab.url);

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
      plusButton.style.background = "#28ffa9ff";
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

      //Case PlaceHolder
      const caseDiv = document.createElement("div");
      caseDiv.className = "case-placeholder";

      if (entry.case) {
      caseDiv.innerHTML = 'case: <a href="' + entry.case + '" target="_blank" style="color:#28ffa9;text-decoration:underline;">link</a>';
      } else {
      caseDiv.textContent = "case: ";
      }
      
      caseDiv.style.position = "absolute";
      caseDiv.style.top = "14px";
      caseDiv.style.right = "26px";
      caseDiv.style.color = "#ffe1f2";
      caseDiv.style.fontWeight = "bold";
      caseDiv.style.background = "rgba(40, 18, 60, 0.9)";
      caseDiv.style.padding = "2px 12px";
      caseDiv.style.borderRadius = "16px";
      caseDiv.style.fontSize = "0.96rem";
      caseDiv.style.boxShadow = "0 2px 8px #ff64c480";

      // Make the parent .entry position: relative
      entryDiv.style.position = "relative";
      entryDiv.appendChild(caseDiv);
        entryDiv.appendChild(title);
        entryDiv.appendChild(content);
        entryDiv.appendChild(tag);
        entryDiv.appendChild(buttonRow);
        contentDiv.appendChild(entryDiv);

      function showExplosion(evt) {
  // Create a fresh <img> so the GIF restarts each time (use cache-busting)
  const img = new Image();
  img.src = EXPLOSION_PATH + "?" + Date.now();  // force replay
  img.alt = "";
  img.style.position = "fixed";
  img.style.left = `${evt.clientX}px`;
  img.style.top = `${evt.clientY}px`;
  img.style.transform = "translate(-50%, -50%)";
  img.style.width = "140px";         // tweak to taste
  img.style.height = "140px";
  img.style.pointerEvents = "none";
  img.style.zIndex = "999999";
  img.style.opacity = "1";
  img.style.transition = "opacity 180ms ease-out";

  document.body.appendChild(img);

  // quick fade & remove
  setTimeout(() => { img.style.opacity = "0"; }, 380);
  setTimeout(() => { img.remove(); }, 600);
}  

        
// --- helpers (place these inside renderResponses, before the click handler) ---

// returns { plain, html } with signature removed if a valediction is found near the end
function stripSignatureFromRendered(contentEl) {
  const valedictionRe = /^(kind regards|best regards|best|thanks|thank you|sincerely|warmly|cheers)[\s,!.-]*$/i;

  // Split by visual lines from the rendered node
  const lines = contentEl.innerText
    .replace(/\u00A0/g, ' ')   // normalize nbsp
    .split(/\r?\n/);

  // Walk upward from the bottom, find a valediction line near the end (within last ~8 non-empty lines)
  const lastNonEmptyIdx = (() => {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() !== '') return i;
    }
    return -1;
  })();

  // If nothing meaningful, just return current text/html
  if (lastNonEmptyIdx === -1) {
    return {
      plain: contentEl.innerText.replace(/\u00A0/g, ' '),
      html: contentEl.innerHTML
    };
  }

  // Search for a valediction line in the last N lines (N=8 is a good heuristic)
  const WINDOW = 8;
  let cutAt = -1;
  for (let i = lastNonEmptyIdx; i >= Math.max(0, lastNonEmptyIdx - WINDOW + 1); i--) {
    if (valedictionRe.test(lines[i].trim())) {
      cutAt = i; // cut starting at the valediction line
      break;
    }
  }

  if (cutAt === -1) {
    // No valediction found near the end -> return original
    return {
      plain: contentEl.innerText.replace(/\u00A0/g, ' '),
      html: contentEl.innerHTML
    };
  }

  // Build plaintext without signature
  const plainNoSig = lines.slice(0, cutAt).join('\n').replace(/\s+$/,''); // trim trailing

  // For HTML, simplest safe approach is to mirror the plaintext with <br> so you don't copy the signature.
  // (If you need to preserve links/bold exactly, I can share a DOM-pruning variant.)
  const htmlNoSig = plainNoSig.split('\n').map(l => l === '' ? '<br>' : l).join('\n');

  return { plain: plainNoSig, html: htmlNoSig };
}

entryDiv.addEventListener("click", async (e) => {
  // Don’t trigger when clicking +1, Edit, or links
  if (e.target.closest('button') || e.target.closest('a')) return;

  // 1) Strip signature from the rendered node (your helper from earlier)
 // 1) Strip signature from the rendered node (plain text only)
const { plain } = stripSignatureFromRendered(content);

// 2) Re-generate formatted HTML from the *source* content
//    (this ensures links and bold show up, just like in the viewer)
const formattedHtml = formatText(entry.content);

  // 2) Copy (prefer rich HTML; fallback to plaintext)
  try {
if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
  const item = new ClipboardItem({
    'text/html': new Blob([formattedHtml], { type: 'text/html' }),
    'text/plain': new Blob([plain], { type: 'text/plain' })
  });
  await navigator.clipboard.write([item]);
} else {
  await navigator.clipboard.writeText(plain);
}
  } catch (err) {
    console.error('Clipboard failed:', err);
    try { await navigator.clipboard.writeText(plain); } catch {}
  }

  // 3) Fire the explosion confirmation at the click point
  showExplosion(e);

  // 4) Upvote (same endpoint you already use for the +1 button)
  try {
    await fetch(`http://localhost:3001/json/pluses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry._id })
    });
    entry.pluses = (entry.pluses || 0) + 1;
    plusesLabel.textContent = `+${entry.pluses}`;
  } catch (err) {
    console.error("Failed to upvote:", err);
  }
});

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

  //Logic for Null Mode

// Returns true if entry has a "Null" tag (case-insensitive)
function hasNullTag(entry) {
  if (!entry.tags || !Array.isArray(entry.tags)) return false;
  return entry.tags.some(
    (t) => t && t.toLowerCase() === "null"
  );
}

// Find the "next" Null entry, ordered by most recent _id
// lastId: if provided, we skip everything at/after that id
function getNextNullResponse(lastId) {
  if (!allResponses || allResponses.length === 0) return null;

  // Sort by _id descending (newest-ish first, given Mongo ObjectId)
  const sorted = [...allResponses].sort((a, b) => {
    if (a._id < b._id) return 1;
    if (a._id > b._id) return -1;
    return 0;
  });

  // If no lastId, just return the newest Null-tagged entry
  if (!lastId) {
    return sorted.find((entry) => hasNullTag(entry)) || null;
  }

  // Otherwise, find index of the last processed one and look after it
  const startIdx = sorted.findIndex((e) => e._id === lastId);
  for (let i = (startIdx === -1 ? 0 : startIdx + 1); i < sorted.length; i++) {
    if (hasNullTag(sorted[i])) return sorted[i];
  }
  return null; // nothing left
}
//**

// ===== Data loading: Fetch all responses from backend =====
 fetch("http://localhost:3001/json")
  .then((response) => response.json())
  .then((data) => {
    allResponses = data.responses;

    // Existing sort (pluses then _id)
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

    // === Null mode: start workflow from button ===
    if (nullModeButton) {
      nullModeButton.addEventListener("click", () => {
        const next = getNextNullResponse(null);
        if (!next) {
          alert("No responses tagged 'Null' found.");
          sessionStorage.removeItem("nullModeActive");
          sessionStorage.removeItem("lastNullId");
          return;
        }

        // Mark Null mode as active
        sessionStorage.setItem("nullModeActive", "1");
        // We only mark lastNullId AFTER saving, in add.js

        window.location.href = `add.html?id=${next._id}&nullMode=1`;
      });
    }

    // === Null mode: we just came back from editing one ===
    const params = new URLSearchParams(window.location.search);
    if (
      params.get("fromNullEdit") === "1" &&
      sessionStorage.getItem("nullModeActive") === "1"
    ) {
      const lastId = sessionStorage.getItem("lastNullId");
      const next = getNextNullResponse(lastId);
      if (next) {
        window.location.href = `add.html?id=${next._id}&nullMode=1`;
        return; // Don't bother rendering the list right now
      } else {
        alert("You're all caught up — no more 'Null' tagged responses.");
        sessionStorage.removeItem("nullModeActive");
        sessionStorage.removeItem("lastNullId");
      }
    }

    // Normal render
    filterAndRender();
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