import {  useState } from 'react';
import { Navbar } from './Navbar'; 
import { Sidebar } from './Sidebar'; 
import { Outlet } from 'react-router-dom';

export function Layout() {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cover bg-center  bg-darkgray font-montserrat" 
      >
      <Sidebar
        isDashboardOpen={isDashboardOpen}
        setIsDashboardOpen={setIsDashboardOpen}
      />

      <div>
        <Navbar
          isDashboardOpen={isDashboardOpen}
          setIsDashboardOpen={setIsDashboardOpen}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
        <Outlet />
        </main>
      </div>
    </div>
  );
}
