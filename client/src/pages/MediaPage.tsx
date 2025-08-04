import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "../contexts/ToastContext";
import MediaModal from "../components/MediaModal";

/** Configuration for the backend API URL */
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

interface MediaFile {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    description?: string;
    url: string;
    uploadedBy: {
        id: string;
        username: string;
    };
    createdAt: string;
}

interface SelectedMedia {
    url: string;
    type: string;
    name: string;
}

const MediaPage: React.FC = () => {
    const { addToast } = useToast();
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurging, setIsPurging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "size" | "date">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch media files from database
    const fetchFiles = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No authentication token found");
            }

            const response = await fetch(`${BACKEND_URL}/api/files?page=${currentPage}&limit=50`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (!data.files) {
                throw new Error("Invalid response format: files array is missing");
            }

            console.log("Received files from database:", data.files);
            setFiles(data.files);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error("Error fetching files:", error);
            addToast(error instanceof Error ? error.message : "Failed to fetch media files", "error");
            setFiles([]);
        } finally {
            setIsLoading(false);
        }
    }, [addToast, currentPage]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    // Handle purge all files
    const handlePurgeAll = async () => {
        if (!window.confirm("Are you sure you want to delete ALL files? This action cannot be undone and will remove all uploaded images, videos, and documents.")) {
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            addToast("No authentication token found", "error");
            return;
        }

        setIsPurging(true);
        try {
            // Get all files first
            const response = await fetch(`${BACKEND_URL}/api/files?page=1&limit=1000`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch files for deletion");
            }

            const data = await response.json();
            const allFileIds = data.files.map((file: MediaFile) => file.id);

            if (allFileIds.length === 0) {
                addToast("No files to delete", "info");
                return;
            }

            // Delete all files
            const deletePromises = allFileIds.map(async (fileId: string) => {
                const deleteResponse = await fetch(`${BACKEND_URL}/api/files/${fileId}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                if (!deleteResponse.ok) {
                    throw new Error(`Failed to delete file ${fileId}`);
                }

                return deleteResponse.json();
            });

            await Promise.all(deletePromises);
            addToast(`Successfully deleted ${allFileIds.length} files`, "success");
            setSelectedFiles([]);
            fetchFiles(); // Refresh the file list
        } catch (error) {
            console.error("Purge error:", error);
            addToast("Failed to delete all files", "error");
        } finally {
            setIsPurging(false);
        }
    };

    // Handle file deletion
    const handleDeleteFiles = async () => {
        if (selectedFiles.length === 0) return;

        if (!window.confirm(`Are you sure you want to delete ${selectedFiles.length} file(s)?`)) {
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            addToast("No authentication token found", "error");
            return;
        }

        try {
            // Delete files one by one
            const deletePromises = selectedFiles.map(async (fileId) => {
                const response = await fetch(`${BACKEND_URL}/api/files/${fileId}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to delete file ${fileId}`);
                }

                return response.json();
            });

            await Promise.all(deletePromises);
            addToast("Files deleted successfully", "success");
            setSelectedFiles([]);
            fetchFiles(); // Refresh the file list
        } catch (error) {
            console.error("Delete error:", error);
            addToast("Failed to delete files", "error");
        }
    };

    // Handle single file deletion
    const handleDeleteFile = async (fileId: string, fileName: string) => {
        if (!window.confirm(`Are you sure you want to delete ${fileName}?`)) {
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            addToast("No authentication token found", "error");
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/files/${fileId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Failed to delete file");
            }

            addToast("File deleted successfully", "success");
            fetchFiles(); // Refresh the file list
        } catch (error) {
            console.error("Delete error:", error);
            addToast("Failed to delete file", "error");
        }
    };

    // Filter and sort files
    const filteredAndSortedFiles = files
        .filter(file => file.originalName.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            const order = sortOrder === "asc" ? 1 : -1;
            switch (sortBy) {
                case "name":
                    return order * a.originalName.localeCompare(b.originalName);
                case "size":
                    return order * (a.size - b.size);
                case "date":
                    return order * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                default:
                    return 0;
            }
        });

    const handleMediaPreview = (file: MediaFile) => {
        console.log("Previewing media:", file);
        setSelectedMedia({
            url: `${BACKEND_URL}${file.url}`,
            type: file.mimeType,
            name: file.originalName
        });
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Media Management</h1>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handlePurgeAll}
                        disabled={isPurging}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isPurging ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deleting...
                            </div>
                        ) : (
                            "Purge All"
                        )}
                    </button>
                </div>
            </div>

            {/* Search and Sort Controls */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as "name" | "size" | "date")}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="name">Name</option>
                        <option value="size">Size</option>
                        <option value="date">Date</option>
                    </select>
                    <button
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        {sortOrder === "asc" ? "↑" : "↓"}
                    </button>
                </div>
            </div>

            {/* File List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                        <p className="mt-2 text-gray-600">Loading files...</p>
                    </div>
                ) : filteredAndSortedFiles.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-600">No files found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredAndSortedFiles.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedFiles.includes(file.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedFiles([...selectedFiles, file.id]);
                                            } else {
                                                setSelectedFiles(selectedFiles.filter(id => id !== file.id));
                                            }
                                        }}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <div className="flex items-center space-x-4">
                                        {file.mimeType.startsWith("image/") ? (
                                            <img
                                                src={`${BACKEND_URL}${file.url}`}
                                                alt={file.originalName}
                                                className="h-12 w-12 object-cover rounded cursor-pointer"
                                                onClick={() => handleMediaPreview(file)}
                                                onError={(e) => {
                                                    console.error("Error loading image:", `${BACKEND_URL}${file.url}`);
                                                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'%3E%3C/path%3E%3C/svg%3E";
                                                }}
                                            />
                                        ) : file.mimeType.startsWith("video/") ? (
                                            <div
                                                className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center cursor-pointer"
                                                onClick={() => handleMediaPreview(file)}
                                            >
                                                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <div
                                                className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center cursor-pointer"
                                                onClick={() => handleMediaPreview(file)}
                                            >
                                                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()} • Uploaded by {file.uploadedBy.username}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleMediaPreview(file)}
                                        className="p-2 text-gray-400 hover:text-gray-500"
                                        aria-label={`Preview ${file.originalName}`}
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteFile(file.id, file.originalName)}
                                        className="p-2 text-gray-400 hover:text-red-500"
                                        aria-label={`Delete ${file.originalName}`}
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Media Modal */}
            <MediaModal
                isOpen={selectedMedia !== null}
                onClose={() => setSelectedMedia(null)}
                mediaUrl={selectedMedia?.url || ""}
                mediaType={selectedMedia?.type || ""}
                mediaName={selectedMedia?.name || ""}
            />

            {/* Bulk Actions */}
            {selectedFiles.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
                    <div className="container mx-auto flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            {selectedFiles.length} file(s) selected
                        </p>
                        <button
                            onClick={handleDeleteFiles}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaPage; 