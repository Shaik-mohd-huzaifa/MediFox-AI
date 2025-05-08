
import React from 'react';
import { BarChart, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  
  const routes = [
    {
      icon: BarChart,
      label: "Dashboard",
      href: "/dashboard",
      active: location.pathname === "/dashboard"
    },
    {
      icon: MessageSquare,
      label: "AI Chatbot",
      href: "/",
      active: location.pathname === "/" && !location.pathname.includes("/dashboard")
    },
    {
      icon: User,
      label: "Profiles",
      href: "/profiles",
      active: location.pathname === "/profiles" || location.pathname.startsWith("/profile/")
    }
  ];

  // Utility routes removed as requested

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200 transition-width duration-300",
      isCollapsed ? "w-[60px]" : "w-[200px] min-w-[200px]"
    )}>
      <div className="flex items-center justify-center p-4 border-b border-gray-100">
        <img 
          src="/uploads/medifox-logo-v2.png" 
          alt="Medifox Logo" 
          className={cn("h-8", isCollapsed ? "mx-auto" : "w-full max-w-[115px]")}
        />
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <nav className="space-y-1 px-2">
          {routes.map((route) => (
            <Link
              key={route.href + route.label} 
              to={route.href}
              className={cn(
                "flex items-center px-2 py-3 rounded-md transition-colors hover:bg-gray-100",
                route.active ? "bg-gray-100" : "",
                isCollapsed ? "justify-center" : ""
              )}
            >
              <route.icon size={20} className={route.active ? "text-[#FF7F2E]" : "text-gray-500"} />
              {!isCollapsed && (
                <span className={cn(
                  "ml-3 font-medium font-inter",
                  route.active ? "text-gray-900" : "text-gray-500"
                )}>
                  {route.label}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="py-2 px-2 space-y-1">
        {/* Settings and Help sections removed */}

        <div className={cn(
          "mt-6 border-t border-gray-100 pt-4 pb-2",
          isCollapsed ? "px-2" : "px-4"
        )}>
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0">
              <img src="https://ui-avatars.com/api/?name=M+U&background=random" alt="User" className="rounded-full" />
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 font-inter">Mark Anderson</p>
                <p className="text-xs text-gray-500 font-inter">mark@example.com</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
