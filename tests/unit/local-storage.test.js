// Unit tests for LocalStorageAdapter
import { describe, it, expect } from 'vitest';
import { LocalStorageAdapter } from '../../src/modules/storage/local-storage.js';

describe('LocalStorageAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new LocalStorageAdapter();
  });

  it('should store and retrieve a value', () => {
    adapter.set('test_key', { name: 'Alice', age: 30 });
    const result = adapter.get('test_key');
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  it('should return null for non-existent key', () => {
    expect(adapter.get('nonexistent')).toBeNull();
  });

  it('should store arrays', () => {
    const arr = [1, 2, 3, 'hello'];
    adapter.set('arr_key', arr);
    expect(adapter.get('arr_key')).toEqual(arr);
  });

  it('should store nested objects', () => {
    const obj = {
      team: [{ nom: 'Test' }],
      config: { nested: { deep: true } },
    };
    adapter.set('nested_key', obj);
    expect(adapter.get('nested_key')).toEqual(obj);
  });

  it('should remove a key', () => {
    adapter.set('remove_me', 'value');
    expect(adapter.get('remove_me')).toBe('value');
    adapter.remove('remove_me');
    expect(adapter.get('remove_me')).toBeNull();
  });

  it('should overwrite existing values', () => {
    adapter.set('overwrite', 'first');
    adapter.set('overwrite', 'second');
    expect(adapter.get('overwrite')).toBe('second');
  });

  it('should handle boolean values', () => {
    adapter.set('bool_true', true);
    adapter.set('bool_false', false);
    expect(adapter.get('bool_true')).toBe(true);
    expect(adapter.get('bool_false')).toBe(false);
  });

  it('should handle numeric values', () => {
    adapter.set('num', 42);
    expect(adapter.get('num')).toBe(42);
  });
});
