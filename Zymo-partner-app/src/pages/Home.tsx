import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Button } from "../components/Button";
import { MapPinIcon, Plus } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface CarListing {
  id: string;
  carBrand: string;
  carName: string;
  cities: string[];
  images: string[];
  pickupLocations: { [key: string]: string }; // Changed from single pickupLocation
  securityDeposit: string; // Changed from number to string
  yearOfRegistration: number | null; // Added null possibility
  fuelType: string;
  carType: string;
  transmissionType: string;
  minBookingDuration: number;
  unit: string; // New field
  noOfSeats: number; // New field
  unavailableDates: string[];
  unavailableHours: { start: string; end: string }; // New field

  // Updated rental pricing structure
  hourlyRental: {
    limit: "Limit Type" | "Limited" | "Unlimited";
    limited?: {
      packages: Array<{ hourlyRate: string; kmPerHour: string }>;
      extraKmRate: string;
      extraHourRate: string;
    };
    unlimited?: {
      fixedHourlyRate: string;
      extraHourRate: string;
    };
  };

  weeklyRental?: {
    available: boolean;
    limit: "Limit Type" | "Unlimited" | "Limited";
    limited?: {
      packages: Array<{ weeklyRate: string; kmPerWeek: string }>;
      extraKmRate: string;
      extraHourRate: string;
    };
    unlimited?: {
      fixedWeeklyRate: string;
      extraHourRate: string;
    };
  };

  monthlyRental?: {
    available: boolean;
    limit: "Limit Type" | "Unlimited" | "Limited";
    limited?: {
      packages: Array<{ monthlyRate: string; kmPerMonth: string }>;
      extraKmRate: string;
      extraHourRate: string;
    };
    unlimited?: {
      fixedMonthlyRate: string;
      extraHourRate: string;
    };
  };

  deliveryCharges?: {
    enabled: boolean;
    charges: {
      "0-10": string;
      "10-25": string;
      "25-50": string;
    };
  };

  slabRates?: {
    enabled: boolean;
    slabs: Array<{ duration: string; rate: string }>;
  };
}

export function Home() {
  const navigate = useNavigate();
  const [cars, setCars] = useState<CarListing[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true); // Added loading state
  const [logo, setLogo] = useState<string | null>(null);
  const [currentIndexes, setCurrentIndexes] = useState<number[]>([]);
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [carToDelete, setCarToDelete] = useState<CarListing | null>(null);

  const handleDeleteCar = async (): Promise<void> => {
    if (!carToDelete || !auth.currentUser) return;

    try {
      // Reference to the car document
      const carDocRef: DocumentReference = doc(
        db,
        "partnerWebApp",
        auth.currentUser.uid,
        "uploadedCars",
        carToDelete.id
      );

      // Delete the document
      await deleteDoc(carDocRef);

      // Update local state to remove the car
      setCars((prevCars: CarListing[]) =>
        prevCars.filter((car: CarListing) => car.id !== carToDelete.id)
      );

      // Close confirmation dialog
      setShowDeleteConfirm(false);
      setCarToDelete(null);
    } catch (error) {
      console.error("Error deleting car:", error);
      // Add error handling/notification here
    }
  };

  const showDeleteConfirmation = (car: CarListing) => {
    setCarToDelete(car);
    setShowDeleteConfirm(true);
  };

  const openModal = (car: CarListing) => {
    setSelectedCar(car);
    setSelectedDates(
      (car.unavailableDates || []).map((dateStr) => new Date(dateStr))
    );
    setIsModalOpen(true);
  };

  const handleDateSelect = (dates: Date[] | undefined) => {
    if (!dates) {
      setSelectedDates([]);
      return;
    }
    setSelectedDates(dates);
  };

  const handleSaveDates = async (): Promise<void> => {
    if (!selectedCar || !auth.currentUser) return;

    try {
      // Reference to the specific car document
      const carDocRef: DocumentReference = doc(
        db,
        "partnerWebApp",
        auth.currentUser.uid,
        "uploadedCars",
        selectedCar.id
      );

      // Convert Date objects to strings for storage if needed
      const dateStrings: string[] = selectedDates.map(
        (date: Date) => date.toISOString().split("T")[0]
      );

      // Only update the unavailableDates field
      await updateDoc(carDocRef, {
        unavailableDates: dateStrings,
      });

      // Update local state to reflect changes
      setCars((prevCars: CarListing[]) =>
        prevCars.map((car: CarListing) =>
          car.id === selectedCar.id
            ? { ...car, unavailableDates: dateStrings }
            : car
        )
      );

      // Display success message
      setSaveMessage("Dates saved successfully!");

      // Close modal after a short delay so user can see the message
      setTimeout(() => {
        setIsModalOpen(false);
        // Clear message after modal closes
        setTimeout(() => setSaveMessage(null), 500);
      }, 1500);
    } catch (error) {
      console.error("Error updating unavailable dates:", error);
      setSaveMessage("Error saving dates. Please try again.");
    }
  };

  useEffect(() => {
    setCurrentIndexes(new Array(cars.length).fill(0)); // Set default index for each car
  }, [cars]); // Update when cars are fetched

  const handlePrevImage = (carIndex: number, imagesLength: number) => {
    setCurrentIndexes((prevIndexes) => {
      const newIndexes = [...prevIndexes];
      newIndexes[carIndex] =
        (newIndexes[carIndex] - 1 + imagesLength) % imagesLength;
      return newIndexes;
    });
  };

  const handleNextImage = (carIndex: number, imagesLength: number) => {
    setCurrentIndexes((prevIndexes) => {
      const newIndexes = [...prevIndexes];
      newIndexes[carIndex] = (newIndexes[carIndex] + 1) % imagesLength;
      return newIndexes;
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            setUserProfile(null);
          }

          // Fetch cars only after the user is confirmed
          const carsCollection = collection(
            db,
            "partnerWebApp",
            user.uid,
            "uploadedCars"
          );
          const carsSnapshot = await getDocs(carsCollection);
          const carsData = carsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setCars(carsData as CarListing[]);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      } else {
        setUserEmail(null);
        setUserProfile(null);
        setCars([]); // Clear cars when logged out
      }
      setLoading(false); // Mark loading as done
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchLogo = async () => {
      if (!auth.currentUser) return;

      try {
        const userRef = doc(db, "partnerWebApp", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data?.logo) {
            setLogo(data.logo);
          }
        }
      } catch (err) {
        console.error("Error fetching logo:", err);
      }
    };

    fetchLogo();
  }, []);

  const handleEditCar = (carId: string) => {
    navigate(`/upload-car?mode=edit&carId=${carId}`);
  };

  const handleUploadCar = () => {
    navigate("/upload-car");
  };

  return (
    <div className="  bg-darkgray">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show loading text until data is ready */}
        {loading ? (
          <div className="text-center text-gray-100 text-xl">Loading...</div>
        ) : (
          <>
            {/* Greeting Section */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-100">
                {userEmail ? `Welcome, ${userEmail}!` : "Welcome!"}
              </h1>
            </div>
            {/* Car Listings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {cars.map((car, index) => {
                // Calculate display price (example using first hourly package)
                const displayPrice =
                  car.hourlyRental.limited?.packages[0]?.hourlyRate ||
                  car.hourlyRental.unlimited?.fixedHourlyRate ||
                  "Price not set";

                return (
                  <div
                    key={car.id}
                    className="bg-lightgray rounded-2xl shadow-lg overflow-hidden hover:shadow-custom-even hover:shadow-lime transition duration-300 ease-in-out hover:scale-100"
                  >
                    {/* Image Gallery (unchanged) */}
                    <div className="img-container relative w-full overflow-hidden rounded-2xl">
                      {/* Backward Button */}
                      <button
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-25 text-[#faffa4] p-2 rounded-full z-10"
                        onClick={() =>
                          handlePrevImage(index, car.images.length)
                        }
                      >
                        &#10094;
                      </button>

                      {/* Image Scroller */}
                      <div
                        className="img-scroller inline-flex transition-transform duration-700 ease-in-out"
                        style={{
                          width: `${car.images.length * 100}%`,
                          transform: `translateX(-${
                            (currentIndexes[index] * 100) / car.images.length
                          }%)`,
                        }}
                      >
                        {car.images.map((img, imgIndex) => (
                          <img
                            key={imgIndex}
                            src={img}
                            alt={`${car.carName} ${imgIndex}`}
                            className="w-full h-48 object-cover rounded-2xl"
                          />
                        ))}
                      </div>

                      {/* Forward Button */}
                      <button
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-25 text-[#faffa4] p-2 rounded-full z-10"
                        onClick={() =>
                          handleNextImage(index, car.images.length)
                        }
                      >
                        &#10095;
                      </button>
                    </div>

                    <div className="p-4">
                      <div className="flex gap-1">
                        <h2 className="text-xl font-semibold  text-gray-100">
                          {car.carBrand}
                        </h2>
                        <h2 className="text-xl font-semibold  text-gray-100">
                          {car.carName}
                        </h2>
                      </div>

                      <p className="flex gap-1 my-2  text-gray-300">
                        <MapPinIcon />
                        {car.cities.join(", ")}
                      </p>

                      {/* Display pricing information */}
                      <div className="space-y-1">
                        <p className="m-1  text-white">
                          Hourly Rate: ₹ {displayPrice}
                        </p>

                        {car.hourlyRental.limited && (
                          <p className="m-1 text-sm   text-gray-300">
                            {car.hourlyRental.limited.packages[0]?.kmPerHour ||
                              "N/A"}{" "}
                            km/hour
                          </p>
                        )}
                      </div>

                      {/* Car specifications */}
                      <div className="space-y-1 mt-2">
                        <p className="m-1   text-white">
                          Type: {car.carType} | {car.fuelType} |{" "}
                          {car.transmissionType}
                        </p>
                        <p className="m-1   text-white">
                          Seats: {car.noOfSeats} | Year of Reg.:{" "}
                          {car.yearOfRegistration || "N/A"}
                        </p>
                        <p className="m-1   text-white">
                          Min. Booking: {car.minBookingDuration} {car.unit}
                        </p>

                        <p className="m-1   text-white">
                          Unavailable: {car.unavailableHours.start} to{" "}
                          {car.unavailableHours.end}
                        </p>
                      </div>

                      {logo && (
                        <div className="mt-2">
                          <img
                            src={logo}
                            alt="Company Logo"
                            className="w-16 h-16 object-contain rounded-lg"
                          />
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-4">
                        <button
                          onClick={() => openModal(car)}
                          className="border border-lime px-4 py-2 rounded-2xl  text-white"
                        >
                          Set Unavailable Dates
                        </button>
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <Button
                          onClick={() => handleEditCar(car.id)}
                          className="bg-lime px-4 py-2 rounded"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => showDeleteConfirmation(car)}
                          className="bg-red-500 px-4 py-2 rounded text-white"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && carToDelete && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="  bg-lightgray p-6 rounded-lg shadow-lg w-96">
                  <h3 className="text-lg font-semibold   text-white mb-2">
                    Confirm Deletion
                  </h3>
                  <p className="mb-4   text-gray-400">
                    Are you sure you want to delete the car "
                    {carToDelete.carName}
                    "? This action cannot be undone.
                  </p>

                  <div className="mt-6 flex justify-end space-x-3">
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="bg-gray-500 px-4 py-2 rounded text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteCar}
                      className="bg-red-500 px-4 py-2 rounded text-white"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {/* Unavailable Dates Modal */}
            {isModalOpen && selectedCar && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                <div className="bg-lightgray p-6 rounded-lg shadow-lg w-96">
                  <h3 className="text-lg   text-white mb-2">
                    Select Unavailable Dates
                  </h3>
                  <p className="mb-4 text-gray-400">
                    Mark dates when your car is unavailable for booking
                  </p>
                  {/* Save message display */}
                  {saveMessage && (
                    <div
                      className={`mb-4 p-2 text-center rounded ${
                        saveMessage.includes("Error")
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {saveMessage}
                    </div>
                  )}
                  <div className="flex justify-center   text-white">
                    <DayPicker
                      mode="multiple"
                      selected={selectedDates.map((date) => new Date(date))}
                      onSelect={handleDateSelect}
                      className="grid gap-4 p-4 border rounded-lg shadow-md"
                    />
                  </div>
                  <div className="mt-4 flex justify-between">
                    <Button
                      onClick={() => setIsModalOpen(false)}
                      className="bg-gray-500 px-4 py-2 rounded text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveDates}
                      className="bg-lime px-4 py-2 rounded text-black"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {/* Upload Car Button */}
            <div className="fixed bottom-8 right-8">
              <Button
                onClick={handleUploadCar}
                className="rounded-full hover:bg-[#9bbf65] bg-lime w-14 h-14 flex items-center justify-center shadow-lg"
              >
                <Plus className="text-black h-6 w-6" />
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
