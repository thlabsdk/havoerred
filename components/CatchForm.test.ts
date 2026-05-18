import { describe, it, expect } from 'vitest';
import { formatDateInput, parseLengthInput } from './CatchForm';

describe('formatDateInput', () => {
  it('returns empty string for empty input', () => {
    expect(formatDateInput('')).toBe('');
  });

  it('returns single digit unchanged', () => {
    expect(formatDateInput('1')).toBe('1');
  });

  it('returns two digits unchanged', () => {
    expect(formatDateInput('12')).toBe('12');
  });

  it('inserts slash after 2 digits', () => {
    expect(formatDateInput('120')).toBe('12/0');
  });

  it('formats dd/mm on 4 digits', () => {
    expect(formatDateInput('1205')).toBe('12/05');
  });

  it('inserts slash after 4 digits', () => {
    expect(formatDateInput('12050')).toBe('12/05/0');
  });

  it('formats full date on 8 digits', () => {
    expect(formatDateInput('12052026')).toBe('12/05/2026');
  });

  it('normalizes dash-separated paste', () => {
    expect(formatDateInput('12-05-2026')).toBe('12/05/2026');
  });

  it('normalizes dot-separated paste', () => {
    expect(formatDateInput('12.05.2026')).toBe('12/05/2026');
  });

  it('normalizes leading and trailing whitespace', () => {
    expect(formatDateInput(' 12052026 ')).toBe('12/05/2026');
  });

  it('normalizes whitespace around slash-separated paste', () => {
    expect(formatDateInput(' 12/05/2026 ')).toBe('12/05/2026');
  });

  it('caps at 8 digits even with extra input', () => {
    expect(formatDateInput('1205202699')).toBe('12/05/2026');
  });

  it('formats correctly when raw value ends with slash (backspace past slash)', () => {
    expect(formatDateInput('12/')).toBe('12');
  });
});

describe('parseLengthInput', () => {
  it('returns null for empty string', () => {
    expect(parseLengthInput('')).toBeNull();
  });

  it('returns number for digit string', () => {
    expect(parseLengthInput('67')).toBe(67);
  });

  it('strips non-digit suffix noise', () => {
    expect(parseLengthInput('67cm')).toBe(67);
  });

  it('strips negative sign', () => {
    expect(parseLengthInput('-5')).toBe(5);
  });

  it('returns null for all non-digits', () => {
    expect(parseLengthInput('abc')).toBeNull();
  });
});
