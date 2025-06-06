import { describe, it, expect } from 'vitest';
import { Money } from '../value-objects/Money';

describe('Money Value Object', () => {
  describe('creation', () => {
    it('should create money with positive amount', () => {
      const money = Money.of(1000);
      expect(money.amount).toBe(1000);
    });

    it('should create zero money', () => {
      const money = Money.zero();
      expect(money.amount).toBe(0);
      expect(money.isZero()).toBe(true);
    });

    it('should round to 2 decimal places', () => {
      const money = Money.of(1000.999);
      expect(money.amount).toBe(1001);
    });

    it('should throw error for negative amounts', () => {
      expect(() => Money.of(-100)).toThrow('Money amount cannot be negative');
    });

    it('should throw error for infinite amounts', () => {
      expect(() => Money.of(Infinity)).toThrow('Money amount must be a finite number');
      expect(() => Money.of(NaN)).toThrow('Money amount must be a finite number');
    });
  });

  describe('arithmetic operations', () => {
    const money1 = Money.of(1000);
    const money2 = Money.of(500);

    it('should add money correctly', () => {
      const result = money1.add(money2);
      expect(result.amount).toBe(1500);
    });

    it('should subtract money correctly', () => {
      const result = money1.subtract(money2);
      expect(result.amount).toBe(500);
    });

    it('should multiply by factor correctly', () => {
      const result = money1.multiply(1.5);
      expect(result.amount).toBe(1500);
    });

    it('should divide by divisor correctly', () => {
      const result = money1.divide(2);
      expect(result.amount).toBe(500);
    });

    it('should throw error when dividing by zero', () => {
      expect(() => money1.divide(0)).toThrow('Cannot divide by zero');
    });
  });

  describe('comparison operations', () => {
    const money1 = Money.of(1000);
    const money2 = Money.of(500);
    const money3 = Money.of(1000);

    it('should compare greater than correctly', () => {
      expect(money1.isGreaterThan(money2)).toBe(true);
      expect(money2.isGreaterThan(money1)).toBe(false);
    });

    it('should compare less than correctly', () => {
      expect(money2.isLessThan(money1)).toBe(true);
      expect(money1.isLessThan(money2)).toBe(false);
    });

    it('should compare equality correctly', () => {
      expect(money1.isEqual(money3)).toBe(true);
      expect(money1.isEqual(money2)).toBe(false);
    });

    it('should check if positive', () => {
      expect(money1.isPositive()).toBe(true);
      expect(Money.zero().isPositive()).toBe(false);
    });
  });

  describe('formatting', () => {
    it('should format as Polish currency', () => {
      const money = Money.of(1000);
      const formatted = money.toDisplayString();
      expect(formatted).toContain('1');
      expect(formatted).toContain('000');
      expect(formatted).toContain('zł');
    });

    it('should format large amounts with spaces', () => {
      const money = Money.of(1000000);
      const formatted = money.toDisplayString();
      // Polish formatting may vary, just check it contains the right elements
      expect(formatted).toMatch(/1[\s]?000[\s]?000/);
      expect(formatted).toContain('zł');
    });

    it('should format zero correctly', () => {
      const money = Money.zero();
      const formatted = money.toDisplayString();
      expect(formatted).toContain('0');
      expect(formatted).toContain('zł');
    });
  });

  describe('serialization', () => {
    it('should serialize to number', () => {
      const money = Money.of(1000);
      expect(money.toJSON()).toBe(1000);
      expect(JSON.stringify(money)).toBe('1000');
    });

    it('should convert to string', () => {
      const money = Money.of(1000);
      expect(money.toString()).toBe('1000');
    });
  });
});