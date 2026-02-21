import { describe, it, expect } from 'vitest';
import { parseMarkdown, serializeMarkdown, Block } from './markdownUtils';

describe('markdownUtils', () => {
  describe('parseMarkdown', () => {
    it('parses headings', () => {
      const input = '# H1\n## H2\n### H3';
      const blocks = parseMarkdown(input);
      expect(blocks).toHaveLength(3);
      expect(blocks[0].type).toBe('h1');
      expect(blocks[0].content).toBe('H1');
      expect(blocks[1].type).toBe('h2');
      expect(blocks[1].content).toBe('H2');
      expect(blocks[2].type).toBe('h3');
      expect(blocks[2].content).toBe('H3');
    });

    it('parses lists', () => {
      const input = '- Item 1\n* Item 2\n1. Item 3';
      const blocks = parseMarkdown(input);
      expect(blocks).toHaveLength(3);
      expect(blocks[0].type).toBe('ul');
      expect(blocks[0].content).toBe('Item 1');
      expect(blocks[1].type).toBe('ul');
      expect(blocks[1].content).toBe('Item 2');
      expect(blocks[2].type).toBe('ol');
      expect(blocks[2].content).toBe('Item 3');
    });

    it('parses checkboxes', () => {
      const input = '- [ ] Unchecked\n- [x] Checked';
      const blocks = parseMarkdown(input);
      expect(blocks).toHaveLength(2);
      expect(blocks[0].type).toBe('checkbox');
      expect(blocks[0].checked).toBe(false);
      expect(blocks[0].content).toBe('Unchecked');
      expect(blocks[1].type).toBe('checkbox');
      expect(blocks[1].checked).toBe(true);
      expect(blocks[1].content).toBe('Checked');
    });

    it('parses images', () => {
      const input = '![Alt](http://example.com/img.png)';
      const blocks = parseMarkdown(input);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('image');
      expect(blocks[0].alt).toBe('Alt');
      expect(blocks[0].src).toBe('http://example.com/img.png');
    });

    it('parses bold text inline', () => {
      const input = 'Text with **bold** content';
      const blocks = parseMarkdown(input);
      expect(blocks[0].content).toBe('Text with <strong>bold</strong> content');
    });
    
    it('handles empty input', () => {
      const blocks = parseMarkdown('');
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('p');
    });

    it('escapes HTML entities', () => {
      const input = '<script>alert(1)</script>';
      const blocks = parseMarkdown(input);
      expect(blocks[0].content).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('performance: parses large input quickly', () => {
      const line = '- [ ] Task item with **bold** text\n';
      const input = line.repeat(1000).trim();
      const start = performance.now();
      const blocks = parseMarkdown(input);
      const end = performance.now();
      expect(blocks).toHaveLength(1000);
      expect(end - start).toBeLessThan(100); 
    });
  });

  describe('serializeMarkdown', () => {
    it('serializes headings', () => {
      const blocks: Block[] = [
        { id: '1', type: 'h1', content: 'H1' },
        { id: '2', type: 'h2', content: 'H2' },
        { id: '3', type: 'h3', content: 'H3' }
      ];
      expect(serializeMarkdown(blocks)).toBe('# H1\n## H2\n### H3');
    });

    it('serializes lists', () => {
      const blocks: Block[] = [
        { id: '1', type: 'ul', content: 'Item 1' },
        { id: '2', type: 'ol', content: 'Item 2' }
      ];
      expect(serializeMarkdown(blocks)).toBe('- Item 1\n1. Item 2');
    });

    it('serializes checkboxes', () => {
        const blocks: Block[] = [
            { id: '1', type: 'checkbox', content: 'Task', checked: true },
            { id: '2', type: 'checkbox', content: 'Task 2', checked: false }
        ];
        expect(serializeMarkdown(blocks)).toBe('- [x] Task\n- [ ] Task 2');
    });

    it('serializes images', () => {
        const blocks: Block[] = [
            { id: '1', type: 'image', content: '', alt: 'Alt', src: 'url' }
        ];
        expect(serializeMarkdown(blocks)).toBe('![Alt](url)');
    });

    it('serializes bold text', () => {
      const blocks: Block[] = [
        { id: '1', type: 'p', content: 'Text <strong>bold</strong>' },
        { id: '2', type: 'p', content: 'Text <b>bold</b>' }
      ];
      expect(serializeMarkdown(blocks)).toBe('Text **bold**\nText **bold**');
    });

    it('decodes HTML entities', () => {
      const blocks: Block[] = [
        { id: '1', type: 'p', content: '&lt;script&gt;alert(1)&lt;/script&gt;' }
      ];
      expect(serializeMarkdown(blocks)).toBe('<script>alert(1)</script>');
    });
  });
});
