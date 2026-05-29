import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reducer } from 'redux';
import { persistReducer, PersistConfig } from 'redux-persist';

import { ApplicationState } from 'app/state';

export const createPersistReducer = (
  reducer: Reducer<any, any>,
  config: Omit<PersistConfig<ApplicationState>, 'storage'>,
) => persistReducer({ ...config, storage: AsyncStorage }, reducer);
