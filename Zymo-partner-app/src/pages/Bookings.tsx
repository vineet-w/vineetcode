import { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle, Calendar, User, MapPin } from 'lucide-react';

interface Booking {
  id: string;
  customerName: string;
  vehicle: string;
  pickupLocation: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'active' | 'completed' | 'cancelled';
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const fetchBookings = async () => {
      try {
        // Replace with actual API call
        const mockBookings: Booking[] = [
          {
            id: '1',
            customerName: 'Rahul Sharma',
            vehicle: 'Hyundai Creta',
            pickupLocation: 'MG Road, Bangalore',
            startDate: '2023-06-15',
            endDate: '2023-06-20',
            totalAmount: 12000,
            status: 'active'
          },
          {
            id: '2',
            customerName: 'Priya Patel',
            vehicle: 'Maruti Swift',
            pickupLocation: 'Connaught Place, Delhi',
            startDate: '2023-06-10',
            endDate: '2023-06-12',
            totalAmount: 6000,
            status: 'completed'
          },
          {
            id: '3',
            customerName: 'Amit Singh',
            vehicle: 'Kia Seltos',
            pickupLocation: 'Juhu Beach, Mumbai',
            startDate: '2023-06-18',
            endDate: '2023-06-25',
            totalAmount: 15000,
            status: 'active'
          },
          {
            id: '4',
            customerName: 'Neha Gupta',
            vehicle: 'Tata Nexon',
            pickupLocation: 'Hitech City, Hyderabad',
            startDate: '2023-06-05',
            endDate: '2023-06-08',
            totalAmount: 9000,
            status: 'completed'
          }
        ];
        
        setBookings(mockBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Sort bookings - active first, then completed
  const sortedBookings = [...bookings].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return 0;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-5 w-5 text-blue-400" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime"></div>
      </div>
    );
  }

  return (
    <div className="bg-lime rounded-2xl   bg-transparent">
      <div className="max-w-6xl mx-auto px-4 py-8 text-lime-400">
        <div className="  bg-darkgray bg-white rounded-2xl shadow-lg p-6 animate-slide-in border border-lime">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-lime-200 text-darklime   text-lime p-3 rounded-full">
                <Calendar className="h-6 w-6 text-lime-600" />
              </div>
              <h1 className="text-2xl font-bold   text-lime text-darklime">
                Bookings
              </h1>
            </div>
          </div>

          {/* Bookings List */}
          <div className="space-y-6">
            {sortedBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500   text-gray-400">
                  No bookings found
                </p>
              </div>
            ) : (
              sortedBookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`p-6 rounded-2xl ${
                    booking.status === 'active'
                      ? ' bg-gray-200   bg-lightgray'
                      : 'border border-lightgray'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Booking Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(booking.status)}
                        <span className="font-medium capitalize   text-gray-300">
                          {booking.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold   text-white">
                        {booking.vehicle}
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4   text-gray-300">
                        <div className="flex items-start space-x-2 ">
                          <User className="h-5 w-5 text-lime-600 mt-0.5" />
                          <span>{booking.customerName}</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-5 w-5 text-lime-600 mt-0.5" />
                          <span>{booking.pickupLocation}</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Calendar className="h-5 w-5 text-lime-600 mt-0.5" />
                          <span>
                            {new Date(booking.startDate).toLocaleDateString()} -{' '}
                            {new Date(booking.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Amount and Actions */}
                    <div className="flex flex-col items-end space-y-3">
                      <div className="text-2xl font-bold   text-white">
                        ₹{booking.totalAmount.toLocaleString()}
                      </div>
                      <div className="flex space-x-3">
                        <button className="px-4 py-2 bg-lime text-darkgray rounded-full hover:bg-lime-600 transition">
                          View Details
                        </button>
                        {booking.status === 'active' && (
                          <button className="px-4 py-2 border border-gray-700   border-lime    text-lime rounded-full hover:bg-lime-50   hover:bg-gray-700 transition">
                            Manage
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}