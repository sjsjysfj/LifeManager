import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { parseMarkdown, serializeMarkdown } from '../../utils/markdownUtils';
import type { Block, BlockType } from '../../utils/markdownUtils';
import BlockItem from './BlockItem';
import Toolbar from './Toolbar';
import './BlockEditor.css';

interface BlockEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

const BlockEditor: React.FC<BlockEditorProps> = ({ value, onChange, readOnly = false }) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  
  // Ref to track if we should ignore value updates (avoid loop)
  const isInternalChange = useRef(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize blocks from value
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const parsed = parseMarkdown(value);
    // Workaround: If we have blocks, and value matches serialize(blocks), don't update.
    const currentSerialized = serializeMarkdown(blocks);
    if (currentSerialized === value && blocks.length > 0) return;

    setBlocks(parsed);
  }, [value]);

  const emitChange = useCallback((newBlocks: Block[]) => {
    isInternalChange.current = true;
    const markdown = serializeMarkdown(newBlocks);
    onChange(markdown);
  }, [onChange]);

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(prev => {
      const newBlocks = prev.map(b => b.id === id ? { ...b, ...updates } : b);
      emitChange(newBlocks);
      return newBlocks;
    });
  };

  const addBlock = (afterId: string, type: BlockType = 'p', content: string = '', extraProps: Partial<Block> = {}) => {
    const newId = uuidv4();
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === afterId);
      const newBlock: Block = { id: newId, type, content, ...extraProps };
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      emitChange(newBlocks);
      return newBlocks;
    });
    // Focus new block after render
    setTimeout(() => setFocusedBlockId(newId), 0);
  };

  // Split block at cursor position (handled by BlockItem calling this)
  const splitBlock = (id: string, leftContent: string, rightContent: string) => {
      const newId = uuidv4();
      setBlocks(prev => {
          const index = prev.findIndex(b => b.id === id);
          if (index === -1) return prev;
          
          const currentBlock = prev[index];
          
          // Update current block with left content
          const updatedCurrent = { ...currentBlock, content: leftContent };
          
          // Determine new type
          let newType = currentBlock.type;
          if (['h1', 'h2', 'h3'].includes(newType)) {
              newType = 'p';
          }
          
          const newBlock: Block = { id: newId, type: newType, content: rightContent };
          if (newType === 'checkbox') {
              newBlock.checked = false; // Reset checkbox
          }

          const newBlocks = [...prev];
          newBlocks[index] = updatedCurrent;
          newBlocks.splice(index + 1, 0, newBlock);
          
          emitChange(newBlocks);
          return newBlocks;
      });
      // Focus new block
      setTimeout(() => setFocusedBlockId(newId), 0);
  };

  // Merge block with previous
  const mergeBlock = (id: string) => {
      // Find prev ID for focus
      const index = blocks.findIndex(b => b.id === id);
      if (index <= 0) return;
      const prevId = blocks[index - 1].id;

      setBlocks(prev => {
          const idx = prev.findIndex(b => b.id === id);
          if (idx <= 0) return prev;
          
          const currentBlock = prev[idx];
          const prevBlock = prev[idx - 1];
          
          // Don't merge if previous is image or current is image?
          if (prevBlock.type === 'image' || currentBlock.type === 'image') {
              if (!currentBlock.content) {
                  const newBlocks = prev.filter(b => b.id !== id);
                  emitChange(newBlocks);
                  return newBlocks;
              }
              return prev;
          }

          // Merge content: prev + current
          const newContent = prevBlock.content + currentBlock.content;
          
          const updatedPrev = { ...prevBlock, content: newContent };
          const newBlocks = [...prev];
          newBlocks[idx - 1] = updatedPrev;
          newBlocks.splice(idx, 1); // Remove current
          
          emitChange(newBlocks);
          
          return newBlocks;
      });
      
      setTimeout(() => setFocusedBlockId(prevId), 0);
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === id);
      if (index <= 0 && prev.length === 1) {
          // Don't remove the last block
          return prev;
      }
      
      const newBlocks = prev.filter(b => b.id !== id);
      
      // Focus previous
      if (index > 0) {
          setFocusedBlockId(prev[index - 1].id);
      } else if (newBlocks.length > 0) {
          setFocusedBlockId(newBlocks[0].id);
      }
      
      emitChange(newBlocks);
      return newBlocks;
    });
  };

  const focusBlock = (id: string) => {
    setFocusedBlockId(id);
  };

  const focusPrevious = (id: string) => {
      const index = blocks.findIndex(b => b.id === id);
      if (index > 0) {
          setFocusedBlockId(blocks[index - 1].id);
      }
  };

  const focusNext = (id: string) => {
      const index = blocks.findIndex(b => b.id === id);
      if (index < blocks.length - 1) {
          setFocusedBlockId(blocks[index + 1].id);
      }
  };

  // Toolbar handlers
  const handleToggleType = (type: BlockType) => {
    if (!focusedBlockId) return;
    
    // Check if we are toggling off
    const currentBlock = blocks.find(b => b.id === focusedBlockId);
    if (currentBlock && currentBlock.type === type) {
        // Toggle off -> set to 'p'
        updateBlock(focusedBlockId, { type: 'p' });
    } else {
        updateBlock(focusedBlockId, { type });
    }
  };

  const handleToggleBold = () => {
    document.execCommand('bold');
    // Content update happens via onInput in BlockItem
  };

  const handleAddImage = () => {
    // If no block is focused, use the last block or first block?
    // If blocks is empty (unlikely as we init with one P), use it.
    let targetId = focusedBlockId;
    if (!targetId) {
        if (blocks.length > 0) {
            targetId = blocks[blocks.length - 1].id;
        } else {
            // Should not happen if we ensure at least one block
            return; 
        }
    }

    const url = prompt('Enter Image URL:');
    if (url && targetId) {
       // Replace current block if empty, else add new
       const currentBlock = blocks.find(b => b.id === targetId);
       if (currentBlock && !currentBlock.content && currentBlock.type === 'p') {
           updateBlock(targetId, { type: 'image', src: url, alt: 'Image' });
       } else {
           addBlock(targetId, 'image', '', { src: url, alt: 'Image' });
       }
    }
  };

  // Get current type for toolbar
  const currentBlock = blocks.find(b => b.id === focusedBlockId);

  return (
    <div className="block-editor-container">
      {!readOnly && (
        <Toolbar 
            onToggleType={handleToggleType} 
            onToggleBold={handleToggleBold} 
            onAddImage={handleAddImage}
            currentType={currentBlock?.type || null}
        />
      )}
      <div className="block-editor-content" ref={editorRef}>
        {blocks.map((block, i) => {
          let index: number | undefined;
          if (block.type === 'ol') {
            let count = 1;
            for (let j = i - 1; j >= 0; j--) {
              if (blocks[j].type === 'ol') {
                count++;
              } else {
                break;
              }
            }
            index = count;
          }

          return (
            <BlockItem
              key={block.id}
              block={block}
              index={index}
              isFocused={focusedBlockId === block.id}
              updateBlock={updateBlock}
              addBlock={addBlock}
              splitBlock={splitBlock}
              mergeBlock={mergeBlock}
              removeBlock={removeBlock}
              focusBlock={focusBlock}
              focusPrevious={focusPrevious}
              focusNext={focusNext}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BlockEditor;
