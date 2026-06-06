import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { DifferenceType, ReviewStatus, ResponsibilityAttribution, InventoryItem, ClosingStatus } from '../types';

const DIFFERENCE_TYPE_LABELS: Record<DifferenceType, string> = {
  overage: '盘盈',
  shortage: '盘亏',
  outOfStock: '缺货',
  noDifference: '无差异',
};

const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: '待处理',
  inProgress: '复盘中',
  completed: '已完成',
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

export function ReviewPanel() {
  const { state, setReviewData, setClosingData, getReviewStats, generateReviewSummary, confirmItem, batchConfirm } = useApp();
  const [filterAreaId, setFilterAreaId] = useState<string>('');
  const [filterDiffType, setFilterDiffType] = useState<string>('');
  const [filterReviewStatus, setFilterReviewStatus] = useState<string>('');
  const [filterClosingStatus, setFilterClosingStatus] = useState<string>('');
  const [filterConfirmStatus, setFilterConfirmStatus] = useState<string>('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingClosingItemId, setEditingClosingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    reviewConclusion: '',
    handlingOpinion: '',
    responsibilityAttribution: '' as ResponsibilityAttribution,
    reviewStatus: 'pending' as ReviewStatus,
  });
  const [closingEditForm, setClosingEditForm] = useState({
    closingProgress: '',
    expectedClosingDate: '',
    finalResult: '',
    closingStatus: 'notStarted' as ClosingStatus,
  });

  const reviewStats = useMemo(() => getReviewStats(), [getReviewStats]);

  const exceptionItems = useMemo(() => {
    return state.items.filter(i => i.hasDifference || i.isOutOfStock);
  }, [state.items]);

  const filteredItems = useMemo(() => {
    let items = exceptionItems;
    if (filterAreaId) {
      items = items.filter(i => i.areaId === filterAreaId);
    }
    if (filterDiffType) {
      items = items.filter(i => getDifferenceType(i) === filterDiffType);
    }
    if (filterReviewStatus) {
      items = items.filter(i => i.reviewStatus === filterReviewStatus);
    }
    if (filterClosingStatus) {
      items = items.filter(i => i.closingStatus === filterClosingStatus);
    }
    if (filterConfirmStatus === 'confirmed') {
      items = items.filter(i => i.isConfirmed);
    } else if (filterConfirmStatus === 'unconfirmed') {
      items = items.filter(i => !i.isConfirmed);
    }
    return items;
  }, [exceptionItems, filterAreaId, filterDiffType, filterReviewStatus, filterClosingStatus, filterConfirmStatus]);

  const unconfirmedExceptions = useMemo(() => {
    return exceptionItems.filter(i => !i.isConfirmed);
  }, [exceptionItems]);

  const getAreaName = (areaId: string) => {
    return state.areas.find(a => a.id === areaId)?.name || '未知';
  };

  const getDiff = (item: InventoryItem) => {
    const actual = item.isOutOfStock ? 0 : (item.actualQty ?? 0);
    return actual - item.expectedQty;
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setEditForm({
      reviewConclusion: item.reviewConclusion,
      handlingOpinion: item.handlingOpinion,
      responsibilityAttribution: item.responsibilityAttribution,
      reviewStatus: item.reviewStatus,
    });
  };

  const handleSave = () => {
    if (!editingItemId) return;
    
    if (editForm.reviewStatus === 'completed') {
      if (!editForm.reviewConclusion.trim()) {
        alert('请填写复核结论');
        return;
      }
      if (!editForm.handlingOpinion.trim()) {
        alert('请填写处理意见');
        return;
      }
      if (!editForm.responsibilityAttribution) {
        alert('请选择责任归因');
        return;
      }
    }
    
    setReviewData(editingItemId, editForm);
    setEditingItemId(null);
  };

  const handleCancel = () => {
    setEditingItemId(null);
  };

  const handleEditClosing = (item: InventoryItem) => {
    setEditingClosingItemId(item.id);
    setClosingEditForm({
      closingProgress: item.closingProgress,
      expectedClosingDate: item.expectedClosingDate,
      finalResult: item.finalResult,
      closingStatus: item.closingStatus,
    });
  };

  const handleSaveClosing = () => {
    if (!editingClosingItemId) return;
    
    if (closingEditForm.closingStatus === 'completed') {
      if (!closingEditForm.finalResult.trim()) {
        alert('请填写最终处理结果');
        return;
      }
    }
    
    setClosingData(editingClosingItemId, closingEditForm);
    setEditingClosingItemId(null);
  };

  const handleCancelClosing = () => {
    setEditingClosingItemId(null);
  };

  const handleConfirmAll = () => {
    const ids = unconfirmedExceptions.map(i => i.id);
    if (ids.length === 0) return;
    if (confirm(`确定批量确认 ${ids.length} 条差异记录吗？`)) {
      batchConfirm(ids);
    }
  };

  const handleCopySummary = () => {
    const summary = generateReviewSummary();
    navigator.clipboard.writeText(summary).then(() => {
      alert('复盘摘要已复制到剪贴板！');
    });
  };

  const getStatusBadgeClass = (status: ReviewStatus) => {
    switch (status) {
      case 'completed': return 'status-badge confirmed';
      case 'inProgress': return 'status-badge pending';
      case 'pending': return 'status-badge out-of-stock';
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

  const getClosingStatusBadgeClass = (status: ClosingStatus) => {
    switch (status) {
      case 'completed': return 'status-badge confirmed';
      case 'inProgress': return 'status-badge pending';
      case 'notStarted': return 'status-badge out-of-stock';
      default: return 'status-badge';
    }
  };

  const isOverdue = (item: InventoryItem) => {
    if (item.closingStatus === 'completed' || !item.expectedClosingDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return item.expectedClosingDate < today;
  };

  return (
    <div className="review-panel">
      <div className="review-header">
        <div className="review-stats">
          <div className="stat-card stat-warning">
            <span className="stat-card-value">{reviewStats.totalDifferences}</span>
            <span className="stat-card-label">总差异数</span>
          </div>
          <div className="stat-card stat-danger">
            <span className="stat-card-value">{reviewStats.pending}</span>
            <span className="stat-card-label">待处理</span>
          </div>
          <div className="stat-card stat-primary">
            <span className="stat-card-value">{reviewStats.inProgress}</span>
            <span className="stat-card-label">复盘中</span>
          </div>
          <div className="stat-card stat-success">
            <span className="stat-card-value">{reviewStats.completed}</span>
            <span className="stat-card-label">复盘完成</span>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
            <span className="stat-card-value">{reviewStats.closingStats.unclosed}</span>
            <span className="stat-card-label">未闭环</span>
          </div>
          <div className="stat-card stat-success">
            <span className="stat-card-value">{reviewStats.closingStats.completed}</span>
            <span className="stat-card-label">已闭环</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-value">{reviewStats.closingStats.closingRate}%</span>
            <span className="stat-card-label">闭环率</span>
          </div>
        </div>
        <div className="review-actions">
          <button
            className="btn btn-primary"
            onClick={handleConfirmAll}
            disabled={unconfirmedExceptions.length === 0}
          >
            批量确认差异 ({unconfirmedExceptions.length})
          </button>
          <button
            className="btn btn-success"
            onClick={() => setShowSummaryModal(true)}
          >
            📄 生成复盘摘要
          </button>
        </div>
      </div>

      <div className="review-filters">
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
          <label className="filter-label">差异类型：</label>
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
          <label className="filter-label">复盘状态：</label>
          <select
            className="form-input"
            value={filterReviewStatus}
            onChange={(e) => setFilterReviewStatus(e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="inProgress">复盘中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">闭环状态：</label>
          <select
            className="form-input"
            value={filterClosingStatus}
            onChange={(e) => setFilterClosingStatus(e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="notStarted">未开始</option>
            <option value="inProgress">处理中</option>
            <option value="completed">已闭环</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">确认状态：</label>
          <select
            className="form-input"
            value={filterConfirmStatus}
            onChange={(e) => setFilterConfirmStatus(e.target.value)}
          >
            <option value="">全部</option>
            <option value="unconfirmed">待确认</option>
            <option value="confirmed">已确认</option>
          </select>
        </div>
        <span className="items-count">共 {filteredItems.length} 条记录</span>
      </div>

      {exceptionItems.length === 0 ? (
        <div className="empty-state">
          <p>✅ 暂无差异，盘点数据全部一致</p>
        </div>
      ) : (
        <div className="exception-list">
          {filteredItems.map((item) => {
            const diff = getDiff(item);
            const diffType = getDifferenceType(item);
            const isEditing = editingItemId === item.id;

            return (
              <div
                key={item.id}
                className={`exception-card ${item.reviewStatus === 'completed' ? 'confirmed' : ''}`}
              >
                <div className="exception-main">
                  <div className="exception-info">
                    <span className="exception-sku">{item.sku}</span>
                    <span className="exception-name">{item.name}</span>
                    <span className="exception-area">{getAreaName(item.areaId)}</span>
                    <span className={`${getDiffTypeBadgeClass(diffType)}`}>
                      {DIFFERENCE_TYPE_LABELS[diffType]}
                    </span>
                    <span className={getStatusBadgeClass(item.reviewStatus)}>
                      {REVIEW_STATUS_LABELS[item.reviewStatus]}
                    </span>
                    <span className={getClosingStatusBadgeClass(item.closingStatus)}>
                      {CLOSING_STATUS_LABELS[item.closingStatus]}
                      {isOverdue(item) && ' ⚠️'}
                    </span>
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
                    {item.handlingOpinion && (
                      <div className="exception-note">
                        <span className="note-label">处理意见：</span>
                        {item.handlingOpinion}
                      </div>
                    )}
                    {item.responsibilityAttribution && (
                      <div className="exception-note">
                        <span className="note-label">责任归因：</span>
                        {RESPONSIBILITY_LABELS[item.responsibilityAttribution]}
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
                        {isOverdue(item) && <span style={{ color: 'var(--danger)', marginLeft: 8 }}>已逾期</span>}
                      </div>
                    )}
                    {item.finalResult && (
                      <div className="exception-note">
                        <span className="note-label">最终处理结果：</span>
                        {item.finalResult}
                      </div>
                    )}
                    <div className="exception-actions">
                      {!item.isConfirmed ? (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => confirmItem(item.id)}
                        >
                          确认差异
                        </button>
                      ) : (
                        <span className="status-badge confirmed">差异已确认 ✓</span>
                      )}
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleEdit(item)}
                      >
                        {item.reviewStatus === 'pending' ? '开始复盘' : '编辑复盘'}
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                        onClick={() => handleEditClosing(item)}
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
                        <label className="form-label">复盘状态 <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <select
                          className="form-input"
                          value={editForm.reviewStatus}
                          onChange={(e) => setEditForm({ ...editForm, reviewStatus: e.target.value as ReviewStatus })}
                        >
                          <option value="pending">待处理</option>
                          <option value="inProgress">复盘中</option>
                          <option value="completed">已完成</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          责任归因
                          {editForm.reviewStatus === 'completed' && <span style={{ color: 'var(--danger)' }}> *</span>}
                        </label>
                        <select
                          className="form-input"
                          value={editForm.responsibilityAttribution}
                          onChange={(e) => setEditForm({ ...editForm, responsibilityAttribution: e.target.value as ResponsibilityAttribution })}
                          style={{
                            borderColor: editForm.reviewStatus === 'completed' && !editForm.responsibilityAttribution ? 'var(--danger)' : undefined
                          }}
                        >
                          <option value="">请选择</option>
                          <option value="operator">录入人员</option>
                          <option value="system">系统问题</option>
                          <option value="supplier">供应商问题</option>
                          <option value="other">其他</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        复核结论
                        {editForm.reviewStatus === 'completed' && <span style={{ color: 'var(--danger)' }}> *</span>}
                      </label>
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="请输入复核结论，说明差异产生的原因..."
                        value={editForm.reviewConclusion}
                        onChange={(e) => setEditForm({ ...editForm, reviewConclusion: e.target.value })}
                        style={{
                          borderColor: editForm.reviewStatus === 'completed' && !editForm.reviewConclusion.trim() ? 'var(--danger)' : undefined
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        处理意见
                        {editForm.reviewStatus === 'completed' && <span style={{ color: 'var(--danger)' }}> *</span>}
                      </label>
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="请输入处理意见，说明后续如何处理该差异..."
                        value={editForm.handlingOpinion}
                        onChange={(e) => setEditForm({ ...editForm, handlingOpinion: e.target.value })}
                        style={{
                          borderColor: editForm.reviewStatus === 'completed' && !editForm.handlingOpinion.trim() ? 'var(--danger)' : undefined
                        }}
                      />
                    </div>
                    {editForm.reviewStatus === 'completed' && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--danger)' }}>*</span> 标记为"已完成"时，以上字段必须填写
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

                {editingClosingItemId === item.id && (
                  <div className="review-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">闭环状态 <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <select
                          className="form-input"
                          value={closingEditForm.closingStatus}
                          onChange={(e) => setClosingEditForm({ ...closingEditForm, closingStatus: e.target.value as ClosingStatus })}
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
                          value={closingEditForm.expectedClosingDate}
                          onChange={(e) => setClosingEditForm({ ...closingEditForm, expectedClosingDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">处理进度</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="请输入当前处理进度..."
                        value={closingEditForm.closingProgress}
                        onChange={(e) => setClosingEditForm({ ...closingEditForm, closingProgress: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        最终处理结果
                        {closingEditForm.closingStatus === 'completed' && <span style={{ color: 'var(--danger)' }}> *</span>}
                      </label>
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="请输入最终处理结果..."
                        value={closingEditForm.finalResult}
                        onChange={(e) => setClosingEditForm({ ...closingEditForm, finalResult: e.target.value })}
                        style={{
                          borderColor: closingEditForm.closingStatus === 'completed' && !closingEditForm.finalResult.trim() ? 'var(--danger)' : undefined
                        }}
                      />
                    </div>
                    {closingEditForm.closingStatus === 'completed' && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--danger)' }}>*</span> 标记为"已闭环"时，最终处理结果必须填写
                      </div>
                    )}
                    <div className="form-actions">
                      <button className="btn btn-ghost" onClick={handleCancelClosing}>
                        取消
                      </button>
                      <button className="btn btn-primary" onClick={handleSaveClosing}>
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

      {showSummaryModal && (
        <div className="modal-overlay" onClick={() => setShowSummaryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📄 盘点差异复盘摘要</h3>
              <button className="modal-close" onClick={() => setShowSummaryModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <pre className="summary-text">{generateReviewSummary()}</pre>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowSummaryModal(false)}>
                关闭
              </button>
              <button className="btn btn-primary" onClick={handleCopySummary}>
                📋 复制到剪贴板
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
