import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Wallet, Calendar, Phone, MapPin, BadgeInfo, CheckCircle, Car, X, Save, Edit } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { Input } from '../components/Input';

interface UserData {
  id: string;
  username: string;
  email: string;
  accountType: string;
  fullName: string;
  phone: string;
  cities: string[];
  carsRange: string;
  bankAccount: string;
  bankAccountName: string;
  ifscCode: string;
  upiId?: string;
  visibility: number;
  isApproved: boolean;
  brandName?: string;
  gstNumber?: string;
  unavailableHours: {
    start: string;
    end: string;
  };
}

interface CarData {
  id: string;
  name: string;
  images: string[];
  hourlyRate: string;
  securityDeposit: string;
  fuelType: string;
  transmissionType: string;
  noOfSeats: number;
  cities: string[];
  pickupLocation: string;
  yearOfRegistration: number;
  minBookingDuration: number;
  unit: string;
  slabRates: Array<{ duration: string; rate: string }>;
  hourlyRental: {
    limit: string;
    limited: {
      packages: Array<{ hourlyRate: string; kmPerHour: string }>;
      extraKmRate: string;
      extraHourRate: string;
    };
    unlimited: {
      fixedHourlyRate: string;
      extraKmRate: string;
      extraHourRate: string;
    };
  };
  monthlyRental: {
    available: boolean;
    rate: string;
    limit: string;
    limitValueKm: string;
    limitValueHr: string;
    packages: Array<{
      rate: string;
      kmPerMonth: string;
      extraHourRate: string;
      extraKmRate: string;
    }>;
  };
  weeklyRental: {
    available: boolean;
    rate: string;
    limit: string;
    limitValueKm: string;
    limitValueHr: string;
    packages: Array<{
      rate: string;
      kmPerWeek: string;
      extraHourRate: string;
      extraKmRate: string;
    }>;
  };
  deliveryCharges: {
    enabled: boolean;
    Range: string;
    charges: {
      "0-10": string;
      "10-25": string;
      "25-50": string;
    };
  };
  unavailableHours: {
    start: string;
    end: string;
  };
}

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userCars, setUserCars] = useState<CarData[]>([]);
  const [carsLoading, setCarsLoading] = useState(false);
  const [carsError, setCarsError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editingCar, setEditingCar] = useState<CarData | null>(null);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isEditingCar, setIsEditingCar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const blockUser = async (userId: string) => {
    try {
      const userRef = doc(db, 'partnerWebApp', userId);
      const user = users.find((u) => u.id === userId);
  
      if (!user) {
        alert('User not found.');
        return;
      }
  
      const newVisibility = user.visibility === 0 ? 1 : 0;
      await updateDoc(userRef, { visibility: newVisibility });
  
      const carsCollectionRef = collection(db, 'partnerWebApp', userId, 'uploadedCars');
      const carsSnapshot = await getDocs(carsCollectionRef);
  
      const updateCarPromises = carsSnapshot.docs.map((carDoc) =>
        updateDoc(doc(db, 'partnerWebApp', userId, 'uploadedCars', carDoc.id), {
          visibility: newVisibility,
        })
      );
  
      await Promise.all(updateCarPromises);
  
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, visibility: newVisibility } : user
        )
      );
  
      alert(`User and their cars have been ${newVisibility === 0 ? 'blocked' : 'unblocked'} successfully.`);
    } catch (error) {
      console.error('Error toggling user block status:', error);
      alert('Failed to toggle user block status. Please try again.');
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'partnerWebApp'));
        const userList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          username: doc.data().username || 'No Username',
          email: doc.data().email || 'No Email',
          accountType: doc.data().accountType || 'No Account Type',
          fullName: doc.data().fullName || 'No Full Name',
          phone: doc.data().phone || 'No Phone',
          cities: doc.data().cities || [],
          carsRange: doc.data().carsRange || 'No Cars Range',
          bankAccount: doc.data().bankAccount || 'No Bank Account',
          bankAccountName: doc.data().bankAccountName || 'No Account Name',
          ifscCode: doc.data().ifscCode || 'No IFSC Code',
          upiId: doc.data().upiId || 'No UPI ID',
          isApproved: doc.data().isApproved || false,
          visibility: doc.data().visibility || 1,
          brandName: doc.data().brandName || '',
          gstNumber: doc.data().gstNumber || '',
          unavailableHours: doc.data().unavailableHours || { start: '00:00', end: '06:00' }
        }));
        setUsers(userList);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUsers();
  }, []);

  const deleteUserAccount = async (userId: string) => {
    try {
      const userRef = doc(db, 'partnerWebApp', userId);
      const carsCollectionRef = collection(db, 'partnerWebApp', userId, 'uploadedCars');
      const carsSnapshot = await getDocs(carsCollectionRef);
      
      // Fix: Add type annotation and proper Promise.all handling
      const deleteCarPromises: Promise<void>[] = carsSnapshot.docs.map((carDoc) => 
        deleteDoc(doc(db, 'partnerWebApp', userId, 'uploadedCars', carDoc.id))
      );
      await Promise.all(deleteCarPromises);
      
      await deleteDoc(userRef);
      
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      alert('User and their cars have been deleted successfully.');
    } catch (error) {
      console.error('Error deleting user and cars:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const fetchUserCars = async (userId: string) => {
    try {
      setCarsLoading(true);
      setCarsError(null);
      setUserCars([]);
      
      const carsRef = collection(db, 'partnerWebApp', userId, 'uploadedCars');
      const snapshot = await getDocs(carsRef);
      const carsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CarData[];
      setUserCars(carsData);
    } catch (error) {
      console.error('Error fetching cars:', error);
      setCarsError('Failed to load cars data');
    } finally {
      setCarsLoading(false);
    }
  };

  const handleViewCars = (userId: string) => {
    setSelectedUserId(userId);
  };

  const toggleApproval = async (userId: string, isApproved: boolean) => {
    try {
      const userRef = doc(db, 'partnerWebApp', userId);
      await updateDoc(userRef, { isApproved: !isApproved });
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isApproved: !isApproved } : user
      ));
    } catch (error) {
      console.error('Error updating approval status:', error);
    }
  };

  const handleEditUser = (user: UserData) => {
    setEditingUser({...user});
    setIsEditingUser(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    try {
      const userRef = doc(db, 'partnerWebApp', editingUser.id);
      await updateDoc(userRef, {
        fullName: editingUser.fullName,
        phone: editingUser.phone,
        cities: editingUser.cities,
        carsRange: editingUser.carsRange,
        bankAccount: editingUser.bankAccount,
        bankAccountName: editingUser.bankAccountName,
        ifscCode: editingUser.ifscCode,
        upiId: editingUser.upiId,
        brandName: editingUser.brandName,
        gstNumber: editingUser.gstNumber,
        unavailableHours: editingUser.unavailableHours
      });

      setUsers(prev => prev.map(user => 
        user.id === editingUser.id ? {...editingUser} : user
      ));
      setIsEditingUser(false);
      alert('User data updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user data');
    }
  };

  const handleEditCar = (car: CarData) => {
    setEditingCar({...car});
    setIsEditingCar(true);
  };

  const handleSaveCar = async () => {
    if (!editingCar || !selectedUserId) return;
    
    try {
      const carRef = doc(db, 'partnerWebApp', selectedUserId, 'uploadedCars', editingCar.id);
      await updateDoc(carRef, {
        name: editingCar.name,
        securityDeposit: editingCar.securityDeposit,
        fuelType: editingCar.fuelType,
        transmissionType: editingCar.transmissionType,
        noOfSeats: editingCar.noOfSeats,
        cities: editingCar.cities,
        pickupLocation: editingCar.pickupLocation,
        yearOfRegistration: editingCar.yearOfRegistration,
        minBookingDuration: editingCar.minBookingDuration,
        unit: editingCar.unit,
        slabRates: editingCar.slabRates,
        hourlyRental: editingCar.hourlyRental,
        monthlyRental: editingCar.monthlyRental,
        weeklyRental: editingCar.weeklyRental,
        deliveryCharges: editingCar.deliveryCharges,
        unavailableHours: editingCar.unavailableHours
      });

      setUserCars(prev => prev.map(car => 
        car.id === editingCar.id ? {...editingCar} : car
      ));
      setIsEditingCar(false);
      alert('Car data updated successfully');
    } catch (error) {
      console.error('Error updating car:', error);
      alert('Failed to update car data');
    }
  };

  const handleUnavailableHoursChange = (field: 'start' | 'end', value: string, isUser: boolean) => {
    if (isUser && editingUser) {
      setEditingUser({
        ...editingUser,
        unavailableHours: {
          ...editingUser.unavailableHours,
          [field]: value
        }
      });
    } else if (!isUser && editingCar) {
      setEditingCar({
        ...editingCar,
        unavailableHours: {
          ...editingCar.unavailableHours,
          [field]: value
        }
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (selectedUserId) {
      fetchUserCars(selectedUserId);
    }
  }, [selectedUserId]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const CarsModal = () => (
    <Dialog
      open={!!selectedUserId}
      onClose={() => setSelectedUserId(null)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl rounded-2xl bg-darkgray border border-lime/30 relative flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-lime/30">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-2xl font-bold text-lime flex items-center">
                <Car className="mr-2 h-8 w-8" />
                Uploaded Cars
              </Dialog.Title>
              <button
                onClick={() => setSelectedUserId(null)}
                className="text-lime hover:text-lime/80"
              >
                <X className="h-8 w-8" />
              </button>
            </div>
          </div>
  
          <div className="flex-1 overflow-y-auto p-6">
            {carsLoading && (
              <div className="text-center text-lime">Loading cars...</div>
            )}
  
            {carsError && (
              <div className="text-red-500 text-center mb-4">{carsError}</div>
            )}
  
            {!carsLoading && !carsError && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-2">
                {userCars.length === 0 ? (
                  <div className="col-span-full text-center text-gray-400">
                    No cars uploaded yet
                  </div>
                ) : (
                  userCars.map((car) => (
                    <div 
                      key={car.id} 
                      className="bg-lightgray/10 rounded-xl p-4 border border-lime/20 hover:border-lime/40 transition-colors"
                    >
                      <div className="mb-4 h-48 overflow-hidden rounded-lg">
                        {car.images.length > 0 ? (
                          <img
                            src={car.images[0]}
                            alt={car.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/fallback-car-image.png';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800/50 flex items-center justify-center">
                            <span className="text-gray-400">No image available</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-lime mb-2 truncate">
                        {car.name}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                        <div className="flex items-center">
                          <span className="font-medium">Rate:</span>
                          <span className="ml-1">₹{car.hourlyRate}/hr</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Deposit:</span>
                          <span className="ml-1">₹{car.securityDeposit}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Fuel:</span>
                          <span className="ml-1">{car.fuelType}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Transmission:</span>
                          <span className="ml-1">{car.transmissionType}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Seats:</span>
                          <span className="ml-1">{car.noOfSeats}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Year:</span>
                          <span className="ml-1">{car.yearOfRegistration}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditCar(car)}
                        className="mt-3 w-full flex items-center justify-center gap-2 bg-lime/20 text-lime hover:bg-lime/30 px-3 py-1 rounded-lg text-sm transition"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Car
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  const UserEditModal = () => (
    <Dialog
      open={isEditingUser}
      onClose={() => setIsEditingUser(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-darkgray border border-lime/30 relative flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-lime/30">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-2xl font-bold text-lime flex items-center">
                <User className="mr-2 h-8 w-8" />
                Edit User: {editingUser?.fullName}
              </Dialog.Title>
              <button
                onClick={() => setIsEditingUser(false)}
                className="text-lime hover:text-lime/80"
              >
                <X className="h-8 w-8" />
              </button>
            </div>
          </div>
  
          <div className="flex-1 overflow-y-auto p-6">
            {editingUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={editingUser.fullName}
                    onChange={(e: { target: { value: any; }; }) => setEditingUser({...editingUser, fullName: e.target.value})}
                  />
                  <Input
                    label="Email"
                    value={editingUser.email}
                    onChange={(e: { target: { value: any; }; }) => setEditingUser({...editingUser, email: e.target.value})}
                    disabled
                  />
                  <Input
                    label="Phone"
                    value={editingUser.phone}
                    onChange={(e: { target: { value: any; }; }) => setEditingUser({...editingUser, phone: e.target.value})}
                  />
                  <Input
                    label="Car Range"
                    value={editingUser.carsRange}
                    onChange={(e: { target: { value: any; }; }) => setEditingUser({...editingUser, carsRange: e.target.value})}
                  />
                  <Input
                    label="Bank Account"
                    value={editingUser.bankAccount}
                    onChange={(e: { target: { value: any; }; }) => setEditingUser({...editingUser, bankAccount: e.target.value})}
                  />
                  <Input
                    label="Bank Account Name"
                    value={editingUser.bankAccountName}
                    onChange={(e: { target: { value: any; }; }) => setEditingUser({...editingUser, bankAccountName: e.target.value})}
                  />
                  <Input
                    label="IFSC Code"
                    value={editingUser.ifscCode}
                    onChange={(e: { target: { value: any; }; }) => setEditingUser({...editingUser, ifscCode: e.target.value})}
                  />
                  <Input
                    label="UPI ID"
                    value={editingUser.upiId || ''}
                    onChange={(e: { target: { value: any; }; }) => setEditingUser({...editingUser, upiId: e.target.value})}
                  />
                  <Input
                    label="Brand Name"
                    value={editingUser.brandName || ''}
                    onChange={(e: { target: { value: any; }; }) => setEditingUser({...editingUser, brandName: e.target.value})}
                  />
                  <Input
                    label="GST Number"
                    value={editingUser.gstNumber || ''}
                    onChange={(e: { target: { value: any; }; }) => setEditingUser({...editingUser, gstNumber: e.target.value})}
                  />
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-medium text-lime mb-2">Cities Operated</h3>
                  <div className="flex flex-wrap gap-2">
                    {editingUser.cities.map((city, index) => (
                      <div key={index} className="bg-lime/20 text-lime px-3 py-1 rounded-full flex items-center">
                        {city}
                        <button
                          onClick={() => {
                            const newCities = [...editingUser.cities];
                            newCities.splice(index, 1);
                            setEditingUser({...editingUser, cities: newCities});
                          }}
                          className="ml-2 text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Add new city"
                      className="bg-lightgray/10 border border-lime/30 rounded-lg px-3 py-2 text-white w-full"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setEditingUser({
                            ...editingUser,
                            cities: [...editingUser.cities, e.currentTarget.value.trim()]
                          });
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-medium text-lime mb-2">Unavailable Hours</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-lime mb-1">Start Time</label>
                      <input
                        type="time"
                        value={editingUser.unavailableHours.start}
                        onChange={(e) => handleUnavailableHoursChange('start', e.target.value, true)}
                        className="w-full p-2 bg-lightgray/10 border border-lime/30 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-lime mb-1">End Time</label>
                      <input
                        type="time"
                        value={editingUser.unavailableHours.end}
                        onChange={(e) => handleUnavailableHoursChange('end', e.target.value, true)}
                        className="w-full p-2 bg-lightgray/10 border border-lime/30 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-lime/30 flex justify-end gap-3">
            <button
              onClick={() => setIsEditingUser(false)}
              className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUser}
              className="px-4 py-2 bg-lime text-black rounded-lg hover:bg-lime/80 flex items-center gap-2 transition"
            >
              <Save className="h-5 w-5" />
              Save Changes
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  const CarEditModal = () => (
    <Dialog
      open={isEditingCar}
      onClose={() => setIsEditingCar(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl rounded-2xl bg-darkgray border border-lime/30 relative flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-lime/30">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-2xl font-bold text-lime flex items-center">
                <Car className="mr-2 h-8 w-8" />
                Edit Car: {editingCar?.name}
              </Dialog.Title>
              <button
                onClick={() => setIsEditingCar(false)}
                className="text-lime hover:text-lime/80"
              >
                <X className="h-8 w-8" />
              </button>
            </div>
          </div>
  
          <div className="flex-1 overflow-y-auto p-6">
            {editingCar && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Car Name"
                    value={editingCar.name}
                    onChange={(e: { target: { value: any; }; }) => setEditingCar({...editingCar, name: e.target.value})}
                  />
                  <Input
                    label="Security Deposit"
                    value={editingCar.securityDeposit}
                    onChange={(e: { target: { value: any; }; }) => setEditingCar({...editingCar, securityDeposit: e.target.value})}
                    prefix="₹"
                  />
                  <Input
                    label="Pickup Location"
                    value={editingCar.pickupLocation}
                    onChange={(e: { target: { value: any; }; }) => setEditingCar({...editingCar, pickupLocation: e.target.value})}
                  />
                  <Input
                    label="Year of Registration"
                    value={editingCar.yearOfRegistration.toString()}
                    onChange={(e: { target: { value: string; }; }) => setEditingCar({...editingCar, yearOfRegistration: parseInt(e.target.value) || 0})}
                  />
                  <Input
                    label="Min Booking Duration"
                    value={editingCar.minBookingDuration.toString()}
                    onChange={(e: { target: { value: string; }; }) => setEditingCar({...editingCar, minBookingDuration: parseInt(e.target.value) || 1})}
                  />
                  <div>
                    <label className="block text-sm text-lime mb-1">Unit</label>
                    <select
                      value={editingCar.unit}
                      onChange={(e) => setEditingCar({...editingCar, unit: e.target.value})}
                      className="w-full p-2 bg-lightgray/10 border border-lime/30 rounded-lg text-white"
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-lime mb-1">Fuel Type</label>
                    <select
                      value={editingCar.fuelType}
                      onChange={(e) => setEditingCar({...editingCar, fuelType: e.target.value})}
                      className="w-full p-2 bg-lightgray/10 border border-lime/30 rounded-lg text-white"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-lime mb-1">Transmission</label>
                    <select
                      value={editingCar.transmissionType}
                      onChange={(e) => setEditingCar({...editingCar, transmissionType: e.target.value})}
                      className="w-full p-2 bg-lightgray/10 border border-lime/30 rounded-lg text-white"
                    >
                      <option value="Manual">Manual</option>
                      <option value="Automatic">Automatic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-lime mb-1">Seats</label>
                    <select
                      value={editingCar.noOfSeats.toString()}
                      onChange={(e) => setEditingCar({...editingCar, noOfSeats: parseInt(e.target.value) || 4})}
                      className="w-full p-2 bg-lightgray/10 border border-lime/30 rounded-lg text-white"
                    >
                      {[2, 4, 5, 6, 7, 8].map(seats => (
                        <option key={seats} value={seats}>{seats}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-medium text-lime mb-2">Cities Available</h3>
                  <div className="flex flex-wrap gap-2">
                    {editingCar.cities.map((city, index) => (
                      <div key={index} className="bg-lime/20 text-lime px-3 py-1 rounded-full flex items-center">
                        {city}
                        <button
                          onClick={() => {
                            const newCities = [...editingCar.cities];
                            newCities.splice(index, 1);
                            setEditingCar({...editingCar, cities: newCities});
                          }}
                          className="ml-2 text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Add new city"
                      className="bg-lightgray/10 border border-lime/30 rounded-lg px-3 py-2 text-white w-full"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setEditingCar({
                            ...editingCar,
                            cities: [...editingCar.cities, e.currentTarget.value.trim()]
                          });
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-medium text-lime mb-2">Slab Rates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editingCar.slabRates.map((slab, index) => (
                      <div key={index} className="bg-lightgray/10 p-3 rounded-lg">
                        <div className="font-medium text-lime mb-1">{slab.duration} hours</div>
                        <Input
                          value={slab.rate}
                          onChange={(e: { target: { value: string; }; }) => {
                            const newSlabs = [...editingCar.slabRates];
                            newSlabs[index].rate = e.target.value;
                            setEditingCar({...editingCar, slabRates: newSlabs});
                          }}
                          prefix="₹"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-medium text-lime mb-2">Hourly Rental</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-lime mb-1">Limit Type</label>
                      <select
                        value={editingCar.hourlyRental.limit}
                        onChange={(e) => setEditingCar({
                          ...editingCar,
                          hourlyRental: {
                            ...editingCar.hourlyRental,
                            limit: e.target.value
                          }
                        })}
                        className="w-full p-2 bg-lightgray/10 border border-lime/30 rounded-lg text-white"
                      >
                        <option value="Limit Type">Limit Type</option>
                        <option value="Limited">Limited</option>
                        <option value="Unlimited">Unlimited</option>
                      </select>
                    </div>

                    {editingCar.hourlyRental.limit === 'Limited' && (
                      <>
                        <Input
                          label="Extra Hour Rate"
                          value={editingCar.hourlyRental.limited.extraHourRate}
                          onChange={(e: { target: { value: any; }; }) => setEditingCar({
                            ...editingCar,
                            hourlyRental: {
                              ...editingCar.hourlyRental,
                              limited: {
                                ...editingCar.hourlyRental.limited,
                                extraHourRate: e.target.value
                              }
                            }
                          })}
                          prefix="₹"
                        />
                        <Input
                          label="Extra Km Rate"
                          value={editingCar.hourlyRental.limited.extraKmRate}
                          onChange={(e: { target: { value: any; }; }) => setEditingCar({
                            ...editingCar,
                            hourlyRental: {
                              ...editingCar.hourlyRental,
                              limited: {
                                ...editingCar.hourlyRental.limited,
                                extraKmRate: e.target.value
                              }
                            }
                          })}
                          prefix="₹"
                        />
                      </>
                    )}

                    {editingCar.hourlyRental.limit === 'Unlimited' && (
                      <>
                        <Input
                          label="Fixed Hourly Rate"
                          value={editingCar.hourlyRental.unlimited.fixedHourlyRate}
                          onChange={(e: { target: { value: any; }; }) => setEditingCar({
                            ...editingCar,
                            hourlyRental: {
                              ...editingCar.hourlyRental,
                              unlimited: {
                                ...editingCar.hourlyRental.unlimited,
                                fixedHourlyRate: e.target.value
                              }
                            }
                          })}
                          prefix="₹"
                        />
                        <Input
                          label="Extra Hour Rate"
                          value={editingCar.hourlyRental.unlimited.extraHourRate}
                          onChange={(e: { target: { value: any; }; }) => setEditingCar({
                            ...editingCar,
                            hourlyRental: {
                              ...editingCar.hourlyRental,
                              unlimited: {
                                ...editingCar.hourlyRental.unlimited,
                                extraHourRate: e.target.value
                              }
                            }
                          })}
                          prefix="₹"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-medium text-lime mb-2">Monthly Rental</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingCar.monthlyRental.available}
                        onChange={(e) => setEditingCar({
                          ...editingCar,
                          monthlyRental: {
                            ...editingCar.monthlyRental,
                            available: e.target.checked
                          }
                        })}
                        className="mr-2"
                      />
                      <label className="text-lime">Available</label>
                    </div>

                    {editingCar.monthlyRental.available && (
                      <>
                        <Input
                          label="Monthly Rate"
                          value={editingCar.monthlyRental.rate}
                          onChange={(e: { target: { value: any; }; }) => setEditingCar({
                            ...editingCar,
                            monthlyRental: {
                              ...editingCar.monthlyRental,
                              rate: e.target.value
                            }
                          })}
                          prefix="₹"
                        />
                        <div>
                          <label className="block text-sm text-lime mb-1">Limit Type</label>
                          <select
                            value={editingCar.monthlyRental.limit}
                            onChange={(e) => setEditingCar({
                              ...editingCar,
                              monthlyRental: {
                                ...editingCar.monthlyRental,
                                limit: e.target.value
                              }
                            })}
                            className="w-full p-2 bg-lightgray/10 border border-lime/30 rounded-lg text-white"
                          >
                            <option value="Limit Type">Limit Type</option>
                            <option value="Limited">Limited</option>
                            <option value="Unlimited">Unlimited</option>
                          </select>
                        </div>
                        {editingCar.monthlyRental.limit === 'Limited' && (
                          <>
                            <Input
                              label="Extra Km Rate"
                              value={editingCar.monthlyRental.limitValueKm}
                              onChange={(e: { target: { value: any; }; }) => setEditingCar({
                                ...editingCar,
                                monthlyRental: {
                                  ...editingCar.monthlyRental,
                                  limitValueKm: e.target.value
                                }
                              })}
                              prefix="₹"
                            />
                            <Input
                              label="Extra Hour Rate"
                              value={editingCar.monthlyRental.limitValueHr}
                              onChange={(e: { target: { value: any; }; }) => setEditingCar({
                                ...editingCar,
                                monthlyRental: {
                                  ...editingCar.monthlyRental,
                                  limitValueHr: e.target.value
                                }
                              })}
                              prefix="₹"
                            />
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-medium text-lime mb-2">Weekly Rental</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingCar.weeklyRental.available}
                        onChange={(e) => setEditingCar({
                          ...editingCar,
                          weeklyRental: {
                            ...editingCar.weeklyRental,
                            available: e.target.checked
                          }
                        })}
                        className="mr-2"
                      />
                      <label className="text-lime">Available</label>
                    </div>

                    {editingCar.weeklyRental.available && (
                      <>
                        <Input
                          label="Weekly Rate"
                          value={editingCar.weeklyRental.rate}
                          onChange={(e: { target: { value: any; }; }) => setEditingCar({
                            ...editingCar,
                            weeklyRental: {
                              ...editingCar.weeklyRental,
                              rate: e.target.value
                            }
                          })}
                          prefix="₹"
                        />
                        <div>
                          <label className="block text-sm text-lime mb-1">Limit Type</label>
                          <select
                            value={editingCar.weeklyRental.limit}
                            onChange={(e) => setEditingCar({
                              ...editingCar,
                              weeklyRental: {
                                ...editingCar.weeklyRental,
                                limit: e.target.value
                              }
                            })}
                            className="w-full p-2 bg-lightgray/10 border border-lime/30 rounded-lg text-white"
                          >
                            <option value="Limit Type">Limit Type</option>
                            <option value="Limited">Limited</option>
                            <option value="Unlimited">Unlimited</option>
                          </select>
                        </div>
                        {editingCar.weeklyRental.limit === 'Limited' && (
                          <>
                            <Input
                              label="Extra Km Rate"
                              value={editingCar.weeklyRental.limitValueKm}
                              onChange={(e: { target: { value: any; }; }) => setEditingCar({
                                ...editingCar,
                                weeklyRental: {
                                  ...editingCar.weeklyRental,
                                  limitValueKm: e.target.value
                                }
                              })}
                              prefix="₹"
                            />
                            <Input
                              label="Extra Hour Rate"
                              value={editingCar.weeklyRental.limitValueHr}
                              onChange={(e: { target: { value: any; }; }) => setEditingCar({
                                ...editingCar,
                                weeklyRental: {
                                  ...editingCar.weeklyRental,
                                  limitValueHr: e.target.value
                                }
                              })}
                              prefix="₹"
                            />
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-medium text-lime mb-2">Delivery Charges</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingCar.deliveryCharges.enabled}
                        onChange={(e) => setEditingCar({
                          ...editingCar,
                          deliveryCharges: {
                            ...editingCar.deliveryCharges,
                            enabled: e.target.checked
                          }
                        })}
                        className="mr-2"
                      />
                      <label className="text-lime">Enabled</label>
                    </div>

                    {editingCar.deliveryCharges.enabled && (
                      <>
                        <Input
                          label="0-10 km"
                          value={editingCar.deliveryCharges.charges["0-10"]}
                          onChange={(e: { target: { value: any; }; }) => setEditingCar({
                            ...editingCar,
                            deliveryCharges: {
                              ...editingCar.deliveryCharges,
                              charges: {
                                ...editingCar.deliveryCharges.charges,
                                "0-10": e.target.value
                              }
                            }
                          })}
                          prefix="₹"
                        />
                        <Input
                          label="10-25 km"
                          value={editingCar.deliveryCharges.charges["10-25"]}
                          onChange={(e: { target: { value: any; }; }) => setEditingCar({
                            ...editingCar,
                            deliveryCharges: {
                              ...editingCar.deliveryCharges,
                              charges: {
                                ...editingCar.deliveryCharges.charges,
                                "10-25": e.target.value
                              }
                            }
                          })}
                          prefix="₹"
                        />
                        <Input
                          label="25-50 km"
                          value={editingCar.deliveryCharges.charges["25-50"]}
                          onChange={(e: { target: { value: any; }; }) => setEditingCar({
                            ...editingCar,
                            deliveryCharges: {
                              ...editingCar.deliveryCharges,
                              charges: {
                                ...editingCar.deliveryCharges.charges,
                                "25-50": e.target.value
                              }
                            }
                          })}
                          prefix="₹"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-medium text-lime mb-2">Unavailable Hours</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-lime mb-1">Start Time</label>
                      <input
                        type="time"
                        value={editingCar.unavailableHours.start}
                        onChange={(e) => handleUnavailableHoursChange('start', e.target.value, false)}
                        className="w-full p-2 bg-lightgray/10 border border-lime/30 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-lime mb-1">End Time</label>
                      <input
                        type="time"
                        value={editingCar.unavailableHours.end}
                        onChange={(e) => handleUnavailableHoursChange('end', e.target.value, false)}
                        className="w-full p-2 bg-lightgray/10 border border-lime/30 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-lime/30 flex justify-end gap-3">
            <button
              onClick={() => setIsEditingCar(false)}
              className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCar}
              className="px-4 py-2 bg-lime text-black rounded-lg hover:bg-lime/80 flex items-center gap-2 transition"
            >
              <Save className="h-5 w-5" />
              Save Changes
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-darkgray p-8 font-montserrat">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center text-4xl font-bold text-lime drop-shadow-lg"
      >
        <Shield className="mr-3 inline-block h-12 w-12" />
        Admin Dashboard
      </motion.h1>

      <div className="mb-8 max-w-2xl mx-auto">
        <Input
          label="Search Users"
          placeholder="Search by name, email or phone"
          value={searchTerm}
          onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-xl bg-lightgray/30 p-6 shadow-lg"
            >
              <div className="mb-4 h-6 w-3/4 rounded bg-gray-700/50"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 rounded bg-gray-700/30"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence>
          {filteredUsers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-2xl text-gray-400"
            >
              No users found
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredUsers.map((user) => (
                <motion.div
                  key={user.id}
                  variants={cardVariants}
                  className="group relative overflow-hidden rounded-2xl border border-lime/30 bg-lightgray/10 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-lime/60 hover:bg-lightgray/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-lime/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="mb-4 flex items-center border-b border-lime/30 pb-4">
                    <User className="mr-3 h-8 w-8 text-lime" />
                    <h2 className="text-xl font-semibold text-white">
                      {user.fullName}
                      <span className="ml-2 text-sm text-lime">
                        ({user.accountType})
                      </span>
                    </h2>
                  </div>

                  <div className="space-y-3 text-gray-300">
                    <div className="flex items-center">
                      <Phone className="mr-2 h-5 w-5 text-lime" />
                      <span>{user.phone}</span>
                    </div>

                    <div className="flex items-center">
                      <MapPin className="mr-2 h-5 w-5 text-lime" />
                      <span>Cities: {user.cities.join(', ') || 'N/A'}</span>
                    </div>

                    <div className="flex items-center">
                      <Car className="mr-2 h-5 w-5 text-lime" />
                      <span>Car Range: {user.carsRange}</span>
                    </div>

                    <div className="flex items-center">
                      <Wallet className="mr-2 h-5 w-5 text-lime" />
                      <span>Bank: ****{user.bankAccount.slice(-4)}</span>
                    </div>

                    <div className="flex items-center">
                      <BadgeInfo className="mr-2 h-5 w-5 text-lime" />
                      <span>IFSC: {user.ifscCode}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex justify-between gap-3">
                      <button
                        onClick={() => handleViewCars(user.id)}
                        className="flex items-center justify-center flex-1 rounded-lg px-4 py-2 text-sm font-medium bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-all duration-300"
                      >
                        <Car className="mr-2 h-4 w-4" />
                        View Cars
                      </button>

                      <button
                        onClick={() => toggleApproval(user.id, user.isApproved)}
                        className={`flex items-center justify-center flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
                          user.isApproved
                            ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                            : 'bg-lime/20 text-lime hover:bg-lime/30'
                        }`}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {user.isApproved ? 'Approved' : 'Approve'}
                      </button>
                    </div>

                    <div className="flex justify-between gap-3">
                      <button
                        onClick={() => deleteUserAccount(user.id)}
                        className="flex items-center justify-center flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                      >
                        Delete Account
                      </button>

                      <button
                        onClick={() => blockUser(user.id)}
                        className={`flex items-center justify-center flex-1 ${
                          user.visibility === 0 ? 'bg-green-600' : 'bg-orange-600'
                        } text-white px-4 py-2 rounded-md hover:${
                          user.visibility === 0 ? 'bg-green-700' : 'bg-orange-700'
                        } transition`}
                      >
                        {user.visibility === 0 ? 'Unblock User' : 'Block User'}
                      </button>
                    </div>

                    <button
                      onClick={() => handleEditUser(user)}
                      className="w-full flex items-center justify-center gap-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 px-4 py-2 rounded-lg transition"
                    >
                      <Edit className="h-4 w-4" />
                      Edit User Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
      <CarsModal />
      <UserEditModal />
      <CarEditModal />
    </div>
  );
};

export default AdminPage;