import { useNavigate } from 'react-router-dom';
import { User, Image, LogOut, Car, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useDispatch } from 'react-redux';
import { resetProfile } from '../store/slices/profileSlice';

interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
}


export function Dashboard({ isOpen, onClose }: DashboardProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      dispatch(resetProfile());
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { icon: User, label: 'Profile', onClick: () => navigate('/profile') },
    {
      icon: Image,
      label: 'Upload Logo',
      onClick: () => navigate('/upload-logo'),
    },
    {
      icon: Car,
      label: 'Upload Car Details',
      onClick: () => navigate('/upload-car'),
    },
    { icon: LogOut, label: 'Sign Out', onClick: handleLogout },
  ];

  return (
    <>
      {/* Overlay to darken background when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 "
          onClick={onClose} // Close the sidebar when overlay is clicked
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-lightgray transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-50 `}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Car className="h-6 w-6 text-darklime dark:text-lime" />
              <span className="text-lg font-bold font-quicksand text-[#94C748] dark:text-lime">
                Zymo Partner
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 "
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick();
                  onClose(); // Close sidebar after item click
                }}
                className="flex items-center w-full px-4 py-3 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
