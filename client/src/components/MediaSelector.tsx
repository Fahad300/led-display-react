import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "../contexts/ToastContext";
import MediaModal from "./MediaModal";
import { backendApi } from "../services/api";

interface MediaFile {
    name: string;
    url: string;
    type: "image" | "video";
    size: number;
    lastModified: number;
}

interface MediaSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    acceptedTypes?: ("image" | "video")[];
    title?: string;
}

/**
 * MediaSelector Component
 * A modal component that allows users to select from existing media or upload new files
 */
export const MediaSelector: React.FC<MediaSelectorProps> = ({
    isOpen,
    onClose,
    onSelect,
    acceptedTypes = ["image", "video"],
    title = "Select Media"
}) => {
    const { addToast } = useToast();
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
    const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);

    const fetchFiles = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No authentication token found");
            }

            const response = await backendApi.get(`/api/files`);

            const filteredFiles = response.data.files.filter((file: MediaFile) =>
                acceptedTypes.includes(file.type)
            );
            setFiles(filteredFiles);
        } catch (error) {
            console.error("Error fetching files:", error);
            addToast("Failed to load media files", "error");
        } finally {
            setIsLoading(false);
        }
    }, [acceptedTypes, addToast]);

    // Fetch files on mount and when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchFiles();
        }
    }, [isOpen, fetchFiles]);

    // Close modal when Escape key is pressed
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");

        if (!isVideo && !isImage) {
            addToast("Please upload an image or video file", "error");
            return;
        }

        if (!acceptedTypes.includes(isVideo ? "video" : "image")) {
            addToast(`Please upload a ${acceptedTypes.join(" or ")} file`, "error");
            return;
        }

        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            addToast("File size should be less than 100MB", "error");
            return;
        }

        setIsUploading(true);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No authentication token found");
            }

            const formData = new FormData();
            formData.append("file", file);

            const response = await backendApi.post(`/api/files/upload`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            const data = response.data;
            if (!data.url) {
                throw new Error("Invalid response: missing file URL");
            }

            // Determine file type from MIME type
            let fileType: "image" | "video";
            if (data.mimeType) {
                if (data.mimeType.startsWith("video/")) {
                    fileType = "video";
                } else if (data.mimeType.startsWith("image/")) {
                    fileType = "image";
                } else {
                    fileType = "image"; // Default fallback
                }
            } else {
                // Fallback to checking the original file type
                fileType = isVideo ? "video" : "image";
            }

            const newFile: MediaFile = {
                name: data.originalName || file.name,
                url: data.url,
                type: fileType,
                size: data.size || file.size,
                lastModified: file.lastModified
            };

            setFiles(prev => [newFile, ...prev]);
            setSelectedFile(newFile);
            addToast("File uploaded successfully", "success");
        } catch (error) {
            console.error("Error uploading file:", error);
            addToast(error instanceof Error ? error.message : "Failed to upload file", "error");
        } finally {
            setIsUploading(false);
            // Reset the file input
            e.target.value = "";
        }
    };

    const handleSelect = (file: MediaFile) => {
        setSelectedFile(file);
    };

    const handlePreview = (file: MediaFile) => {
        setPreviewFile(file);
    };

    const handleConfirm = () => {
        if (selectedFile) {
            onSelect(selectedFile.url);
            onClose();
        }
    };

    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                        <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                    </div>

                    <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        {title}
                                    </h3>

                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                            <p className="text-gray-500">Loading media files...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-4">
                                                <input
                                                    type="text"
                                                    placeholder="Search files..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
                                                {filteredFiles.map((file) => (
                                                    <div
                                                        key={file.url}
                                                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 ${selectedFile?.url === file.url
                                                            ? "border-blue-600"
                                                            : "border-transparent hover:border-gray-300"
                                                            }`}
                                                        onClick={() => handleSelect(file)}
                                                    >
                                                        {file.type === "image" ? (
                                                            <img
                                                                src={file.url}
                                                                alt={file.name}
                                                                className="w-full h-32 object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                                                                <svg
                                                                    className="w-12 h-12 text-gray-400"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePreview(file);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                            >
                                                                Preview
                                                            </button>
                                                        </div>
                                                        <div className="p-2">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {file.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-4 flex justify-between items-center">
                                                <div>
                                                    <label
                                                        htmlFor="file-upload"
                                                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                                    >
                                                        <span>Upload new file</span>
                                                        <input
                                                            id="file-upload"
                                                            name="file-upload"
                                                            type="file"
                                                            className="sr-only"
                                                            onChange={handleFileUpload}
                                                            accept={acceptedTypes
                                                                .map((type) =>
                                                                    type === "image"
                                                                        ? "image/*"
                                                                        : "video/*"
                                                                )
                                                                .join(",")}
                                                            disabled={isUploading}
                                                        />
                                                    </label>
                                                    {isUploading && (
                                                        <span className="ml-2 text-sm text-gray-500">
                                                            Uploading...
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex space-x-3">
                                                    <button
                                                        type="button"
                                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        onClick={onClose}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        onClick={handleConfirm}
                                                        disabled={!selectedFile}
                                                    >
                                                        Select
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {previewFile && (
                <MediaModal
                    isOpen={!!previewFile}
                    onClose={() => setPreviewFile(null)}
                    mediaUrl={previewFile.url}
                    mediaType={previewFile.type === "image" ? "image/jpeg" : "video/mp4"}
                    mediaName={previewFile.name}
                />
            )}
        </>
    );
};

export default MediaSelector; 