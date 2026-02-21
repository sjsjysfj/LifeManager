import { describe, it, expect } from 'vitest';
import { formatDuration, formatTimeRange, calculateDuration, checkTimeConflict } from './timeUtils';

describe('timeUtils', () => {
  describe('formatDuration', () => {
    it('should format duration less than 60 minutes correctly', () => {
      expect(formatDuration(30)).toEqual({ value: '30', unit: 'min' });
      expect(formatDuration(59)).toEqual({ value: '59', unit: 'min' });
      expect(formatDuration(0)).toEqual({ value: '0', unit: 'min' });
    });

    it('should format duration exactly 60 minutes correctly', () => {
      expect(formatDuration(60)).toEqual({ value: '1', unit: 'h' });
    });

    it('should format duration more than 60 minutes correctly', () => {
      expect(formatDuration(61)).toEqual({ value: '1h 1', unit: 'min' });
      expect(formatDuration(90)).toEqual({ value: '1h 30', unit: 'min' });
      expect(formatDuration(120)).toEqual({ value: '2', unit: 'h' });
      expect(formatDuration(150)).toEqual({ value: '2h 30', unit: 'min' });
    });
  });

  describe('formatTimeRange', () => {
    it('should format time range correctly', () => {
      expect(formatTimeRange('10:00', '11:00')).toBe('10:00-11:00');
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration within the same day', () => {
      expect(calculateDuration('10:00', '11:00')).toBe(60);
      expect(calculateDuration('10:00', '10:30')).toBe(30);
    });

    it('should calculate duration across midnight', () => {
      expect(calculateDuration('23:00', '01:00')).toBe(120);
      expect(calculateDuration('23:30', '00:30')).toBe(60);
    });
    
    it('should calculate duration correctly when start equals end (assuming 24h or 0)', () => {
        // Depending on logic, same time could be 0 or 24h. 
        // Current implementation logic: if end is before start, add day. 
        // If equal, diff is 0.
        expect(calculateDuration('10:00', '10:00')).toBe(0);
    });
  });

  describe('checkTimeConflict', () => {
    const existingLogs = [
        { startTime: '10:00', endTime: '11:00', id: '1', tag: 'Log 1' },
        { startTime: '14:00', endTime: '15:00', id: '2', tag: 'Log 2' },
        { startTime: '23:00', endTime: '01:00', id: '3', tag: 'Log 3 (Cross-day)' }
    ];

    it('should detect overlap when new log is completely inside existing log', () => {
        const conflicts = checkTimeConflict('10:15', '10:45', existingLogs);
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].id).toBe('1');
    });

    it('should detect overlap when new log completely covers existing log', () => {
        const conflicts = checkTimeConflict('09:00', '12:00', existingLogs);
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].id).toBe('1');
    });

    it('should detect partial overlap (start inside)', () => {
        const conflicts = checkTimeConflict('10:30', '11:30', existingLogs);
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].id).toBe('1');
    });

    it('should detect partial overlap (end inside)', () => {
        const conflicts = checkTimeConflict('09:30', '10:30', existingLogs);
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].id).toBe('1');
    });

    it('should NOT detect overlap when touching boundaries (end = start)', () => {
        // 11:00 ends Log 1, new starts at 11:00
        const conflicts = checkTimeConflict('11:00', '12:00', existingLogs);
        expect(conflicts).toHaveLength(0);
    });

    it('should NOT detect overlap when touching boundaries (start = end)', () => {
        // 10:00 starts Log 1, new ends at 10:00
        const conflicts = checkTimeConflict('09:00', '10:00', existingLogs);
        expect(conflicts).toHaveLength(0);
    });

    it('should detect overlap with cross-day logs', () => {
        // Log 3 is 23:00 - 01:00
        // This covers Today 23:00 to Tomorrow 01:00.
        
        // Case 1: 23:30 - 23:45 (Today late night) -> Should overlap
        const conflicts1 = checkTimeConflict('23:30', '23:45', existingLogs);
        expect(conflicts1).toHaveLength(1);
        expect(conflicts1[0].id).toBe('3');

        // Case 2: 00:15 - 00:45 (Today early morning)
        // Since we assume existingLogs are "Today's logs", Log 3 started Today at 23:00.
        // A new log at 00:15 Today is ~23 hours BEFORE Log 3.
        // So it should NOT overlap.
        const conflicts2 = checkTimeConflict('00:15', '00:45', existingLogs);
        expect(conflicts2).toHaveLength(0);
        
        // If we wanted to test "Tomorrow 00:15", we can't express that with just HH:mm
        // unless we assume it's relative to the other time. 
        // But checkTimeConflict assumes absolute time on a standard day (2000-01-01).
    });
  });
});
