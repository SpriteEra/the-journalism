import { combineReducers, configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage'
import { persistReducer, persistStore } from 'redux-persist';
import user from "./slices/user.slice";

const userPersistConfig = {
    key: 'user',
    storage,
    whitelist: ['user'],
};

const rootReducer = combineReducers({
    user: persistReducer(userPersistConfig, user),
});

const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export const persistor = persistStore(store);

export default store;
