import type { AppState, InventoryItem, HistoryAction, ActionType } from '../types';

function computeDifference(item: InventoryItem): boolean {
  if (item.isOutOfStock) return true;
  if (item.actualQty === null) return false;
  return item.actualQty !== item.expectedQty;
}

export type Action =
  | { type: 'SET_ITEMS'; payload: InventoryItem[] }
  | { type: 'SET_SELECTED_ID'; payload: string | null }
  | { type: 'SET_QUANTITY'; payload: { itemId: string; qty: number | null } }
  | { type: 'SET_NOTE'; payload: { itemId: string; note: string } }
  | { type: 'TOGGLE_OUT_OF_STOCK'; payload: { itemId: string } }
  | { type: 'CONFIRM_ITEM'; payload: { itemId: string } }
  | { type: 'BATCH_CONFIRM'; payload: { itemIds: string[] } }
  | { type: 'APPLY_HISTORY'; payload: HistoryAction[] }
  | { type: 'SET_FILTER'; payload: Partial<AppState['filter']> }
  | { type: 'SET_SHORTCUTS'; payload: Partial<AppState['shortcuts']> }
  | { type: 'SET_ROLE'; payload: AppState['currentRole'] }
  | { type: 'SET_AREAS'; payload: AppState['areas'] }
  | { type: 'ADD_ITEM'; payload: InventoryItem }
  | { type: 'DELETE_ITEM'; payload: string };

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload };

    case 'SET_SELECTED_ID':
      return { ...state, selectedItemId: action.payload };

    case 'SET_QUANTITY': {
      const { itemId, qty } = action.payload;
      const items = state.items.map(item => {
        if (item.id !== itemId) return item;
        if (item.isConfirmed) return item;
        const updated = { ...item, actualQty: qty, isOutOfStock: false, prevQty: null };
        updated.hasDifference = computeDifference(updated);
        return updated;
      });
      return { ...state, items };
    }

    case 'SET_NOTE': {
      const { itemId, note } = action.payload;
      const items = state.items.map(item => {
        if (item.id !== itemId) return item;
        if (item.isConfirmed) return item;
        return { ...item, note };
      });
      return { ...state, items };
    }

    case 'TOGGLE_OUT_OF_STOCK': {
      const { itemId } = action.payload;
      const items = state.items.map(item => {
        if (item.id !== itemId) return item;
        if (item.isConfirmed) return item;
        const newIsOutOfStock = !item.isOutOfStock;
        const updated = { ...item, isOutOfStock: newIsOutOfStock };
        if (newIsOutOfStock) {
          updated.prevQty = item.actualQty;
          updated.actualQty = 0;
        } else {
          updated.actualQty = item.prevQty;
          updated.prevQty = null;
        }
        updated.hasDifference = computeDifference(updated);
        return updated;
      });
      return { ...state, items };
    }

    case 'CONFIRM_ITEM': {
      const { itemId } = action.payload;
      const items = state.items.map(item =>
        item.id === itemId ? { ...item, isConfirmed: true } : item
      );
      return { ...state, items };
    }

    case 'BATCH_CONFIRM': {
      const { itemIds } = action.payload;
      const items = state.items.map(item =>
        itemIds.includes(item.id) ? { ...item, isConfirmed: true } : item
      );
      return { ...state, items };
    }

    case 'APPLY_HISTORY': {
      let items = [...state.items];
      for (const h of action.payload) {
        if (h.type === 'BATCH_CONFIRM') {
          const ids = h.itemId as string[];
          items = items.map(item =>
            ids.includes(item.id) ? { ...item, isConfirmed: h.prevValue as boolean } : item
          );
        } else {
          const id = h.itemId as string;
          const data = h.prevValue as { value: unknown; prevQty?: number | null };
          items = items.map(item => {
            if (item.id !== id) return item;
            switch (h.type) {
              case 'SET_QUANTITY': {
                const updated = { ...item, actualQty: data.value as number | null, prevQty: null };
                updated.hasDifference = computeDifference(updated);
                return updated;
              }
              case 'SET_NOTE':
                return { ...item, note: data.value as string };
              case 'TOGGLE_OUT_OF_STOCK': {
                const newIsOutOfStock = data.value as boolean;
                const updated = { ...item, isOutOfStock: newIsOutOfStock };
                if (newIsOutOfStock) {
                  updated.prevQty = item.actualQty;
                  updated.actualQty = 0;
                } else {
                  updated.actualQty = data.prevQty ?? null;
                  updated.prevQty = null;
                }
                updated.hasDifference = computeDifference(updated);
                return updated;
              }
              case 'CONFIRM_ITEM':
                return { ...item, isConfirmed: data.value as boolean };
              default:
                return item;
            }
          });
        }
      }
      return { ...state, items };
    }

    case 'SET_FILTER':
      return { ...state, filter: { ...state.filter, ...action.payload } };

    case 'SET_SHORTCUTS':
      return { ...state, shortcuts: { ...state.shortcuts, ...action.payload } };

    case 'SET_ROLE':
      return { ...state, currentRole: action.payload };

    case 'SET_AREAS':
      return { ...state, areas: action.payload };

    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };

    case 'DELETE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };

    default:
      return state;
  }
}

export function createHistoryAction(
  type: ActionType,
  itemId: string | string[],
  prevValue: unknown,
  newValue: unknown
): HistoryAction {
  return {
    type,
    itemId,
    prevValue,
    newValue,
    timestamp: Date.now(),
  };
}
