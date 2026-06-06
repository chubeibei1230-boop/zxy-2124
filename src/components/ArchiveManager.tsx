import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CreateArchiveModal } from './CreateArchiveModal';
import { ArchiveList } from './ArchiveList';
import { ArchiveDetail } from './ArchiveDetail';

export function ArchiveManager() {
  const { state, setArchiveView } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleBackToList = () => {
    setArchiveView('list');
  };

  return (
    <div className="archive-manager">
      <div className="archive-header">
        <div className="archive-title-section">
          <h2 className="section-title">📁 盘点任务归档与交接</h2>
          {state.currentRole === 'manager' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              + 创建归档
            </button>
          )}
        </div>
        <p className="archive-description">
          归档后的任务将被冻结，可随时查看历史数据或恢复为新任务模板
        </p>
      </div>

      {state.archiveView === 'list' ? (
        <ArchiveList />
      ) : (
        <ArchiveDetail onBack={handleBackToList} />
      )}

      {showCreateModal && (
        <CreateArchiveModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
