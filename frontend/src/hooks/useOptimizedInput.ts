import { useState, useCallback, useRef, useEffect } from 'react';

interface UseOptimizedInputOptions {
  initialValue?: string;
  debounceMs?: number;
  maxLength?: number;
  onValueChange?: (value: string) => void;
}

export function useOptimizedInput({
  initialValue = '',
  debounceMs = 0,
  maxLength,
  onValueChange,
}: UseOptimizedInputOptions = {}) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const debounceTimerRef = useRef<NodeJS.Timeout>(null);
  const isComposingRef = useRef(false);

  const updateValue = useCallback((newValue: string) => {
    const finalValue = maxLength ? newValue.slice(0, maxLength) : newValue;
    
    setValue(finalValue);
    
    if (debounceMs === 0 || isComposingRef.current) {
      setDebouncedValue(finalValue);
      onValueChange?.(finalValue);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedValue(finalValue);
      onValueChange?.(finalValue);
    }, debounceMs);
  }, [debounceMs, maxLength, onValueChange]);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
    setDebouncedValue(initialValue);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, [initialValue]);

  return {
    value,
    debouncedValue,
    updateValue,
    reset,
    handleCompositionStart,
    handleCompositionEnd,
    onChange: useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateValue(e.target.value);
    }, [updateValue]),
  };
}
