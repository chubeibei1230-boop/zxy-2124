import { useReducer, useEffect, useCallback, useMemo } from 'react';
import type { AppState, HistoryAction, InventoryItem, Area } from '../types';
import { appReducer, createHistoryAction } from '../store/reducer';
import {
  DEFAULT_SHORTCUTS,
  DEFAULT_FILTER,
  DEFAULT_HISTORY,
  DEFAULT_ROLE,
  STORAGE_KEYS,
} from '../constants/defaultConfig';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { createMockAreas, createMockItems } from '../utils/mockData';
import { clamp } from '../utils/helpers';

const MAX_HISTORY = 100;

function initializeState(): AppState {
  let areas = loadFromStorage<Area[] | null>(STORAGE_KEYS.AREAS, null);
  let items = loadFromStorage<InventoryItem[]>(STORAGE_KEYS.ITEMS, []);

  if (!areas || areas.length === 0) {
    const mockAreas = createMockAreas();
    const mockItems = createMockItems(mockAreas);
    areas = mockAreas;
    items = mockItems;
    saveToStorage(STORAGE_KEYS.AREAS, areas);
    saveToStorage(STORAGE_KEYS.ITEMS, items);
  }

  return {
    areas,
    items,
    selectedItemId: loadFromStorage(STORAGE_KEYS.SELECTED_ID, items[0]?.id || null),
    currentRole: loadFromStorage(STORAGE_KEYS.ROLE, DEFAULT_ROLE),
    filter: loadFromStorage(STORAGE_KEYS.FILTER, DEFAULT_FILTER),
    shortcuts: loadFromStorage(STORAGE_KEYS.SHORTCUTS, DEFAULT_SHORTCUTS),
    history: loadFromStorage(STORAGE_KEYS.HISTORY, DEFAULT_HISTORY),
  };
}

export function useAppState() {
  const [state, dispatch] = useReducer(appReducer, null, initializeState);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.AREAS, state.areas);
  }, [state.areas]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ITEMS, state.items);
  }, [state.items]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SELECTED_ID, state.selectedItemId);
  }, [state.selectedItemId]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FILTER, state.filter);
  }, [state.filter]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SHORTCUTS, state.shortcuts);
  }, [state.shortcuts]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ROLE, state.currentRole);
  }, [state.currentRole]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.HISTORY, state.history);
  }, [state.history]);

  const pushHistory = useCallback((actions: HistoryAction[]) => {
    const newPast = [...state.history.past, actions];
    if (newPast.length > MAX_HISTORY) {
      newPast.shift();
    }
    state.history.past = newPast;
    state.history.future = [];
  }, [state.history]);

  const undo = useCallback(() => {
    if (state.history.past.length === 0) return;
    const past = [...state.history.past];
    const actions = past.pop()!;
    const future = [...state.history.future, actions];
    
    dispatch({ type: 'APPLY_HISTORY', payload: actions });
    state.history.past = past;
    state.history.future = future;
  }, [state.history]);

  const redo = useCallback(() => {
    if (state.history.future.length === 0) return;
    const future = [...state.history.future];
    const actions = future.pop()!;
    const past = [...state.history.past, actions];
    
    const reversed: HistoryAction[] = actions.map(a => ({
      ...a,
      prevValue: a.newValue,
      newValue: a.prevValue,
    }));
    
    dispatch({ type: 'APPLY_HISTORY', payload: reversed });
    state.history.past = past;
    state.history.future = future;
  }, [state.history]);

  const setQuantity = useCallback((itemId: string, qty: number | null) => {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;
    if (item.actualQty === qty) return;

    dispatch({ type: 'SET_QUANTITY', payload: { itemId, qty } });
    pushHistory([
      createHistoryAction('SET_QUANTITY', itemId, item.actualQty, qty),
    ]);
  }, [state.items, pushHistory]);

  const setNote = useCallback((itemId: string, note: string) => {
    const item = state.items.find(i => i.id === itemId);
    if (!item || item.note === note) return;

    dispatch({ type: 'SET_NOTE', payload: { itemId, note } });
    pushHistory([
      createHistoryAction('SET_NOTE', itemId, item.note, note),
    ]);
  }, [state.items, pushHistory]);

  const toggleOutOfStock = useCallback((itemId: string) => {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;

    dispatch({ type: 'TOGGLE_OUT_OF_STOCK', payload: { itemId } });
    pushHistory([
      createHistoryAction('TOGGLE_OUT_OF_STOCK', itemId, item.isOutOfStock, !item.isOutOfStock),
    ]);
  }, [state.items, pushHistory]);

  const confirmItem = useCallback((itemId: string) => {
    const item = state.items.find(i => i.id === itemId);
    if (!item || item.isConfirmed) return;

    dispatch({ type: 'CONFIRM_ITEM', payload: { itemId } });
    pushHistory([
      createHistoryAction('CONFIRM_ITEM', itemId, false, true),
    ]);
  }, [state.items, pushHistory]);

  const batchConfirm = useCallback((itemIds: string[]) => {
    const toConfirm = itemIds.filter(id => {
      const item = state.items.find(i => i.id === id);
      return item && !item.isConfirmed;
    });
    if (toConfirm.length === 0) return;

    dispatch({ type: 'BATCH_CONFIRM', payload: { itemIds: toConfirm } });
    pushHistory([
      createHistoryAction('BATCH_CONFIRM', toConfirm, false, true),
    ]);
  }, [state.items, pushHistory]);

  const moveSelection = useCallback((direction: 1 | -1) => {
    const filteredItems = getFilteredItems(state.items, state.filter, state.areas);
    if (filteredItems.length === 0) return;

    let currentIndex = filteredItems.findIndex(i => i.id === state.selectedItemId);
    if (currentIndex === -1) currentIndex = 0;

    const nextIndex = clamp(currentIndex + direction, 0, filteredItems.length - 1);
    dispatch({ type: 'SET_SELECTED_ID', payload: filteredItems[nextIndex].id });
  }, [state.items, state.selectedItemId, state.filter, state.areas]);

  const jumpToNextException = useCallback(() => {
    const filteredItems = getFilteredItems(state.items, state.filter, state.areas);
    const currentIndex = filteredItems.findIndex(i => i.id === state.selectedItemId);
    
    const exceptions = filteredItems
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.hasDifference || item.isOutOfStock);
    
    if (exceptions.length === 0) return;

    const nextException = exceptions.find(e => e.index > currentIndex) || exceptions[0];
    dispatch({ type: 'SET_SELECTED_ID', payload: nextException.item.id });
  }, [state.items, state.selectedItemId, state.filter, state.areas]);

  const canUndo = state.history.past.length > 0;
  const canRedo = state.history.future.length > 0;

  const stats = useMemo(() => {
    const total = state.items.length;
    const counted = state.items.filter(i => i.actualQty !== null || i.isOutOfStock).length;
    const differences = state.items.filter(i => i.hasDifference).length;
    const confirmed = state.items.filter(i => i.isConfirmed).length;
    const outOfStock = state.items.filter(i => i.isOutOfStock).length;
    return { total, counted, differences, confirmed, outOfStock };
  }, [state.items]);

  const filteredItems = useMemo(() => 
    getFilteredItems(state.items, state.filter, state.areas),
    [state.items, state.filter, state.areas]
  );

  return {
    state,
    dispatch,
    setQuantity,
    setNote,
    toggleOutOfStock,
    confirmItem,
    batchConfirm,
    moveSelection,
    jumpToNextException,
    undo,
    redo,
    canUndo,
    canRedo,
    stats,
    filteredItems,
  };
}

function getFilteredItems(
  items: InventoryItem[],
  filter: AppState['filter'],
  areas: AppState['areas']
): InventoryItem[] {
  return items.filter(item => {
    if (filter.areaId && item.areaId !== filter.areaId) return false;
    if (filter.showOnlyDifferences && !item.hasDifference) return false;
    if (filter.showOnlyUnconfirmed && item.isConfirmed) return false;
    if (filter.showOnlyOutOfStock && !item.isOutOfStock) return false;
    if (filter.searchText) {
      const search = filter.searchText.toLowerCase();
      const area = areas.find(a => a.id === item.areaId);
      return (
        item.sku.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        (area?.name.toLowerCase().includes(search) ?? false)
      );
    }
    return true;
  });
}
