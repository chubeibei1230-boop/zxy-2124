import { useApp } from '../context/AppContext';
import type { Role } from '../types';

const ROLE_LABELS: Record<Role, string> = {
  manager: '仓储负责人',
  operator: '录入人员',
  reviewer: '复核人员',
};

interface HeaderProps {
  showArchive?: boolean;
  onToggleArchive?: () => void;
}

export function Header({ showArchive = false, onToggleArchive }: HeaderProps) {
  const { state, dispatch, stats, undo, redo, canUndo, canRedo } = useApp();

  const handleRoleChange = (role: Role) => {
    dispatch({ type: 'SET_ROLE', payload: role });
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="app-title">📦 库存盘点</h1>
        <div className="nav-switcher">
          <button
            className={`nav-btn ${!showArchive ? 'active' : ''}`}
            onClick={() => onToggleArchive?.()}
          >
            🔄 当前盘点
          </button>
          <button
            className={`nav-btn ${showArchive ? 'active' : ''}`}
            onClick={() => onToggleArchive?.()}
          >
            📁 历史归档
          </button>
        </div>
        <div className="role-switcher">
        {(Object.keys(ROLE_LABELS) as Role[]).map(role => (
          <button
            key={role}
            className={`role-btn ${state.currentRole === role ? 'active' : ''}`}
            onClick={() => handleRoleChange(role)}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </div>
      </div>
      
      {!showArchive && (
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">总数</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">已盘点</span>
            <span className="stat-value">{stats.counted}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">差异</span>
            <span className="stat-value stat-warning">{stats.differences}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">已确认</span>
            <span className="stat-value stat-success">{stats.confirmed}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">缺货</span>
            <span className="stat-value stat-danger">{stats.outOfStock}</span>
          </div>
        </div>
      )}

      {!showArchive && (
        <div className="header-actions">
          <button
            className="btn btn-ghost"
            onClick={undo}
            disabled={!canUndo}
            title="撤销 (Ctrl+Z)"
          >
            ↶ 撤销
          </button>
          <button
            className="btn btn-ghost"
            onClick={redo}
            disabled={!canRedo}
            title="重做 (Ctrl+Shift+Z)"
          >
            ↷ 重做
          </button>
        </div>
      )}
    </header>
  );
}
