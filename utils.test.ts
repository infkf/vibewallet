import {
  uid,
  startOfCurrentMonth,
  endOfCurrentMonth,
  formatCurrency,
  formatCurrencyWithSymbol,
  toISODateString,
  parseMoneyTrackerDate,
  stringToColor,
} from './utils';

describe('utils', () => {
  describe('uid', () => {
    it('should return a string in the correct format', () => {
      const id = uid();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });

  describe('startOfCurrentMonth', () => {
    it('should return the first day of the current month', () => {
      const result = startOfCurrentMonth();
      const expected = new Date();
      expected.setDate(1);
      expected.setHours(0, 0, 0, 0);
      expect(result.getFullYear()).toBe(expected.getFullYear());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getDate()).toBe(1);
    });
  });

  describe('endOfCurrentMonth', () => {
    it('should return the last day of the current month', () => {
      const result = endOfCurrentMonth();
      const now = new Date();
      const expected = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      expect(result.getFullYear()).toBe(expected.getFullYear());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getDate()).toBe(expected.getDate());
    });
  });

  describe('formatCurrency', () => {
    it('should format a number as a currency string', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
    });

    it('should handle different currencies', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
    });

    it('should fallback to a default format on error', () => {
      expect(formatCurrency(1234.56, 'INVALID')).toBe('1234.56 INVALID');
    });
  });

  describe('formatCurrencyWithSymbol', () => {
    it('should format a number with a given symbol', () => {
      expect(formatCurrencyWithSymbol(1234.56, '$')).toBe('$1234.56');
    });

    it('should handle different decimal places', () => {
      expect(formatCurrencyWithSymbol(1234.567, '$', 3)).toBe('$1234.567');
    });
  });

  describe('toISODateString', () => {
    it('should format a date as an ISO date string', () => {
      const date = new Date(2025, 7, 20);
      expect(toISODateString(date)).toBe('2025-08-20');
    });
  });

  describe('parseMoneyTrackerDate', () => {
    it('should parse a Money Tracker date string', () => {
      const date = parseMoneyTrackerDate('2025-08-20 12:34:56');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(7);
      expect(date.getDate()).toBe(20);
      expect(date.getHours()).toBe(12);
      expect(date.getMinutes()).toBe(34);
      expect(date.getSeconds()).toBe(56);
    });
  });

  describe('stringToColor', () => {
    it('should return a deterministic color for a given string', () => {
      const color1 = stringToColor('test');
      const color2 = stringToColor('test');
      expect(color1).toBe(color2);
    });

    it('should return a different color for a different string', () => {
      const color1 = stringToColor('test1');
      const color2 = stringToColor('test2');
      expect(color1).not.toBe(color2);
    });
  });
});
