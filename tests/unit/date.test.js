// Unit tests for date utility functions
import { describe, it, expect, vi } from 'vitest';
import { todayStr, nowTime } from '../../src/modules/utils/date.js';

describe('Date Utils', () => {
  it('todayStr returns YYYY-MM-DD format', () => {
    const result = todayStr();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('todayStr returns today\'s date', () => {
    const expected = new Date().toISOString().split('T')[0];
    expect(todayStr()).toBe(expected);
  });

  it('nowTime returns HH:MM format', () => {
    const result = nowTime();
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('nowTime pads single digits', () => {
    // Mock Date to 09:05
    const mockDate = new Date(2025, 0, 15, 9, 5, 0);
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    expect(nowTime()).toBe('09:05');

    vi.useRealTimers();
  });

  it('nowTime handles midnight', () => {
    const mockDate = new Date(2025, 0, 15, 0, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    expect(nowTime()).toBe('00:00');

    vi.useRealTimers();
  });
});
