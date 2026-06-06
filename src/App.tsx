import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { AreaManager } from './components/AreaManager';
import { InventoryTable } from './components/InventoryTable';
import { ReviewPanel } from './components/ReviewPanel';
import { ShortcutHelp } from './components/ShortcutHelp';
import { ArchiveManager } from './components/ArchiveManager';
import './App.css';

function AppContent() {
  const { state } = useApp();
  const [showArchive, setShowArchive] = useState(false);

  const renderContent = () => {
    if (showArchive) {
      return <ArchiveManager />;
    }

    switch (state.currentRole) {
      case 'manager':
        return <AreaManager />;
      case 'operator':
        return (
          <>
            <FilterBar />
            <InventoryTable />
          </>
        );
      case 'reviewer':
        return <ReviewPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <Header showArchive={showArchive} onToggleArchive={() => setShowArchive(!showArchive)} />
      <main className="main-content">
        {renderContent()}
      </main>
      {!showArchive && <ShortcutHelp />}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
