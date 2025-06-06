import { describe, it, expect } from 'vitest';
import { InterestRate } from '../value-objects/InterestRate';

describe('InterestRate Value Object', () => {
  describe('creation', () => {
    it('should create from percentage', () => {
      const rate = InterestRate.fromPercentage(5.5);
      expect(rate.annualPercentage).toBe(5.5);
    });

    it('should create from decimal', () => {
      const rate = InterestRate.fromDecimal(0.055);
      expect(rate.annualPercentage).toBe(5.5);
    });

    it('should create zero rate', () => {
      const rate = InterestRate.zero();
      expect(rate.annualPercentage).toBe(0);
      expect(rate.isZero()).toBe(true);
    });

    it('should throw error for negative rates', () => {
      expect(() => InterestRate.fromPercentage(-1)).toThrow('Interest rate cannot be negative');
    });

    it('should throw error for rates over 100%', () => {
      expect(() => InterestRate.fromPercentage(101)).toThrow('Interest rate cannot exceed 100%');
    });

    it('should throw error for infinite rates', () => {
      expect(() => InterestRate.fromPercentage(Infinity)).toThrow('Interest rate must be a finite number');
    });
  });

  describe('conversions', () => {
    const rate = InterestRate.fromPercentage(6);

    it('should convert to annual decimal', () => {
      expect(rate.annualDecimal).toBe(0.06);
    });

    it('should convert to monthly decimal', () => {
      expect(rate.monthlyDecimal).toBeCloseTo(0.005, 6);
    });

    it('should convert to monthly percentage', () => {
      expect(rate.monthlyPercentage).toBeCloseTo(0.5, 6);
    });
  });

  describe('properties', () => {
    it('should check if zero', () => {
      expect(InterestRate.zero().isZero()).toBe(true);
      expect(InterestRate.fromPercentage(5).isZero()).toBe(false);
    });

    it('should check if positive', () => {
      expect(InterestRate.fromPercentage(5).isPositive()).toBe(true);
      expect(InterestRate.zero().isPositive()).toBe(false);
    });
  });

  describe('string representation', () => {
    it('should format as percentage string', () => {
      const rate = InterestRate.fromPercentage(5.5);
      expect(rate.toString()).toBe('5.5%');
    });
  });

  describe('serialization', () => {
    it('should serialize to percentage number', () => {
      const rate = InterestRate.fromPercentage(5.5);
      expect(rate.toJSON()).toBe(5.5);
      expect(JSON.stringify(rate)).toBe('5.5');
    });
  });

  describe('edge cases', () => {
    it('should handle zero rate calculations', () => {
      const rate = InterestRate.zero();
      expect(rate.monthlyDecimal).toBe(0);
      expect(rate.annualDecimal).toBe(0);
    });

    it('should handle high precision rates', () => {
      const rate = InterestRate.fromPercentage(5.123456789);
      expect(rate.annualPercentage).toBe(5.123456789);
    });
  });
});