import { useCallback, useRef, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export function InventoryTable() {
  const {
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
    filteredItems,
  } = useApp();

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleQuickQty = useCallback((digit: number) => {
    if (!state.selectedItemId) return;
    const item = state.items.find(i => i.id === state.selectedItemId);
    if (!item || item.isConfirmed) return;

    let newQty: number;
    if (item.actualQty === null || item.actualQty === 0) {
      newQty = digit;
    } else {
      newQty = item.actualQty * 10 + digit;
    }
    setQuantity(state.selectedItemId, newQty);
  }, [state.selectedItemId, state.items, setQuantity]);

  const handlers = {
    onMoveUp: () => moveSelection(-1),
    onMoveDown: () => moveSelection(1),
    onMarkOutOfStock: () => state.selectedItemId && toggleOutOfStock(state.selectedItemId),
    onNextException: jumpToNextException,
    onBatchConfirm: () => batchConfirm(filteredItems.map(i => i.id)),
    onUndo: undo,
    onRedo: redo,
    onQuickQty: handleQuickQty,
  };

  useKeyboardShortcuts(state.shortcuts, handlers, state.currentRole === 'operator');

  useEffect(() => {
    if (state.selectedItemId && tableRef.current) {
      const row = document.querySelector(`[data-item-id="${state.selectedItemId}"]`);
      row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [state.selectedItemId]);

  const getAreaName = (areaId: string) => {
    return state.areas.find(a => a.id === areaId)?.name || '未知';
  };

  const handleQtyChange = (itemId: string, value: string) => {
    const num = value === '' ? null : parseInt(value);
    if (num === null || !isNaN(num)) {
      setQuantity(itemId, num);
    }
  };

  const handleRowClick = (itemId: string) => {
    dispatch({ type: 'SET_SELECTED_ID', payload: itemId });
  };

  if (filteredItems.length === 0) {
    return (
      <div className="empty-state">
        <p>没有找到符合条件的商品</p>
      </div>
    );
  }

  return (
    <div className="inventory-table-wrapper" ref={tableRef}>
      <table className="inventory-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}></th>
            <th>SKU</th>
            <th>商品名称</th>
            <th>区域</th>
            <th style={{ width: '100px', textAlign: 'right' }}>账面</th>
            <th style={{ width: '120px', textAlign: 'right' }}>实盘</th>
            <th style={{ width: '100px', textAlign: 'center' }}>状态</th>
            <th>备注</th>
            <th style={{ width: '120px' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map(item => (
            <tr
              key={item.id}
              data-item-id={item.id}
              className={`
                ${state.selectedItemId === item.id ? 'selected' : ''}
                ${item.hasDifference ? 'has-diff' : ''}
                ${item.isOutOfStock ? 'out-of-stock' : ''}
                ${item.isConfirmed ? 'confirmed' : ''}
              `}
              onClick={() => handleRowClick(item.id)}
            >
              <td>
                {item.isConfirmed && <span className="status-badge confirmed">✓</span>}
              </td>
              <td className="sku-cell">{item.sku}</td>
              <td className="name-cell">{item.name}</td>
              <td className="area-cell">{getAreaName(item.areaId)}</td>
              <td className="qty-cell">{item.expectedQty}</td>
              <td>
                <input
                  ref={el => inputRefs.current[item.id] = el}
                  type="number"
                  className={`qty-input ${item.actualQty !== item.expectedQty && item.actualQty !== null ? 'diff' : ''}`}
                  value={item.actualQty ?? ''}
                  placeholder="-"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleQtyChange(item.id, e.target.value)}
                  disabled={item.isOutOfStock || item.isConfirmed}
                />
              </td>
              <td className="status-cell">
                {item.isOutOfStock && (
                  <span className="status-badge out-of-stock">缺货</span>
                )}
                {item.hasDifference && !item.isOutOfStock && (
                  <span className="status-badge diff">差异</span>
                )}
              </td>
              <td className="note-cell">
                {item.isConfirmed ? (
                  <span className="note-text">
                    {item.note || <span className="note-placeholder">已确认</span>}
                  </span>
                ) : editingNoteId === item.id ? (
                  <input
                    type="text"
                    className="note-input"
                    value={item.note}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setNote(item.id, e.target.value)}
                    onBlur={() => setEditingNoteId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingNoteId(null);
                    }}
                  />
                ) : (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingNoteId(item.id);
                    }}
                    className="note-text"
                  >
                    {item.note || <span className="note-placeholder">点击添加备注</span>}
                  </span>
                )}
              </td>
              <td className="actions-cell">
                <button
                  className={`btn btn-sm ${item.isOutOfStock ? 'btn-warning' : 'btn-outline'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOutOfStock(item.id);
                  }}
                  disabled={item.isConfirmed}
                >
                  {item.isOutOfStock ? '取消缺货' : '缺货'}
                </button>
                <button
                  className="btn btn-sm btn-success"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmItem(item.id);
                  }}
                  disabled={item.isConfirmed}
                >
                  {item.isConfirmed ? '已确认' : '确认'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
