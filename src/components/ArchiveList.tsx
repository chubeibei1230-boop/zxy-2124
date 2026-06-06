import { useApp } from '../context/AppContext';
import type { Archive } from '../types';

const ROLE_LABELS: Record<string, string> = {
  manager: '仓储负责人',
  operator: '录入人员',
  reviewer: '复核人员',
};

export function ArchiveList() {
  const {
    state,
    filteredArchives,
    setArchiveFilter,
    setCurrentArchiveId,
    setArchiveView,
    deleteArchive,
    restoreFromArchive,
  } = useApp();

  const handleViewDetail = (archive: Archive) => {
    setCurrentArchiveId(archive.id);
    setArchiveView('detail');
  };

  const handleDelete = (archiveId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个归档吗？删除后无法恢复。')) {
      deleteArchive(archiveId);
    }
  };

  const handleRestore = (archive: Archive, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        `确定要将「${archive.taskName}」恢复为新的盘点任务吗？\n\n这将创建一个全新的任务，不会影响原归档记录。`
      )
    ) {
      restoreFromArchive(archive);
      alert('恢复成功！已创建新的盘点任务，您可以切换到其他角色开始盘点。');
    }
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

  const getProgressPercent = (stats: Archive['snapshot']['stats']) => {
    if (stats.total === 0) return 0;
    return Math.round((stats.counted / stats.total) * 100);
  };

  return (
    <div className="archive-list-container">
      <div className="archive-filter-bar">
        <div className="filter-item">
          <input
            type="text"
            className="form-input"
            placeholder="搜索任务名称或负责人..."
            value={state.archiveFilter.searchText}
            onChange={(e) => setArchiveFilter({ searchText: e.target.value })}
          />
        </div>
        <div className="filter-item">
          <label className="filter-label">日期从</label>
          <input
            type="date"
            className="form-input"
            value={state.archiveFilter.dateFrom}
            onChange={(e) => setArchiveFilter({ dateFrom: e.target.value })}
          />
        </div>
        <div className="filter-item">
          <label className="filter-label">至</label>
          <input
            type="date"
            className="form-input"
            value={state.archiveFilter.dateTo}
            onChange={(e) => setArchiveFilter({ dateTo: e.target.value })}
          />
        </div>
        {(state.archiveFilter.searchText ||
          state.archiveFilter.dateFrom ||
          state.archiveFilter.dateTo) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() =>
              setArchiveFilter({ searchText: '', dateFrom: '', dateTo: '' })
            }
          >
            清除筛选
          </button>
        )}
      </div>

      {filteredArchives.length === 0 ? (
        <div className="empty-state">
          <p>📭 暂无归档记录</p>
          {state.currentRole === 'manager' && (
            <p className="empty-state-hint">完成盘点后，点击「创建归档」按钮保存历史记录</p>
          )}
        </div>
      ) : (
        <div className="archive-list">
          {filteredArchives.map((archive) => {
            const progress = getProgressPercent(archive.snapshot.stats);
            return (
              <div
                key={archive.id}
                className="archive-card"
                onClick={() => handleViewDetail(archive)}
              >
                <div className="archive-card-header">
                  <h3 className="archive-card-title">{archive.taskName}</h3>
                  <span className="archive-badge">已归档</span>
                </div>

                <div className="archive-card-meta">
                  <div className="meta-item">
                    <span className="meta-label">📅 盘点日期</span>
                    <span className="meta-value">{archive.inventoryDate}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">👤 负责人</span>
                    <span className="meta-value">{archive.responsiblePerson}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">📝 归档人</span>
                    <span className="meta-value">
                      {ROLE_LABELS[archive.createdBy] || archive.createdBy}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">🕐 归档时间</span>
                    <span className="meta-value">{formatDate(archive.createdAt)}</span>
                  </div>
                </div>

                <div className="archive-card-stats">
                  <div className="archive-stat">
                    <span className="archive-stat-label">商品总数</span>
                    <span className="archive-stat-value">{archive.snapshot.stats.total}</span>
                  </div>
                  <div className="archive-stat">
                    <span className="archive-stat-label">盘点进度</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                      <span className="progress-text">{progress}%</span>
                    </div>
                  </div>
                  <div className="archive-stat">
                    <span className="archive-stat-label">差异数</span>
                    <span className="archive-stat-value stat-warning">
                      {archive.snapshot.stats.differences}
                    </span>
                  </div>
                  <div className="archive-stat">
                    <span className="archive-stat-label">已确认</span>
                    <span className="archive-stat-value stat-success">
                      {archive.snapshot.stats.confirmed}
                    </span>
                  </div>
                </div>

                {archive.handoverNote && (
                  <div className="archive-card-note">
                    <span className="note-icon">📋</span>
                    <span className="note-text">{archive.handoverNote}</span>
                  </div>
                )}

                <div className="archive-card-actions">
                  <button className="btn btn-outline btn-sm">查看详情</button>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={(e) => handleRestore(archive, e)}
                  >
                    ↻ 恢复为新任务
                  </button>
                  {state.currentRole === 'manager' && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={(e) => handleDelete(archive.id, e)}
                    >
                      删除
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
