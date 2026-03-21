import { ValidationError } from '@/domain/errors/validation.error';

export const validator = {
  required(fieldName: string, value: any): void {
    if (!value || value === '' || value === null || value === undefined) {
      throw new ValidationError(`${fieldName} is required`);
    }
  },

  isString(fieldName: string, value: any): void {
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`);
    }
  },

  isNumber(fieldName: string, value: any): void {
    const num = Number(value);
    if (isNaN(num)) {
      throw new ValidationError(`${fieldName} must be a valid number`);
    }
  },

  isInteger(fieldName: string, value: any): number {
    const num = Number(value);
    if (!Number.isInteger(num)) {
      throw new ValidationError(`${fieldName} must be an integer`);
    }
    return num;
  },

  isPositive(fieldName: string, value: number): void {
    if (value < 1) {
      throw new ValidationError(`${fieldName} must be a positive number`);
    }
  },

  isPositiveInteger(fieldName: string, value: any): number {
    const num = this.isInteger(fieldName, value);
    this.isPositive(fieldName, num);
    return num;
  },

  inRange(fieldName: string, value: number, min: number, max: number): void {
    if (value < min || value > max) {
      throw new ValidationError(`${fieldName} must be between ${min} and ${max}`);
    }
  },

  minLength(fieldName: string, value: string, min: number): void {
    if (value.length < min) {
      throw new ValidationError(`${fieldName} must be at least ${min} characters long`);
    }
  },

  maxLength(fieldName: string, value: string, max: number): void {
    if (value.length > max) {
      throw new ValidationError(`${fieldName} must be at most ${max} characters long`);
    }
  },

  isArray(fieldName: string, value: any): void {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array`);
    }
  },

  isEmail(fieldName: string, value: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid email`);
    }
  },

  matches(fieldName: string, value: string, pattern: RegExp, message?: string): void {
    if (!pattern.test(value)) {
      throw new ValidationError(message || `${fieldName} format is invalid`);
    }
  },

  oneOf(fieldName: string, value: any, allowedValues: any[]): void {
    if (!allowedValues.includes(value)) {
      throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
    }
  }
};
