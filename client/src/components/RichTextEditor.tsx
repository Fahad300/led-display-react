import React, { useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import CodeBlock from "@tiptap/extension-code-block";
import Image from "@tiptap/extension-image";
import { MediaSelector } from "./MediaSelector";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

/**
 * RichTextEditor component using Tiptap for reliable text formatting
 * Provides full rich text editing capabilities with proper formatting application
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = "Enter your text here...",
    className = ""
}) => {
    const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // We'll use the separate CodeBlock extension
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            TextStyle,
            Color.configure({
                types: [TextStyle.name],
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-blue-400 hover:text-blue-300 underline",
                },
            }),
            Underline,
            CodeBlock.configure({
                HTMLAttributes: {
                    class: "bg-gray-800 text-yellow-300 p-4 rounded border border-gray-600",
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: "max-w-full h-auto rounded-lg shadow-sm",
                },
                allowBase64: false,
                inline: false,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose max-w-none focus:outline-none min-h-[400px] p-4",
                placeholder: placeholder,
            },
        },
    });

    const setLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL", previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        // update link
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }, [editor]);

    const addImage = useCallback(() => {
        if (!editor) return;

        const url = window.prompt("Enter image URL:");

        if (url) {
            // Validate URL
            try {
                new URL(url);
                editor.chain().focus().setImage({ src: url, alt: "Image" }).run();
            } catch (error) {
                alert("Please enter a valid URL");
            }
        }
    }, [editor]);

    const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!editor) return;

        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            try {
                // Upload file using existing API
                const formData = new FormData();
                formData.append('file', file);
                formData.append('description', `Rich text editor image: ${file.name}`);

                const response = await fetch('/api/files/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const result = await response.json();
                    const imageUrl = result.url;
                    editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
                } else {
                    console.error('Failed to upload image');
                    alert('Failed to upload image. Please try again.');
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Error uploading image. Please try again.');
            }
        }
    }, [editor]);

    const handleImageSelect = useCallback((url: string) => {
        if (!editor) return;
        editor.chain().focus().setImage({ src: url, alt: "Image" }).run();
        setIsMediaSelectorOpen(false);
    }, [editor]);

    if (!editor) {
        return null;
    }

    const MenuButton = ({
        onClick,
        isActive = false,
        children,
        title
    }: {
        onClick: () => void;
        isActive?: boolean;
        children: React.ReactNode;
        title: string;
    }) => (
        <button
            onClick={onClick}
            className={`p-2 rounded transition-colors ${isActive
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                }`}
            title={title}
        >
            {children}
        </button>
    );

    return (
        <div className={`rich-text-editor border border-gray-300 rounded-lg overflow-hidden ${className}`}>
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
                {/* Undo/Redo */}
                <MenuButton
                    onClick={() => editor.chain().focus().undo().run()}
                    title="Undo"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().redo().run()}
                    title="Redo"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </MenuButton>

                <div className="w-px h-8 bg-gray-300 mx-1" />

                {/* Text Formatting */}
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive("bold")}
                    title="Bold"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 4a1 1 0 011-1h5.5a2.5 2.5 0 011.5 4.5 2.5 2.5 0 010 5H6a1 1 0 01-1-1V4zm2 1v2h4.5a.5.5 0 000-1H7zm0 4v2h5.5a.5.5 0 000-1H7z" />
                    </svg>
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive("italic")}
                    title="Italic"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 2a1 1 0 011 1v1h3a1 1 0 110 2H9v8h2a1 1 0 110 2H6a1 1 0 110-2h2V5H5a1 1 0 110-2h3V3a1 1 0 011-1z" />
                    </svg>
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive("underline")}
                    title="Underline"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 7.707 7.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3z" clipRule="evenodd" />
                    </svg>
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive("strike")}
                    title="Strikethrough"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    isActive={editor.isActive("code")}
                    title="Inline Code"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </MenuButton>

                <div className="w-px h-8 bg-gray-300 mx-1" />

                {/* Headings */}
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive("heading", { level: 1 })}
                    title="Heading 1"
                >
                    H1
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive("heading", { level: 2 })}
                    title="Heading 2"
                >
                    H2
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive("heading", { level: 3 })}
                    title="Heading 3"
                >
                    H3
                </MenuButton>

                <div className="w-px h-8 bg-gray-300 mx-1" />

                {/* Lists */}
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive("bulletList")}
                    title="Bullet List"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 5a1 1 0 100 2h.01a1 1 0 100-2H3zm3 0a1 1 0 100 2h12a1 1 0 100-2H6zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H3zm3 0a1 1 0 100 2h12a1 1 0 100-2H6zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H3zm3 0a1 1 0 100 2h12a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive("orderedList")}
                    title="Numbered List"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4h1v1H3V4zm2 0h12v1H5V4zm-2 3h1v1H3V7zm2 0h12v1H5V7zm-2 3h1v1H3v-1zm2 0h12v1H5v-1zm-2 3h1v1H3v-1zm2 0h12v1H5v-1z" />
                        <text x="3.5" y="4.8" fontSize="3" fill="currentColor">1</text>
                        <text x="3.5" y="7.8" fontSize="3" fill="currentColor">2</text>
                        <text x="3.5" y="10.8" fontSize="3" fill="currentColor">3</text>
                        <text x="3.5" y="13.8" fontSize="3" fill="currentColor">4</text>
                    </svg>
                </MenuButton>

                <div className="w-px h-8 bg-gray-300 mx-1" />

                {/* Alignment */}
                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    isActive={editor.isActive({ textAlign: "left" })}
                    title="Align Left"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h10a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    isActive={editor.isActive({ textAlign: "center" })}
                    title="Align Center"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm2 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm-2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm3 4a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign("right").run()}
                    isActive={editor.isActive({ textAlign: "right" })}
                    title="Align Right"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1zm2 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zm-6 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm10 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                    isActive={editor.isActive({ textAlign: "justify" })}
                    title="Justify"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                </MenuButton>

                <div className="w-px h-8 bg-gray-300 mx-1" />

                {/* Block Elements */}
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive("blockquote")}
                    title="Quote"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 8c0-2.2 1.8-4 4-4v2c-1.1 0-2 .9-2 2s.9 2 2 2h2v4H3V8zm10 0c0-2.2 1.8-4 4-4v2c-1.1 0-2 .9-2 2s.9 2 2 2h2v4h-6V8z" />
                    </svg>
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    isActive={editor.isActive("codeBlock")}
                    title="Code Block"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </MenuButton>

                <div className="w-px h-8 bg-gray-300 mx-1" />

                {/* Link */}
                <MenuButton
                    onClick={setLink}
                    isActive={editor.isActive("link")}
                    title="Add Link"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().unsetLink().run()}
                    isActive={editor.isActive("link")}
                    title="Remove Link"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </MenuButton>

                <div className="w-px h-8 bg-gray-300 mx-1" />

                {/* Image */}
                <MenuButton
                    onClick={addImage}
                    title="Add Image from URL"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                </MenuButton>

                {/* Image Upload */}
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Upload Image"
                    />
                    <MenuButton
                        onClick={() => { }}
                        title="Upload Image from Computer"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </MenuButton>
                </div>

                {/* Image Library */}
                <MenuButton
                    onClick={() => setIsMediaSelectorOpen(true)}
                    title="Select Image from Library"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                </MenuButton>

                <div className="w-px h-8 bg-gray-300 mx-1" />

                {/* Text Color */}
                <div className="flex items-center gap-2">
                    <label className="text-gray-700 text-sm">Color:</label>
                    <input
                        type="color"
                        onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
                        value={editor.getAttributes("textStyle").color || "#000000"}
                        className="w-8 h-8 rounded border border-gray-300 bg-white"
                        title="Text Color"
                    />
                </div>
            </div>

            {/* Editor Content */}
            <div className="bg-white">
                <EditorContent
                    editor={editor}
                    className="prose max-w-none focus:outline-none min-h-[400px] p-4"
                />
            </div>

            {/* Media Selector */}
            <MediaSelector
                isOpen={isMediaSelectorOpen}
                onClose={() => setIsMediaSelectorOpen(false)}
                onSelect={handleImageSelect}
                acceptedTypes={["image"]}
                title="Select Image"
            />
        </div>
    );
};

export default RichTextEditor;