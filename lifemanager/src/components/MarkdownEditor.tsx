import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';

// Create a wrapper for styling purposes if needed
interface MarkdownEditorProps {
  value: string;
  onChange: (value?: string) => void;
  height?: number;
  preview?: 'live' | 'edit' | 'preview';
  placeholder?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ 
  value, 
  onChange, 
  height = 400,
  preview = 'live',
  placeholder 
}) => {
  // We can add custom styles or configuration here
  // For now, basic integration
  
  return (
    <div className="markdown-editor-container" data-color-mode="light">
      <MDEditor
        value={value}
        onChange={onChange}
        height={height}
        preview={preview}
        textareaProps={{
          placeholder: placeholder
        }}
        previewOptions={{
          rehypePlugins: [[rehypeSanitize]],
        }}
        visibleDragbar={false}
      />
    </div>
  );
};

export default MarkdownEditor;
