// Helper function to escape HTML content to prevent XSS
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function parseAndFormat(text: string): string {
  if (!text) return '';

  const lines = text.split('\n');
  let formattedHTML = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      formattedHTML += '<div class="action"><br></div>';
      continue;
    }

    // Basmala detection
    if (line.includes('بسم الله الرحمن الرحيم')) {
      formattedHTML += `<div class="basmala">${escapeHtml(line)}</div>`;
    }
    // Scene header detection
    else if (line.match(/^(مشهد|م\.)\s*\d+/)) {
      const parts = line.split(/[\s-]+/);
      const sceneNum = parts.slice(0, 2).join(' ');
      const timeLocation = parts.slice(2, 4).join(' - ');
      let place = parts.slice(4).join(' ');

      // Check if place is empty and next line exists (scene header spanning two lines)
      if (!place && i + 1 < lines.length && lines[i + 1].trim() &&
          !lines[i + 1].trim().match(/^(مشهد|م\.)\s*\d+/) &&
          !lines[i + 1].trim().match(/^[أ-ي\s]+:$/)) {
        i++;
        place = lines[i].trim();
      }

      formattedHTML += `
        <div class="scene-header-container">
          <div class="scene-header-top-line">
            <span class="scene-header-1">${escapeHtml(sceneNum)}</span>
            <span class="scene-header-2">${escapeHtml(timeLocation)}</span>
          </div>
          <div class="scene-header-3">${escapeHtml(place)}</div>
        </div>`;
    }
    // Transition detection
    else if (line.match(/(قطع إلى|انتقال إلى|قطع\.|انتقال|فيد إلى|فيد من)/)) {
      formattedHTML += `<div class="transition">${escapeHtml(line)}</div>`;
    }
    // Character name detection (line ending with colon or all caps)
    else if (line.match(/^[أ-ي\s]+:$/) || (line === line.toUpperCase() && line.match(/^[أ-ي\s]+$/))) {
      let dialogueBlock = `<div class="dialogue-block">`;
      dialogueBlock += `<div class="character-name">${escapeHtml(line.replace(':', ''))}</div>`;

      // Check for parenthetical in next line
      if (i + 1 < lines.length && lines[i + 1].trim().match(/^\(.+\)$/)) {
        i++;
        dialogueBlock += `<div class="parenthetical">${escapeHtml(lines[i].trim())}</div>`;
      }

      // Get dialogue text from next lines until empty line or new element
      while (i + 1 < lines.length && lines[i + 1].trim() &&
             !lines[i + 1].trim().match(/^(مشهد|م\.)\s*\d+/) &&
             !lines[i + 1].trim().match(/(قطع إلى|انتقال إلى|قطع\.|انتقال|فيد إلى|فيد من)/) &&
             !lines[i + 1].trim().match(/^[أ-ي\s]+:$/)) {
        i++;
        const dialogueLine = lines[i].trim();
        if (dialogueLine.match(/^\(.+\)$/)) {
          dialogueBlock += `<div class="parenthetical">${escapeHtml(dialogueLine)}</div>`;
        } else {
          dialogueBlock += `<div class="dialogue-text">${escapeHtml(dialogueLine)}</div>`;
        }
      }

      dialogueBlock += `</div>`;
      formattedHTML += dialogueBlock;
    }
    // Default to action
    else {
      formattedHTML += `<div class="action">${escapeHtml(line)}</div>`;
    }
  }

  return formattedHTML;
}

export function extractPlainText(html: string): string {
  // Remove HTML tags and return plain text
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

export function countElements(text: string) {
  const scenes = (text.match(/(مشهد|م\.)\s*\d+/g) || []).length;
  const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const pages = Math.max(1, Math.ceil(words / 250));

  return { scenes, words, pages };
}