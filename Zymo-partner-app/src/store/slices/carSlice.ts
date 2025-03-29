import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../lib/firebase';

interface RentalPackage {
  hourlyRate?: string;
  kmPerHour?: string;
  monthlyRate?: string;
  kmPerMonth?: string;
  weeklyRate?: string;
  kmPerWeek?: string;
}

interface LimitedRental {
  packages: RentalPackage[];
  extraKmRate: string;
  extraHourRate: string;
}

interface UnlimitedRental {
  fixedHourlyRate?: string;
  fixedMonthlyRate?: string;
  fixedWeeklyRate?: string;
  extraHourRate: string;
}

interface HourlyRental {
  limit: "Limit Type" | "Limited" | "Unlimited";
  limited: LimitedRental;
  unlimited: UnlimitedRental;
}

interface MonthlyRental {
  available: boolean;
  limit: "Limit Type" | "Unlimited" | "Limited";
  limited: LimitedRental;
  unlimited: UnlimitedRental;
}

interface WeeklyRental {
  available: boolean;
  limit: "Limit Type" | "Unlimited" | "Limited";
  limited: LimitedRental;
  unlimited: UnlimitedRental;
}

interface DeliveryCharges {
  enabled: boolean;
  Range: string;
  charges: {
    "0-10": string;
    "10-25": string;
    "25-50": string;
  };
}

interface SlabRate {
  duration: string;
  rate: string;
}

interface UnavailableHours {
  start: string;
  end: string;
}

export interface Car {
  id?: string;
  name: string;
  images: string[];
  cities: string[];
  pickupLocation: string;
  securityDeposit: string;
  yearOfRegistration: number;
  fuelType: string;
  carType: string;
  transmissionType: string;
  minBookingDuration: number;
  unavailableDates: string[];
  unit: string;
  noOfSeats: number;
  hourlyRental: HourlyRental;
  monthlyRental: MonthlyRental;
  weeklyRental: WeeklyRental;
  deliveryCharges: DeliveryCharges;
  slabRates: SlabRate[];
  unavailableHours: UnavailableHours;
  userId: string;
}

interface CarState {
  cars: Car[];
  loading: boolean;
  error: string | null;
}

const initialState: CarState = {
  cars: [],
  loading: false,
  error: null,
};

const uploadImages = async (files: File[]): Promise<string[]> => {
  if (!auth.currentUser) throw new Error('No authenticated user');

  return Promise.all(
    files.map(async (file) => {
      const storageRef = ref(
        storage,
        `cars/${auth.currentUser!.uid}/${Date.now()}_${file.name}`
      );
      const snapshot = await uploadBytes(storageRef, file);
      return getDownloadURL(snapshot.ref);
    })
  );
};

export const addCar = createAsyncThunk<Car, { car: Omit<Car, 'userId' | 'id' | 'images'>; imageFiles: File[] }>(
  'car/addCar',
  async (carData) => {
    try {
      const imageUrls = await uploadImages(carData.imageFiles);

      const car: Car = {
        ...carData.car,
        images: imageUrls,
        userId: auth.currentUser!.uid,
      };

      const docRef = await addDoc(collection(db, 'cars'), car);
      return { ...car, id: docRef.id };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add car');
    }
  }
);

export const fetchUserCars = createAsyncThunk<Car[], void>(
  'car/fetchUserCars',
  async () => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');

      const q = query(
        collection(db, 'cars'),
        where('userId', '==', auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Car[];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch cars');
    }
  }
);

const carSlice = createSlice({
  name: 'car',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addCar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCar.fulfilled, (state, action) => {
        state.loading = false;
        state.cars.push(action.payload);
      })
      .addCase(addCar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add car';
      })
      .addCase(fetchUserCars.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserCars.fulfilled, (state, action) => {
        state.loading = false;
        state.cars = action.payload;
      })
      .addCase(fetchUserCars.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch cars';
      });
  },
});

export default carSlice.reducer;