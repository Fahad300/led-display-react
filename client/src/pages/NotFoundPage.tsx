import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Not Found Page Component
 */
const NotFoundPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <h1 className="text-9xl font-bold text-primary">404</h1>
            <p className="text-2xl font-medium mb-8">Page Not Found</p>
            <p className="text-slate-500 max-w-md text-center mb-8">
                The page you are looking for might have been removed or is temporarily unavailable.
            </p>
            <Link to="/" className="btn btn-primary">
                Return to Home
            </Link>
        </div>
    );
};

export default NotFoundPage; 