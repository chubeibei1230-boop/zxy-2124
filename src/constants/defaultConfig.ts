import type { ShortcutConfig, FilterCondition, HistoryState, Role } from '../types';

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  moveUp: 'ArrowUp',
  moveDown: 'ArrowDown',
  markOutOfStock: 'KeyO',
  nextException: 'KeyE',
  batchConfirm: 'KeyC',
  undo: 'Mod+KeyZ',
  redo: 'Mod+Shift+KeyZ',
  quickQty0: 'Digit0',
  quickQty1: 'Digit1',
  quickQty2: 'Digit2',
  quickQty3: 'Digit3',
  quickQty4: 'Digit4',
  quickQty5: 'Digit5',
  quickQty6: 'Digit6',
  quickQty7: 'Digit7',
  quickQty8: 'Digit8',
  quickQty9: 'Digit9',
};

export const DEFAULT_FILTER: FilterCondition = {
  areaId: null,
  showOnlyDifferences: false,
  showOnlyUnconfirmed: false,
  showOnlyOutOfStock: false,
  searchText: '',
};

export const DEFAULT_HISTORY: HistoryState = {
  past: [],
  future: [],
};

export const DEFAULT_ROLE: Role = 'operator';

export const STORAGE_KEYS = {
  AREAS: 'inventory_areas',
  ITEMS: 'inventory_items',
  SHORTCUTS: 'inventory_shortcuts',
  FILTER: 'inventory_filter',
  HISTORY: 'inventory_history',
  SELECTED_ID: 'inventory_selected_id',
  ROLE: 'inventory_role',
};
