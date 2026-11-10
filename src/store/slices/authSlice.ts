import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { SessionInfo } from '../../types';
import * as authService from '../../services/auth/authService';

interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  session: SessionInfo | null;
  error: string | null;
  pending: boolean;
  needsEmailConfirmation: boolean;
}

const initialState: AuthState = {
  status: 'loading',
  session: null,
  error: null,
  pending: false,
  needsEmailConfirmation: false,
};

export const initializeAuth = createAsyncThunk('auth/initialize', async () => {
  return authService.getSession();
});

export const loginWithEmail = createAsyncThunk(
  'auth/login',
  async (params: { email: string; password: string }, { rejectWithValue }) => {
    try {
      return await authService.signInWithEmail(params.email, params.password);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const registerWithEmail = createAsyncThunk(
  'auth/register',
  async (
    params: { email: string; password: string; fullName: string },
    { rejectWithValue },
  ) => {
    try {
      return await authService.signUpWithEmail(params);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const loginWithGoogle = createAsyncThunk(
  'auth/google',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.signInWithGoogle();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const loginDemo = createAsyncThunk('auth/demo', async (_, { rejectWithValue }) => {
  try {
    return await authService.signInDemo();
  } catch (error) {
    return rejectWithValue((error as Error).message);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.signOut();
});

export const deleteAccount = createAsyncThunk(
  'auth/deleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      await authService.deleteAccount();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
      state.needsEmailConfirmation = false;
    },
    setSession(state, action: { payload: SessionInfo | null; type: string }) {
      state.session = action.payload;
      state.status = action.payload ? 'authenticated' : 'unauthenticated';
    },
  },
  extraReducers: builder => {
    const pending = (state: AuthState) => {
      state.pending = true;
      state.error = null;
    };
    const rejected = (state: AuthState, action: { payload?: unknown }) => {
      state.pending = false;
      state.error = (action.payload as string) ?? 'errors.unknown';
    };
    builder
      .addCase(initializeAuth.pending, state => {
        state.status = 'loading';
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.session = action.payload;
        state.status = action.payload ? 'authenticated' : 'unauthenticated';
      })
      .addCase(initializeAuth.rejected, state => {
        state.status = 'unauthenticated';
      })
      .addCase(loginWithEmail.pending, pending)
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.pending = false;
        state.session = action.payload;
        state.status = 'authenticated';
      })
      .addCase(loginWithEmail.rejected, rejected)
      .addCase(registerWithEmail.pending, pending)
      .addCase(registerWithEmail.fulfilled, (state, action) => {
        state.pending = false;
        if (action.payload.session) {
          state.session = action.payload.session;
          state.status = 'authenticated';
        } else {
          state.needsEmailConfirmation = action.payload.needsEmailConfirmation;
        }
      })
      .addCase(registerWithEmail.rejected, rejected)
      .addCase(loginWithGoogle.pending, pending)
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.pending = false;
        state.session = action.payload;
        state.status = 'authenticated';
      })
      .addCase(loginWithGoogle.rejected, rejected)
      .addCase(loginDemo.pending, pending)
      .addCase(loginDemo.fulfilled, (state, action) => {
        state.pending = false;
        state.session = action.payload;
        state.status = 'authenticated';
      })
      .addCase(loginDemo.rejected, rejected)
      .addCase(logout.fulfilled, state => {
        state.session = null;
        state.status = 'unauthenticated';
        state.pending = false;
      })
      .addCase(deleteAccount.fulfilled, state => {
        state.session = null;
        state.status = 'unauthenticated';
        state.pending = false;
      })
      .addCase(deleteAccount.rejected, rejected);
  },
});

export const { clearAuthError, setSession } = authSlice.actions;
export default authSlice.reducer;
