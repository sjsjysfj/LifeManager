import React, { useRef, useEffect } from 'react';
import type { Block, BlockType } from '../../utils/markdownUtils';

interface BlockItemProps {
  block: Block;
  index?: number;
  isFocused: boolean;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  addBlock: (afterId: string, type?: BlockType, content?: string) => void;
  splitBlock: (id: string, leftContent: string, rightContent: string) => void;
  mergeBlock: (id: string) => void;
  removeBlock: (id: string) => void;
  focusBlock: (id: string, offset?: number) => void;
  focusPrevious: (id: string) => void;
  focusNext: (id: string) => void;
}

const BlockItem: React.FC<BlockItemProps> = ({
  block,
  index,
  isFocused,
  updateBlock,
  addBlock,
  splitBlock,
  mergeBlock,
  removeBlock,
  focusBlock,
  focusPrevious,
  focusNext,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Set initial content and update if block.id changes (recycling component)
  useEffect(() => {
    if (contentRef.current && block.content !== contentRef.current.innerHTML) {
      if (document.activeElement !== contentRef.current) {
         contentRef.current.innerHTML = block.content;
      }
    }
  }, [block.id, block.content]);

  // Handle focus
  useEffect(() => {
    if (isFocused && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isFocused]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    const text = e.currentTarget.textContent || '';
    
    // Markdown Shortcuts
    if (block.type === 'p') {
      // H1: "# "
      if (text.startsWith('# ') || text.startsWith('#\u00A0')) {
         updateBlock(block.id, { type: 'h1', content: text.substring(2) });
         return;
      }
      
      // H2: "## "
      if (text.startsWith('## ') || text.startsWith('##\u00A0')) {
         updateBlock(block.id, { type: 'h2', content: text.substring(3) });
         return;
      }
      
      // H3: "### "
      if (text.startsWith('### ') || text.startsWith('###\u00A0')) {
         updateBlock(block.id, { type: 'h3', content: text.substring(4) });
         return;
      }
      
      // UL: "- " or "* "
      if (text.startsWith('- ') || text.startsWith('-\u00A0') || text.startsWith('* ') || text.startsWith('*\u00A0')) {
         updateBlock(block.id, { type: 'ul', content: text.substring(2) });
         return;
      }
      
      // OL: "1. "
      if (text.match(/^\d+\.(\s|\u00A0)/)) {
         updateBlock(block.id, { type: 'ol', content: text.replace(/^\d+\.(\s|\u00A0)/, '') });
         return;
      }
      
      // Checkbox: "- [ ] "
      if (text.startsWith('- [ ] ') || text.startsWith('- [ ]\u00A0')) {
          updateBlock(block.id, { type: 'checkbox', content: text.substring(6), checked: false });
          return;
      }
      if (text.startsWith('- [x] ') || text.startsWith('- [x]\u00A0')) {
          updateBlock(block.id, { type: 'checkbox', content: text.substring(6), checked: true });
          return;
      }
    }
    
    updateBlock(block.id, { content: newContent });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Split block logic
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
          addBlock(block.id);
          return;
      }

      // We need to split HTML content.
      // Ideally we rely on the browser/contentEditable, but here we are managing blocks.
      // Simple approach: Get text before caret and text after caret?
      // No, we have HTML (bold tags).
      // If selection is collapsed:
      // We need to split the innerHTML.
      // This is complex to do robustly without a library.
      // Simplified:
      // 1. Insert a temporary marker at caret.
      // 2. Get innerHTML.
      // 3. Split by marker.
      // 4. Clean up marker.
      
      // Insert marker
      const range = selection.getRangeAt(0);
      const marker = document.createElement('span');
      marker.id = 'split-marker';
      range.insertNode(marker);
      
      const html = contentRef.current?.innerHTML || '';
      const parts = html.split(`<span id="${marker.id}"></span>`);
      // If split didn't work (e.g. self closing tag issue), try regex?
      // Actually browser might normalize `<span id="split-marker"></span>` to something else or empty.
      
      // Let's try simpler:
      // If we are at end, add empty block.
      // If we are at start, add empty block before? Or move content to new block?
      // Standard: Enter at start -> New empty block above, current block stays.
      // Enter at end -> New empty block below.
      // Enter in middle -> Split.
      
      // Let's just use the marker approach, it's usually fine for simple HTML.
      // But we need to remove the marker node from DOM immediately so we don't mess up display if split fails.
      // Actually, if we updateBlock, the component re-renders with new content.
      
      // Wait, inserting node modifies DOM. `handleInput` might trigger? No, input event not fired for programmatic change usually.
      
      if (parts.length === 2) {
          const left = parts[0];
          const right = parts[1];
          // Remove marker from DOM to be clean
          marker.remove();
          
          splitBlock(block.id, left, right);
      } else {
          // Fallback
          marker.remove();
          addBlock(block.id);
      }
      
    } else if (e.key === 'Backspace') {
      const selection = window.getSelection();
      // Check if cursor is at start
      if (selection && selection.rangeCount > 0 && selection.isCollapsed) {
          // Robust check for "at start":
          // If caret offset is 0 and we are in the first text node...
          // Or simpler: range.startOffset === 0 && range.startContainer === contentRef.current (or first child)
          // But with bold tags, it's tricky.
          // Let's assume if textContent is empty, remove.
          // If not empty, we need to know if we are at the visual start.
          // We can try to move backward. If we can't, we are at start.
          
          // Actually, let's stick to the user requirement: "修复输入或删除字符时光标自动跳转到行首的问题"
          // That was likely due to full re-renders.
          // Here we are handling merging.
          
          // If block is empty, remove it (already handled).
          // If block is not empty, and we are at start, merge with previous.
          
          // How to detect "At start"?
          // range.getClientRects()?
          // Or selection.anchorOffset === 0?
          // If we are inside a <b> tag at start: <b>|Text</b>. anchorNode is text node inside b. offset 0.
          // We need to check if all previous siblings are empty/non-existent.
          
          // Simplified check:
          // If cursor is at beginning of the block content...
          // We can use `range.setStartBefore(contentRef.current!)` and check `range.toString()` is empty?
          // No, that's complex.
          
          // Let's keep the existing "Remove if empty" logic for now.
          // Implementing full merge on backspace is high risk for "cursor jumping" bugs if not perfect.
          // The user asked to fix "cursor jumping to start on input". That is fixed by `useEffect` check.
          // The user also asked "fix inline newline". That is fixed by `Enter` split logic above.
          
          if (!contentRef.current?.textContent && block.type !== 'image') {
            e.preventDefault();
            removeBlock(block.id);
          } else if (block.type === 'image') {
            e.preventDefault();
            removeBlock(block.id);
          } else {
              // If we are at start of non-empty block, merge?
              // Let's try:
              const range = selection.getRangeAt(0);
              // Check if we are at the start of the contentEditable
              // Create a range from start of contentEditable to current caret
              const preCaretRange = range.cloneRange();
              if (contentRef.current) {
                  preCaretRange.selectNodeContents(contentRef.current);
                  preCaretRange.setEnd(range.endContainer, range.endOffset);
                  if (preCaretRange.toString().length === 0) {
                      // We are at start!
                      e.preventDefault();
                      mergeBlock(block.id);
                  }
              }
          }
      }
    } else if (e.key === 'ArrowUp') {
      // Only move if at top line?
      // Default arrow behavior works fine inside text.
      // We only want to jump block if at top edge.
      // But calculating "top edge" is hard (wrapping).
      // For now, let's keep the "ArrowUp moves focus" behavior, 
      // but maybe only if we are at the start? 
      // No, user expects standard text editor behavior.
      // Standard: ArrowUp moves cursor up. If at top line, moves to previous block.
      // Since blocks are separate contentEditables, default ArrowUp STOPS at boundary.
      // So we MUST handle it.
      // But we shouldn't prevent default if we are not at top line.
      
      // How to know if at top line?
      // Comparing y coordinates of caret vs top of box?
      // This is getting complex for "Simplified Markdown Editor".
      // Let's keep the existing logic: ArrowUp ALWAYS goes to previous block.
      // This is acceptable for a block editor (like Notion).
      // Notion does this: Up arrow at top of block -> Prev block. Up arrow in middle -> Up one line.
      // To implement that, we need to know if we are at the top line.
      // Simple heuristic: Get caret rect. Get content rect. If caret.top is close to content.top, we are at top line.
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && contentRef.current) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const contentRect = contentRef.current.getBoundingClientRect();
          // If caret is within first line height (approx 24px or 1.5em)
          if (rect.top - contentRect.top < 30) { // 30px buffer
               e.preventDefault();
               focusPrevious(block.id);
          }
      }
    } else if (e.key === 'ArrowDown') {
      // Similar logic for bottom
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && contentRef.current) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const contentRect = contentRef.current.getBoundingClientRect();
          if (contentRect.bottom - rect.bottom < 30) {
               e.preventDefault();
               focusNext(block.id);
          }
      }
    }
  };

  // Render based on type
  if (block.type === 'image') {
    return (
      <div className="block-item image-block" contentEditable={false}>
        <img 
            src={block.src} 
            alt={block.alt} 
            style={{ maxWidth: '100%', borderRadius: 8, cursor: 'pointer' }}
            onClick={() => focusBlock(block.id)}
            className={isFocused ? 'focused-image' : ''}
        />
        <div 
            ref={contentRef} 
            contentEditable 
            onKeyDown={handleKeyDown} 
            style={{ width: 1, height: 1, opacity: 0, position: 'absolute' }} 
        />
      </div>
    );
  }

  const getPlaceholder = () => {
    switch (block.type) {
        case 'h1': return 'Heading 1';
        case 'h2': return 'Heading 2';
        case 'h3': return 'Heading 3';
        // case 'p': return "Type '/' for commands"; // Removed per requirement
        default: return '';
    }
  };

  const commonProps = {
    ref: contentRef,
    contentEditable: true,
    className: `block-content block-${block.type}`,
    onInput: handleInput,
    onKeyDown: handleKeyDown,
    suppressContentEditableWarning: true,
    'data-placeholder': getPlaceholder(),
    onClick: () => focusBlock(block.id),
    // dangerouslySetInnerHTML removed to prevent cursor jumping
  };

  // Wrapper for checkbox
  if (block.type === 'checkbox') {
    return (
      <div className="block-item checkbox-block" style={{ display: 'flex', alignItems: 'center' }}>
        <input 
          type="checkbox" 
          checked={block.checked} 
          onChange={(e) => updateBlock(block.id, { checked: e.target.checked })}
          style={{ marginRight: 8 }}
        />
        <div {...commonProps} style={{ flex: 1 }} />
      </div>
    );
  }
  
  // Wrapper for lists
  if (block.type === 'ul') {
      return (
          <div className="block-item ul-block" style={{ display: 'flex' }}>
              <span style={{ marginRight: 8 }}>•</span>
              <div {...commonProps} style={{ flex: 1 }} />
          </div>
      )
  }

  if (block.type === 'ol') {
      return (
          <div className="block-item ol-block" style={{ display: 'flex' }}>
              <span style={{ marginRight: 8 }}>{index ? `${index}.` : '1.'}</span> 
              <div {...commonProps} style={{ flex: 1 }} />
          </div>
      )
  }

  // Wrapper for Headings and Paragraph
  return (
    <div className={`block-item ${block.type}-wrapper`}>
      <div {...commonProps} />
    </div>
  );
};

export default BlockItem;
