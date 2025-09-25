import React, { useState } from 'react';
import ScreenplayEditor from './components/ScreenplayEditor';
import { Toaster } from './components/ui/toaster';
import './styles/globals.css';

const App: React.FC = () => {
    const [content, setContent] = useState('');

    return (
        <div className="bg-background dark:bg-background min-h-screen text-foreground dark:text-foreground transition-colors duration-300">
            <header className="bg-card dark:bg-card shadow-md p-4 no-print">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary dark:text-primary">محرر السيناريو العربي</h1>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <button
                            onClick={() => window.print()}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
                        >
                            طباعة / PDF
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <ScreenplayEditor content={content} onContentChange={setContent} />
            </main>
            <Toaster />
        </div>
    );
};

export default App;