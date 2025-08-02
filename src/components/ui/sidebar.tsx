
"use client";

import * as React from "react";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { PanelLeftClose, PanelRightOpen } from 'lucide-react';

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  toggleCollapse: () => void;
  collapseMode: "icon" | "responsive" | false;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
};

interface SidebarProviderProps {
  children: React.ReactNode;
  initialOpen?: boolean;
  initialCollapsed?: boolean;
  collapseMode?: "icon" | "responsive" | false;
}

export const SidebarProvider = ({
  children,
  initialOpen = false,
  initialCollapsed = false,
  collapseMode = "responsive",
}: SidebarProviderProps) => {
  const [isOpen, _setIsOpen] = useState(initialOpen);
  const [isCollapsed, _setIsCollapsed] = useState(initialCollapsed);
  const isMobile = useMediaQuery('(max-width: 1023px)'); 
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  const setIsOpen = useCallback((open: boolean) => {
    _setIsOpen(open);
    if (!open) { 
        _setIsCollapsed(false);
    }
  }, [_setIsOpen, _setIsCollapsed]);

  const setIsCollapsed = useCallback((collapsed: boolean) => {
    if (collapseMode === "icon" && !isMobile) { 
        _setIsCollapsed(collapsed);
        if (collapsed) {
            _setIsOpen(true); 
        }
    } else if (!collapsed) { 
        _setIsCollapsed(false);
    }
  }, [_setIsCollapsed, _setIsOpen, collapseMode, isMobile]);


  useEffect(() => {
    if (!mounted) return; // Wait until mounted to apply media query dependent logic

    if (collapseMode === "responsive") {
      if (isMobile) {
        setIsOpen(false);
        setIsCollapsed(false); 
      } else {
        setIsOpen(true);
        setIsCollapsed(initialCollapsed);
      }
    } else if (collapseMode === "icon") {
        setIsOpen(initialOpen);
        setIsCollapsed(initialCollapsed);
    } else { 
        setIsOpen(initialOpen);
        setIsCollapsed(false);
    }
  }, [mounted, isMobile, collapseMode, initialOpen, initialCollapsed, setIsOpen, setIsCollapsed]);

  const toggleCollapse = useCallback(() => {
    if (collapseMode === "icon" && !isMobile && isOpen) {
      setIsCollapsed(!isCollapsed);
    }
  }, [collapseMode, isMobile, isOpen, isCollapsed, setIsCollapsed]);
  
  const value = {
    isOpen,
    setIsOpen,
    isCollapsed,
    setIsCollapsed,
    toggleCollapse,
    collapseMode,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export const Sidebar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { isOpen, isCollapsed, collapseMode } = useSidebarContext();
    const isMobile = useMediaQuery('(max-width: 1023px)');
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted && collapseMode === "responsive") {
      // For responsive mode, if not mounted, we don't know the true 'isMobile' state yet.
      // Render a basic placeholder or null to avoid potential hydration mismatch.
      // A simple div with base styling might be needed if CSS expects the element.
      // This placeholder aims to prevent complex logic from running with SSR-derived 'isMobile' (false).
      return (
        <div
          ref={ref}
          className={cn(
            "group fixed inset-y-0 left-0 top-0 z-40 flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
            "w-0 overflow-hidden border-r-0", // Default to hidden/collapsed on server for responsive mode
            className
          )}
          data-state="closed" // Assume closed until client hydration confirms otherwise
          {...props}
        />
      );
    }
    
    let currentVisibilityAndWidthClass = "";
    let groupDataState = "closed"; 

    if (isMobile && collapseMode === "responsive") {
      currentVisibilityAndWidthClass = "w-0 overflow-hidden border-r-0";
      groupDataState = "closed";
    } else if (!isOpen && !isMobile) { 
      currentVisibilityAndWidthClass = "w-0 overflow-hidden border-r-0";
      groupDataState = "closed";
    } else if (isCollapsed && collapseMode === "icon" && !isMobile) { 
      currentVisibilityAndWidthClass = "w-16"; 
      groupDataState = "collapsed";
    } else if (isOpen && !isMobile) { 
      currentVisibilityAndWidthClass = "w-[var(--sidebar-width)]"; 
      groupDataState = "open";
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "group fixed inset-y-0 left-0 top-0 z-40 flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
          currentVisibilityAndWidthClass, 
          className 
        )}
        data-state={groupDataState}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

export const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const { isOpen, isCollapsed, toggleCollapse, collapseMode } = useSidebarContext();
    const isMobile = useMediaQuery('(max-width: 1023px)');

    if (collapseMode === "icon" && !isMobile && isOpen) { 
      return (
        <button
          ref={ref}
          onClick={toggleCollapse}
          className={cn("rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", className)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          {...props}
        >
          {isCollapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          {children}
        </button>
      );
    }
    return null;
  }
);
SidebarTrigger.displayName = "SidebarTrigger";

export const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-16 items-center p-4", 
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SidebarHeader.displayName = "SidebarHeader";

export const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 overflow-y-auto py-2", className)} {...props}>
      {children}
    </div>
  )
);
SidebarContent.displayName = "SidebarContent";

export const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("border-t border-sidebar-border p-4", className)} {...props}>
      {children}
    </div>
  )
);
SidebarFooter.displayName = "SidebarFooter";

export const SidebarActionTypes = {
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_SIDEBAR_COLLAPSED: 'SET_SIDEBAR_COLLAPSED',
  SET_SIDEBAR_COLLAPSIBLE: 'SET_SIDEBAR_COLLAPSIBLE',
};
