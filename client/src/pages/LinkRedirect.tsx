import { useEffect } from "react";

/**
 * LinkRedirect component
 * Redirects to an external URL when accessed via /link route
 * Change the EXTERNAL_URL constant to your Teams meeting link
 */
const EXTERNAL_URL = "https://teams.microsoft.com/l/meetup-join/19%3ameeting_MjZmMGVhNmUtNjQxZi00MmYyLWE3MGUtMTMyN2Q0N2JiNDdi%40thread.v2/0?context=%7b%22Tid%22%3a%226fdd1bd7-6fa0-48fa-995b-5cd5b6b88381%22%2c%22Oid%22%3a%22f3a3c962-da7a-4d19-9efd-be9ab1d92bd6%22%7d";

export const LinkRedirect: React.FC = () => {
    useEffect(() => {
        // Redirect to external URL in a new tab/window
        window.open(EXTERNAL_URL, "_blank", "noopener,noreferrer");

        // Optionally redirect back to home after opening the link
        // Uncomment the line below if you want to go back to home page
        // window.location.href = "/";
    }, []);

    return (
        <div className="w-full h-screen flex items-center justify-center bg-gray-900">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white text-xl mb-2">Opening Teams Meeting...</p>
                <p className="text-gray-400 text-sm">You can close this tab or it will redirect automatically</p>
            </div>
        </div>
    );
};

export default LinkRedirect;

