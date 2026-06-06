import { useEffect, useCallback } from 'react';
import type { ShortcutConfig } from '../types';

interface ShortcutHandlers {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMarkOutOfStock: () => void;
  onNextException: () => void;
  onBatchConfirm: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onQuickQty: (digit: number) => void;
}

function matchShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.split('+');
  const keyPart = parts[parts.length - 1];
  
  const needsMod = parts.includes('Mod');
  const needsShift = parts.includes('Shift');
  const needsCtrl = parts.includes('Ctrl');
  const needsAlt = parts.includes('Alt');

  const modOk = !needsMod || (e.metaKey || e.ctrlKey);
  const shiftOk = !needsShift || e.shiftKey;
  const ctrlOk = !needsCtrl || e.ctrlKey;
  const altOk = !needsAlt || e.altKey;

  if (!modOk || !shiftOk || !ctrlOk || !altOk) return false;

  if (keyPart.startsWith('Key')) {
    return e.code === keyPart;
  }
  if (keyPart.startsWith('Digit')) {
    return e.code === keyPart;
  }
  return e.code === keyPart;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig,
  handlers: ShortcutHandlers,
  enabled: boolean = true
) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      if (!e.ctrlKey && !e.metaKey && !e.altKey) return;
    }

    if (matchShortcut(e, shortcuts.moveUp)) {
      e.preventDefault();
      handlers.onMoveUp();
      return;
    }

    if (matchShortcut(e, shortcuts.moveDown)) {
      e.preventDefault();
      handlers.onMoveDown();
      return;
    }

    if (matchShortcut(e, shortcuts.markOutOfStock)) {
      e.preventDefault();
      handlers.onMarkOutOfStock();
      return;
    }

    if (matchShortcut(e, shortcuts.nextException)) {
      e.preventDefault();
      handlers.onNextException();
      return;
    }

    if (matchShortcut(e, shortcuts.batchConfirm)) {
      e.preventDefault();
      handlers.onBatchConfirm();
      return;
    }

    if (matchShortcut(e, shortcuts.undo)) {
      e.preventDefault();
      handlers.onUndo();
      return;
    }

    if (matchShortcut(e, shortcuts.redo)) {
      e.preventDefault();
      handlers.onRedo();
      return;
    }

    const quickQtyKeys: [string, number][] = [
      [shortcuts.quickQty0, 0],
      [shortcuts.quickQty1, 1],
      [shortcuts.quickQty2, 2],
      [shortcuts.quickQty3, 3],
      [shortcuts.quickQty4, 4],
      [shortcuts.quickQty5, 5],
      [shortcuts.quickQty6, 6],
      [shortcuts.quickQty7, 7],
      [shortcuts.quickQty8, 8],
      [shortcuts.quickQty9, 9],
    ];

    for (const [key, digit] of quickQtyKeys) {
      if (matchShortcut(e, key)) {
        e.preventDefault();
        handlers.onQuickQty(digit);
        return;
      }
    }
  }, [shortcuts, handlers, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
