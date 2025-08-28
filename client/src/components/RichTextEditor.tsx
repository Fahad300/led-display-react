import React from "react";
import { Editor } from "@tinymce/tinymce-react";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

/**
 * RichTextEditor component using TinyMCE for reliable text formatting
 * Provides full rich text editing capabilities with proper formatting application
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = "Enter your text here...",
    className = ""
}) => {
    const handleEditorChange = (content: string) => {
        onChange(content);
    };

    return (
        <div className={`rich-text-editor ${className}`}>
            <Editor
                apiKey="5hh7p56xnrugdfeg6wmd6yezyxuflf5s9uuk3gxah0wu7ocg"
                value={value}
                onEditorChange={handleEditorChange}
                init={{
                    height: 400,
                    menubar: false,
                    plugins: [
                        "advlist", "autolink", "lists", "link", "image", "charmap", "preview",
                        "anchor", "searchreplace", "visualblocks", "code", "fullscreen",
                        "insertdatetime", "media", "table", "code", "help", "wordcount", "textcolor"
                    ],
                    toolbar: "undo redo | formatselect | " +
                        "bold italic | forecolor backcolor | alignleft aligncenter " +
                        "alignright alignjustify | bullist numlist outdent indent | " +
                        "removeformat | help",
                    textcolor_map: [
                        "000000", "Black",
                        "FFFFFF", "White",
                        "FF0000", "Red",
                        "00FF00", "Green",
                        "0000FF", "Blue",
                        "FFFF00", "Yellow",
                        "FF00FF", "Magenta",
                        "00FFFF", "Cyan",
                        "FFA500", "Orange",
                        "800080", "Purple",
                        "8CE6C9", "Teal",
                        "FFD700", "Gold",
                        "00D4FF", "Light Blue"
                    ],
                    content_style: `
                        body { 
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                            font-size: 14px;
                            line-height: 1.6;
                            color: white;
                            background-color: #1e293b;
                        }
                        h1, h2, h3, h4, h5, h6 {
                            margin: 1em 0 0.5em 0;
                            font-weight: bold;
                            line-height: 1.2;
                            color: white;
                        }
                        h1 { font-size: 2em; }
                        h2 { font-size: 1.5em; }
                        h3 { font-size: 1.17em; }
                        h4 { font-size: 1em; }
                        h5 { font-size: 0.83em; }
                        h6 { font-size: 0.67em; }
                        p { margin: 0.5em 0; color: white; }
                        ul, ol { margin: 0.5em 0; padding-left: 2em; color: white; }
                        li { margin: 0.25em 0; color: white; }
                        a { color: #00D4FF; text-decoration: underline; }
                        a:hover { color: #00B8E6; }
                        strong, b { color: #8CE6C9; }
                        em, i { color: #FFD700; }
                        blockquote {
                            margin: 1em 0;
                            padding: 0.5em 1em;
                            border-left: 4px solid #8CE6C9;
                            background-color: rgba(0, 0, 0, 0.3);
                            color: #E6E6FA;
                        }
                        code {
                            background-color: rgba(0, 0, 0, 0.2);
                            padding: 0.2em 0.4em;
                            border-radius: 3px;
                            font-family: 'Courier New', monospace;
                            color: #FFD700;
                        }
                        pre {
                            background-color: rgba(0, 0, 0, 0.3);
                            padding: 1em;
                            border-radius: 5px;
                            overflow-x: auto;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            color: #E6E6FA;
                        }
                    `,
                    placeholder: placeholder,
                    branding: false,
                    elementpath: false,
                    statusbar: false,
                    resize: false,
                    setup: (editor: any) => {
                        // Custom setup if needed
                        editor.on("init", () => {
                            editor.focus();
                        });
                    }
                }}
            />
        </div>
    );
};

export default RichTextEditor;
