import React from 'react';
import BlockEditor from './BlockEditor/BlockEditor';

interface MarkdownEditorProps {
  value: string;
  onChange: (value?: string) => void;
  height?: number | string;
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
  // If preview is 'preview', we set readOnly to true
  // Note: 'live' and 'edit' both mean editable in our WYSIWYG editor
  const readOnly = preview === 'preview';

  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  return (
    <div 
      className="markdown-editor-container" 
      data-color-mode="light"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <BlockEditor
        value={value || ''}
        onChange={handleChange}
        readOnly={readOnly}
      />
    </div>
  );
};

export default MarkdownEditor;
