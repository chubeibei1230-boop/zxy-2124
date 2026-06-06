import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { AreaManager } from './components/AreaManager';
import { InventoryTable } from './components/InventoryTable';
import { ReviewPanel } from './components/ReviewPanel';
import { ShortcutHelp } from './components/ShortcutHelp';
import './App.css';

function AppContent() {
  const { state } = useApp();

  const renderContent = () => {
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
      <Header />
      <main className="main-content">
        {renderContent()}
      </main>
      <ShortcutHelp />
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
