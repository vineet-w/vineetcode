import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

interface UnavailableHours {
  start: string;
  end: string;
}

interface Profile {
  username: string;
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
}

const defaultUnavailableHours: UnavailableHours = {
  start: '00:00',
  end: '06:00'
};

const initialState: Profile = {
  username: '',
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

export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async () => {
    if (!auth.currentUser) throw new Error('No authenticated user');
    const docRef = doc(db, 'partnerWebApp', auth.currentUser.uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Profile not found');
    const data = docSnap.data();
    
    // Ensure unavailableHours has proper structure when fetched
    const profileData: Profile = {
      ...initialState,
      ...data,
      unavailableHours: data.unavailableHours 
        ? { 
            start: data.unavailableHours.start || defaultUnavailableHours.start,
            end: data.unavailableHours.end || defaultUnavailableHours.end
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
    
    // Prepare the data to be saved
    const profileData = {
      ...profile,
      // Ensure unavailableHours is properly structured
      unavailableHours: profile.unavailableHours || defaultUnavailableHours
    };
    
    await setDoc(docRef, profileData, { merge: true });
    return profileData;
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
        // Ensure unavailableHours is set properly
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
        // Ensure unavailableHours is updated
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