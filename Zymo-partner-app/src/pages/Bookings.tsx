// src/pages/Bookings.tsx (or your equivalent path)
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux'; // Import useSelector
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../lib/firebase'; // Adjust your firebase config import path
import { RootState } from '../store/store'; // Import RootState from your store configuration

// Define the Booking interface based on the provided fields
interface Booking {
    Balance: string;
    Cancelled: boolean;
    CarImage: string;
    CarName: string;
    City: string;
    DateOfBirth: string;
    DateOfBooking: number; // Firestore timestamp stored as number (milliseconds)
    'Discount applied by user'?: number; // Optional field
    Documents?: {
        LicenseBack: string | null;
        LicenseFront: string | null;
        aadhaarBack: string | null;
        aadhaarFront: string | null;
    };
    Drive: string;
    Email: string;
    EndDate: string;
    EndTime: string;
    FirstName: string;
    MapLocation: string;
    'Package Selected': string;
    PhoneNumber: string;
    'Pickup Location': string;
    'Promo Code Used': string;
    RefundData?: {
        'Booking Cancelled'?: string; // Optional within map
        SecurityDeposit?: number; // Optional within map
    };
    StartDate: string;
    StartTime: string;
    Street1: string;
    Street2: string;
    TimeStamp: string; // This seems like a pre-formatted string timestamp
    Transmission: string;
    UserId: string;
    Vendor: string; // This field will be used for matching
    Zipcode: string;
    actualPrice: number;
    bookingId: string; // Use this as the key
    deliveryType: string;
    paymentId: string;
    price: string; // Note: Price is a string in the example data
    refundTimestamp?: string; // Optional field
    // Add id if you want to store the document ID itself
    id?: string;
}

const Bookings = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const db = getFirestore(app);
    const auth = getAuth();

    // Get profile state from Redux store
    const profile = useSelector((state: RootState) => state.profile);
    const vendorBrandName = profile.brandName;  // Access brandName safely

    useEffect(() => {
        const fetchVendorBookings = async () => {
            // Wait until profile data (including brandName) is loaded and user is authenticated
            if (profile.loading || !vendorBrandName) {
                 // Keep showing loading or a specific message if brandName isn't ready
                 // Don't set error here, just wait for data
                 setLoading(true);
                 setError(''); // Clear any previous error
                 return;
            }

            const user = auth.currentUser;
            if (!user) {
                setError('User not authenticated');
                setLoading(false);
                return;
            }

            setLoading(true); // Ensure loading is true before starting async fetch
            setError(''); // Clear previous errors

            try {
                // Query the 'CarsPaymentSuccessDetails' collection
                const q = query(
                    collection(db, 'CarsPaymentSuccessDetails'),
                    // Filter where the 'Vendor' field matches the logged-in user's brandName
                    where('Vendor', '==', vendorBrandName)
                );

                const querySnapshot = await getDocs(q);
                const vendorBookings: Booking[] = [];

                querySnapshot.forEach((doc) => {
                    // Push data, casting to the Booking interface and adding the doc ID
                    vendorBookings.push({ id: doc.id, ...doc.data() } as Booking);
                });

                setBookings(vendorBookings);

            } catch (err: any) {
                console.error("Error fetching bookings:", err);
                setError(`Error fetching bookings: ${err.message || 'Unknown error'}`);
            } finally {
                 setLoading(false); // Set loading to false after fetch attempt (success or fail)
            }
        };

        fetchVendorBookings();
        // Add dependencies: auth status, db instance, profile loading state, and vendorBrandName
    }, [auth, db, profile.loading, vendorBrandName]);

    // Handle case where brandName is still loading
    if (profile.loading) {
        return (
             <div className="flex justify-center items-center min-h-[300px]">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime"></div>
             </div>
         );
    }
     // Handle case where brandName is not available after loading (e.g., profile fetch failed or missing data)
     if (!profile.loading && !vendorBrandName) {
        return <div className="p-4 text-center text-orange-500">Could not load vendor details. Please check your profile.</div>;
    }

    // Handle Firestore loading state
    if (loading) {
        return (
             <div className="flex justify-center items-center min-h-[300px]">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  <span className="ml-3">Loading bookings...</span>
             </div>
         );
    }

    // Handle fetch errors
    if (error) {
        return <div className="p-4 text-center text-red-500">{error}</div>;
    }

    // Format timestamp utility function
    const formatTimestamp = (timestampMillis: number): string => {
        if (!timestampMillis) return 'N/A';
        try {
            return new Date(timestampMillis).toLocaleString();
        } catch (e) {
            return 'Invalid Date';
        }
    }

    return (
        // Apply similar styling context if needed (e.g., dark mode compatibility)
        <div className="container mx-auto p-4 dark:text-white">
            <h1 className="text-2xl font-bold mb-6 text-center dark:text-lime">Your Bookings</h1>

            {bookings.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-10">No bookings found for your brand ({vendorBrandName}).</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map((booking) => (
                        // Use booking.bookingId as key since it seems to be the intended unique identifier
                        <div key={booking.bookingId} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105">
                            <img
                                src={booking.CarImage || '/placeholder-image.png'} // Provide a fallback image
                                alt={booking.CarName}
                                className="w-full h-48 object-cover"
                                // Add error handling for images if necessary
                                onError={(e) => (e.currentTarget.src = '/placeholder-image.png')}
                            />
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{booking.CarName}</h2>
                                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                    <p><span className="font-medium text-gray-700 dark:text-gray-100">Booking ID:</span> {booking.bookingId}</p>
                                    <p><span className="font-medium text-gray-700 dark:text-gray-100">Customer:</span> {booking.FirstName} ({booking.Email})</p>
                                    <p><span className="font-medium text-gray-700 dark:text-gray-100">Phone:</span> {booking.PhoneNumber}</p>
                                    <p><span className="font-medium text-gray-700 dark:text-gray-100">Dates:</span> {booking.StartDate} ({booking.StartTime}) - {booking.EndDate} ({booking.EndTime})</p>
                                     <p><span className="font-medium text-gray-700 dark:text-gray-100">City:</span> {booking.City}</p>
                                     <p><span className="font-medium text-gray-700 dark:text-gray-100">Total Price:</span> ₹{booking.price} (Actual: ₹{booking.actualPrice})</p>
                                     {booking['Discount applied by user'] && <p><span className="font-medium text-gray-700 dark:text-gray-100">Discount:</span> ₹{booking['Discount applied by user']}</p> }
                                    <p><span className="font-medium text-gray-700 dark:text-gray-100">Delivery:</span> {booking.deliveryType}</p>
                                    {booking.deliveryType !== 'Self-Pickup' && <p><span className="font-medium text-gray-700 dark:text-gray-100">Location:</span> {booking.MapLocation || booking['Pickup Location']}</p> }
                                    <p><span className="font-medium text-gray-700 dark:text-gray-100">Booked At:</span> {formatTimestamp(booking.DateOfBooking)}</p>
                                    <p><span className="font-medium text-gray-700 dark:text-gray-100">Payment ID:</span> {booking.paymentId}</p>
                                     <p><span className="font-medium text-gray-700 dark:text-gray-100">Cancelled:</span> <span className={booking.Cancelled ? 'text-red-500 font-semibold' : 'text-green-500 font-semibold'}>{booking.Cancelled ? 'Yes' : 'No'}</span></p>
                                     {booking.Cancelled && booking.refundTimestamp && <p><span className="font-medium text-gray-700 dark:text-gray-100">Refunded At:</span> {booking.refundTimestamp}</p>}
                                     {booking.Cancelled && booking.RefundData?.['Booking Cancelled'] && <p><span className="font-medium text-gray-700 dark:text-gray-100">Refund Amount:</span> ₹{booking.RefundData['Booking Cancelled']}</p>}
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
         </div>
     );
 };

export default Bookings;