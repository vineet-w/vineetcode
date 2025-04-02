import { AlignJustify } from 'lucide-react';
// import { DarkModeToggle } from './DarkModeToggle';
import { useNavigate } from 'react-router-dom';  

interface NavbarProps {
  isDashboardOpen: boolean;
  setIsDashboardOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Navbar({ isDashboardOpen, setIsDashboardOpen }: NavbarProps) {
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate('/home');
  };
  return (
    <header className="bg-lightgray shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => setIsDashboardOpen(!isDashboardOpen)}
              className="p-2 rounded-md hover:bg-gray-700"
              aria-label="Open sidebar"
            >
              <AlignJustify className="h-6 w-6 text-gray-400" />
            </button>

            <button
              onClick={handleNavigation}
              className="flex items-center gap-2 ml-2 text-2xl font-bold text-lime bg-transparent p-2 "
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
</svg>

               
            </button>
            <span className='text-lime mt-1 font-semibold'>Home</span>
          </div>
          {/* <DarkModeToggle /> */}
        </div>
      </div>
    </header>
  );
}
