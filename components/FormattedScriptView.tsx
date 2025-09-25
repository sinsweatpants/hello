
import React, { forwardRef } from 'react';
import { ScreenplayElement, ElementType } from '../types';

interface FormattedScriptViewProps {
    elements: ScreenplayElement[];
    onPaste: (event: React.ClipboardEvent<HTMLDivElement>) => void;
}

// Style object for precise screenplay formatting
const styles: { [key: string]: React.CSSProperties } = {
    basmala: {
        textAlign: 'left',
        fontWeight: 'bold',
        fontSize: '1.125rem',
        marginBottom: '2rem',
    },
    sceneHeadingContainer: {
        marginTop: '2rem',
        marginBottom: '1rem',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    sceneHeadingTopLine: {
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
    },
    sceneHeadingLocation: {
        textAlign: 'center',
        marginTop: '0.25rem',
    },
    action: {
        textAlign: 'right',
        margin: '1rem 0',
    },
    character: {
        textAlign: 'center',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        margin: '1rem auto 0 auto',
        width: '2.5in',
    },
    parenthetical: {
        textAlign: 'center',
        fontStyle: 'italic',
        margin: '0 auto',
        width: '2.0in',
    },
    dialogue: {
        textAlign: 'center',
        margin: '0 auto 0.3rem auto',
        width: '2.5in',
        lineHeight: 1.2,
    },
    transition: {
        textAlign: 'center',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        margin: '1rem 0',
    },
    default: {
        textAlign: 'right',
        margin: '1rem 0',
    }
};

const renderElement = (element: ScreenplayElement, index: number) => {
    switch (element.type) {
        case ElementType.BASMALA:
            return <p key={index} style={styles.basmala}>{element.text}</p>;

        case ElementType.SCENE_HEADING:
            return (
                <div key={index} style={styles.sceneHeadingContainer}>
                    <div style={styles.sceneHeadingTopLine}>
                        <span>{element.scene_number}</span>
                        <span>{element.scene_time}</span>
                    </div>
                    <div style={styles.sceneHeadingLocation}>
                        <span>{element.scene_location}</span>
                    </div>
                </div>
            );

        case ElementType.ACTION:
            return <p key={index} style={styles.action}>{element.text}</p>;
        
        case ElementType.CHARACTER:
            return <p key={index} style={styles.character}>{element.text}:</p>;

        case ElementType.PARENTHETICAL:
            return <p key={index} style={styles.parenthetical}>({element.text})</p>;

        case ElementType.DIALOGUE:
            return <p key={index} style={styles.dialogue}>{element.text}</p>;

        case ElementType.TRANSITION:
            return <p key={index} style={styles.transition}>{element.text}</p>;

        default:
            if (element.text) {
                return <p key={index} style={styles.default}>{element.text}</p>;
            }
            return null;
    }
};

export const FormattedScriptView = forwardRef<HTMLDivElement, FormattedScriptViewProps>(({ elements, onPaste }, ref) => {
    const isEmpty = elements.length === 0;

    return (
        <div className="bg-gray-200 dark:bg-gray-800 p-4 sm:p-8 rounded-xl page-container">
            <div 
                ref={ref}
                onPaste={onPaste}
                contentEditable
                suppressContentEditableWarning
                className={`page-a4 bg-white dark:bg-gray-100 text-black shadow-2xl mx-auto editor-cursor ${isEmpty ? 'is-empty' : ''}`}
                style={{ 
                    position: 'relative',
                    outline: 'none', 
                    padding: '1in 1.5in 1in 1in',
                    minHeight: '29.7cm' 
                }}
                aria-label="محرر السيناريو"
            >
                {isEmpty ? (
                    <div className="text-center text-gray-400 pt-20" contentEditable={false} data-placeholder="true">
                        <h3 className="text-2xl font-bold">محرر سيناريو ذكي</h3>
                        <p className="mt-2">الصق النص هنا ليتم تنسيقه تلقائيًا، أو ابدأ الكتابة ثم اضغط على "تنسيق النص".</p>
                    </div>
                ) : (
                    elements.map(renderElement)
                )}
            </div>
        </div>
    );
});
