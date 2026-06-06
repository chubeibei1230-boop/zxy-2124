export interface Area {
  id: string;
  name: string;
  createdAt: number;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  areaId: string;
  expectedQty: number;
  actualQty: number | null;
  note: string;
  isOutOfStock: boolean;
  isConfirmed: boolean;
  hasDifference: boolean;
  prevQty: number | null;
}

export type ActionType = 
  | 'SET_QUANTITY'
  | 'SET_NOTE'
  | 'TOGGLE_OUT_OF_STOCK'
  | 'CONFIRM_ITEM'
  | 'BATCH_CONFIRM';

export interface HistoryAction {
  type: ActionType;
  itemId: string | string[];
  prevValue: unknown;
  newValue: unknown;
  timestamp: number;
}

export interface HistoryState {
  past: HistoryAction[][];
  future: HistoryAction[][];
}

export interface ShortcutConfig {
  moveUp: string;
  moveDown: string;
  markOutOfStock: string;
  nextException: string;
  batchConfirm: string;
  undo: string;
  redo: string;
  quickQty0: string;
  quickQty1: string;
  quickQty2: string;
  quickQty3: string;
  quickQty4: string;
  quickQty5: string;
  quickQty6: string;
  quickQty7: string;
  quickQty8: string;
  quickQty9: string;
}

export interface FilterCondition {
  areaId: string | null;
  showOnlyDifferences: boolean;
  showOnlyUnconfirmed: boolean;
  showOnlyOutOfStock: boolean;
  searchText: string;
}

export type Role = 'manager' | 'operator' | 'reviewer';

export interface AppState {
  areas: Area[];
  items: InventoryItem[];
  selectedItemId: string | null;
  currentRole: Role;
  filter: FilterCondition;
  shortcuts: ShortcutConfig;
  history: HistoryState;
}
