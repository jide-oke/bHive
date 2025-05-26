// scope.js
document.addEventListener('DOMContentLoaded', function () {
  // Only run this on the Add Response page
  const scopeBtn = document.getElementById('scopeBtn');
  if (!scopeBtn) return;

  scopeBtn.addEventListener('click', async () => {
    scopeBtn.textContent = '⏳ Scoping...';

    const [sfTab] = await chrome.tabs.query({
      url: 'https://getclever.lightning.force.com/lightning/*'
    });

    if (!sfTab) {
      alert('⚠️ No active Salesforce Lightning tab found.');
      scopeBtn.textContent = 'Scope Salesforce';
      return;
    }

    await chrome.tabs.update(sfTab.id, { active: true });

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
            // Email message
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
            // Internal note
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
      scopeBtn.textContent = 'Scope Salesforce';
      if (chrome.runtime.lastError || !results || !results[0]) {
        alert('🚫 Failed to extract content.');
        return;
      }
      const rawResult = results[0].result;
      if (rawResult && rawResult.startsWith('{')) {
        const data = JSON.parse(rawResult);

        let rawInput = data.html;
        const parser = new DOMParser();

        // HTML entity decode
        function decodeHTMLEntities(str) {
          const txt = document.createElement('textarea');
          txt.innerHTML = str;
          return txt.value;
        }
        rawInput = decodeHTMLEntities(rawInput);

        // Special handling for <emailui-rich-text-output value="...">
        let htmlString = rawInput;
        const marker = 'value="';
        const start = rawInput.indexOf(marker);
        if (start !== -1) {
          const i1 = start + marker.length;
          const i2 = rawInput.lastIndexOf('">');
          htmlString = (i2 > i1)
            ? rawInput.substring(i1, i2)
            : rawInput.substring(i1);
        }
        htmlString = decodeHTMLEntities(htmlString);
        const contentDoc = parser.parseFromString(htmlString, 'text/html');

        // Fix Salesforce relative image links
        contentDoc.querySelectorAll('img').forEach(img => {
          let src = decodeHTMLEntities(img.getAttribute('src') || '');
          if (src.startsWith('/')) {
            src = 'https://getclever.my.salesforce.com' + src;
          }
          img.setAttribute('src', src);
          img.style.maxWidth = "100%";
          img.style.display = "block";
          img.style.marginBottom = "12px";
        });

        // Fix <br clear="none">
        contentDoc.querySelectorAll('br[clear="none"]').forEach(br => {
          const newBr = document.createElement('br');
          br.parentNode.replaceChild(newBr, br);
        });

        // Paste HTML into the contenteditable div
        const contentEditableDiv = document.getElementById('content');
        contentEditableDiv.innerHTML = contentDoc.body.innerHTML;
      } else {
        alert(rawResult);
      }
    });
  });
});