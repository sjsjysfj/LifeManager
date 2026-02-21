import { v4 as uuidv4 } from 'uuid';

export type BlockType = 'p' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'checkbox' | 'image';

export interface Block {
  id: string;
  type: BlockType;
  content: string; // HTML string for inline styles (bold)
  checked?: boolean; // For checkbox
  src?: string; // For image
  alt?: string; // For image
}

// Helper to sanitize and process inline HTML
// We only allow <b>, <strong>, <br>
const sanitizeInlineHtml = (html: string): string => {
  // In a real app we might use DOMPurify, but for this restricted requirement:
  // We will assume the input from our editor is safe-ish, but when parsing markdown,
  // we need to convert **text** to <strong>text</strong>.
  return html;
};

export const parseMarkdown = (markdown: string): Block[] => {
  if (!markdown) return [{ id: uuidv4(), type: 'p', content: '' }];

  const lines = markdown.split('\n');
  const blocks: Block[] = [];

  // Regex patterns
  const patterns = {
    h1: /^#\s+(.+)$/,
    h2: /^##\s+(.+)$/,
    h3: /^###\s+(.+)$/,
    ul: /^[-*]\s+(.+)$/,
    ol: /^\d+\.\s+(.+)$/,
    checkbox: /^- \[([ x])\]\s+(.+)$/,
    image: /^!\[(.*?)\]\((.*?)\)$/
  };

  // Process inline styles (bold) -> <strong>
  const processInline = (text: string): string => {
    // Escape HTML first to prevent XSS and ensure correct rendering
    let processed = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    // Replace **text** with <strong>text</strong>
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    return processed;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
       // Empty line -> Empty paragraph? Or skip?
       // Usually empty lines in markdown separate blocks.
       // In block editor, an empty line is an empty paragraph block.
       blocks.push({ id: uuidv4(), type: 'p', content: '' });
       continue;
    }

    let match;
    
    // H1
    if ((match = line.match(patterns.h1))) {
      blocks.push({ id: uuidv4(), type: 'h1', content: processInline(match[1]) });
      continue;
    }
    
    // H2
    if ((match = line.match(patterns.h2))) {
      blocks.push({ id: uuidv4(), type: 'h2', content: processInline(match[1]) });
      continue;
    }
    
    // H3
    if ((match = line.match(patterns.h3))) {
      blocks.push({ id: uuidv4(), type: 'h3', content: processInline(match[1]) });
      continue;
    }
    
    // Checkbox
    if ((match = line.match(patterns.checkbox))) {
      blocks.push({ 
        id: uuidv4(), 
        type: 'checkbox', 
        content: processInline(match[2]), 
        checked: match[1] === 'x' 
      });
      continue;
    }

    // UL
    if ((match = line.match(patterns.ul))) {
      blocks.push({ id: uuidv4(), type: 'ul', content: processInline(match[1]) });
      continue;
    }
    
    // OL
    if ((match = line.match(patterns.ol))) {
      blocks.push({ id: uuidv4(), type: 'ol', content: processInline(match[1]) });
      continue;
    }
    
    // Image
    if ((match = line.match(patterns.image))) {
      blocks.push({ 
        id: uuidv4(), 
        type: 'image', 
        content: '', 
        alt: match[1], 
        src: match[2] 
      });
      continue;
    }

    // Default: Paragraph
    blocks.push({ id: uuidv4(), type: 'p', content: processInline(line) });
  }

  return blocks.length > 0 ? blocks : [{ id: uuidv4(), type: 'p', content: '' }];
};

export const serializeMarkdown = (blocks: Block[]): string => {
  return blocks.map(block => {
    // Process inline HTML -> Markdown
    // <strong>text</strong> -> **text**
    // <b>text</b> -> **text**
    let content = block.content || '';
    
    // Replace <b> and <strong> with **
    content = content.replace(/<(?:strong|b)>(.*?)<\/(?:strong|b)>/g, '**$1**');
    
    // Remove other HTML tags (sanitization/filtering)
    // Keep text content of other tags
    content = content.replace(/<(?!\/?(strong|b))[^>]+>/g, '');
    
    // Decode HTML entities if necessary? contentEditable might escape < >
    // But usually innerHTML gives us tags.
    // We might need to handle &nbsp; -> space
    content = content.replace(/&nbsp;/g, ' ');

    // Decode entities
    content = content
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, "&");

    switch (block.type) {
      case 'h1':
        return `# ${content}`;
      case 'h2':
        return `## ${content}`;
      case 'h3':
        return `### ${content}`;
      case 'ul':
        return `- ${content}`;
      case 'ol':
        return `1. ${content}`; // We just use 1. for all, markdown renders it correctly
      case 'checkbox':
        return `- [${block.checked ? 'x' : ' '}] ${content}`;
      case 'image':
        return `![${block.alt || ''}](${block.src || ''})`;
      case 'p':
      default:
        return content;
    }
  }).join('\n');
};
