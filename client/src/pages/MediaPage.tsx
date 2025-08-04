import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "../contexts/ToastContext";
import MediaModal from "../components/MediaModal";

/** Configuration for the backend API URL */
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

interface MediaFile {
    name: string;
    url: string;
    size: number;
    type: string;
    lastModified: string;
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
    const [isUploading, setIsUploading] = useState(false);
    const [isPurging, setIsPurging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "size" | "date">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);

    // Fetch media files
    const fetchFiles = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No authentication token found");
            }

            const response = await fetch(`${BACKEND_URL}/api/admin/uploads/stats`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (!data.files) {
                throw new Error("Invalid response format: files array is missing");
            }

            // Log the files data for debugging
            console.log("Received files:", data.files);

            setFiles(data.files);
        } catch (error) {
            console.error("Error fetching files:", error);
            addToast(error instanceof Error ? error.message : "Failed to fetch media files", "error");
            setFiles([]); // Reset files array on error
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const token = localStorage.getItem("token");
        if (!token) {
            addToast("No authentication token found", "error");
            return;
        }

        setIsUploading(true);
        const uploadPromises = Array.from(files).map(async (file) => {
            // Validate file type
            const isVideo = file.type.startsWith("video/");
            const isImage = file.type.startsWith("image/");
            if (!isVideo && !isImage) {
                throw new Error(`${file.name} is not a valid image or video file`);
            }

            // Validate file size
            const maxSize = 100 * 1024 * 1024; // 100MB
            if (file.size > maxSize) {
                throw new Error(`${file.name} exceeds the maximum file size of 100MB`);
            }

            const formData = new FormData();
            formData.append("file", file);

            try {
                const response = await fetch(`${BACKEND_URL}/api/files/upload`, {
                    method: "POST",
                    body: formData,
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `Failed to upload ${file.name}`);
                }

                return response.json();
            } catch (error) {
                throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });

        try {
            await Promise.all(uploadPromises);
            addToast("Files uploaded successfully", "success");
            fetchFiles(); // Refresh the file list
        } catch (error) {
            console.error("Upload error:", error);
            addToast(error instanceof Error ? error.message : "Failed to upload files", "error");
        } finally {
            setIsUploading(false);
            // Reset the file input
            e.target.value = "";
        }
    };

    // Handle file deletion
    const handleDeleteFiles = async () => {
        if (selectedFiles.length === 0) return;

        if (!window.confirm(`Are you sure you want to delete ${selectedFiles.length} file(s)?`)) {
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/uploads/delete`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ files: selectedFiles })
            });

            if (!response.ok) {
                throw new Error("Failed to delete files");
            }

            addToast("Files deleted successfully", "success");
            setSelectedFiles([]);
            fetchFiles(); // Refresh the file list
        } catch (error) {
            console.error("Delete error:", error);
            addToast("Failed to delete files", "error");
        }
    };

    // Handle purge all files
    const handlePurgeAll = async () => {
        if (!window.confirm("Are you sure you want to delete all files? This action cannot be undone.")) {
            return;
        }

        setIsPurging(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/uploads/purge-all`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Failed to purge files");
            }

            addToast("All files purged successfully", "success");
            setSelectedFiles([]);
            fetchFiles(); // Refresh the file list
        } catch (error) {
            console.error("Purge error:", error);
            addToast("Failed to purge files", "error");
        } finally {
            setIsPurging(false);
        }
    };

    // Filter and sort files
    const filteredAndSortedFiles = files
        .filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            const order = sortOrder === "asc" ? 1 : -1;
            switch (sortBy) {
                case "name":
                    return order * a.name.localeCompare(b.name);
                case "size":
                    return order * (a.size - b.size);
                case "date":
                    return order * (new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime());
                default:
                    return 0;
            }
        });

    const handleMediaPreview = (file: MediaFile) => {
        console.log("Previewing media:", file); // Debug log
        setSelectedMedia({
            url: file.url,
            type: file.type,
            name: file.name
        });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Media Management</h1>
                <div className="flex items-center space-x-4">
                    <label className="relative">
                        <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            accept="image/*,video/*"
                        />
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Uploading...
                                </div>
                            ) : (
                                "Upload Files"
                            )}
                        </button>
                    </label>
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
                                Purging...
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
                                key={file.name}
                                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedFiles.includes(file.name)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedFiles([...selectedFiles, file.name]);
                                            } else {
                                                setSelectedFiles(selectedFiles.filter(name => name !== file.name));
                                            }
                                        }}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <div className="flex items-center space-x-4">
                                        {file.type.startsWith("image/") ? (
                                            <img
                                                src={file.url}
                                                alt={file.name}
                                                className="h-12 w-12 object-cover rounded cursor-pointer"
                                                onClick={() => handleMediaPreview(file)}
                                                onError={(e) => {
                                                    console.error("Error loading image:", file.url);
                                                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'%3E%3C/path%3E%3C/svg%3E";
                                                }}
                                            />
                                        ) : file.type.startsWith("video/") ? (
                                            <div
                                                className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center cursor-pointer"
                                                onClick={() => handleMediaPreview(file)}
                                            >
                                                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                                </svg>
                                            </div>
                                        ) : null}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.lastModified).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleMediaPreview(file)}
                                        className="p-2 text-gray-400 hover:text-gray-500"
                                        aria-label={`Preview ${file.name}`}
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(`Are you sure you want to delete ${file.name}?`)) {
                                                handleDeleteFiles();
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500"
                                        aria-label={`Delete ${file.name}`}
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