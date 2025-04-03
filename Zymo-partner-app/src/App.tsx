import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Home } from './pages/Home';
import { ProfilePage } from './pages/ProfilePage';
import { UploadLogoPage } from './pages/UploadLogoPage';
import { UploadCarPage } from './pages/UploadCarPage';
import { Layout } from './components/Layout'; 
import AdminPage from './pages/AdminPage';
import Bookings from './pages/Bookings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/upload-logo" element={<UploadLogoPage />} />
          <Route path="/upload-car" element={<UploadCarPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/bookings" element={<Bookings />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
      </Routes>
       
    </BrowserRouter>
  );
}

export default App;
