import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "../lib/firebase";
import { RootState } from "../store/store";
import {
  FiSearch,
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiPhone,
  FiMail,
  FiMapPin,
  FiPackage,
  FiEdit,
} from "react-icons/fi";
import { Car } from "lucide-react";

interface Booking {
  id: string; // Firestore document ID
  Balance: string;
  Cancelled: boolean;
  CarImage: string;
  CarName: string;
  City: string;
  DateOfBirth: string;
  DateOfBooking: number;
  "Discount applied by user"?: number;
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
  "Package Selected": string;
  PhoneNumber: string;
  "Pickup Location": string;
  "Promo Code Used": string;
  RefundData?: {
    "Booking Cancelled"?: string;
    SecurityDeposit?: number;
  };
  StartDate: string;
  StartTime: string;
  Street1: string;
  Street2: string;
  TimeStamp: string;
  Transmission: string;
  UserId: string;
  Vendor: string;
  Zipcode: string;
  actualPrice: number;
  bookingId: string;
  deliveryType: string;
  paymentId: string;
  price: string;
  refundTimestamp?: string;
  status?: "pending" | "accepted" | "rejected";
  rejectionReason?: string;
}

type BookingFilter = "upcoming" | "active" | "past" | "all";
type SortOption =
  | "newest"
  | "oldest"
  | "price-high"
  | "price-low"
  | "name-asc"
  | "name-desc";

const parseBookingDateTime = (
  dateStr: string,
  timeStr: string
): Date | null => {
  try {
    const isoDate = new Date(`${dateStr}T${timeStr}`);
    if (!isNaN(isoDate.getTime())) return isoDate;

    const formats = [
      { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, timeSplit: ":" },
      { regex: /^(\d{2}) (\w{3}), (\d{4})$/, timeSplit: /[: ]/ },
    ];

    for (const format of formats) {
      const match = dateStr.match(format.regex);
      if (match) {
        const [_, day, month, year] = match;
        const timeParts = timeStr.split(format.timeSplit);
        const hours =
          parseInt(timeParts[0]) +
          (timeStr.includes("PM") && timeParts[0] !== "12" ? 12 : 0);
        const minutes = parseInt(timeParts[1]) || 0;

        const monthNum = format.regex.toString().includes("\\w{3}")
          ? new Date(`${month} 1, 2023`).getMonth()
          : parseInt(month) - 1;

        return new Date(
          parseInt(year),
          monthNum,
          parseInt(day),
          hours,
          minutes
        );
      }
    }

    console.warn(`Unrecognized date/time format: ${dateStr} ${timeStr}`);
    return null;
  } catch (error) {
    console.error(`Error parsing date/time: ${dateStr} ${timeStr}`, error);
    return null;
  }
};

const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<BookingFilter>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(
    null
  );
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const db = getFirestore(app);
  const auth = getAuth();
  const profile = useSelector((state: RootState) => state.profile);
  const vendorBrandName = profile.brandName;

  useEffect(() => {
    const fetchVendorBookings = async () => {
      if (profile.loading) {
        setLoading(true);
        return;
      }

      if (!vendorBrandName) {
        setError("Vendor details (Brand Name) not found in profile.");
        setLoading(false);
        return;
      }

      if (!auth.currentUser) {
        setError("User not authenticated.");
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "CarsPaymentSuccessDetails"),
          where("Vendor", "==", vendorBrandName)
        );
        const snapshot = await getDocs(q);
        const vendorBookings = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id, // Firestore document ID
              status: doc.data().status || "pending",
              ...doc.data(),
            } as Booking)
        );
        setBookings(vendorBookings);
      } catch (err: any) {
        setError(`Failed to fetch bookings: ${err.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorBookings();
  }, [auth, db, profile.loading, vendorBrandName]);

  const handleAcceptBooking = async (firestoreDocId: string) => {
    try {
      setProcessingBookingId(firestoreDocId);
      const bookingDoc = doc(db, "CarsPaymentSuccessDetails", firestoreDocId);
      await updateDoc(bookingDoc, {
        status: "accepted",
        updatedAt: new Date().toISOString(),
      });

      setBookings(
        bookings.map((booking) =>
          booking.id === firestoreDocId
            ? { ...booking, status: "accepted" }
            : booking
        )
      );
    } catch (error) {
      console.error("Error accepting booking:", error);
      setError("Failed to accept booking");
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleEditStatus = (bookingId: string) => {
    setEditingStatus(bookingId);
    setRejectionReason(
      bookings.find((b) => b.id === bookingId)?.rejectionReason || ""
    );
  };

  const cancelEdit = () => {
    setEditingStatus(null);
    setRejectionReason("");
  };

  const handleRejectBooking = async (firestoreDocId: string) => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    try {
      setProcessingBookingId(firestoreDocId);
      const bookingDoc = doc(db, "CarsPaymentSuccessDetails", firestoreDocId);
      await updateDoc(bookingDoc, {
        status: "rejected",
        rejectionReason: rejectionReason,
        updatedAt: new Date().toISOString(),
      });

      setBookings(
        bookings.map((booking) =>
          booking.id === firestoreDocId
            ? { ...booking, status: "rejected", rejectionReason }
            : booking
        )
      );
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting booking:", error);
      setError("Failed to reject booking");
    } finally {
      setProcessingBookingId(null);
    }
  };

  const { filteredAndSortedBookings, paginatedBookings, totalPages } =
    useMemo(() => {
      const now = new Date();
      const filtered = bookings.filter((booking) => {
        const start = parseBookingDateTime(
          booking.StartDate,
          booking.StartTime
        );
        const end = parseBookingDateTime(booking.EndDate, booking.EndTime);

        if (!start || !end) return false;

        let timeFilterPassed = false;
        switch (activeFilter) {
          case "upcoming":
            timeFilterPassed = start > now;
            break;
          case "active":
            timeFilterPassed = now >= start && now <= end;
            break;
          case "past":
            timeFilterPassed = end < now;
            break;
          default:
            timeFilterPassed = true;
        }

        const searchLower = searchQuery.toLowerCase();
        const searchPassed =
          !searchLower ||
          [
            booking.FirstName,
            booking.Email,
            booking.PhoneNumber,
            booking.bookingId,
            booking.CarName,
            booking.City,
            booking.paymentId,
            booking["Package Selected"],
          ].some((field) => field?.toLowerCase().includes(searchLower));

        return timeFilterPassed && searchPassed;
      });

      const sorted = [...filtered].sort((a, b) => {
        switch (sortOption) {
          case "newest":
            return b.DateOfBooking - a.DateOfBooking;
          case "oldest":
            return a.DateOfBooking - b.DateOfBooking;
          case "price-high":
            return parseFloat(b.price) - parseFloat(a.price);
          case "price-low":
            return parseFloat(a.price) - parseFloat(b.price);
          case "name-asc":
            return a.CarName.localeCompare(b.CarName);
          case "name-desc":
            return b.CarName.localeCompare(a.CarName);
          default:
            return 0;
        }
      });

      // Calculate pagination
      const totalPages = Math.ceil(sorted.length / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedBookings = sorted.slice(
        startIndex,
        startIndex + itemsPerPage
      );

      return {
        filteredAndSortedBookings: sorted,
        paginatedBookings,
        totalPages,
      };
    }, [
      bookings,
      activeFilter,
      searchQuery,
      sortOption,
      currentPage,
      itemsPerPage,
    ]);

  const toggleBookingExpansion = (bookingId: string) => {
    setExpandedBookingId(expandedBookingId === bookingId ? null : bookingId);
  };

  const PaginationControls = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
        <div className="text-sm text-gray-400">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(
            currentPage * itemsPerPage,
            filteredAndSortedBookings.length
          )}{" "}
          of {filteredAndSortedBookings.length} bookings
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg bg-lightgray text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lightgray/80 transition-colors"
          >
            Previous
          </button>

          <div className="flex gap-1">
            {startPage > 1 && (
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="px-3 py-1 rounded-lg bg-lightgray text-white hover:bg-lightgray/80 transition-colors"
                >
                  1
                </button>
                {startPage > 2 && <span className="px-2 py-1">...</span>}
              </>
            )}

            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => setCurrentPage(number)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  currentPage === number
                    ? "bg-lime"
                    : "bg-lightgray text-white hover:bg-lightgray/80"
                }`}
              >
                {number}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span className="px-2 py-1">...</span>
                )}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-3 py-1 rounded-lg bg-lightgray text-white hover:bg-lightgray/80 transition-colors"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg bg-lightgray text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lightgray/80 transition-colors"
          >
            Next
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-lightgray text-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-lime"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
    );
  };

  const renderSearchBar = () => (
    <div className="relative mb-8 max-w-2xl mx-auto">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <FiSearch className="text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Search by name, email, phone, booking ID..."
        className="block w-full pl-10 pr-3 py-3 rounded-full bg-lightgray text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-lime focus:border-transparent transition-all shadow-sm"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setCurrentPage(1);
        }}
      />
    </div>
  );

  const renderSortAndFilter = () => (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
      <div className="flex items-center space-x-2">
        <FiFilter className="text-gray-400 mb-2" />
        <span className="text-sm font-medium text-gray-300 pb-2">Filter:</span>
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {(["active", "upcoming", "past", "all"] as BookingFilter[]).map(
            (filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  setCurrentPage(1);
                }}
                className={`px-4 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === filter
                    ? "bg-lime shadow-md dark:bg-lime"
                    : " text-white hover:bg-gray-20 bg-lightgray dark:text-gray-300 hover:bg-lightgray/50"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      <div className="relative">
        <select
          value={sortOption}
          onChange={(e) => {
            setSortOption(e.target.value as SortOption);
            setCurrentPage(1);
          }}
          className="appearance-none pl-3 pr-8 py-2 bg-lightgray rounded-xl text-white transition-colors text-sm font-medium focus:outline-none focus:ring-1 focus:ring-lime"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price-high">Price (High to Low)</option>
          <option value="price-low">Price (Low to High)</option>
          <option value="name-asc">Car Name (A-Z)</option>
          <option value="name-desc">Car Name (Z-A)</option>
        </select>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <FiChevronDown className="text-gray-500" />
        </div>
      </div>
    </div>
  );

  const renderBookingStatusActions = (booking: Booking) => {
    if (activeFilter !== "upcoming" || booking.Cancelled) return null;

    const isProcessing = processingBookingId === booking.id;
    const isEditing = editingStatus === booking.id;

    if (isEditing) {
      return (
        <div className="mt-4 pt-4 border-t border-lightgray space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleAcceptBooking(booking.id)}
              disabled={isProcessing}
              className="py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Accept"}
            </button>
            <button
              onClick={() => {
                updateDoc(doc(db, "CarsPaymentSuccessDetails", booking.id), {
                  status: "pending",
                  rejectionReason: "",
                  updatedAt: new Date().toISOString(),
                }).then(() => {
                  setBookings(
                    bookings.map((b) =>
                      b.id === booking.id
                        ? { ...b, status: "pending", rejectionReason: "" }
                        : b
                    )
                  );
                  setEditingStatus(null);
                });
              }}
              disabled={isProcessing}
              className="py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Set Pending"}
            </button>
            <button
              onClick={cancelEdit}
              className="py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-2">
            <textarea
              placeholder="Enter reason for rejection..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <button
              onClick={() => handleRejectBooking(booking.id)}
              disabled={isProcessing || !rejectionReason.trim()}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Reject"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {booking.status === "pending" ? (
          <div className="space-y-3">
            <button
              onClick={() => handleAcceptBooking(booking.id)}
              disabled={isProcessing}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Accept Booking"}
            </button>
            <button
              onClick={() => setEditingStatus(booking.id)}
              disabled={isProcessing}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject Booking
            </button>
          </div>
        ) : (
          <div
            className={`p-3 rounded-lg ${
              booking.status === "accepted"
                ? "bg-green-100 dark:bg-green-900/20"
                : "bg-red-100 dark:bg-red-900/20"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p
                  className={`font-medium ${
                    booking.status === "accepted"
                      ? "text-green-800 dark:text-green-200"
                      : "text-red-800 dark:text-red-200"
                  }`}
                >
                  Booking {booking.status}
                </p>
                {booking.rejectionReason && (
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Reason: {booking.rejectionReason}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleEditStatus(booking.id)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                title="Edit status"
              >
                <FiEdit />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBookingCard = (booking: Booking) => {
    const isExpanded = expandedBookingId === booking.bookingId;
    const startDate = parseBookingDateTime(
      booking.StartDate,
      booking.StartTime
    );
    const endDate = parseBookingDateTime(booking.EndDate, booking.EndTime);

    return (
      <div
        key={`${booking.id}-${booking.bookingId}`}
        className="bg-lightgray rounded-xl shadow-xl overflow-hidden transition-all duration-200 hover:shadow-lg"
      >
        <div className="relative">
          <img
            src={booking.CarImage || "/placeholder-car.png"}
            alt={booking.CarName}
            className="w-full h-48 object-cover"
            onError={(e) => (e.currentTarget.src = "/placeholder-car.png")}
          />
          <div className="absolute top-2 right-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                booking.Cancelled
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                  : booking.status === "rejected"
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                  : booking.status === "accepted"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
              }`}
            >
              {booking.Cancelled
                ? "Cancelled"
                : booking.status === "accepted"
                ? "Accepted"
                : booking.status === "rejected"
                ? "Rejected"
                : "Pending"}
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-xl font-bold text-white truncate">
              {booking.CarName}
            </h2>
            <span className="text-lg font-semibold text-lime">
              ₹{booking.price}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-400 mb-3">
            <FiCalendar className="mr-1" />
            <span>
              {startDate?.toLocaleDateString()} -{" "}
              {endDate?.toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-400 mb-4">
            <FiMapPin className="mr-1" />
            <span>{booking.City}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
            <div className="flex items-center">
              <FiInfo className="mr-1 text-gray-400" />
              <span className="font-medium text-white">ID:</span>
              <span className="ml-1 truncate text-white">
                {booking.bookingId}
              </span>
            </div>
            <div className="flex items-center">
              <FiPackage className="mr-1 text-gray-400" />
              <span className="text-gray-400">
                {booking["Package Selected"]}
              </span>
            </div>
          </div>

          <button
            onClick={() => toggleBookingExpansion(booking.bookingId)}
            className="w-full py-2 flex items-center justify-center text-lime font-medium text-sm hover:bg-darkgray rounded-xl transition-colors"
          >
            {isExpanded ? (
              <>
                <span>Show Less</span>
                <FiChevronUp className="ml-1" />
              </>
            ) : (
              <>
                <span>View Details</span>
                <FiChevronDown className="ml-1" />
              </>
            )}
          </button>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-darkgray flex items-center justify-center mr-3">
                  <FiMail className="text-lime" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Customer</p>
                  <p className="text-white">{booking.FirstName}</p>
                  <p className="text-sm text-white">{booking.Email}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-darkgray flex items-center justify-center mr-3">
                  <FiPhone className="text-lime" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Phone</p>
                  <p className="text-white">{booking.PhoneNumber}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-darkgray flex items-center justify-center mr-3">
                  <FiClock className="text-lime" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Booking Period
                  </p>
                  <p className="text-white">
                    {startDate?.toLocaleString()} - {endDate?.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-darkgray flex items-center justify-center mr-3">
                  <FiDollarSign className="text-lime" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Payment Details
                  </p>
                  <p className="text-white">₹{booking.price}</p>
                  <p className="text-sm text-white">
                    Actual: ₹{booking.actualPrice} • {booking.paymentId}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-darkgray flex items-center justify-center mr-3">
                  <Car className="text-lime" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Delivery Type
                  </p>
                  <p className="text-white">{booking.deliveryType}</p>
                  <p className="text-sm text-gray-400">
                    {booking["Pickup Location"] || "Location not specified"}
                  </p>
                </div>
              </div>

              {booking.Cancelled && (
                <div className="bg-red-900/20 p-3 rounded-xl">
                  <p className="text-sm font-medium text-red-200">
                    Cancellation Details
                  </p>
                  {booking.refundTimestamp && (
                    <p className="text-sm text-red-300 ">
                      Refunded at: {booking.refundTimestamp}
                    </p>
                  )}
                  {booking.RefundData?.["Booking Cancelled"] && (
                    <p className="text-sm text-red-300">
                      Refund Amount: ₹{booking.RefundData["Booking Cancelled"]}
                    </p>
                  )}
                </div>
              )}

              {renderBookingStatusActions(booking)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getEmptyMessage = () => {
    if (searchQuery) return "No bookings match your search";
    return {
      active: "No active bookings found",
      upcoming: "No upcoming bookings found",
      past: "No past bookings found",
      all:
        bookings.length === 0
          ? `No bookings found for ${vendorBrandName}`
          : "No bookings match the current filter",
    }[activeFilter];
  };

  if (profile.loading || loading)
    return (
      <div className="flex justify-center items-center min-h-[400px] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime mr-3"></div>
        {profile.loading ? "Loading Profile..." : "Loading Bookings..."}
      </div>
    );

  if (error || !vendorBrandName)
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400 text-lg">
        {error || "Could not load vendor details"}
      </div>
    );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-lime mb-2">Your Bookings</h1>
          <p className="text-lg text-gray-300">{vendorBrandName}</p>
        </div>

        {renderSearchBar()}
        {renderSortAndFilter()}

        {paginatedBookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-darkgray rounded-full flex items-center justify-center mb-4">
              <FiCalendar className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">
              {getEmptyMessage()}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {searchQuery
                ? "Try a different search term"
                : "When you have bookings, they will appear here"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedBookings.map(renderBookingCard)}
            </div>
            {totalPages > 1 && <PaginationControls />}
          </>
        )}
      </div>
    </div>
  );
};

export default Bookings;
