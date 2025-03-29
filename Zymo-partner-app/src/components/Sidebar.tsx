import { Dashboard } from './Dashboard'; 

interface SidebarProps {
  isDashboardOpen: boolean;
  setIsDashboardOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Sidebar({ isDashboardOpen, setIsDashboardOpen }: SidebarProps) {
  return (
    <div
      className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-lightgray shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isDashboardOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <Dashboard isOpen={isDashboardOpen} onClose={() => setIsDashboardOpen(false)} />
    </div>
  );
}
