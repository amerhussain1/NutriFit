import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppStateSnapshot, AuthUser } from '../../types';

const STATE_KEY = 'nutrifit.local.state.v1';
const DEMO_USER_KEY = 'nutrifit.local.demo-user.v1';

export interface LocalState extends AppStateSnapshot {
  demoUser: AuthUser | null;
}

export const emptyLocalState: LocalState = {
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
  demoUser: null,
};

let memoryState: LocalState = { ...emptyLocalState };

export async function loadLocalState(): Promise<LocalState> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (!raw) {
      return { ...memoryState };
    }
    const parsed = JSON.parse(raw) as Partial<LocalState>;
    memoryState = {
      ...emptyLocalState,
      ...parsed,
      foodLogs: parsed.foodLogs ?? [],
      weightLogs: parsed.weightLogs ?? [],
      waterLogs: parsed.waterLogs ?? [],
      favorites: parsed.favorites ?? [],
    };
    return { ...memoryState };
  } catch {
    return { ...memoryState };
  }
}

export async function saveLocalState(state: LocalState): Promise<void> {
  memoryState = state;
  await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export async function updateLocalState(
  updater: (state: LocalState) => LocalState,
): Promise<LocalState> {
  const current = await loadLocalState();
  const next = updater(current);
  await saveLocalState(next);
  return next;
}

export async function setDemoUser(user: AuthUser | null): Promise<void> {
  await AsyncStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  await updateLocalState(state => ({ ...state, demoUser: user }));
}

export async function getDemoUser(): Promise<AuthUser | null> {
  try {
    const raw = await AsyncStorage.getItem(DEMO_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export async function clearLocalData(): Promise<void> {
  await AsyncStorage.removeMany([STATE_KEY, DEMO_USER_KEY]);
  memoryState = { ...emptyLocalState };
}

export function localUserId(): string {
  return memoryState.demoUser?.id ?? 'demo-user';
}
