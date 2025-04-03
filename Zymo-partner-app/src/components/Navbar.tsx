import { AlignJustify } from 'lucide-react';
import { DarkModeToggle } from './DarkModeToggle';
import { useNavigate } from 'react-router-dom';  

interface NavbarProps {
  isDashboardOpen: boolean;
  setIsDashboardOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Navbar({ isDashboardOpen, setIsDashboardOpen }: NavbarProps) {
  const navigate = useNavigate();

  const handleHomeNavigation = () => {
    navigate('/home');
  };

  const handleBookingsNavigation = () => {
    navigate('/bookings');
  };

  return (
    <header className="bg-white dark:bg-lightgray shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => setIsDashboardOpen(!isDashboardOpen)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Open sidebar"
            >
              <AlignJustify className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>

            <button
              onClick={handleHomeNavigation}
              className="flex items-center gap-2 ml-2 text-2xl font-bold text-darklime dark:text-lime bg-transparent p-2 "
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </button>
            <span className='text-darklime dark:text-lime mt-1 font-semibold'>Home</span>
            
            {/* Added Bookings button */}
            <button
              onClick={handleBookingsNavigation}
              className="flex items-center gap-2 ml-4 text-2xl font-bold text-darklime dark:text-lime bg-transparent p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
            </button>
            <span className='text-darklime dark:text-lime mt-1 font-semibold ml-2'>Bookings</span>
          </div>
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}