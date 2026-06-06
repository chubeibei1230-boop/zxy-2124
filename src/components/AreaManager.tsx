import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../utils/helpers';
import type { InventoryItem } from '../types';

export function AreaManager() {
  const { state, dispatch } = useApp();
  const [newAreaName, setNewAreaName] = useState('');
  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    areaId: state.areas[0]?.id || '',
    expectedQty: 0,
  });

  const handleAddArea = () => {
    if (!newAreaName.trim()) return;
    const newArea = {
      id: generateId(),
      name: newAreaName.trim(),
      createdAt: Date.now(),
    };
    dispatch({ type: 'SET_AREAS', payload: [...state.areas, newArea] });
    setNewAreaName('');
  };

  const handleDeleteArea = (areaId: string) => {
    if (!confirm('删除区域会同时删除该区域下的所有商品，确定吗？')) return;
    const remainingAreas = state.areas.filter(a => a.id !== areaId);
    const remainingItems = state.items.filter(i => i.areaId !== areaId);
    dispatch({ type: 'SET_AREAS', payload: remainingAreas });
    dispatch({ type: 'SET_ITEMS', payload: remainingItems });
  };

  const handleAddItem = () => {
    if (!newItem.sku.trim() || !newItem.name.trim()) return;
    const item: InventoryItem = {
      id: generateId(),
      sku: newItem.sku.trim(),
      name: newItem.name.trim(),
      areaId: newItem.areaId,
      expectedQty: newItem.expectedQty,
      actualQty: null,
      note: '',
      isOutOfStock: false,
      isConfirmed: false,
      hasDifference: false,
      prevQty: null,
    };
    dispatch({ type: 'ADD_ITEM', payload: item });
    setNewItem({ sku: '', name: '', areaId: state.areas[0]?.id || '', expectedQty: 0 });
  };

  const handleDeleteItem = (itemId: string) => {
    dispatch({ type: 'DELETE_ITEM', payload: itemId });
  };

  const handleResetAll = () => {
    if (!confirm('确定要重置所有盘点数据吗？数量、备注、确认状态都会被清空。')) return;
    const resetItems = state.items.map(item => ({
      ...item,
      actualQty: null,
      note: '',
      isOutOfStock: false,
      isConfirmed: false,
      hasDifference: false,
      prevQty: null,
    }));
    dispatch({ type: 'SET_ITEMS', payload: resetItems });
  };

  return (
    <div className="area-manager">
      <div className="section">
        <h2 className="section-title">🗂️ 盘点区域管理</h2>
        <div className="area-list">
          {state.areas.map(area => (
            <div key={area.id} className="area-card">
              <span className="area-name">{area.name}</span>
              <span className="area-count">
                {state.items.filter(i => i.areaId === area.id).length} 个商品
              </span>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteArea(area.id)}
              >
                删除
              </button>
            </div>
          ))}
        </div>
        <div className="add-area-form">
          <input
            type="text"
            className="form-input"
            placeholder="输入新区域名称..."
            value={newAreaName}
            onChange={(e) => setNewAreaName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddArea()}
          />
          <button className="btn btn-primary" onClick={handleAddArea}>
            + 添加区域
          </button>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">📋 商品管理</h2>
        <div className="add-item-form">
          <input
            type="text"
            className="form-input"
            placeholder="SKU"
            value={newItem.sku}
            onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
          />
          <input
            type="text"
            className="form-input"
            placeholder="商品名称"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          />
          <select
            className="form-input"
            value={newItem.areaId}
            onChange={(e) => setNewItem({ ...newItem, areaId: e.target.value })}
          >
            {state.areas.map(area => (
              <option key={area.id} value={area.id}>{area.name}</option>
            ))}
          </select>
          <input
            type="number"
            className="form-input"
            placeholder="账面数量"
            value={newItem.expectedQty || ''}
            onChange={(e) => setNewItem({ ...newItem, expectedQty: parseInt(e.target.value) || 0 })}
          />
          <button className="btn btn-primary" onClick={handleAddItem}>
            + 添加商品
          </button>
        </div>

        <div className="items-preview">
          <table className="mini-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>商品名称</th>
                <th>区域</th>
                <th>账面数量</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map(item => {
                const area = state.areas.find(a => a.id === item.areaId);
                return (
                  <tr key={item.id}>
                    <td>{item.sku}</td>
                    <td>{item.name}</td>
                    <td>{area?.name}</td>
                    <td>{item.expectedQty}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">⚠️ 危险操作</h2>
        <button className="btn btn-danger" onClick={handleResetAll}>
          重置所有盘点数据
        </button>
      </div>
    </div>
  );
}
