import React from 'react';
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
      <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white font-inter">
        <Sidebar />
        <main className={`flex-1 transition-all duration-300 ${
          state.sidebarCollapsed ? 'ml-16' : 'ml-80'
        }`}>
          <div className="h-full overflow-auto">
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