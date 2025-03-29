import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "../components/Button";

// Define the interface for car listing and user details
interface CarListing {
  id: string;
  name: string;
  cities: string[];
  images: string[];
  securityDeposit: number;
  yearOfRegistration: number;
  fuelType: string;
  carType: string;
  transmissionType: string;
  minBookingDuration: number;
  kmRate: number;
  extraHourRate: number;
  userEmail: string; // Email of the user who uploaded the car
}

interface User {
  name: string; // Assuming user has a 'name' field
  email: string;
}

const Public = () => {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [users, setUsers] = useState<Map<string, User>>(new Map()); // Store users by email for easy access

  // Fetch all car data from Firestore
  const fetchCars = async () => {
    const carsCollection = collection(db, "testpcars");
    const carsSnapshot = await getDocs(carsCollection);
    const carsData = carsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CarListing[];
    setCars(carsData);
    fetchUsers(carsData); // Fetch user data after fetching cars
  };

  // Fetch user data based on emails in the cars collection
  const fetchUsers = async (carsData: CarListing[]) => {
    const userEmails = Array.from(new Set(carsData.map((car) => car.userEmail))); // Get unique user emails
    const usersCollection = collection(db, "users");

    const usersData: Map<string, User> = new Map();

    for (const email of userEmails) {
      const userQuery = query(usersCollection, where("email", "==", email));
      const userSnapshot = await getDocs(userQuery);
      userSnapshot.forEach((doc) => {
        const user = doc.data() as User;
        usersData.set(email, user);
      });
    }

    setUsers(usersData);
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const handleBookCar = (carId: string) => {
    alert(`Car with ID ${carId} booked!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkgray py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-center text-lightgray dark:text-gray-100 mb-8">
          All Car Listings
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cars.map((car) => {
            const user = users.get(car.userEmail); // Get user data from the map
            return (
              <div
                key={car.id}
                className="bg-white dark:bg-lightgray hover:shadow-custom-even duration-300 hover:shadow-lime transition hover:scale-105 ease-in-out rounded-lg shadow-lg overflow-hidden"
              >
                <img
                  src={car.images[0] || "default_image_url"} // Display first image or fallback
                  alt={car.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-lightgray dark:text-gray-100">
                    {car.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">{car.cities.join(", ")}</p>
                  <p className="text-lightgray dark:text-gray-100 mt-2">Fuel Type: {car.fuelType}</p>
                  <p className="text-lightgray dark:text-gray-100">Transmission: {car.transmissionType}</p>
                  <p className="text-lightgray dark:text-gray-100">Year of Registration: {car.yearOfRegistration}</p>
                  <p className="text-lightgray dark:text-gray-100">Deposit: ${car.securityDeposit}</p>

                  {/* Display the user who uploaded the car */}
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Fullfiled by: {user ? user.name : "Unknown"}
                  </p>

                  <div className="mt-4">
                    <Button
                      onClick={() => handleBookCar(car.id)}
                      className="bg-lime px-4 py-2 rounded"
                    >
                      Book
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Public;
