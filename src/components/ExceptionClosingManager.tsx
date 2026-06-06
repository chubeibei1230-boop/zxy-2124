import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { InventoryItem, DifferenceType, ClosingStatus, ResponsibilityAttribution } from '../types';

const DIFFERENCE_TYPE_LABELS: Record<DifferenceType, string> = {
  overage: '盘盈',
  shortage: '盘亏',
  outOfStock: '缺货',
  noDifference: '无差异',
};

const CLOSING_STATUS_LABELS: Record<ClosingStatus, string> = {
  notStarted: '未开始',
  inProgress: '处理中',
  completed: '已闭环',
};

const RESPONSIBILITY_LABELS: Record<ResponsibilityAttribution, string> = {
  operator: '录入人员',
  system: '系统问题',
  supplier: '供应商问题',
  other: '其他',
  '': '未归因',
};

function getDifferenceType(item: InventoryItem): DifferenceType {
  if (item.isOutOfStock) return 'outOfStock';
  if (!item.hasDifference) return 'noDifference';
  const diff = (item.actualQty ?? 0) - item.expectedQty;
  return diff > 0 ? 'overage' : 'shortage';
}

export function ExceptionClosingManager() {
  const { state, setClosingData, getClosingStats } = useApp();
  const [filterAreaId, setFilterAreaId] = useState<string>('');
  const [filterDiffType, setFilterDiffType] = useState<string>('');
  const [filterResponsibility, setFilterResponsibility] = useState<string>('');
  const [filterClosingStatus, setFilterClosingStatus] = useState<string>('notStarted,inProgress');
  const [showOnlyUnclosed, setShowOnlyUnclosed] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    closingProgress: '',
    expectedClosingDate: '',
    finalResult: '',
    closingStatus: 'notStarted' as ClosingStatus,
  });

  const closingStats = useMemo(() => getClosingStats(), [getClosingStats]);

  const allExceptionItems = useMemo(() => {
    return state.items.filter(i => i.hasDifference || i.isOutOfStock);
  }, [state.items]);

  const filteredItems = useMemo(() => {
    let items = allExceptionItems;
    
    if (showOnlyUnclosed) {
      items = items.filter(i => i.closingStatus !== 'completed');
    }
    
    if (filterClosingStatus) {
      const statuses = filterClosingStatus.split(',');
      items = items.filter(i => statuses.includes(i.closingStatus));
    }
    
    if (filterAreaId) {
      items = items.filter(i => i.areaId === filterAreaId);
    }
    if (filterDiffType) {
      items = items.filter(i => getDifferenceType(i) === filterDiffType);
    }
    if (filterResponsibility) {
      items = items.filter(i => i.responsibilityAttribution === filterResponsibility);
    }
    return items;
  }, [allExceptionItems, showOnlyUnclosed, filterClosingStatus, filterAreaId, filterDiffType, filterResponsibility]);

  const getAreaName = (areaId: string) => {
    return state.areas.find(a => a.id === areaId)?.name || '未知';
  };

  const getDiff = (item: InventoryItem) => {
    const actual = item.isOutOfStock ? 0 : (item.actualQty ?? 0);
    return actual - item.expectedQty;
  };

  const isOverdue = (item: InventoryItem) => {
    if (item.closingStatus === 'completed' || !item.expectedClosingDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return item.expectedClosingDate < today;
  };

  const getStatusBadgeClass = (status: ClosingStatus) => {
    switch (status) {
      case 'completed': return 'status-badge confirmed';
      case 'inProgress': return 'status-badge pending';
      case 'notStarted': return 'status-badge out-of-stock';
      default: return 'status-badge';
    }
  };

  const getDiffTypeBadgeClass = (type: DifferenceType) => {
    switch (type) {
      case 'overage': return 'status-badge confirmed';
      case 'shortage': return 'status-badge out-of-stock';
      case 'outOfStock': return 'status-badge pending';
      default: return 'status-badge';
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setEditForm({
      closingProgress: item.closingProgress,
      expectedClosingDate: item.expectedClosingDate,
      finalResult: item.finalResult,
      closingStatus: item.closingStatus,
    });
  };

  const handleSave = () => {
    if (!editingItemId) return;
    
    if (editForm.closingStatus === 'completed') {
      if (!editForm.finalResult.trim()) {
        alert('请填写最终处理结果');
        return;
      }
    }
    
    setClosingData(editingItemId, editForm);
    setEditingItemId(null);
  };

  const handleCancel = () => {
    setEditingItemId(null);
  };

  const areaStats = useMemo(() => {
    const stats = new Map<string, { total: number; unclosed: number; completed: number }>();
    state.areas.forEach(area => {
      stats.set(area.id, { total: 0, unclosed: 0, completed: 0 });
    });
    allExceptionItems.forEach(item => {
      const stat = stats.get(item.areaId);
      if (stat) {
        stat.total++;
        if (item.closingStatus === 'completed') {
          stat.completed++;
        } else {
          stat.unclosed++;
        }
      }
    });
    return stats;
  }, [allExceptionItems, state.areas]);

  const diffTypeStats = useMemo(() => {
    const stats = {
      overage: { total: 0, unclosed: 0 },
      shortage: { total: 0, unclosed: 0 },
      outOfStock: { total: 0, unclosed: 0 },
    };
    allExceptionItems.forEach(item => {
      const type = getDifferenceType(item);
      if (type === 'noDifference') return;
      const stat = stats[type as keyof typeof stats];
      if (stat) {
        stat.total++;
        if (item.closingStatus !== 'completed') {
          stat.unclosed++;
        }
      }
    });
    return stats;
  }, [allExceptionItems]);

  const responsibilityStats = useMemo(() => {
    const stats = new Map<string, { total: number; unclosed: number }>();
    (['operator', 'system', 'supplier', 'other', ''] as ResponsibilityAttribution[]).forEach(r => {
      stats.set(r, { total: 0, unclosed: 0 });
    });
    allExceptionItems.forEach(item => {
      const stat = stats.get(item.responsibilityAttribution);
      if (stat) {
        stat.total++;
        if (item.closingStatus !== 'completed') {
          stat.unclosed++;
        }
      }
    });
    return stats;
  }, [allExceptionItems]);

  return (
    <div className="closing-manager">
      <div className="closing-header">
        <h2 className="section-title">🔍 异常闭环跟踪管理</h2>
        <p className="closing-description">
          查看所有盘点异常的闭环处理进度，支持多维度筛选和统计分析
        </p>
      </div>

      <div className="stats-overview">
        <div className="stat-card-large stat-warning">
          <div className="stat-card-icon">⚠️</div>
          <div className="stat-card-info">
            <span className="stat-card-num">{closingStats.totalExceptions}</span>
            <span className="stat-card-label">总异常数</span>
          </div>
        </div>
        <div className="stat-card-large stat-danger">
          <div className="stat-card-icon">⏳</div>
          <div className="stat-card-info">
            <span className="stat-card-num">{closingStats.notStarted}</span>
            <span className="stat-card-label">未开始处理</span>
          </div>
        </div>
        <div className="stat-card-large" style={{ borderTop: '3px solid var(--primary)' }}>
          <div className="stat-card-icon">🔄</div>
          <div className="stat-card-info">
            <span className="stat-card-num">{closingStats.inProgress}</span>
            <span className="stat-card-label">处理中</span>
          </div>
        </div>
        <div className="stat-card-large stat-success">
          <div className="stat-card-icon">✅</div>
          <div className="stat-card-info">
            <span className="stat-card-num">{closingStats.completed}</span>
            <span className="stat-card-label">已闭环</span>
          </div>
        </div>
        <div className="stat-card-large stat-danger">
          <div className="stat-card-icon">⏰</div>
          <div className="stat-card-info">
            <span className="stat-card-num">{closingStats.overdue}</span>
            <span className="stat-card-label">已逾期</span>
          </div>
        </div>
        <div className="stat-card-large">
          <div className="stat-card-icon">📈</div>
          <div className="stat-card-info">
            <span className="stat-card-num">{closingStats.closingRate}%</span>
            <span className="stat-card-label">闭环率</span>
          </div>
        </div>
      </div>

      <div className="closing-progress-section">
        <h3 className="section-subtitle">📊 总体闭环进度</h3>
        <div className="progress-bar large">
          <div
            className="progress-fill success"
            style={{ width: `${closingStats.closingRate}%` }}
          />
          <span className="progress-text">
            已闭环 {closingStats.completed} / {closingStats.totalExceptions} ({closingStats.closingRate}%)
          </span>
        </div>
      </div>

      <div className="stats-breakdown">
        <div className="breakdown-card">
          <h4 className="breakdown-title">🗂️ 按库区分布</h4>
          <div className="breakdown-list">
            {state.areas.map(area => {
              const stat = areaStats.get(area.id);
              if (!stat || stat.total === 0) return null;
              const rate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
              return (
                <div key={area.id} className="breakdown-item">
                  <span className="breakdown-label">{area.name}</span>
                  <div className="breakdown-progress">
                    <div className="progress-bar small">
                      <div className="progress-fill success" style={{ width: `${rate}%` }} />
                    </div>
                    <span className="breakdown-count">
                      {stat.completed}/{stat.total} ({rate}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="breakdown-card">
          <h4 className="breakdown-title">📋 按异常类型分布</h4>
          <div className="breakdown-list">
            {(Object.keys(diffTypeStats) as (keyof typeof diffTypeStats)[]).map(type => {
              const stat = diffTypeStats[type];
              if (stat.total === 0) return null;
              return (
                <div key={type} className="breakdown-item">
                  <span className="breakdown-label">{DIFFERENCE_TYPE_LABELS[type]}</span>
                  <span className="breakdown-count">
                    共 {stat.total} 项，未闭环 {stat.unclosed} 项
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="breakdown-card">
          <h4 className="breakdown-title">👤 按责任归因分布</h4>
          <div className="breakdown-list">
            {(['operator', 'system', 'supplier', 'other', ''] as ResponsibilityAttribution[]).map(r => {
              const stat = responsibilityStats.get(r);
              if (!stat || stat.total === 0) return null;
              return (
                <div key={r} className="breakdown-item">
                  <span className="breakdown-label">{RESPONSIBILITY_LABELS[r]}</span>
                  <span className="breakdown-count">
                    共 {stat.total} 项，未闭环 {stat.unclosed} 项
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="closing-filters">
        <div className="filter-group">
          <label className="filter-label">
            <input
              type="checkbox"
              checked={showOnlyUnclosed}
              onChange={(e) => setShowOnlyUnclosed(e.target.checked)}
            />
            仅显示未闭环
          </label>
        </div>
        <div className="filter-group">
          <label className="filter-label">库区筛选：</label>
          <select
            className="form-input"
            value={filterAreaId}
            onChange={(e) => setFilterAreaId(e.target.value)}
          >
            <option value="">全部库区</option>
            {state.areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">异常类型：</label>
          <select
            className="form-input"
            value={filterDiffType}
            onChange={(e) => setFilterDiffType(e.target.value)}
          >
            <option value="">全部类型</option>
            <option value="overage">盘盈</option>
            <option value="shortage">盘亏</option>
            <option value="outOfStock">缺货</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">责任归因：</label>
          <select
            className="form-input"
            value={filterResponsibility}
            onChange={(e) => setFilterResponsibility(e.target.value)}
          >
            <option value="">全部归因</option>
            <option value="operator">录入人员</option>
            <option value="system">系统问题</option>
            <option value="supplier">供应商问题</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">闭环状态：</label>
          <select
            className="form-input"
            value={filterClosingStatus}
            onChange={(e) => setFilterClosingStatus(e.target.value)}
          >
            <option value="notStarted,inProgress">未闭环（未开始+处理中）</option>
            <option value="notStarted">未开始</option>
            <option value="inProgress">处理中</option>
            <option value="completed">已闭环</option>
            <option value="">全部状态</option>
          </select>
        </div>
        <span className="items-count">共 {filteredItems.length} 条记录</span>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <p>✅ 暂无符合条件的异常记录</p>
        </div>
      ) : (
        <div className="exception-list">
          {filteredItems.map((item) => {
            const diff = getDiff(item);
            const diffType = getDifferenceType(item);
            const isEditing = editingItemId === item.id;
            const overdue = isOverdue(item);

            return (
              <div
                key={item.id}
                className={`exception-card ${item.closingStatus === 'completed' ? 'confirmed' : ''} ${overdue ? 'overdue' : ''}`}
              >
                <div className="exception-main">
                  <div className="exception-info">
                    <span className="exception-sku">{item.sku}</span>
                    <span className="exception-name">{item.name}</span>
                    <span className="exception-area">{getAreaName(item.areaId)}</span>
                    <span className={getDiffTypeBadgeClass(diffType)}>
                      {DIFFERENCE_TYPE_LABELS[diffType]}
                    </span>
                    <span className={getStatusBadgeClass(item.closingStatus)}>
                      {CLOSING_STATUS_LABELS[item.closingStatus]}
                      {overdue && ' ⏰ 逾期'}
                    </span>
                    {item.responsibilityAttribution && (
                      <span className="status-badge">
                        {RESPONSIBILITY_LABELS[item.responsibilityAttribution]}
                      </span>
                    )}
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
                    <div className={`qty-diff ${diff > 0 ? 'plus' : diff < 0 ? 'minus' : ''}`}>
                      {diff > 0 ? '+' : ''}{diff}
                    </div>
                  </div>
                </div>

                {!isEditing && (
                  <>
                    {item.note && (
                      <div className="exception-note">
                        <span className="note-label">盘点备注：</span>
                        {item.note}
                      </div>
                    )}
                    {item.reviewConclusion && (
                      <div className="exception-note">
                        <span className="note-label">复核结论：</span>
                        {item.reviewConclusion}
                      </div>
                    )}
                    {item.closingProgress && (
                      <div className="exception-note">
                        <span className="note-label">处理进度：</span>
                        {item.closingProgress}
                      </div>
                    )}
                    {item.expectedClosingDate && (
                      <div className="exception-note">
                        <span className="note-label">预计完成时间：</span>
                        {item.expectedClosingDate}
                        {overdue && <span style={{ color: 'var(--danger)', marginLeft: 8 }}>已逾期</span>}
                      </div>
                    )}
                    {item.finalResult && (
                      <div className="exception-note">
                        <span className="note-label">最终处理结果：</span>
                        {item.finalResult}
                      </div>
                    )}
                    <div className="exception-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleEdit(item)}
                      >
                        {item.closingStatus === 'notStarted' ? '登记闭环' : '编辑闭环'}
                      </button>
                    </div>
                  </>
                )}

                {isEditing && (
                  <div className="review-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">闭环状态 <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <select
                          className="form-input"
                          value={editForm.closingStatus}
                          onChange={(e) => setEditForm({ ...editForm, closingStatus: e.target.value as ClosingStatus })}
                        >
                          <option value="notStarted">未开始</option>
                          <option value="inProgress">处理中</option>
                          <option value="completed">已闭环</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">预计完成时间</label>
                        <input
                          type="date"
                          className="form-input"
                          value={editForm.expectedClosingDate}
                          onChange={(e) => setEditForm({ ...editForm, expectedClosingDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">处理进度</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="请输入当前处理进度..."
                        value={editForm.closingProgress}
                        onChange={(e) => setEditForm({ ...editForm, closingProgress: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        最终处理结果
                        {editForm.closingStatus === 'completed' && <span style={{ color: 'var(--danger)' }}> *</span>}
                      </label>
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="请输入最终处理结果..."
                        value={editForm.finalResult}
                        onChange={(e) => setEditForm({ ...editForm, finalResult: e.target.value })}
                        style={{
                          borderColor: editForm.closingStatus === 'completed' && !editForm.finalResult.trim() ? 'var(--danger)' : undefined
                        }}
                      />
                    </div>
                    {editForm.closingStatus === 'completed' && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--danger)' }}>*</span> 标记为"已闭环"时，最终处理结果必须填写
                      </div>
                    )}
                    <div className="form-actions">
                      <button className="btn btn-ghost" onClick={handleCancel}>
                        取消
                      </button>
                      <button className="btn btn-primary" onClick={handleSave}>
                        保存
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
