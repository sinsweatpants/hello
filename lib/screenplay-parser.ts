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
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      formattedHTML += '<div><br></div>';
      i++;
      continue;
    }

    // Basmala
    if (line.includes('بسم الله الرحمن الرحيم')) {
      formattedHTML += `<div class="basmala">${escapeHtml(line)}</div>`;
      i++;
    }
    // Scene Header
    else if (line.match(/^(مشهد|م\.)\s*\d+/i)) {
      const sceneLine = line;
      const parts = sceneLine.split(/[\s-]+/);
      const sceneNum = parts.slice(0, 2).join(' ');
      const timeAndSetting = parts.slice(2).join(' - ');

      let location = '';
      // Check if the next line is the location
      if (i + 1 < lines.length && lines[i + 1].trim() && !lines[i+1].trim().match(/^(مشهد|م\.)\s*\d+/i) && !lines[i+1].trim().match(/^[أ-ي\s]+:$/) && !lines[i+1].trim().match(/(قطع إلى|انتقال إلى|قطع\.|انتقال|فيد إلى|فيد من)/)) {
        location = lines[i + 1].trim();
        i++; // Consume the location line
      }

      formattedHTML += `
        <div class="scene-header-container">
          <div class="scene-header-top-line">
            <span class="scene-header-1">${escapeHtml(sceneNum)}</span>
            <span class="scene-header-2">${escapeHtml(timeAndSetting)}</span>
          </div>
          <div class="scene-header-3">${escapeHtml(location)}</div>
        </div>`;
      i++;
    }
    // Transition
    else if (line.match(/(قطع إلى|انتقال إلى|قطع\.|انتقال|فيد إلى|فيد من)/i)) {
      formattedHTML += `<div class="transition">${escapeHtml(line)}</div>`;
      i++;
    }
    // Dialogue Block
    else if (i + 1 < lines.length && (lines[i+1].trim().startsWith('(') || lines[i+1].trim())) {
        // Potential character name if it's not a scene header or transition
        const nextLine = lines[i+1].trim();
        const isDialogue = !line.match(/^(مشهد|م\.)\s*\d+/i) &&
                           !line.match(/(قطع إلى|انتقال إلى|قطع\.|انتقال|فيد إلى|فيد من)/i) &&
                           (
                             nextLine.length > 0 &&
                             !nextLine.match(/^(مشهد|م\.)\s*\d+/i)
                           );

        if (isDialogue) {
            let dialogueBlock = `<div class="dialogue-block">`;
            dialogueBlock += `<div class="character-name">${escapeHtml(line.replace(':', ''))}</div>`;
            i++; // Move to the next line (parenthetical or dialogue)

            while (i < lines.length && lines[i].trim()) {
                const currentDialogueLine = lines[i].trim();
                if (currentDialogueLine.startsWith('(') && currentDialogueLine.endsWith(')')) {
                    dialogueBlock += `<div class="parenthetical">${escapeHtml(currentDialogueLine)}</div>`;
                } else {
                    dialogueBlock += `<div class="dialogue-text">${escapeHtml(currentDialogueLine)}</div>`;
                }
                i++;
            }
            dialogueBlock += `</div>`;
            formattedHTML += dialogueBlock;
        } else {
             formattedHTML += `<div class="action">${escapeHtml(line)}</div>`;
             i++;
        }
    }
    // Action
    else {
      formattedHTML += `<div class="action">${escapeHtml(line)}</div>`;
      i++;
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