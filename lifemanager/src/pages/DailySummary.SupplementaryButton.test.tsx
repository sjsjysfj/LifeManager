import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import DailySummary from './DailySummary';
import { addSupplementaryRecord } from '../services/focusService';
import { getDB } from '../services/db';
import dayjs from 'dayjs';

// Mock dependencies
vi.mock('../services/focusService', () => ({
  addSupplementaryRecord: vi.fn(),
}));

vi.mock('../services/db', () => ({
  getDB: vi.fn(),
  updateDB: vi.fn(),
}));

vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({ toDataURL: () => 'data:image/png;base64,mock' })),
}));

// Setup matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('DailySummary Supplementary Button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getDB as any).mockResolvedValue({
      tasks: [],
      habits: [],
      habitLogs: {},
      focusLogs: [],
      journals: {},
    });
  });

  it('renders the supplementary record button', async () => {
    render(<DailySummary />);
    const button = await screen.findByText('补录');
    expect(button).toBeInTheDocument();
  });

  it('opens the modal when button is clicked', async () => {
    render(<DailySummary />);
    const button = await screen.findByText('补录');
    fireEvent.click(button);
    const modalTitle = await screen.findByText('手动添加学习记录');
    expect(modalTitle).toBeInTheDocument();
  });

  // Since interactions with Ant Design components (TimePicker, Form) are complex in JSDOM,
  // we focus on integration tests: verifying that the button opens the modal and 
  // checking if critical elements (like the new validation message) appear when submitting empty.

  it('validates that at least one time field is required', async () => {
    render(<DailySummary />);
    
    // Open modal
    fireEvent.click(await screen.findByText('补录'));
    
    // Find form inputs
    const modal = await screen.findByRole('dialog');
    const submitButton = within(modal).getByRole('button', { name: /确 定|OK/i });
    
    // Try to submit without filling time
    fireEvent.click(submitButton);

    // Expect validation error
    await waitFor(() => {
       const errors = screen.getAllByText('开始时间和结束时间至少填写一个');
       expect(errors.length).toBeGreaterThan(0);
    });

    expect(addSupplementaryRecord).not.toHaveBeenCalled();
  });
});
