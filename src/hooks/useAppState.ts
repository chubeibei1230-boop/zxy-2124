import { useReducer, useEffect, useCallback, useMemo } from 'react';
import type { AppState, HistoryAction, InventoryItem, Area, Archive, ArchiveSnapshot } from '../types';
import { appReducer, createHistoryAction } from '../store/reducer';
import {
  DEFAULT_SHORTCUTS,
  DEFAULT_FILTER,
  DEFAULT_HISTORY,
  DEFAULT_ROLE,
  STORAGE_KEYS,
  DEFAULT_ARCHIVE_FILTER,
  DEFAULT_ARCHIVE_VIEW,
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
  } else {
    items = items.map(item => ({
      ...item,
      prevQty: (item as InventoryItem).prevQty ?? null,
      reviewConclusion: (item as InventoryItem).reviewConclusion ?? '',
      handlingOpinion: (item as InventoryItem).handlingOpinion ?? '',
      responsibilityAttribution: (item as InventoryItem).responsibilityAttribution ?? '',
      reviewStatus: (item as InventoryItem).reviewStatus ?? 'pending',
      reviewedAt: (item as InventoryItem).reviewedAt ?? null,
    }));
  }

  return {
    areas,
    items,
    selectedItemId: loadFromStorage(STORAGE_KEYS.SELECTED_ID, items[0]?.id || null),
    currentRole: loadFromStorage(STORAGE_KEYS.ROLE, DEFAULT_ROLE),
    filter: loadFromStorage(STORAGE_KEYS.FILTER, DEFAULT_FILTER),
    shortcuts: loadFromStorage(STORAGE_KEYS.SHORTCUTS, DEFAULT_SHORTCUTS),
    history: loadFromStorage(STORAGE_KEYS.HISTORY, DEFAULT_HISTORY),
    archives: loadFromStorage<Archive[]>(STORAGE_KEYS.ARCHIVES, []),
    archiveFilter: loadFromStorage(STORAGE_KEYS.ARCHIVE_FILTER, DEFAULT_ARCHIVE_FILTER),
    currentArchiveId: loadFromStorage<string | null>(STORAGE_KEYS.CURRENT_ARCHIVE_ID, null),
    archiveView: loadFromStorage(STORAGE_KEYS.ARCHIVE_VIEW, DEFAULT_ARCHIVE_VIEW),
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

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ARCHIVES, state.archives);
  }, [state.archives]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ARCHIVE_FILTER, state.archiveFilter);
  }, [state.archiveFilter]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CURRENT_ARCHIVE_ID, state.currentArchiveId);
  }, [state.currentArchiveId]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ARCHIVE_VIEW, state.archiveView);
  }, [state.archiveView]);

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
    if (item.isConfirmed) return;
    if (item.actualQty === qty) return;

    dispatch({ type: 'SET_QUANTITY', payload: { itemId, qty } });
    pushHistory([
      createHistoryAction('SET_QUANTITY', itemId, { value: item.actualQty }, { value: qty }),
    ]);
  }, [state.items, pushHistory]);

  const setNote = useCallback((itemId: string, note: string) => {
    const item = state.items.find(i => i.id === itemId);
    if (!item || item.note === note) return;
    if (item.isConfirmed) return;

    dispatch({ type: 'SET_NOTE', payload: { itemId, note } });
    pushHistory([
      createHistoryAction('SET_NOTE', itemId, { value: item.note }, { value: note }),
    ]);
  }, [state.items, pushHistory]);

  const toggleOutOfStock = useCallback((itemId: string) => {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;
    if (item.isConfirmed) return;

    dispatch({ type: 'TOGGLE_OUT_OF_STOCK', payload: { itemId } });
    pushHistory([
      createHistoryAction(
        'TOGGLE_OUT_OF_STOCK',
        itemId,
        { value: item.isOutOfStock, prevQty: item.prevQty },
        { value: !item.isOutOfStock, prevQty: item.actualQty }
      ),
    ]);
  }, [state.items, pushHistory]);

  const confirmItem = useCallback((itemId: string) => {
    const item = state.items.find(i => i.id === itemId);
    if (!item || item.isConfirmed) return;

    dispatch({ type: 'CONFIRM_ITEM', payload: { itemId } });
    pushHistory([
      createHistoryAction('CONFIRM_ITEM', itemId, { value: false }, { value: true }),
    ]);
  }, [state.items, pushHistory]);

  const batchConfirm = useCallback((itemIds: string[]) => {
    const toConfirm = itemIds.filter(id => {
      const item = state.items.find(i => i.id === id);
      return item && !item.isConfirmed && (item.hasDifference || item.isOutOfStock);
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

  const getReviewStats = useCallback(() => {
    const differenceItems = state.items.filter(i => i.hasDifference || i.isOutOfStock);
    const totalDifferences = differenceItems.length;
    const reviewed = differenceItems.filter(i => i.reviewStatus !== 'pending').length;
    const pending = differenceItems.filter(i => i.reviewStatus === 'pending').length;
    const inProgress = differenceItems.filter(i => i.reviewStatus === 'inProgress').length;
    const completed = differenceItems.filter(i => i.reviewStatus === 'completed').length;
    const completionRate = totalDifferences > 0 ? Math.round((completed / totalDifferences) * 100) : 0;

    return {
      totalDifferences,
      reviewed,
      pending,
      inProgress,
      completed,
      completionRate,
    };
  }, [state.items]);

  const generateReviewSummary = useCallback(() => {
    const differenceItems = state.items.filter(i => i.hasDifference || i.isOutOfStock);
    const stats = getReviewStats();
    
    const areaStats = new Map<string, { total: number; completed: number; overage: number; shortage: number; outOfStock: number }>();
    
    state.areas.forEach(area => {
      areaStats.set(area.id, { total: 0, completed: 0, overage: 0, shortage: 0, outOfStock: 0 });
    });

    differenceItems.forEach(item => {
      const areaStat = areaStats.get(item.areaId);
      if (areaStat) {
        areaStat.total++;
        if (item.reviewStatus === 'completed') areaStat.completed++;
        if (item.isOutOfStock) {
          areaStat.outOfStock++;
        } else {
          const diff = (item.actualQty ?? 0) - item.expectedQty;
          if (diff > 0) areaStat.overage++;
          else if (diff < 0) areaStat.shortage++;
        }
      }
    });

    let summary = `【盘点差异复盘摘要】\n\n`;
    summary += `一、总体情况\n`;
    summary += `本次盘点共发现差异 ${stats.totalDifferences} 项，已完成复盘 ${stats.completed} 项，复盘完成率 ${stats.completionRate}%。\n`;
    summary += `其中：待处理 ${stats.pending} 项，复盘中 ${stats.inProgress} 项，已完成 ${stats.completed} 项。\n\n`;
    
    summary += `二、分区域情况\n`;
    areaStats.forEach((stat, areaId) => {
      if (stat.total > 0) {
        const areaName = state.areas.find(a => a.id === areaId)?.name || '未知区域';
        const rate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
        summary += `- ${areaName}：差异 ${stat.total} 项，盘盈 ${stat.overage} 项，盘亏 ${stat.shortage} 项，缺货 ${stat.outOfStock} 项，复盘完成率 ${rate}%\n`;
      }
    });

    const responsibilityStats = new Map<string, number>();
    differenceItems.forEach(item => {
      if (item.responsibilityAttribution) {
        responsibilityStats.set(item.responsibilityAttribution, (responsibilityStats.get(item.responsibilityAttribution) || 0) + 1);
      }
    });

    if (responsibilityStats.size > 0) {
      summary += `\n三、责任归因分布\n`;
      const responsibilityLabels: Record<string, string> = {
        operator: '录入人员',
        system: '系统问题',
        supplier: '供应商问题',
        other: '其他',
      };
      responsibilityStats.forEach((count, key) => {
        summary += `- ${responsibilityLabels[key] || key}：${count} 项\n`;
      });
    }

    return summary;
  }, [state.items, state.areas, getReviewStats]);

  const setReviewData = useCallback((itemId: string, reviewData: {
    reviewConclusion: string;
    handlingOpinion: string;
    responsibilityAttribution: string;
    reviewStatus: string;
  }) => {
    dispatch({
      type: 'SET_REVIEW_DATA',
      payload: {
        itemId,
        ...reviewData,
      },
    });
  }, []);

  const updateArchiveReviewSummary = useCallback((archiveId: string, reviewSummary: string, reviewStats: any) => {
    dispatch({
      type: 'UPDATE_ARCHIVE_REVIEW_SUMMARY',
      payload: {
        archiveId,
        reviewSummary,
        reviewStats,
      },
    });
  }, []);

  const createArchive = useCallback((data: {
    taskName: string;
    inventoryDate: string;
    responsiblePerson: string;
    handoverNote: string;
  }) => {
    const snapshotStats = {
      total: state.items.length,
      counted: state.items.filter(i => i.actualQty !== null || i.isOutOfStock).length,
      differences: state.items.filter(i => i.hasDifference).length,
      confirmed: state.items.filter(i => i.isConfirmed).length,
      outOfStock: state.items.filter(i => i.isOutOfStock).length,
    };

    const reviewStats = getReviewStats();
    const reviewSummary = generateReviewSummary();

    const snapshot: ArchiveSnapshot = {
      areas: JSON.parse(JSON.stringify(state.areas)),
      items: JSON.parse(JSON.stringify(state.items)),
      stats: snapshotStats,
      reviewStats,
      reviewSummary,
    };

    dispatch({
      type: 'ADD_ARCHIVE',
      payload: {
        ...data,
        snapshot,
        createdBy: state.currentRole,
      },
    });
  }, [state.items, state.areas, state.currentRole, getReviewStats, generateReviewSummary]);

  const deleteArchive = useCallback((archiveId: string) => {
    dispatch({ type: 'DELETE_ARCHIVE', payload: archiveId });
  }, []);

  const setArchiveFilter = useCallback((filter: Partial<AppState['archiveFilter']>) => {
    dispatch({ type: 'SET_ARCHIVE_FILTER', payload: filter });
  }, []);

  const setCurrentArchiveId = useCallback((archiveId: string | null) => {
    dispatch({ type: 'SET_CURRENT_ARCHIVE_ID', payload: archiveId });
  }, []);

  const setArchiveView = useCallback((view: AppState['archiveView']) => {
    dispatch({ type: 'SET_ARCHIVE_VIEW', payload: view });
  }, []);

  const restoreFromArchive = useCallback((archive: Archive) => {
    dispatch({
      type: 'RESTORE_FROM_ARCHIVE',
      payload: {
        areas: archive.snapshot.areas,
        items: archive.snapshot.items,
      },
    });
  }, []);

  const currentArchive = useMemo(() => {
    return state.archives.find(a => a.id === state.currentArchiveId) || null;
  }, [state.archives, state.currentArchiveId]);

  const filteredArchives = useMemo(() => {
    return state.archives.filter(archive => {
      if (state.archiveFilter.searchText) {
        const search = state.archiveFilter.searchText.toLowerCase();
        if (
          !archive.taskName.toLowerCase().includes(search) &&
          !archive.responsiblePerson.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      if (state.archiveFilter.dateFrom) {
        if (archive.inventoryDate < state.archiveFilter.dateFrom) return false;
      }
      if (state.archiveFilter.dateTo) {
        if (archive.inventoryDate > state.archiveFilter.dateTo) return false;
      }
      return true;
    });
  }, [state.archives, state.archiveFilter]);

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
    createArchive,
    deleteArchive,
    setArchiveFilter,
    setCurrentArchiveId,
    setArchiveView,
    restoreFromArchive,
    currentArchive,
    filteredArchives,
    setReviewData,
    getReviewStats,
    generateReviewSummary,
    updateArchiveReviewSummary,
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
