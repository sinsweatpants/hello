
import { Patterns } from './patterns';
import { ScreenplayElement, ElementType } from '../types';

export const parseScriptLocally = (rawText: string): ScreenplayElement[] => {
    // Split by newline, then filter out empty lines.
    const lines = rawText.split('\n').filter(line => line.trim() !== '');
    const elements: ScreenplayElement[] = [];

    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();
        const lastElement = elements.length > 0 ? elements[elements.length - 1] : null;

        // 1. Basmala
        if (Patterns.basmala.test(line)) {
            elements.push({ type: ElementType.BASMALA, text: line });
            i++;
            continue;
        }

        // 2. Scene Heading
        const scenePrefixMatch = line.match(Patterns.sceneHeaderPrefix);
        if (scenePrefixMatch) {
            const [, sceneNum, rest] = scenePrefixMatch;
            const timeLocationMatch = rest.match(Patterns.sceneHeader2BothOrders);
            
            let scene_time = '';
            let scene_location = rest.trim();

            if (timeLocationMatch && rest.trim().startsWith(timeLocationMatch[0])) {
                // Normalize separator to ' - '
                scene_time = timeLocationMatch[0].trim().replace(/\s*[-–—:،]\s*/, ' - ');
                // Remove the matched time part and any leading separator from the location
                scene_location = rest.trim().replace(timeLocationMatch[0], '').trim().replace(/^[-–—:،]\s*/, '');
            }
            
            elements.push({
                type: ElementType.SCENE_HEADING,
                scene_number: `مشهد ${sceneNum}`,
                scene_time: scene_time,
                scene_location: scene_location,
            });
            i++;
            continue;
        }

        // 3. Transitions
        if (Patterns.transitions.test(line)) {
            elements.push({ type: ElementType.TRANSITION, text: line });
            i++;
            continue;
        }

        // 4. Character
        if (Patterns.characterNames.test(line)) {
            const characterName = line.replace(/:$/, '').replace(Patterns.characterBullets, '').trim();
            elements.push({ type: ElementType.CHARACTER, text: characterName });
            i++;
            continue;
        }
        
        // 5. Parenthetical (can appear after character or before dialogue)
        if (Patterns.parenShaped.test(line)) {
            const text = line.replace(/^\(|\)$/g, '').trim();
            elements.push({ type: ElementType.PARENTHETICAL, text });
            i++;
            continue;
        }
        
        // 6. Dialogue (must follow a Character or Parenthetical)
        if (lastElement && (lastElement.type === ElementType.CHARACTER || lastElement.type === ElementType.PARENTHETICAL)) {
            elements.push({ type: ElementType.DIALOGUE, text: line });
            i++;
            continue;
        }
        
        // 7. Action (default case)
        elements.push({ type: ElementType.ACTION, text: line });
        i++;
    }

    return elements;
};
