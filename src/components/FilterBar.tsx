import { useApp } from '../context/AppContext';

export function FilterBar() {
  const { state, dispatch } = useApp();
  const { filter, areas } = state;

  return (
    <div className="filter-bar">
      <div className="filter-group">
      <select
        className="filter-select"
        value={filter.areaId || ''}
        onChange={(e) => dispatch({
          type: 'SET_FILTER',
          payload: { areaId: e.target.value || null }
        })}
      >
        <option value="">全部区域</option>
        {areas.map(area => (
          <option key={area.id} value={area.id}>{area.name}</option>
        ))}
      </select>

      <input
        type="text"
        className="filter-input"
        placeholder="搜索 SKU / 商品名 / 区域..."
        value={filter.searchText}
        onChange={(e) => dispatch({
          type: 'SET_FILTER',
          payload: { searchText: e.target.value }
        })}
      />
      </div>

      <div className="filter-checkboxes">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filter.showOnlyDifferences}
            onChange={(e) => dispatch({
              type: 'SET_FILTER',
              payload: { showOnlyDifferences: e.target.checked }
            })}
          />
          仅显示差异
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filter.showOnlyUnconfirmed}
            onChange={(e) => dispatch({
              type: 'SET_FILTER',
              payload: { showOnlyUnconfirmed: e.target.checked }
            })}
          />
          仅显示未确认
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filter.showOnlyOutOfStock}
            onChange={(e) => dispatch({
              type: 'SET_FILTER',
              payload: { showOnlyOutOfStock: e.target.checked }
            })}
          />
          仅显示缺货
        </label>
      </div>
    </div>
  );
}
