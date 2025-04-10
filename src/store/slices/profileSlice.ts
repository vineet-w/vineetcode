import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Timestamp } from 'firebase/firestore';

interface UnavailableHours {
  start: string;
  end: string;
}

interface Profile {
  fullName: string;
  email: string;
  brandName: string;
  phone: string;
  gstNumber: string;
  bankAccountName: string;
  bankAccount: string;
  ifscCode: string;
  cities: string[];
  logo: string;
  loading: boolean;
  error: string | null;
  unavailableHours?: UnavailableHours;
  createdAt?: number; // Store as number (milliseconds)
}

const defaultUnavailableHours: UnavailableHours = {
  start: '00:00',
  end: '06:00'
};

const initialState: Profile = {
  fullName: '',
  email: '',
  brandName: '',
  phone: '',
  gstNumber: '',
  bankAccountName: '',
  bankAccount: '',
  ifscCode: '',
  cities: [],
  logo: '',
  loading: false,
  error: null,
  unavailableHours: defaultUnavailableHours
};

const isFirestoreTimestamp = (value: any): value is Timestamp => {
  return value instanceof Timestamp;
};
// Updated convertTimestamps function with proper type handling
const convertTimestamps = (data: any) => {
  if (!data) return data;
  
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (isFirestoreTimestamp(value)) {
      return { ...acc, [key]: value.toMillis() };
    }
    return { ...acc, [key]: value };
  }, {});
};

export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async () => {
    if (!auth.currentUser) throw new Error('No authenticated user');
    const docRef = doc(db, 'partnerWebApp', auth.currentUser.uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) throw new Error('Profile not found');
    
    const rawData = docSnap.data();
    const convertedData = convertTimestamps(rawData);
    
    const profileData: Profile = {
      ...initialState,
      ...convertedData,
      unavailableHours: convertedData.unavailableHours 
        ? { 
            start: convertedData.unavailableHours.start || defaultUnavailableHours.start,
            end: convertedData.unavailableHours.end || defaultUnavailableHours.end
          }
        : defaultUnavailableHours
    };
    
    return profileData;
  }
);

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (profile: Partial<Profile>) => {
    if (!auth.currentUser) throw new Error('No authenticated user');
    const docRef = doc(db, 'partnerWebApp', auth.currentUser.uid);
    
    // Convert back to Firestore Timestamp if needed
    const dataToSave = {
      ...profile,
      unavailableHours: profile.unavailableHours || defaultUnavailableHours,
      createdAt: profile.createdAt ? Timestamp.fromMillis(profile.createdAt) : Timestamp.now()
    };
    
    await setDoc(docRef, dataToSave, { merge: true });
    return profile;
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    resetProfile: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
        state.unavailableHours = action.payload.unavailableHours || defaultUnavailableHours;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch profile';
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
        if (action.payload.unavailableHours) {
          state.unavailableHours = action.payload.unavailableHours;
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update profile';
      });
  },
});

export const { resetProfile } = profileSlice.actions;
export default profileSlice.reducer;