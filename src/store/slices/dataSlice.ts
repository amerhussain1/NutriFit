import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  AppStateSnapshot,
  DailyTargets,
  FoodItem,
  FoodLog,
  MealPlan,
  Profile,
  ReplacementRequest,
  UserBudget,
  UserGoal,
  UserPreferences,
} from '../../types';
import * as api from '../../services/data/api';
import type { RootState } from '../index';

interface DataState extends AppStateSnapshot {
  foods: FoodItem[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  busy: boolean;
  demo: boolean;
  initialized: boolean;
}

const initialState: DataState = {
  profile: null,
  goal: null,
  preferences: null,
  budget: null,
  plan: null,
  foodLogs: [],
  weightLogs: [],
  waterLogs: [],
  favorites: [],
  groceryList: null,
  foods: [],
  status: 'idle',
  error: null,
  busy: false,
  demo: false,
  initialized: false,
};

export const loadUserData = createAsyncThunk(
  'data/load',
  async (userId: string, { rejectWithValue }) => {
    try {
      const snapshot = await api.fetchSnapshot(userId);
      const foods = snapshot.profile
        ? await api.fetchFoods(snapshot.profile)
        : [];
      return { snapshot, foods, demo: userId === 'demo-user' };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const saveProfileData = createAsyncThunk(
  'data/saveProfile',
  async (params: { userId: string; profile: Profile }, { rejectWithValue }) => {
    try {
      await api.saveProfile(params.userId, params.profile);
      return params.profile;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const saveGoalData = createAsyncThunk(
  'data/saveGoal',
  async (params: { userId: string; goal: UserGoal }, { rejectWithValue }) => {
    try {
      await api.saveGoal(params.userId, params.goal);
      return params.goal;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const savePreferencesData = createAsyncThunk(
  'data/savePreferences',
  async (
    params: { userId: string; preferences: UserPreferences },
    { rejectWithValue },
  ) => {
    try {
      await api.savePreferences(params.userId, params.preferences);
      return params.preferences;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const saveBudgetData = createAsyncThunk(
  'data/saveBudget',
  async (params: { userId: string; budget: UserBudget }, { rejectWithValue }) => {
    try {
      await api.saveBudget(params.userId, params.budget);
      return params.budget;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const createPlan = createAsyncThunk(
  'data/createPlan',
  async (
    params: {
      userId: string;
      profile: Profile;
      goal: UserGoal;
      preferences: UserPreferences;
      budget: UserBudget;
      targets: DailyTargets;
      foods: FoodItem[];
    },
    { rejectWithValue },
  ) => {
    try {
      return await api.generatePlan(params.userId, params);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const replacePlanMeal = createAsyncThunk(
  'data/replaceMeal',
  async (
    params: {
      userId: string;
      plan: MealPlan;
      itemId: string;
      reason: ReplacementRequest['reason'];
      foodItemId?: string;
    },
    { getState, rejectWithValue },
  ) => {
    try {
      const { data } = getState() as RootState;
      return await api.replaceMeal(
        params.userId,
        params.plan,
        params.itemId,
        params.reason,
        data.foods,
        params.foodItemId,
      );
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const markMealCompleted = createAsyncThunk(
  'data/markMeal',
  async (
    params: { userId: string; plan: MealPlan; itemId: string; completed: boolean },
    { rejectWithValue },
  ) => {
    try {
      return await api.setMealCompleted(
        params.userId,
        params.plan,
        params.itemId,
        params.completed,
      );
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const addFoodLog = createAsyncThunk(
  'data/addFoodLog',
  async (params: { userId: string; log: Omit<FoodLog, 'id'> }, { rejectWithValue }) => {
    try {
      return await api.addFoodLog(params.userId, params.log);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const updateFoodLog = createAsyncThunk(
  'data/updateFoodLog',
  async (params: { userId: string; log: FoodLog }, { rejectWithValue }) => {
    try {
      return await api.updateFoodLog(params.userId, params.log);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const removeFoodLog = createAsyncThunk(
  'data/removeFoodLog',
  async (params: { userId: string; id: string }, { rejectWithValue }) => {
    try {
      await api.deleteFoodLog(params.userId, params.id);
      return params.id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const addWater = createAsyncThunk(
  'data/addWater',
  async (params: { userId: string; quantityMl: number }, { rejectWithValue }) => {
    try {
      return await api.addWater(params.userId, params.quantityMl);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const removeWater = createAsyncThunk(
  'data/removeWater',
  async (params: { userId: string }, { rejectWithValue }) => {
    try {
      await api.removeLastWater(params.userId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const addWeight = createAsyncThunk(
  'data/addWeight',
  async (params: { userId: string; weightKg: number; notes?: string }, { rejectWithValue }) => {
    try {
      return await api.addWeight(params.userId, params.weightKg, params.notes);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const toggleFavorite = createAsyncThunk(
  'data/toggleFavorite',
  async (
    params: {
      userId: string;
      foodItemId?: string;
      mealPlanItemId?: string;
      name: string;
      calories?: number;
    },
    { getState, rejectWithValue },
  ) => {
    try {
      await api.toggleFavorite(params.userId, params);
      const state = getState() as RootState;
      const existing = state.data.favorites.find(
        f =>
          (params.foodItemId && f.foodItemId === params.foodItemId) ||
          (params.mealPlanItemId && f.mealPlanItemId === params.mealPlanItemId),
      );
      return existing
        ? { removed: existing.id }
        : {
            added: {
              id: `fav-${Date.now()}`,
              ...params,
              createdAt: new Date().toISOString(),
            },
          };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const createGroceryList = createAsyncThunk(
  'data/createGrocery',
  async (params: { userId: string; plan: MealPlan; foods: FoodItem[] }, { rejectWithValue }) => {
    try {
      return await api.generateGroceryList(params.userId, params.plan, params.foods);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const markGroceryPurchased = createAsyncThunk(
  'data/markGrocery',
  async (
    params: { userId: string; list: NonNullable<DataState['groceryList']>; itemId: string; purchased: boolean },
    { rejectWithValue },
  ) => {
    try {
      return await api.setGroceryItemPurchased(
        params.userId,
        params.list,
        params.itemId,
        params.purchased,
      );
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    resetData() {
      return { ...initialState };
    },
    setDemo(state, action: PayloadAction<boolean>) {
      state.demo = action.payload;
    },
    setFoods(state, action: PayloadAction<FoodItem[]>) {
      state.foods = action.payload;
    },
    clearDataError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadUserData.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadUserData.fulfilled, (state, action) => {
        Object.assign(state, action.payload.snapshot);
        state.foods = action.payload.foods;
        state.demo = action.payload.demo;
        state.status = 'ready';
        state.initialized = true;
      })
      .addCase(loadUserData.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) ?? 'errors.unknown';
        state.initialized = true;
      })
      .addCase(saveProfileData.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(saveGoalData.fulfilled, (state, action) => {
        state.goal = action.payload;
      })
      .addCase(savePreferencesData.fulfilled, (state, action) => {
        state.preferences = action.payload;
      })
      .addCase(saveBudgetData.fulfilled, (state, action) => {
        state.budget = action.payload;
      })
      .addCase(createPlan.pending, state => {
        state.busy = true;
        state.error = null;
      })
      .addCase(createPlan.fulfilled, (state, action) => {
        state.plan = action.payload;
        state.busy = false;
      })
      .addCase(createPlan.rejected, (state, action) => {
        state.busy = false;
        state.error = (action.payload as string) ?? 'errors.unknown';
      })
      .addCase(replacePlanMeal.pending, state => {
        state.busy = true;
      })
      .addCase(replacePlanMeal.fulfilled, (state, action) => {
        state.plan = action.payload;
        state.busy = false;
      })
      .addCase(replacePlanMeal.rejected, (state, action) => {
        state.busy = false;
        state.error = (action.payload as string) ?? 'errors.unknown';
      })
      .addCase(markMealCompleted.fulfilled, (state, action) => {
        state.plan = action.payload;
      })
      .addCase(addFoodLog.fulfilled, (state, action) => {
        state.foodLogs = [action.payload, ...state.foodLogs];
      })
      .addCase(updateFoodLog.fulfilled, (state, action) => {
        state.foodLogs = state.foodLogs.map(log =>
          log.id === action.payload.id ? action.payload : log,
        );
      })
      .addCase(removeFoodLog.fulfilled, (state, action) => {
        state.foodLogs = state.foodLogs.filter(log => log.id !== action.payload);
      })
      .addCase(addWater.fulfilled, (state, action) => {
        state.waterLogs = [action.payload, ...state.waterLogs];
      })
      .addCase(removeWater.fulfilled, state => {
        state.waterLogs = state.waterLogs.slice(1);
      })
      .addCase(addWeight.fulfilled, (state, action) => {
        state.weightLogs = [...state.weightLogs, action.payload];
        if (state.profile) {
          state.profile.weightKg = action.payload.weightKg;
        }
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        if (action.payload.removed) {
          state.favorites = state.favorites.filter(f => f.id !== action.payload.removed);
        } else if (action.payload.added) {
          state.favorites = [action.payload.added, ...state.favorites];
        }
      })
      .addCase(createGroceryList.fulfilled, (state, action) => {
        state.groceryList = action.payload;
      })
      .addCase(markGroceryPurchased.fulfilled, (state, action) => {
        state.groceryList = action.payload;
      });
  },
});

export const { resetData, setDemo, setFoods, clearDataError } = dataSlice.actions;
export default dataSlice.reducer;
