import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserDetails } from "../types";
import { RootState } from "./store";

// Initial User state, all values are empty initially
const initialState: UserDetails = {
  username: "",
  balance: 0,
  firstname: "",
  lastname: "",
  admin: false,
  created_on: new Date(),
};

// Redux User Slice
export const userSlice = createSlice({
  name: "user",
  initialState,
  // Reducers for mutating the Redux State
  reducers: {
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
    },
    setBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    logOut: (state) => {
      state.username = "";
      state.balance = 0;
    },
    setUserDetails: (state, action: PayloadAction<UserDetails>) => {
      state.firstname = action.payload.firstname;
      state.username = action.payload.username;
      state.lastname = action.payload.lastname;
      state.balance = action.payload.balance;
      state.admin = action.payload.admin;
      state.created_on = action.payload.created_on;
    },
  },
});

export const { setUsername, logOut, setUserDetails, setBalance } =
  userSlice.actions;

// Get data from Redux state
const selectUsername = (state: RootState) => state.user.username;
const selectBalance = (state: RootState) => state.user.balance;
const selectFirstname = (state: RootState) => state.user.firstname;
const selectLastname = (state: RootState) => state.user.lastname;
const selectAdmin = (state: RootState) => state.user.admin;
const selectCreatedOn = (state: RootState) => state.user.created_on;
const selectUserState = (state: RootState) => state.user;

export {
  selectUsername,
  selectBalance,
  selectFirstname,
  selectLastname,
  selectAdmin,
  selectCreatedOn,
  selectUserState,
};

export default userSlice.reducer;
