
import React from 'react';

export const Spinner: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center text-white">
            <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent border-solid rounded-full animate-spin"></div>
            <p className="mt-4 text-lg font-semibold">...يقوم الذكاء الاصطناعي بتحليل النص</p>
        </div>
    );
};
