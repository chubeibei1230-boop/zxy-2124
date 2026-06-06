import { useState } from 'react';
import { useApp } from '../context/AppContext';

const SHORTCUT_LABELS: Record<string, string> = {
  moveUp: '向上移动',
  moveDown: '向下移动',
  markOutOfStock: '标记缺货',
  nextException: '跳到下一异常',
  batchConfirm: '批量确认',
  undo: '撤销',
  redo: '重做',
  quickQty0: '快速输入 0',
  quickQty1: '快速输入 1',
  quickQty2: '快速输入 2',
  quickQty3: '快速输入 3',
  quickQty4: '快速输入 4',
  quickQty5: '快速输入 5',
  quickQty6: '快速输入 6',
  quickQty7: '快速输入 7',
  quickQty8: '快速输入 8',
  quickQty9: '快速输入 9',
};

function formatShortcut(key: string): string {
  return key
    .replace('Mod+', 'Ctrl/⌘+')
    .replace('Shift+', 'Shift+')
    .replace('Ctrl+', 'Ctrl+')
    .replace('Alt+', 'Alt+')
    .replace('ArrowUp', '↑')
    .replace('ArrowDown', '↓')
    .replace('ArrowLeft', '←')
    .replace('ArrowRight', '→')
    .replace('Key', '')
    .replace('Digit', '');
}

export function ShortcutHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const { state } = useApp();

  const mainShortcuts = [
    'moveUp', 'moveDown', 'markOutOfStock', 'nextException',
    'batchConfirm', 'undo', 'redo',
  ];

  const qtyShortcuts = ['quickQty1', 'quickQty2', 'quickQty3', 'quickQty4', 'quickQty5',
    'quickQty6', 'quickQty7', 'quickQty8', 'quickQty9', 'quickQty0'];

  return (
    <>
      <button
        className="shortcut-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="快捷键帮助"
      >
        ⌨️
      </button>

      {isOpen && (
        <div className="shortcut-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="shortcut-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⌨️ 快捷键说明</h3>
              <button className="modal-close" onClick={() => setIsOpen(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="shortcut-section">
                <h4>核心操作</h4>
                {mainShortcuts.map(key => (
                  <div key={key} className="shortcut-item">
                    <span className="shortcut-name">{SHORTCUT_LABELS[key]}</span>
                    <kbd className="shortcut-key">
                      {formatShortcut(state.shortcuts[key as keyof typeof state.shortcuts])}
                    </kbd>
                  </div>
                ))}
              </div>
              <div className="shortcut-section">
                <h4>快速录入数量</h4>
                <p className="shortcut-tip">
                  选中行后直接按数字键，连续按数字可输入多位数
                </p>
                <div className="shortcut-grid">
                  {qtyShortcuts.map(key => (
                    <div key={key} className="shortcut-item-inline">
                      <kbd className="shortcut-key">
                        {formatShortcut(state.shortcuts[key as keyof typeof state.shortcuts])}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
              <div className="shortcut-section">
                <h4>说明</h4>
                <ul className="shortcut-tips">
                  <li>快捷键仅在"录入人员"角色下生效</li>
                  <li>正在输入备注时数字键不会触发快速录入</li>
                  <li>撤销/重做支持所有修改操作</li>
                  <li>所有数据自动保存到本地浏览器</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
