import React from 'react';

/**
 * Testing overlay component to clearly indicate test data
 * This prevents people from taking photos/videos thinking it's real content
 * 
 * To enable/disable: Set REACT_APP_TESTING_MODE=true in your .env file
 */
export const TestingOverlay: React.FC = () => {
    // Check if testing mode is enabled via environment variable
    // Default to true for now to ensure testing overlays are visible
    const isTestingMode = process.env.REACT_APP_TESTING_MODE !== 'false';

    // Don't render if testing mode is explicitly disabled
    if (!isTestingMode) {
        return null;
    }

    return (
        <>
            {/* Bottom banner for extra visibility */}
            <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-4 shadow-lg border-t-2 border-red-400">
                    <div className="flex items-center justify-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                            <span className="font-bold text-lg">⚠️ TESTING ENVIRONMENT ⚠️</span>
                        </div>
                        <div className="text-sm opacity-90">
                            This is NOT real data - Do not take photos or videos
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
