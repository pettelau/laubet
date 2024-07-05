import React from "react";
import "./App.css";
// import { HashRouter as Router, Routes, Route } from "react-router-dom";

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Home from "./components/Home";
// import Login from "./components/Login";
import NavBar from "./components/Nav";
// import UserReg from "./components/UserReg";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { useEffect } from "react";
import { setUserDetails, setUsername } from "./redux/userSlice";
import BettingHome from "./components/Betting/BettingHome";
import MyAccums from "./components/Betting/MyAccums";
import Accumulator from "./components/Betting/Accumulator";
import Login from "./components/Login";
import UserReg from "./components/UserReg";
import AppAppBar from "./components/AppAppBar";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { selectPath } from "./redux/envSlice";
import AdminHome from "./components/Admin/AdminHome";
import NewBet from "./components/Admin/NewBet";
import EditBet from "./components/Admin/EditBet";
import RequestBet from "./components/Betting/RequestBet";
import Leaderboard from "./components/Betting/Leaderboard";
import Dictionary from "./components/Dictionary";
import BetFeed from "./components/Betting/BetFeed";
import UserProfile from "./components/UserProfile";
import Competition from "./components/Competition";
import BondeBridge from "./components/BondeBridge/BondeBridge";
import BondeBridgeHome from "./components/BondeBridge/BondeBridgeHome";

const THEME = createTheme({
  typography: {
    fontFamily: `'Quicksand', sans-serif`,
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: "#303c6c",
          color: "white",
        },
        outlined: {
          borderColor: "#303c6c",
          border: "2px solid",
          color: "#303c6c",
        },
      },
    },
  },
});

export default function App() {
  const url_path = "/";
  // const url_path = "http://localhost:8000/";

  async function loginDetails() {
    const response = await fetch(`${url_path}api/login/details`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
    });
    const resp = await response.json();
    // dispatch(setUsername(user.toLowerCase()));
    store.dispatch(setUserDetails(resp[0]));
  }

  useEffect(() => {
    if (localStorage.getItem("jwt") !== "") {
      loginDetails();
    }
  }, []);
  return (
    <ThemeProvider theme={THEME}>
      <CssBaseline />
      <Provider store={store}>
        <div className="App">
          <BrowserRouter>
            <AppAppBar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="bettinghome" element={<BettingHome />} />
              <Route path="myaccums" element={<MyAccums />} />
              <Route path="login" element={<Login />} />
              <Route path="userReg" element={<UserReg />} />
              <Route path="requestbet" element={<RequestBet />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="dictionary" element={<Dictionary />} />
              <Route path="betfeed" element={<BetFeed />} />
              <Route path="competition" element={<Competition />} />
              <Route path="bondebridge/:game_id" element={<BondeBridge />} />
              <Route path="bondebridge" element={<BondeBridgeHome />} />
              <Route path="user/:username" element={<UserProfile />} />
              <Route path="admin" element={<AdminHome />} />
              <Route path="admin/newbet" element={<NewBet />} />
              <Route path="admin/editbet" element={<EditBet />} />
            </Routes>
          </BrowserRouter>
          <Accumulator />
        </div>
      </Provider>
    </ThemeProvider>
  );
}
