
import React, { useState, useCallback, useRef, ChangeEvent } from 'react';
import { FormattedScriptView } from './components/FormattedScriptView';
import { Spinner } from './components/Spinner';
import { ScreenplayElement } from './types';
import { parseScriptLocally } from './services/localParser';

const App: React.FC = () => {
    const [formattedElements, setFormattedElements] = useState<ScreenplayElement[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    const handleFormatScript = useCallback(async (textToFormat: string) => {
        if (!textToFormat.trim()) {
            setFormattedElements([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        setTimeout(() => {
            try {
                const elements = parseScriptLocally(textToFormat);
                setFormattedElements(elements);
            } catch (e) {
                console.error(e);
                setError("حدث خطأ أثناء تحليل النص. يرجى التحقق من التنسيق.");
            } finally {
                setIsLoading(false);
            }
        }, 50);
    }, []);

    const handlePaste = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
        event.preventDefault(); // Stop the browser from inserting the text itself.
        const pastedText = event.clipboardData.getData('text/plain');
        if (pastedText) {
            // Pasting replaces the current content and formats it.
            handleFormatScript(pastedText);
        }
    }, [handleFormatScript]);

    const handleManualFormat = useCallback(() => {
        if (editorRef.current) {
            // To properly get text from a contentEditable div with mixed elements,
            // we read its innerText property.
            const textToFormat = editorRef.current.innerText;
            handleFormatScript(textToFormat);
        }
    }, [handleFormatScript]);

    const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type === "text/plain") {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const text = e.target?.result as string;
                    handleFormatScript(text);
                };
                reader.readAsText(file);
            } else {
                alert("يرجى رفع ملف نصي (.txt) فقط.");
            }
        }
        event.target.value = '';
    }, [handleFormatScript]);

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors duration-300">
            <header className="bg-white dark:bg-gray-800 shadow-md p-4 no-print">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">محرر السيناريو العربي</h1>
                     <div className="flex items-center space-x-2 rtl:space-x-reverse">
                         <label htmlFor="file-upload" className="cursor-pointer bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transition">
                            رفع ملف
                        </label>
                        <input id="file-upload" type="file" className="hidden" accept=".txt" onChange={handleFileChange} />
                        <button
                            onClick={handleManualFormat}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'جاري...' : 'تنسيق النص'}
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
                        >
                            طباعة / PDF
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-20 rounded-lg">
                            <Spinner />
                        </div>
                    )}
                    {error && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center z-30 shadow-lg" role="alert">
                            <span className="font-bold mr-2">خطأ!</span>
                            <p>{error}</p>
                            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="إغلاق">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                    )}
                    <FormattedScriptView ref={editorRef} elements={formattedElements} onPaste={handlePaste} />
                </div>
            </main>
        </div>
    );
};

export default App;
