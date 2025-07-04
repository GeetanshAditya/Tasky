import { useApp } from '../context/AppContext';
import Sidebar from './Sidebar';
import TaskView from './TaskView';
import Analytics from './Analytics';
import FocusMode from './FocusMode';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export default function Layout() {
  const { state, dispatch } = useApp();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-inter overflow-hidden">
        <Sidebar />
        <main className={`flex-1 transition-all duration-500 ease-in-out ${
          state.sidebarCollapsed ? 'ml-20' : 'ml-80'
        }`}>
          <div className="h-full overflow-auto bg-gradient-to-br from-slate-900/50 via-purple-900/30 to-slate-900/50 backdrop-blur-sm">
            {state.selectedProject === 'analytics' ? <Analytics /> : <TaskView />}
          </div>
        </main>
        
        {/* Focus Mode Modal */}
        {state.focusMode && (
          <FocusMode onClose={() => dispatch({ type: 'TOGGLE_FOCUS_MODE' })} />
        )}
      </div>
    </DndProvider>
  );
}