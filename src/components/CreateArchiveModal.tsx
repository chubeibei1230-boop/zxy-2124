import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

interface CreateArchiveModalProps {
  onClose: () => void;
}

export function CreateArchiveModal({ onClose }: CreateArchiveModalProps) {
  const { createArchive, stats, getReviewStats, generateReviewSummary } = useApp();
  const reviewStats = useMemo(() => getReviewStats(), [getReviewStats]);
  const reviewSummary = useMemo(() => generateReviewSummary(), [generateReviewSummary]);
  const [formData, setFormData] = useState({
    taskName: '',
    inventoryDate: new Date().toISOString().split('T')[0],
    responsiblePerson: '',
    handoverNote: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.taskName.trim() || !formData.responsiblePerson.trim()) {
      alert('请填写任务名称和负责人');
      return;
    }
    createArchive(formData);
    onClose();
  };

  const isComplete = stats.counted === stats.total && stats.total > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📦 创建盘点归档</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {!isComplete && (
          <div className="alert alert-warning">
            ⚠️ 当前盘点尚未全部完成，仍有 {stats.total - stats.counted} 个商品未盘点。
            建议完成全部盘点后再进行归档。
          </div>
        )}

        {reviewStats.totalDifferences > 0 && reviewStats.unclosed > 0 && (
          <div className="alert alert-warning">
            ⚠️ 本次盘点共有 {reviewStats.totalDifferences} 项差异，其中 {reviewStats.unclosed} 项尚未闭环（{reviewStats.pending} 项待处理，{reviewStats.inProgress} 项复盘中）。
            建议完成所有差异复盘后再进行归档。
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="taskName">任务名称 *</label>
            <input
              id="taskName"
              type="text"
              className="form-input"
              placeholder="例如：2024年Q2季度盘点"
              value={formData.taskName}
              onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="inventoryDate">盘点日期 *</label>
              <input
                id="inventoryDate"
                type="date"
                className="form-input"
                value={formData.inventoryDate}
                onChange={(e) => setFormData({ ...formData, inventoryDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="responsiblePerson">负责人 *</label>
              <input
                id="responsiblePerson"
                type="text"
                className="form-input"
                placeholder="负责人姓名"
                value={formData.responsiblePerson}
                onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="handoverNote">交接说明</label>
            <textarea
              id="handoverNote"
              className="form-input form-textarea"
              placeholder="记录本次盘点的特殊情况、待跟进事项等..."
              rows={4}
              value={formData.handoverNote}
              onChange={(e) => setFormData({ ...formData, handoverNote: e.target.value })}
            />
          </div>

          <div className="archive-preview">
            <h4>归档数据预览</h4>
            <div className="preview-stats">
              <div className="preview-stat">
                <span className="preview-stat-label">商品总数</span>
                <span className="preview-stat-value">{stats.total}</span>
              </div>
              <div className="preview-stat">
                <span className="preview-stat-label">已盘点</span>
                <span className="preview-stat-value">{stats.counted}</span>
              </div>
              <div className="preview-stat">
                <span className="preview-stat-label">差异数</span>
                <span className="preview-stat-value stat-warning">{stats.differences}</span>
              </div>
              <div className="preview-stat">
                <span className="preview-stat-label">已确认</span>
                <span className="preview-stat-value stat-success">{stats.confirmed}</span>
              </div>
            </div>
            {reviewStats.totalDifferences > 0 && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <h4 style={{ marginBottom: 12 }}>差异复盘情况</h4>
                <div className="preview-stats">
                  <div className="preview-stat">
                    <span className="preview-stat-label">总差异</span>
                    <span className="preview-stat-value stat-warning">{reviewStats.totalDifferences}</span>
                  </div>
                  <div className="preview-stat">
                    <span className="preview-stat-label">未闭环</span>
                    <span className="preview-stat-value stat-danger">{reviewStats.unclosed}</span>
                  </div>
                  <div className="preview-stat">
                    <span className="preview-stat-label">已完成</span>
                    <span className="preview-stat-value stat-success">{reviewStats.completed}</span>
                  </div>
                  <div className="preview-stat">
                    <span className="preview-stat-label">完成率</span>
                    <span className="preview-stat-value">{reviewStats.completionRate}%</span>
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ marginBottom: 8 }}>📄 复盘摘要预览</h4>
                  <div className="review-summary-content" style={{ maxHeight: '200px', overflow: 'auto' }}>
                    {reviewSummary}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              确认归档
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
