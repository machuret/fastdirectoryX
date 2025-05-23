import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';

export interface HeaderElements {
  title?: string;
  description?: string;
  icon?: ReactNode;
  actionButtons?: ReactNode;
}

interface AdminHeaderContextType {
  headerElements: HeaderElements;
  setPageSpecificHeaderElements: (elements: Partial<HeaderElements>) => void; 
}

const AdminHeaderContext = createContext<AdminHeaderContextType | undefined>(undefined);

export const AdminHeaderProvider: React.FC<{ children: ReactNode, initialBaseElements?: HeaderElements }> = ({ children, initialBaseElements }) => {
  const [baseElements, setBaseElements] = useState<HeaderElements>(initialBaseElements || {});
  const [pageSpecificElements, setPageSpecificElements] = useState<Partial<HeaderElements>>({});

  useEffect(() => {
    setBaseElements(initialBaseElements || {});
    setPageSpecificElements({}); 
  }, [initialBaseElements]);

  const combinedElements: HeaderElements = useMemo(() => ({
    title: pageSpecificElements.title ?? baseElements.title,
    description: pageSpecificElements.description ?? baseElements.description,
    icon: pageSpecificElements.icon ?? baseElements.icon,
    actionButtons: pageSpecificElements.actionButtons ?? baseElements.actionButtons,
  }), [pageSpecificElements, baseElements]);
  
  const setPageSpecificHeaderElementsCallback = useCallback((elements: Partial<HeaderElements>) => {
    setPageSpecificElements(elements);
  }, []); // Empty dependency array makes the callback stable

  const contextValue = useMemo(() => ({
    headerElements: combinedElements,
    setPageSpecificHeaderElements: setPageSpecificHeaderElementsCallback
  }), [combinedElements, setPageSpecificHeaderElementsCallback]);

  return (
    <AdminHeaderContext.Provider value={contextValue}>
      {children}
    </AdminHeaderContext.Provider>
  );
};

export const useAdminHeader = () => {
  const context = useContext(AdminHeaderContext);
  if (context === undefined) {
    throw new Error('useAdminHeader must be used within an AdminHeaderProvider');
  }
  return context;
};
