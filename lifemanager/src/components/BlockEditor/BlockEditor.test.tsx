import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BlockEditor from './BlockEditor';
import '@testing-library/jest-dom';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();
// Mock prompt
window.prompt = vi.fn();

// Mock document.execCommand for bold
document.execCommand = vi.fn();

// Mock selection
const mockSelection = {
  rangeCount: 1,
  getRangeAt: () => ({
    cloneRange: () => ({
      selectNodeContents: () => {},
      setEnd: () => {},
      toString: () => '',
    }),
    getBoundingClientRect: () => ({ top: 0, bottom: 20 }),
    insertNode: () => {},
  }),
  isCollapsed: true,
};
window.getSelection = vi.fn(() => mockSelection as any);

describe('BlockEditor Interaction', () => {
  it('renders initial content correctly', () => {
    const value = 'Paragraph text';
    render(<BlockEditor value={value} onChange={() => {}} />);
    expect(screen.getByText('Paragraph text')).toBeInTheDocument();
  });

  it('handles bold toggle', () => {
    const value = 'Text';
    render(<BlockEditor value={value} onChange={() => {}} />);
    
    // Focus text
    const text = screen.getByText('Text');
    fireEvent.click(text);
    
    // Click Bold button
    const boldBtn = screen.getByRole('button', { name: /bold/i });
    fireEvent.click(boldBtn);
    
    expect(document.execCommand).toHaveBeenCalledWith('bold');
  });

  it('toggles block types (P -> H1 -> P)', async () => {
    const onChange = vi.fn();
    const value = 'Heading';
    render(<BlockEditor value={value} onChange={onChange} />);
    
    const text = screen.getByText('Heading');
    fireEvent.click(text); // Focus
    
    // Click H1
    const h1Btn = screen.getByRole('button', { name: 'H1' });
    fireEvent.click(h1Btn);
    
    expect(onChange).toHaveBeenCalledWith('# Heading');
    
    // Wait for button to become active (primary)
    await waitFor(() => {
        const btn = screen.getByRole('button', { name: 'H1' });
        expect(btn).toHaveClass('ant-btn-primary');
    });

    // Click H1 again (should toggle off to P)
    const activeH1Btn = screen.getByRole('button', { name: 'H1' });
    fireEvent.click(activeH1Btn);
    
    // Expect toggle back to P (plain text)
    expect(onChange).toHaveBeenLastCalledWith('Heading');
  });

  it('adds new block on Enter', () => {
    const onChange = vi.fn();
    const value = 'Line 1';
    render(<BlockEditor value={value} onChange={onChange} />);
    
    const text = screen.getByText('Line 1');
    fireEvent.click(text);
    
    fireEvent.keyDown(text, { key: 'Enter' });
    
    expect(onChange).toHaveBeenCalled();
  });

  it('inserts image correctly', () => {
    const onChange = vi.fn();
    const value = 'Text';
    (window.prompt as any).mockReturnValue('http://example.com/image.png');
    
    render(<BlockEditor value={value} onChange={onChange} />);
    
    const text = screen.getByText('Text');
    fireEvent.click(text); // Focus
    
    const imgBtn = screen.getByRole('button', { name: /image/i });
    fireEvent.click(imgBtn);
    
    // Should call prompt
    expect(window.prompt).toHaveBeenCalled();
    
    // Should add image block
    // "Text" -> "Text" + "Image"
    // So onChange should contain ![Image](url)
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('![Image](http://example.com/image.png)'));
  });
});
