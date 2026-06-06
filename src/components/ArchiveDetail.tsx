import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { InventoryItem, Area, ReviewStats, ReviewStatus, ResponsibilityAttribution, DifferenceType } from '../types';

interface ArchiveDetailProps {
  onBack: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  manager: '仓储负责人',
  operator: '录入人员',
  reviewer: '复核人员',
};

const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: '待处理',
  inProgress: '复盘中',
  completed: '已完成',
};

const RESPONSIBILITY_LABELS: Record<ResponsibilityAttribution, string> = {
  operator: '录入人员',
  system: '系统问题',
  supplier: '供应商问题',
  other: '其他',
  '': '未归因',
};

const DIFFERENCE_TYPE_LABELS: Record<DifferenceType, string> = {
  overage: '盘盈',
  shortage: '盘亏',
  outOfStock: '缺货',
  noDifference: '无差异',
};

function getDifferenceType(item: InventoryItem): DifferenceType {
  if (item.isOutOfStock) return 'outOfStock';
  if (!item.hasDifference) return 'noDifference';
  const diff = (item.actualQty ?? 0) - item.expectedQty;
  return diff > 0 ? 'overage' : 'shortage';
}

export function ArchiveDetail({ onBack }: ArchiveDetailProps) {
  const { currentArchive, state, restoreFromArchive } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'exceptions' | 'review'>('overview');
  const [filterAreaId, setFilterAreaId] = useState<string>('');

  const archive = currentArchive;

  const exceptionItems = useMemo(() => {
    if (!archive) return [];
    return archive.snapshot.items.filter((i) => i.hasDifference || i.isOutOfStock);
  }, [archive]);

  const confirmedExceptions = useMemo(() => {
    return exceptionItems.filter((i) => i.isConfirmed);
  }, [exceptionItems]);

  const unconfirmedExceptions = useMemo(() => {
    return exceptionItems.filter((i) => !i.isConfirmed);
  }, [exceptionItems]);

  const reviewStats = useMemo((): ReviewStats | null => {
    if (!archive) return null;
    if (archive.snapshot.reviewStats) {
      return archive.snapshot.reviewStats;
    }
    const items = archive.snapshot.items.filter(i => i.hasDifference || i.isOutOfStock);
    const totalDifferences = items.length;
    const reviewed = items.filter(i => i.reviewStatus !== 'pending').length;
    const pending = items.filter(i => i.reviewStatus === 'pending').length;
    const inProgress = items.filter(i => i.reviewStatus === 'inProgress').length;
    const completed = items.filter(i => i.reviewStatus === 'completed').length;
    const completionRate = totalDifferences > 0 ? Math.round((completed / totalDifferences) * 100) : 0;
    return {
      totalDifferences,
      reviewed,
      pending,
      inProgress,
      completed,
      completionRate,
    };
  }, [archive]);

  const filteredItems = useMemo(() => {
    if (!archive) return [];
    let items = archive.snapshot.items;
    if (filterAreaId) {
      items = items.filter((i) => i.areaId === filterAreaId);
    }
    return items;
  }, [archive, filterAreaId]);

  const getAreaName = (areaId: string, areas: Area[]) => {
    return areas.find((a) => a.id === areaId)?.name || '未知';
  };

  const getDiff = (item: InventoryItem) => {
    const actual = item.isOutOfStock ? 0 : (item.actualQty ?? 0);
    return actual - item.expectedQty;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRestore = () => {
    if (!archive) return;
    const hasProgress = state.items.some(i => i.actualQty !== null || i.isOutOfStock);
    let warning = '';
    if (hasProgress) {
      warning = '\n\n⚠️ 警告：当前正在进行的盘点任务有录入数据，恢复后将全部丢失，无法恢复！';
    }
    if (
      confirm(
        `确定要将「${archive.taskName}」恢复为新的盘点任务吗？\n\n恢复后将使用该归档的区域和商品数据创建新的盘点任务，所有盘点进度将重置。${warning}`
      )
    ) {
      restoreFromArchive(archive);
      alert('恢复成功！已基于归档创建新的盘点任务。');
      onBack();
    }
  };

  if (!archive) {
    return (
      <div className="empty-state">
        <p>未找到归档记录</p>
        <button className="btn btn-primary" onClick={onBack}>
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="archive-detail">
      <div className="detail-header">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← 返回列表
        </button>
        <div className="detail-title-section">
          <h2 className="detail-title">
            {archive.taskName}
            <span className="archive-badge large">已归档</span>
          </h2>
        </div>
        <div className="detail-actions">
          <button className="btn btn-success" onClick={handleRestore}>
            ↻ 恢复为新任务
          </button>
        </div>
      </div>

      <div className="detail-meta-card">
        <div className="meta-grid">
          <div className="meta-block">
            <span className="meta-block-label">📅 盘点日期</span>
            <span className="meta-block-value">{archive.inventoryDate}</span>
          </div>
          <div className="meta-block">
            <span className="meta-block-label">👤 负责人</span>
            <span className="meta-block-value">{archive.responsiblePerson}</span>
          </div>
          <div className="meta-block">
            <span className="meta-block-label">📝 归档人</span>
            <span className="meta-block-value">
              {ROLE_LABELS[archive.createdBy] || archive.createdBy}
            </span>
          </div>
          <div className="meta-block">
            <span className="meta-block-label">🕐 归档时间</span>
            <span className="meta-block-value">{formatDate(archive.createdAt)}</span>
          </div>
        </div>
        {archive.handoverNote && (
          <div className="handover-note">
            <span className="handover-note-label">📋 交接说明：</span>
            <p className="handover-note-content">{archive.handoverNote}</p>
          </div>
        )}
      </div>

      <div className="detail-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 汇总统计
        </button>
        <button
          className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          📦 盘点明细
        </button>
        <button
          className={`tab-btn ${activeTab === 'exceptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('exceptions')}
        >
          ⚠️ 异常记录 ({exceptionItems.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          📋 差异复盘 ({reviewStats?.totalDifferences || 0})
        </button>
      </div>

      <div className="detail-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card-large">
                <div className="stat-card-icon">📦</div>
                <div className="stat-card-info">
                  <span className="stat-card-num">{archive.snapshot.stats.total}</span>
                  <span className="stat-card-label">商品总数</span>
                </div>
              </div>
              <div className="stat-card-large">
                <div className="stat-card-icon">✅</div>
                <div className="stat-card-info">
                  <span className="stat-card-num">{archive.snapshot.stats.counted}</span>
                  <span className="stat-card-label">已盘点</span>
                </div>
              </div>
              <div className="stat-card-large stat-warning">
                <div className="stat-card-icon">⚠️</div>
                <div className="stat-card-info">
                  <span className="stat-card-num">{archive.snapshot.stats.differences}</span>
                  <span className="stat-card-label">差异数</span>
                </div>
              </div>
              <div className="stat-card-large stat-success">
                <div className="stat-card-icon">✓</div>
                <div className="stat-card-info">
                  <span className="stat-card-num">{archive.snapshot.stats.confirmed}</span>
                  <span className="stat-card-label">已确认</span>
                </div>
              </div>
              <div className="stat-card-large stat-danger">
                <div className="stat-card-icon">📭</div>
                <div className="stat-card-info">
                  <span className="stat-card-num">{archive.snapshot.stats.outOfStock}</span>
                  <span className="stat-card-label">缺货</span>
                </div>
              </div>
            </div>

            <div className="area-summary">
              <h3 className="section-subtitle">🗂️ 各区域盘点情况</h3>
              <div className="area-summary-list">
                {archive.snapshot.areas.map((area) => {
                  const areaItems = archive.snapshot.items.filter(
                    (i) => i.areaId === area.id
                  );
                  const areaCounted = areaItems.filter(
                    (i) => i.actualQty !== null || i.isOutOfStock
                  ).length;
                  const areaDiff = areaItems.filter((i) => i.hasDifference).length;
                  const progress =
                    areaItems.length > 0
                      ? Math.round((areaCounted / areaItems.length) * 100)
                      : 0;
                  return (
                    <div key={area.id} className="area-summary-item">
                      <div className="area-summary-header">
                        <span className="area-summary-name">{area.name}</span>
                        <span className="area-summary-count">
                          {areaCounted}/{areaItems.length}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="area-summary-footer">
                        <span className="area-summary-diff">
                          差异: {areaDiff}
                        </span>
                        <span className="area-summary-progress">{progress}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {reviewStats && reviewStats.totalDifferences > 0 && (
              <div className="review-summary-card">
                <h3 className="section-subtitle">📋 差异复盘完成情况</h3>
                <div className="stats-grid" style={{ marginTop: 16, gridTemplateColumns: 'repeat(5, 1fr)' }}>
                  <div className="stat-card-large stat-warning">
                    <div className="stat-card-icon">📊</div>
                    <div className="stat-card-info">
                      <span className="stat-card-num">{reviewStats.totalDifferences}</span>
                      <span className="stat-card-label">总差异数</span>
                    </div>
                  </div>
                  <div className="stat-card-large stat-danger">
                    <div className="stat-card-icon">⏳</div>
                    <div className="stat-card-info">
                      <span className="stat-card-num">{reviewStats.pending}</span>
                      <span className="stat-card-label">未闭环</span>
                    </div>
                  </div>
                  <div className="stat-card-large">
                    <div className="stat-card-icon">🔄</div>
                    <div className="stat-card-info">
                      <span className="stat-card-num">{reviewStats.inProgress}</span>
                      <span className="stat-card-label">复盘中</span>
                    </div>
                  </div>
                  <div className="stat-card-large stat-success">
                    <div className="stat-card-icon">✅</div>
                    <div className="stat-card-info">
                      <span className="stat-card-num">{reviewStats.completed}</span>
                      <span className="stat-card-label">已完成</span>
                    </div>
                  </div>
                  <div className="stat-card-large">
                    <div className="stat-card-icon">📈</div>
                    <div className="stat-card-info">
                      <span className="stat-card-num">{reviewStats.completionRate}%</span>
                      <span className="stat-card-label">完成率</span>
                    </div>
                  </div>
                </div>
                <div className="review-progress-bar">
                  <div
                    className="review-progress-fill"
                    style={{ width: `${reviewStats.completionRate}%` }}
                  />
                  <span className="review-progress-text">
                    复盘完成率 {reviewStats.completionRate}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'items' && (
          <div className="items-section">
            <div className="items-filter">
              <select
                className="form-input"
                value={filterAreaId}
                onChange={(e) => setFilterAreaId(e.target.value)}
              >
                <option value="">全部区域</option>
                {archive.snapshot.areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
              <span className="items-count">共 {filteredItems.length} 条记录</span>
            </div>
            <div className="archive-table-container">
              <table className="archive-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>商品名称</th>
                    <th>区域</th>
                    <th>账面数量</th>
                    <th>实盘数量</th>
                    <th>差异</th>
                    <th>状态</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const diff = getDiff(item);
                    return (
                      <tr key={item.id} className={item.hasDifference ? 'has-diff' : ''}>
                        <td>{item.sku}</td>
                        <td>{item.name}</td>
                        <td>{getAreaName(item.areaId, archive.snapshot.areas)}</td>
                        <td>{item.expectedQty}</td>
                        <td>
                          {item.isOutOfStock ? (
                            <span className="status-badge out-of-stock">缺货</span>
                          ) : (
                            item.actualQty ?? <span className="text-muted">未盘点</span>
                          )}
                        </td>
                        <td>
                          {item.actualQty !== null || item.isOutOfStock ? (
                            <span
                              className={`diff-value ${diff > 0 ? 'plus' : diff < 0 ? 'minus' : ''}`}
                            >
                              {diff > 0 ? '+' : ''}
                              {diff}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {item.isConfirmed ? (
                            <span className="status-badge confirmed">已确认</span>
                          ) : (
                            <span className="status-badge pending">待确认</span>
                          )}
                        </td>
                        <td className="note-cell">{item.note || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'exceptions' && (
          <div className="exceptions-section">
            <div className="exception-stats-bar">
              <div className="exception-stat">
                <span className="exception-stat-value">{exceptionItems.length}</span>
                <span className="exception-stat-label">总异常数</span>
              </div>
              <div className="exception-stat">
                <span className="exception-stat-value stat-danger">
                  {unconfirmedExceptions.length}
                </span>
                <span className="exception-stat-label">待复核</span>
              </div>
              <div className="exception-stat">
                <span className="exception-stat-value stat-success">
                  {confirmedExceptions.length}
                </span>
                <span className="exception-stat-label">已复核</span>
              </div>
            </div>

            {exceptionItems.length === 0 ? (
              <div className="empty-state">
                <p>✅ 暂无异常记录，盘点数据全部一致</p>
              </div>
            ) : (
              <div className="exception-list">
                {exceptionItems.map((item) => {
                  const diff = getDiff(item);
                  const diffType = getDifferenceType(item);
                  return (
                    <div
                      key={item.id}
                      className={`exception-card ${item.isConfirmed ? 'confirmed' : ''}`}
                    >
                      <div className="exception-main">
                        <div className="exception-info">
                          <span className="exception-sku">{item.sku}</span>
                          <span className="exception-name">{item.name}</span>
                          <span className="exception-area">
                            {getAreaName(item.areaId, archive.snapshot.areas)}
                          </span>
                          <span className="status-badge diff">
                            {DIFFERENCE_TYPE_LABELS[diffType]}
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
                          <div className={`qty-diff ${diff > 0 ? 'plus' : 'minus'}`}>
                            {diff > 0 ? '+' : ''}
                            {diff}
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
                          <span className="status-badge pending large">待确认</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <div className="review-section">
            {reviewStats && reviewStats.totalDifferences > 0 ? (
              <>
                <div className="exception-stats-bar">
                  <div className="exception-stat">
                    <span className="exception-stat-value">{reviewStats.totalDifferences}</span>
                    <span className="exception-stat-label">总差异数</span>
                  </div>
                  <div className="exception-stat">
                    <span className="exception-stat-value stat-danger">
                      {reviewStats.pending}
                    </span>
                    <span className="exception-stat-label">未闭环</span>
                  </div>
                  <div className="exception-stat">
                    <span className="exception-stat-value" style={{ color: 'var(--primary)' }}>
                      {reviewStats.inProgress}
                    </span>
                    <span className="exception-stat-label">复盘中</span>
                  </div>
                  <div className="exception-stat">
                    <span className="exception-stat-value stat-success">
                      {reviewStats.completed}
                    </span>
                    <span className="exception-stat-label">已完成</span>
                  </div>
                  <div className="exception-stat">
                    <span className="exception-stat-value">{reviewStats.completionRate}%</span>
                    <span className="exception-stat-label">完成率</span>
                  </div>
                </div>

                {archive.snapshot.reviewSummary && (
                  <div className="review-summary-card">
                    <h4>📄 复盘摘要</h4>
                    <div className="review-summary-content">
                      {archive.snapshot.reviewSummary}
                    </div>
                  </div>
                )}

                <div className="section-subtitle" style={{ marginTop: 24 }}>
                  📋 复盘明细
                </div>
                <div className="exception-list">
                  {exceptionItems.map((item) => {
                    const diff = getDiff(item);
                    const diffType = getDifferenceType(item);
                    return (
                      <div
                        key={item.id}
                        className={`exception-card ${item.reviewStatus === 'completed' ? 'confirmed' : ''}`}
                      >
                        <div className="exception-main">
                          <div className="exception-info">
                            <span className="exception-sku">{item.sku}</span>
                            <span className="exception-name">{item.name}</span>
                            <span className="exception-area">
                              {getAreaName(item.areaId, archive.snapshot.areas)}
                            </span>
                            <span className="status-badge diff">
                              {DIFFERENCE_TYPE_LABELS[diffType]}
                            </span>
                            <span
                              className={`status-badge ${
                                item.reviewStatus === 'completed'
                                  ? 'confirmed'
                                  : item.reviewStatus === 'inProgress'
                                  ? 'pending'
                                  : 'out-of-stock'
                              }`}
                            >
                              {REVIEW_STATUS_LABELS[item.reviewStatus]}
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
                            <div className={`qty-diff ${diff > 0 ? 'plus' : 'minus'}`}>
                              {diff > 0 ? '+' : ''}
                              {diff}
                            </div>
                          </div>
                        </div>

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
                        {!item.reviewConclusion && !item.handlingOpinion && !item.responsibilityAttribution && (
                          <div className="exception-note">
                            <span className="note-label text-muted">暂无复盘信息</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>✅ 暂无差异，无需复盘</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
