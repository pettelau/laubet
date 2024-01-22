import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserDetails } from "../types";
import { RootState } from "./store";


type EnvDetails = {
    path: string;
}

// Initial User state, all values are empty initially
const initialState: EnvDetails = {
    path: "/"
    // path: "http://localhost:8000/"
  };
  
  // Redux User Slice
  export const envSlice = createSlice({
    name: "env",
    initialState,
    // Reducers for mutating the Redux State
    reducers: {
     
    },
  });
  
  
  // Get data from Redux state
  const selectPath = (state: RootState) => state.env.path;
  
  export { selectPath };
  
  export default envSlice.reducer;
  