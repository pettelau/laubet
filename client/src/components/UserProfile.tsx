import {
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Tab,
  Tabs,
} from "@mui/material";
import React, { useEffect } from "react";
import { selectPath } from "../redux/envSlice";
import { useAppSelector } from "../redux/hooks";
import { AccumBets, Accums, PublicUserData } from "../types";
import NoAccess from "./NoAccess";
//use useParams
import { useParams } from "react-router-dom";

function getAccumStatus(accum: Accums) {
  let hasWon: boolean = false;
  let hasLost: boolean = false;
  let hasOpen: boolean = false;
  accum.accumBets.forEach((bet: AccumBets) => {
    if (bet.option_status == 3) {
      hasLost = true;
      return;
    } else if (bet.option_status == 2) {
      hasWon = true;
    } else if (bet.option_status == 1) {
      hasOpen = true;
    }
  });
  if (hasLost) {
    return ["5px solid #a81a3f", 3];
  }
  if (hasOpen) {
    return ["white", 1];
  }
  if (hasWon) {
    return ["5px solid #388e3c", 2];
  } else {
    return ["white", 1];
  }
}

export default function UserProfile() {
  const params = useParams();
  const username = params.username;
  const [accums, setAccums] = React.useState<Accums[]>([]);
  const [publicUserData, setPublicUserData] =
    React.useState<PublicUserData[]>();

  const [responseCode, setResponseCode] = React.useState<number>();
  const [responseCodeUser, setResponseCodeUser] = React.useState<number>();
  const [responseText, setResponseText] = React.useState<number>();

  const fetchBets = async () => {
    const response = await fetch(
      `${url_path}api/useraccums?` +
        new URLSearchParams({ user: username ? username : "" }),
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
      }
    );
    const resp = await response.json();
    setResponseCode(response.status);
    if (response.ok) {
      setAccums(resp);
    } else {
      setResponseText(resp.detail);
    }
  };

  const fetchPublicUserData = async () => {
    const response = await fetch(
      `${url_path}api/publicuserdata?` +
        new URLSearchParams({ user: username ? username : "" }),
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
      }
    );
    const resp = await response.json();
    setResponseCodeUser(response.status);
    if (response.ok) {
      setPublicUserData(resp);
    } else {
      setResponseText(resp.detail);
    }
  };
  const url_path = useAppSelector(selectPath);

  const [chosenAccums, setChosenAccums] = React.useState<number>(0);

  const ACCUMCHOICES = [
    { label: "Alle kuponger", id: 0 },
    { label: "Levende", id: 1 },
    { label: "Avsluttede", id: 5 },
    { label: "Vunnede", id: 2 },
    { label: "Tapte", id: 3 },
  ];

  const MONTHS = [
    "jan",
    "feb",
    "mar",
    "apr",
    "mai",
    "jun",
    "jul",
    "aug",
    "sep",
    "okt",
    "nov",
    "des",
  ];

  useEffect(() => {
    fetchBets();
    fetchPublicUserData();
  }, []);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setChosenAccums(newValue);
  };

  if (responseCode == undefined) {
    return (
      <>
        <br />
        <br />
        <br />
        <CircularProgress />
      </>
    );
  }

  if (responseCode !== 200 || responseCodeUser !== 200) {
    return <NoAccess responseCode={responseCode} responseText={responseText} />;
  }
  if (publicUserData) {
    return (
      <>
        <h2>{username} sine kuponger</h2>
        Fornavn: {publicUserData[0].firstname} <br />
        Fornavn: {publicUserData[0].lastname} <br />
        Balanse: {publicUserData[0].balance} kr
        <br />
        Sist innlogget:{" "}
        {new Date(
          publicUserData[0].last_login ? publicUserData[0].last_login : ""
        ).getDate() +
          " " +
          MONTHS[
            new Date(
              publicUserData[0].last_login ? publicUserData[0].last_login : ""
            ).getMonth()
          ] +
          " " +
          new Date(
            publicUserData[0].last_login ? publicUserData[0].last_login : ""
          ).getFullYear() +
          " " +
          (
            "0" +
            new Date(
              publicUserData[0].last_login ? publicUserData[0].last_login : ""
            ).getHours()
          ).slice(-2) +
          ":" +
          (
            "0" +
            new Date(
              publicUserData[0].last_login ? publicUserData[0].last_login : ""
            ).getMinutes()
          ).slice(-2)}{" "}
        <br />
        <Tabs
          sx={{
            boxShadow: "3px 3px 5px 2px rgba(0,0,0,.1)",
            backgroundColor: "white",
            margin: 2,
          }}
          value={chosenAccums}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {ACCUMCHOICES.map((choice: any) => {
            return <Tab label={choice.label} value={choice.id} />;
          })}
        </Tabs>
        <div className="accums-flex-container">
          {accums.map((accum) => {
            let status: (string | number)[] = getAccumStatus(accum);
            if (
              chosenAccums == 0 ||
              chosenAccums == status[1] ||
              (chosenAccums == 5 && (status[1] == 2 || status[1] == 3))
            ) {
              return (
                <>
                  <div>
                    <Card
                      sx={{
                        border: status[0],
                        padding: 1,
                        width: 345,
                      }}
                    >
                      <p
                        style={{
                          marginTop: 1,
                          marginBottom: 1,
                          color: "#828385",
                        }}
                      >
                        <b>{"KupongID: " + accum.accum_id}</b> |{" "}
                        {new Date(accum.placed_timestamp).getDate() +
                          " " +
                          MONTHS[new Date(accum.placed_timestamp).getMonth()] +
                          " " +
                          new Date(accum.placed_timestamp).getFullYear() +
                          " " +
                          (
                            "0" + new Date(accum.placed_timestamp).getHours()
                          ).slice(-2) +
                          ":" +
                          (
                            "0" + new Date(accum.placed_timestamp).getMinutes()
                          ).slice(-2)}
                      </p>
                      {accum.accumBets.map((bet) => {
                        let border = "";
                        let status_color = "white";
                        let text_color = "black";
                        if (bet.option_status == 2) {
                          border = "2px solid #388e3c";
                          status_color = "#388e3c";
                          text_color = "white";
                        } else if (bet.option_status == 3) {
                          border = "2px solid #a81a3f";
                          status_color = "#a81a3f";
                          text_color = "white";
                        }
                        return (
                          <>
                            <Paper
                              sx={{
                                border: border,
                                padding: 1,
                                marginLeft: 2,
                                marginRight: 2,
                                marginTop: 1,
                                marginBottom: 2,
                              }}
                              elevation={3}
                            >
                              <b>{bet.title} </b>
                              <br />
                              <Chip
                                sx={{
                                  backgroundColor: status_color,
                                  color: text_color,
                                }}
                                label={bet.option + " - " + bet.user_odds}
                              ></Chip>

                              <br />
                            </Paper>
                          </>
                        );
                      })}
                      <Chip
                        sx={{
                          backgroundColor: "#303c6c",
                          color: "white",
                          marginRight: 1,
                        }}
                        label={"Innsats: " + accum.stake + "kr"}
                      ></Chip>
                      <Chip
                        sx={{ backgroundColor: "#303c6c", color: "white" }}
                        label={"Totalodds: " + accum.total_odds.toFixed(2)}
                      ></Chip>
                      <br />
                      <Chip
                        sx={{
                          marginTop: 1,
                          backgroundColor: "#303c6c",
                          color: "white",
                        }}
                        label={
                          "Mulig utbetaling: " +
                          (accum.stake * accum.total_odds).toFixed(2) +
                          " kr"
                        }
                      ></Chip>
                    </Card>
                  </div>
                </>
              );
            }
          })}
        </div>
      </>
    );
  } else {
    return <NoAccess responseCode={responseCode} responseText={responseText} />;
  }
}
