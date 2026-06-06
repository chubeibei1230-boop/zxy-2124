import type { ShortcutConfig, FilterCondition, HistoryState, Role, ArchiveFilter, ArchiveView, ManagerView } from '../types';

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

export const DEFAULT_ARCHIVE_FILTER: ArchiveFilter = {
  searchText: '',
  dateFrom: '',
  dateTo: '',
};

export const DEFAULT_ARCHIVE_VIEW: ArchiveView = 'list';

export const DEFAULT_MANAGER_VIEW: ManagerView = 'areas';

export const STORAGE_KEYS = {
  AREAS: 'inventory_areas',
  ITEMS: 'inventory_items',
  SHORTCUTS: 'inventory_shortcuts',
  FILTER: 'inventory_filter',
  HISTORY: 'inventory_history',
  SELECTED_ID: 'inventory_selected_id',
  ROLE: 'inventory_role',
  ARCHIVES: 'inventory_archives',
  ARCHIVE_FILTER: 'inventory_archive_filter',
  CURRENT_ARCHIVE_ID: 'inventory_current_archive_id',
  ARCHIVE_VIEW: 'inventory_archive_view',
  MANAGER_VIEW: 'inventory_manager_view',
};
