import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

export function ReviewPanel() {
  const { state, confirmItem, batchConfirm } = useApp();

  const exceptionItems = useMemo(() => {
    return state.items.filter(i => i.hasDifference || i.isOutOfStock);
  }, [state.items]);

  const unconfirmedExceptions = useMemo(() => {
    return exceptionItems.filter(i => !i.isConfirmed);
  }, [exceptionItems]);

  const getAreaName = (areaId: string) => {
    return state.areas.find(a => a.id === areaId)?.name || '未知';
  };

  const getDiff = (item: typeof state.items[0]) => {
    const actual = item.isOutOfStock ? 0 : (item.actualQty ?? 0);
    return actual - item.expectedQty;
  };

  const handleConfirmAll = () => {
    const ids = unconfirmedExceptions.map(i => i.id);
    if (ids.length === 0) return;
    if (confirm(`确定批量确认 ${ids.length} 条差异记录吗？`)) {
      batchConfirm(ids);
    }
  };

  return (
    <div className="review-panel">
      <div className="review-header">
        <div className="review-stats">
          <div className="stat-card stat-warning">
            <span className="stat-card-value">{exceptionItems.length}</span>
            <span className="stat-card-label">总差异数</span>
          </div>
          <div className="stat-card stat-danger">
            <span className="stat-card-value">{unconfirmedExceptions.length}</span>
            <span className="stat-card-label">待复核</span>
          </div>
          <div className="stat-card stat-success">
            <span className="stat-card-value">{exceptionItems.length - unconfirmedExceptions.length}</span>
            <span className="stat-card-label">已复核</span>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleConfirmAll}
          disabled={unconfirmedExceptions.length === 0}
        >
          批量确认全部 ({unconfirmedExceptions.length})
        </button>
      </div>

      {exceptionItems.length === 0 ? (
        <div className="empty-state">
          <p>✅ 暂无差异，盘点数据全部一致</p>
        </div>
      ) : (
        <div className="exception-list">
          {exceptionItems.map(item => {
            const diff = getDiff(item);
            return (
              <div
                key={item.id}
                className={`exception-card ${item.isConfirmed ? 'confirmed' : ''}`}
              >
                <div className="exception-main">
                  <div className="exception-info">
                    <span className="exception-sku">{item.sku}</span>
                    <span className="exception-name">{item.name}</span>
                    <span className="exception-area">{getAreaName(item.areaId)}</span>
                  </div>
                  <div className="exception-qtys">
                    <div className="qty-block">
                      <span className="qty-label">账面</span>
                      <span className="qty-value">{item.expectedQty}</span>
                    </div>
                    <div className="qty-arrow">→</div>
                    <div className="qty-block">
                      <span className="qty-label">实盘</span>
                      <span className="qty-value">
                        {item.isOutOfStock ? '缺货' : item.actualQty}
                      </span>
                    </div>
                    <div className={`qty-diff ${diff > 0 ? 'plus' : 'minus'}`}>
                      {diff > 0 ? '+' : ''}{diff}
                    </div>
                  </div>
                </div>
                {item.note && (
                  <div className="exception-note">
                    <span className="note-label">备注：</span>
                    {item.note}
                  </div>
                )}
                <div className="exception-actions">
                  {item.isConfirmed ? (
                    <span className="status-badge confirmed large">已确认 ✓</span>
                  ) : (
                    <button
                      className="btn btn-success"
                      onClick={() => confirmItem(item.id)}
                    >
                      确认差异
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
