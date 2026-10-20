import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        getUser: (state) => {
            state.loading = true;
        },
        getUserSuccess: (state, action) => {
            state.user = action.payload.user;
            state.isVerify = true;
            state.error = null;
            state.loading = false;
        },
        userLogOut: (state) => {
            state.user = null;
            state.isVerify = false;
            state.error = null;
            state.loading = false;
        },
        getUserFail: (state, action) => {
            state.error = action.payload;
            state.loading = false;
            state.isVerify = false;
            state.user = null;
        }
    }
})

export const { getUser, getUserSuccess, getUserFail, userLogOut } = userSlice.actions

export default userSlice.reducer;