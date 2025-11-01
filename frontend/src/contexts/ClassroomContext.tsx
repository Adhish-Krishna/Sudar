import React, { createContext, useContext, useState, useCallback } from 'react';

interface ClassroomContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const ClassroomContext = createContext<ClassroomContextType | undefined>(undefined);

export const ClassroomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <ClassroomContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </ClassroomContext.Provider>
  );
};

export const useClassroomRefresh = () => {
  const context = useContext(ClassroomContext);
  if (context === undefined) {
    throw new Error('useClassroomRefresh must be used within a ClassroomProvider');
  }
  return context;
};
