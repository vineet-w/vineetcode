import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User , Car, X, Save, Edit, Plus } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { Input } from '../components/Input';
import { Shield, Phone, MapPin, Wallet, BadgeInfo, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const CarsModal = () => {
    // Safe access to car data with defaults
    const getSafeCarData = (car: CarData) => ({
      id: car.id || '',
      name: car.name || 'Unnamed Car',
      images: car.images || [],
      securityDeposit: car.securityDeposit || '0',
      fuelType: car.fuelType || 'Unknown',
      transmissionType: car.transmissionType || 'Unknown',
      noOfSeats: car.noOfSeats || 4,
      cities: car.cities || [],
      pickupLocation: car.pickupLocation || 'Not specified',
      yearOfRegistration: car.yearOfRegistration || new Date().getFullYear(),
      minBookingDuration: car.minBookingDuration || 1,
      unit: car.unit || 'hours',
      slabRates: car.slabRates || [],
      hourlyRental: {
        limit: car.hourlyRental?.limit || 'Limit Type',
        limited: {
          packages: car.hourlyRental?.limited?.packages || [],
          extraKmRate: car.hourlyRental?.limited?.extraKmRate || '0',
          extraHourRate: car.hourlyRental?.limited?.extraHourRate || '0',
        },
        unlimited: {
          fixedHourlyRate: car.hourlyRental?.unlimited?.fixedHourlyRate || '0',
          extraHourRate: car.hourlyRental?.unlimited?.extraHourRate || '0',
        },
      },
      monthlyRental: {
        available: car.monthlyRental?.available || false,
        limit: car.monthlyRental?.limit || 'Limit Type',
        limitValueKm: car.monthlyRental?.limitValueKm || '0',
        limitValueHr: car.monthlyRental?.limitValueHr || '0',
        packages: car.monthlyRental?.packages || [],
        rate: car.monthlyRental?.rate || '0',
      },
      weeklyRental: {
        available: car.weeklyRental?.available || false,
        limit: car.weeklyRental?.limit || 'Limit Type',
        limitValueKm: car.weeklyRental?.limitValueKm || '0',
        limitValueHr: car.weeklyRental?.limitValueHr || '0',
        packages: car.weeklyRental?.packages || [],
        rate: car.weeklyRental?.rate || '0',
      },
      deliveryCharges: {
        enabled: car.deliveryCharges?.enabled || false,
        charges: {
          "0-10": car.deliveryCharges?.charges?.["0-10"] || '0',
          "10-25": car.deliveryCharges?.charges?.["10-25"] || '0',
          "25-50": car.deliveryCharges?.charges?.["25-50"] || '0',
        },
      },
      unavailableHours: car.unavailableHours || { start: '00:00', end: '06:00' },
    });
  
    return (
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
              {carsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime"></div>
                </div>
              ) : carsError ? (
                <div className="text-red-500 text-center p-4 bg-red-500/10 rounded-lg">
                  {carsError}
                </div>
              ) : userCars.length === 0 ? (
                <div className="text-center text-gray-400 p-8">
                  No cars uploaded yet
                </div>
              ) : (
                <div className="space-y-6">
                  {userCars.map((car) => {
                    const safeCar = getSafeCarData(car);
                    return (
                      <div
                        key={safeCar.id}
                        className="bg-lightgray/10 rounded-xl p-6 border border-lime/20 hover:border-lime/40 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Car Image */}
                          <div className="flex-shrink-0 w-full md:w-1/3 h-48 overflow-hidden rounded-lg">
                            {safeCar.images.length > 0 ? (
                              <img
                                src={safeCar.images[0]}
                                alt={safeCar.name}
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
  
                          {/* Car Details */}
                          <div className="flex-1 space-y-4">
                            {/* Header with name and edit button */}
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-xl font-semibold text-lime">
                                  {safeCar.name}
                                </h3>
                                <div className="text-gray-300 text-sm mt-1">
                                  {safeCar.fuelType} • {safeCar.transmissionType} • {safeCar.noOfSeats} seats • {safeCar.yearOfRegistration}
                                </div>
                              </div>
                              <button
                                onClick={() => handleEditCar(car)}
                                className="flex items-center gap-2 bg-lime/20 text-lime hover:bg-lime/30 px-3 py-1 rounded-lg text-sm transition"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </button>
                            </div>
  
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-gray-400">Security Deposit</div>
                                <div className="text-white">₹{safeCar.securityDeposit}</div>
                              </div>
                              <div>
                                <div className="text-gray-400">Min Booking</div>
                                <div className="text-white">{safeCar.minBookingDuration} {safeCar.unit}</div>
                              </div>
                              <div>
                                <div className="text-gray-400">Pickup Location</div>
                                <div className="text-white">{safeCar.pickupLocation}</div>
                              </div>
                              <div>
                                <div className="text-gray-400">Available Cities</div>
                                <div className="text-white">
                                  {safeCar.cities.length > 0 ? safeCar.cities.join(', ') : 'Not specified'}
                                </div>
                              </div>
                            </div>
  
                            {/* Hourly Rental */}
                            <div className="pt-4 border-t border-lime/20">
                              <h4 className="text-lime font-medium mb-3">Hourly Rental</h4>
                              {safeCar.hourlyRental.limit === 'Limited' ? (
                                <div className="space-y-3">
                                  {safeCar.hourlyRental.limited.packages.length > 0 ? (
                                    safeCar.hourlyRental.limited.packages.map((pkg, index) => (
                                      <div key={index} className="bg-lightgray/20 p-3 rounded-lg">
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <div className="text-gray-400">Package {index + 1}</div>
                                            <div className="text-white">₹{pkg.hourlyRate || '0'}/hr</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-400">KM Limit</div>
                                            <div className="text-white">{pkg.kmPerHour || '0'} km/hr</div>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-gray-400 text-sm">No packages defined</div>
                                  )}
                                  <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                      <div className="text-gray-400">Extra KM Rate</div>
                                      <div className="text-white">₹{safeCar.hourlyRental.limited.extraKmRate}/km</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-400">Extra Hour Rate</div>
                                      <div className="text-white">₹{safeCar.hourlyRental.limited.extraHourRate}/hr</div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-gray-400">Fixed Rate</div>
                                    <div className="text-white">₹{safeCar.hourlyRental.unlimited.fixedHourlyRate}/hr</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-400">Extra Hour Rate</div>
                                    <div className="text-white">₹{safeCar.hourlyRental.unlimited.extraHourRate}/hr</div>
                                  </div>
                                </div>
                              )}
                            </div>
  
                            {/* Weekly Rental (if available) */}
                            {safeCar.weeklyRental.available && (
                              <div className="pt-4 border-t border-lime/20">
                                <h4 className="text-lime font-medium mb-3">Weekly Rental</h4>
                                {safeCar.weeklyRental.limit === 'Limited' ? (
                                  <div className="space-y-3">
                                    {safeCar.weeklyRental.packages.length > 0 ? (
                                      safeCar.weeklyRental.packages.map((pkg, index) => (
                                        <div key={index} className="bg-lightgray/20 p-3 rounded-lg">
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <div className="text-gray-400">Package {index + 1}</div>
                                              <div className="text-white">₹{pkg.rate || '0'}/week</div>
                                            </div>
                                            <div>
                                              <div className="text-gray-400">KM Limit</div>
                                              <div className="text-white">{pkg.kmPerWeek || '0'} km/week</div>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-gray-400 text-sm">No packages defined</div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                      <div>
                                        <div className="text-gray-400">Extra KM Rate</div>
                                        <div className="text-white">₹{safeCar.weeklyRental.limitValueKm}/km</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-400">Extra Hour Rate</div>
                                        <div className="text-white">₹{safeCar.weeklyRental.limitValueHr}/hr</div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <div className="text-gray-400">Fixed Rate</div>
                                      <div className="text-white">₹{safeCar.weeklyRental.rate}/week</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-400">Extra Hour Rate</div>
                                      <div className="text-white">₹{safeCar.weeklyRental.limitValueHr}/hr</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
  
                            {/* Monthly Rental (if available) */}
                            {safeCar.monthlyRental.available && (
                              <div className="pt-4 border-t border-lime/20">
                                <h4 className="text-lime font-medium mb-3">Monthly Rental</h4>
                                {safeCar.monthlyRental.limit === 'Limited' ? (
                                  <div className="space-y-3">
                                    {safeCar.monthlyRental.packages.length > 0 ? (
                                      safeCar.monthlyRental.packages.map((pkg, index) => (
                                        <div key={index} className="bg-lightgray/20 p-3 rounded-lg">
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <div className="text-gray-400">Package {index + 1}</div>
                                              <div className="text-white">₹{pkg.rate || '0'}/month</div>
                                            </div>
                                            <div>
                                              <div className="text-gray-400">KM Limit</div>
                                              <div className="text-white">{pkg.kmPerMonth || '0'} km/month</div>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-gray-400 text-sm">No packages defined</div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                      <div>
                                        <div className="text-gray-400">Extra KM Rate</div>
                                        <div className="text-white">₹{safeCar.monthlyRental.limitValueKm}/km</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-400">Extra Hour Rate</div>
                                        <div className="text-white">₹{safeCar.monthlyRental.limitValueHr}/hr</div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <div className="text-gray-400">Fixed Rate</div>
                                      <div className="text-white">₹{safeCar.monthlyRental.rate}/month</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-400">Extra Hour Rate</div>
                                      <div className="text-white">₹{safeCar.monthlyRental.limitValueHr}/hr</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
  
                            {/* Delivery Charges (if enabled) */}
                            {safeCar.deliveryCharges.enabled && (
                              <div className="pt-4 border-t border-lime/20">
                                <h4 className="text-lime font-medium mb-3">Delivery Charges</h4>
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <div className="text-gray-400">0-10 km</div>
                                    <div className="text-white">₹{safeCar.deliveryCharges.charges["0-10"]}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-400">10-25 km</div>
                                    <div className="text-white">₹{safeCar.deliveryCharges.charges["10-25"]}</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-400">25-50 km</div>
                                    <div className="text-white">₹{safeCar.deliveryCharges.charges["25-50"]}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  };

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
                        className="w-full w-full p-2 bg-black/50 border border-lime/30 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-lime mb-1">End Time</label>
                      <input
                        type="time"
                        value={editingUser.unavailableHours.end}
                        onChange={(e) => handleUnavailableHoursChange('end', e.target.value, true)}
                        className="w-full w-full p-2 bg-black/50 border border-lime/30 rounded-lg text-white"
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

  const CarEditModal = () => {
    const [editingPackageIndex, setEditingPackageIndex] = useState<number | null>(null);
    const [editingPackageType, setEditingPackageType] = useState<'hourly' | 'weekly' | 'monthly' | null>(null);
    const [newPackage, setNewPackage] = useState({
      rate: '',
      kmLimit: '',
      extraHourRate: '',
      extraKmRate: ''
    });
  
    if (!editingCar) return null;
  
    const handleAddPackage = (type: 'hourly' | 'weekly' | 'monthly') => {
      setEditingPackageType(type);
      setEditingPackageIndex(null);
      setNewPackage({
        rate: '',
        kmLimit: '',
        extraHourRate: type === 'hourly' ? editingCar.hourlyRental.limited.extraHourRate : 
                       type === 'weekly' ? editingCar.weeklyRental.limitValueHr : 
                       editingCar.monthlyRental.limitValueHr,
        extraKmRate: type === 'hourly' ? editingCar.hourlyRental.limited.extraKmRate : 
                     type === 'weekly' ? editingCar.weeklyRental.limitValueKm : 
                     editingCar.monthlyRental.limitValueKm
      });
    };
  
    const handleEditPackage = (type: 'hourly' | 'weekly' | 'monthly', index: number) => {
      setEditingPackageType(type);
      setEditingPackageIndex(index);
      
      if (type === 'hourly') {
        const pkg = editingCar.hourlyRental.limited.packages[index];
        setNewPackage({
          rate: pkg.hourlyRate,
          kmLimit: pkg.kmPerHour,
          extraHourRate: editingCar.hourlyRental.limited.extraHourRate,
          extraKmRate: editingCar.hourlyRental.limited.extraKmRate
        });
      } else if (type === 'weekly') {
        const pkg = editingCar.weeklyRental.packages[index];
        setNewPackage({
          rate: pkg.rate,
          kmLimit: pkg.kmPerWeek,
          extraHourRate: pkg.extraHourRate,
          extraKmRate: pkg.extraKmRate
        });
      } else {
        const pkg = editingCar.monthlyRental.packages[index];
        setNewPackage({
          rate: pkg.rate,
          kmLimit: pkg.kmPerMonth,
          extraHourRate: pkg.extraHourRate,
          extraKmRate: pkg.extraKmRate
        });
      }
    };
  
    const handleSavePackage = () => {
      if (editingPackageType === null) return;
  
      const updatedCar = { ...editingCar };
  
      if (editingPackageType === 'hourly') {
        const packages = [...updatedCar.hourlyRental.limited.packages];
        
        if (editingPackageIndex !== null) {
          packages[editingPackageIndex] = {
            hourlyRate: newPackage.rate,
            kmPerHour: newPackage.kmLimit
          };
        } else {
          packages.push({
            hourlyRate: newPackage.rate,
            kmPerHour: newPackage.kmLimit
          });
        }
  
        updatedCar.hourlyRental.limited = {
          ...updatedCar.hourlyRental.limited,
          packages,
          extraHourRate: newPackage.extraHourRate,
          extraKmRate: newPackage.extraKmRate
        };
      } 
      else if (editingPackageType === 'weekly') {
        const packages = [...updatedCar.weeklyRental.packages];
        
        if (editingPackageIndex !== null) {
          packages[editingPackageIndex] = {
            rate: newPackage.rate,
            kmPerWeek: newPackage.kmLimit,
            extraHourRate: newPackage.extraHourRate,
            extraKmRate: newPackage.extraKmRate
          };
        } else {
          packages.push({
            rate: newPackage.rate,
            kmPerWeek: newPackage.kmLimit,
            extraHourRate: newPackage.extraHourRate,
            extraKmRate: newPackage.extraKmRate
          });
        }
  
        updatedCar.weeklyRental = {
          ...updatedCar.weeklyRental,
          packages,
          limitValueHr: newPackage.extraHourRate,
          limitValueKm: newPackage.extraKmRate
        };
      } 
      else if (editingPackageType === 'monthly') {
        const packages = [...updatedCar.monthlyRental.packages];
        
        if (editingPackageIndex !== null) {
          packages[editingPackageIndex] = {
            rate: newPackage.rate,
            kmPerMonth: newPackage.kmLimit,
            extraHourRate: newPackage.extraHourRate,
            extraKmRate: newPackage.extraKmRate
          };
        } else {
          packages.push({
            rate: newPackage.rate,
            kmPerMonth: newPackage.kmLimit,
            extraHourRate: newPackage.extraHourRate,
            extraKmRate: newPackage.extraKmRate
          });
        }
  
        updatedCar.monthlyRental = {
          ...updatedCar.monthlyRental,
          packages,
          limitValueHr: newPackage.extraHourRate,
          limitValueKm: newPackage.extraKmRate
        };
      }
  
      setEditingCar(updatedCar);
      setEditingPackageType(null);
      setEditingPackageIndex(null);
    };
  
    const handleRemovePackage = (type: 'hourly' | 'weekly' | 'monthly', index: number) => {
      const updatedCar = { ...editingCar };
  
      if (type === 'hourly') {
        const packages = [...updatedCar.hourlyRental.limited.packages];
        packages.splice(index, 1);
        updatedCar.hourlyRental.limited.packages = packages;
      } 
      else if (type === 'weekly') {
        const packages = [...updatedCar.weeklyRental.packages];
        packages.splice(index, 1);
        updatedCar.weeklyRental.packages = packages;
      } 
      else if (type === 'monthly') {
        const packages = [...updatedCar.monthlyRental.packages];
        packages.splice(index, 1);
        updatedCar.monthlyRental.packages = packages;
      }
  
      setEditingCar(updatedCar);
    };

    return (
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
                      className="w-full w-full p-2 bg-black/50 border border-lime/30 rounded-lg text-white"
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
                      className="w-full w-full p-2 bg-black/50 border border-lime/30 rounded-lg text-white"
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
                      className="  w-full p-2 bg-black/50 border border-lime/30 rounded-lg text-white"
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
                      className="  w-full p-2 bg-black/50 border border-lime/30 rounded-lg text-white"
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

                <div className="pt-4 border-t border-lime/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-lime">Hourly Rental</h3>
                  <div className="flex items-center space-x-4">
                    <select
                      value={editingCar.hourlyRental.limit}
                      onChange={(e) => setEditingCar({
                        ...editingCar,
                        hourlyRental: {
                          ...editingCar.hourlyRental,
                          limit: e.target.value as "Limit Type" | "Limited" | "Unlimited"
                        }
                      })}
                      className="w-full w-full p-2 bg-black/50 border border-lime/30 rounded-lg text-white"
                    >
                      <option value="Limit Type">Limit Type</option>
                      <option value="Limited">Limited</option>
                      <option value="Unlimited">Unlimited</option>
                    </select>
                  </div>
                </div>

                {editingCar.hourlyRental.limit === 'Limited' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-medium text-lime">Packages</h4>
                      <button
                        onClick={() => handleAddPackage('hourly')}
                        className="flex items-center gap-2 bg-lime/20 text-lime hover:bg-lime/30 px-3 py-1 rounded-lg text-sm transition"
                      >
                        <Plus className="h-4 w-4" />
                        Add Package
                      </button>
                    </div>

                    {editingCar.hourlyRental.limited.packages.map((pkg, index) => (
                      <div key={index} className="bg-lightgray/20 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <Input
                            label="Hourly Rate"
                            value={pkg.hourlyRate}
                            onChange={(e: { target: { value: string; }; }) => {
                              const packages = [...editingCar.hourlyRental.limited.packages];
                              packages[index].hourlyRate = e.target.value;
                              setEditingCar({
                                ...editingCar,
                                hourlyRental: {
                                  ...editingCar.hourlyRental,
                                  limited: {
                                    ...editingCar.hourlyRental.limited,
                                    packages
                                  }
                                }
                              });
                            }}
                            prefix="₹"
                          />
                          <Input
                            label="KM Limit"
                            value={pkg.kmPerHour}
                            onChange={(e: { target: { value: string; }; }) => {
                              const packages = [...editingCar.hourlyRental.limited.packages];
                              packages[index].kmPerHour = e.target.value;
                              setEditingCar({
                                ...editingCar,
                                hourlyRental: {
                                  ...editingCar.hourlyRental,
                                  limited: {
                                    ...editingCar.hourlyRental.limited,
                                    packages
                                  }
                                }
                              });
                            }}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleRemovePackage('hourly', index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Extra Hour Rate"
                        value={editingCar.hourlyRental.limited.extraHourRate}
                        onChange={(e: { target: { value: any; }; }) => 
                          setEditingCar({
                            ...editingCar,
                            hourlyRental: {
                              ...editingCar.hourlyRental,
                              limited: {
                                ...editingCar.hourlyRental.limited,
                                extraHourRate: e.target.value
                              }
                            }
                          })
                        }
                        prefix="₹"
                      />
                      <Input
                        label="Extra KM Rate"
                        value={editingCar.hourlyRental.limited.extraKmRate}
                        onChange={(e: { target: { value: any; }; }) => 
                          setEditingCar({
                            ...editingCar,
                            hourlyRental: {
                              ...editingCar.hourlyRental,
                              limited: {
                                ...editingCar.hourlyRental.limited,
                                extraKmRate: e.target.value
                              }
                            }
                          })
                        }
                        prefix="₹"
                      />
                    </div>
                  </div>
                )}

                {editingCar.hourlyRental.limit === 'Unlimited' && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Fixed Hourly Rate"
                      value={editingCar.hourlyRental.unlimited.fixedHourlyRate}
                      onChange={(e: { target: { value: any; }; }) => 
                        setEditingCar({
                          ...editingCar,
                          hourlyRental: {
                            ...editingCar.hourlyRental,
                            unlimited: {
                              ...editingCar.hourlyRental.unlimited,
                              fixedHourlyRate: e.target.value
                            }
                          }
                        })
                      }
                      prefix="₹"
                    />
                    <Input
                      label="Extra Hour Rate"
                      value={editingCar.hourlyRental.unlimited.extraHourRate}
                      onChange={(e: { target: { value: any; }; }) => 
                        setEditingCar({
                          ...editingCar,
                          hourlyRental: {
                            ...editingCar.hourlyRental,
                            unlimited: {
                              ...editingCar.hourlyRental.unlimited,
                              extraHourRate: e.target.value
                            }
                          }
                        })
                      }
                      prefix="₹"
                    />
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-lime/20">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingCar.monthlyRental.available}
                      onChange={(e) => 
                        setEditingCar({
                          ...editingCar,
                          monthlyRental: {
                            ...editingCar.monthlyRental,
                            available: e.target.checked
                          }
                        })
                      }
                      className="rounded border-gray-300 text-lime focus:ring-lime"
                    />
                    <h3 className="text-lg font-medium text-lime">Monthly Rental</h3>
                  </div>
                  {editingCar.monthlyRental.available && (
                    <select
                      value={editingCar.monthlyRental.limit}
                      onChange={(e) => setEditingCar({
                        ...editingCar,
                        monthlyRental: {
                          ...editingCar.monthlyRental,
                          limit: e.target.value as "Limit Type" | "Limited" | "Unlimited"
                        }
                      })}
                      className="w-full w-full p-2 bg-black/50 border border-lime/30 rounded-lg text-white"
                    >
                      <option value="Limit Type">Limit Type</option>
                      <option value="Limited">Limited</option>
                      <option value="Unlimited">Unlimited</option>
                    </select>
                  )}
                </div>

                {editingCar.monthlyRental.available && (
                  <>
                    {editingCar.monthlyRental.limit === 'Limited' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-md font-medium text-lime">Packages</h4>
                          <button
                            onClick={() => handleAddPackage('monthly')}
                            className="flex items-center gap-2 bg-lime/20 text-lime hover:bg-lime/30 px-3 py-1 rounded-lg text-sm transition"
                          >
                            <Plus className="h-4 w-4" />
                            Add Package
                          </button>
                        </div>

                        {editingCar.monthlyRental.packages.map((pkg, index) => (
                          <div key={index} className="bg-lightgray/20 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <Input
                                label="Monthly Rate"
                                value={pkg.rate}
                                onChange={(e: { target: { value: string; }; }) => {
                                  const packages = [...editingCar.monthlyRental.packages];
                                  packages[index].rate = e.target.value;
                                  setEditingCar({
                                    ...editingCar,
                                    monthlyRental: {
                                      ...editingCar.monthlyRental,
                                      packages
                                    }
                                  });
                                }}
                                prefix="₹"
                              />
                              <Input
                                label="KM Limit"
                                value={pkg.kmPerMonth}
                                onChange={(e: { target: { value: string; }; }) => {
                                  const packages = [...editingCar.monthlyRental.packages];
                                  packages[index].kmPerMonth = e.target.value;
                                  setEditingCar({
                                    ...editingCar,
                                    monthlyRental: {
                                      ...editingCar.monthlyRental,
                                      packages
                                    }
                                  });
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <Input
                                label="Extra Hour Rate"
                                value={pkg.extraHourRate}
                                onChange={(e: { target: { value: string; }; }) => {
                                  const packages = [...editingCar.monthlyRental.packages];
                                  packages[index].extraHourRate = e.target.value;
                                  setEditingCar({
                                    ...editingCar,
                                    monthlyRental: {
                                      ...editingCar.monthlyRental,
                                      packages,
                                      limitValueHr: e.target.value
                                    }
                                  });
                                }}
                                prefix="₹"
                              />
                              <Input
                                label="Extra KM Rate"
                                value={pkg.extraKmRate}
                                onChange={(e: { target: { value: string; }; }) => {
                                  const packages = [...editingCar.monthlyRental.packages];
                                  packages[index].extraKmRate = e.target.value;
                                  setEditingCar({
                                    ...editingCar,
                                    monthlyRental: {
                                      ...editingCar.monthlyRental,
                                      packages,
                                      limitValueKm: e.target.value
                                    }
                                  });
                                }}
                                prefix="₹"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleRemovePackage('monthly', index)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {editingCar.monthlyRental.limit === 'Unlimited' && (
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Fixed Monthly Rate"
                          value={editingCar.monthlyRental.rate}
                          onChange={(e: { target: { value: any; }; }) => 
                            setEditingCar({
                              ...editingCar,
                              monthlyRental: {
                                ...editingCar.monthlyRental,
                                rate: e.target.value
                              }
                            })
                          }
                          prefix="₹"
                        />
                        <Input
                          label="Extra Hour Rate"
                          value={editingCar.monthlyRental.limitValueHr}
                          onChange={(e: { target: { value: any; }; }) => 
                            setEditingCar({
                              ...editingCar,
                              monthlyRental: {
                                ...editingCar.monthlyRental,
                                limitValueHr: e.target.value
                              }
                            })
                          }
                          prefix="₹"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-lime/20">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingCar.weeklyRental.available}
                      onChange={(e) => 
                        setEditingCar({
                          ...editingCar,
                          weeklyRental: {
                            ...editingCar.weeklyRental,
                            available: e.target.checked
                          }
                        })
                      }
                      className="rounded border-gray-300 text-lime focus:ring-lime"
                    />
                    <h3 className="text-lg font-medium text-lime">Weekly Rental</h3>
                  </div>
                  {editingCar.weeklyRental.available && (
                    <select
                      value={editingCar.weeklyRental.limit}
                      onChange={(e) => setEditingCar({
                        ...editingCar,
                        weeklyRental: {
                          ...editingCar.weeklyRental,
                          limit: e.target.value as "Limit Type" | "Limited" | "Unlimited"
                        }
                      })}
                      className="w-full w-full p-2 bg-black/50 border border-lime/30 rounded-lg text-white"
                    >
                      <option value="Limit Type">Limit Type</option>
                      <option value="Limited">Limited</option>
                      <option value="Unlimited">Unlimited</option>
                    </select>
                  )}
                </div>

                {editingCar.weeklyRental.available && (
                  <>
                    {editingCar.weeklyRental.limit === 'Limited' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-md font-medium text-lime">Packages</h4>
                          <button
                            onClick={() => handleAddPackage('weekly')}
                            className="flex items-center gap-2 bg-lime/20 text-lime hover:bg-lime/30 px-3 py-1 rounded-lg text-sm transition"
                          >
                            <Plus className="h-4 w-4" />
                            Add Package
                          </button>
                        </div>

                        {editingCar.weeklyRental.packages.map((pkg, index) => (
                          <div key={index} className="bg-lightgray/20 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <Input
                                label="Weekly Rate"
                                value={pkg.rate}
                                onChange={(e: { target: { value: string; }; }) => {
                                  const packages = [...editingCar.weeklyRental.packages];
                                  packages[index].rate = e.target.value;
                                  setEditingCar({
                                    ...editingCar,
                                    weeklyRental: {
                                      ...editingCar.weeklyRental,
                                      packages
                                    }
                                  });
                                }}
                                prefix="₹"
                              />
                              <Input
                                label="KM Limit"
                                value={pkg.kmPerWeek}
                                onChange={(e: { target: { value: string; }; }) => {
                                  const packages = [...editingCar.weeklyRental.packages];
                                  packages[index].kmPerWeek = e.target.value;
                                  setEditingCar({
                                    ...editingCar,
                                    weeklyRental: {
                                      ...editingCar.weeklyRental,
                                      packages
                                    }
                                  });
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <Input
                                label="Extra Hour Rate"
                                value={pkg.extraHourRate}
                                onChange={(e: { target: { value: string; }; }) => {
                                  const packages = [...editingCar.weeklyRental.packages];
                                  packages[index].extraHourRate = e.target.value;
                                  setEditingCar({
                                    ...editingCar,
                                    weeklyRental: {
                                      ...editingCar.weeklyRental,
                                      packages,
                                      limitValueHr: e.target.value
                                    }
                                  });
                                }}
                                prefix="₹"
                              />
                              <Input
                                label="Extra KM Rate"
                                value={pkg.extraKmRate}
                                onChange={(e: { target: { value: string; }; }) => {
                                  const packages = [...editingCar.weeklyRental.packages];
                                  packages[index].extraKmRate = e.target.value;
                                  setEditingCar({
                                    ...editingCar,
                                    weeklyRental: {
                                      ...editingCar.weeklyRental,
                                      packages,
                                      limitValueKm: e.target.value
                                    }
                                  });
                                }}
                                prefix="₹"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleRemovePackage('weekly', index)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {editingCar.weeklyRental.limit === 'Unlimited' && (
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Fixed Weekly Rate"
                          value={editingCar.weeklyRental.rate}
                          onChange={(e: { target: { value: any; }; }) => 
                            setEditingCar({
                              ...editingCar,
                              weeklyRental: {
                                ...editingCar.weeklyRental,
                                rate: e.target.value
                              }
                            })
                          }
                          prefix="₹"
                        />
                        <Input
                          label="Extra Hour Rate"
                          value={editingCar.weeklyRental.limitValueHr}
                          onChange={(e: { target: { value: any; }; }) => 
                            setEditingCar({
                              ...editingCar,
                              weeklyRental: {
                                ...editingCar.weeklyRental,
                                limitValueHr: e.target.value
                              }
                            })
                          }
                          prefix="₹"
                        />
                      </div>
                    )}
                  </>
                )}
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
                        className="w-full w-full p-2 bg-black/50 border border-lime/30 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-lime mb-1">End Time</label>
                      <input
                        type="time"
                        value={editingCar.unavailableHours.end}
                        onChange={(e) => handleUnavailableHoursChange('end', e.target.value, false)}
                        className="w-full w-full p-2 bg-black/50 border border-lime/30 rounded-lg text-white"
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
  )}
    
     

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