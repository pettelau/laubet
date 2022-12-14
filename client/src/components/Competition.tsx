import {
  Alert,
  AlertColor,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect } from "react";
import { selectPath } from "../redux/envSlice";
import { useAppSelector } from "../redux/hooks";
import { AccumBets, Accums, AlertT, CompetitionT } from "../types";
import NoAccess from "./NoAccess";
import Slider from "@mui/material/Slider";
import AlertComp from "./Alert";
import { selectUsername } from "../redux/userSlice";

export default function Competition() {
  const USERNAME = useAppSelector(selectUsername);
  const url_path = useAppSelector(selectPath);

  const [competition, setCompetition] = React.useState<CompetitionT[]>([]);
  const [statusUser, setStatusUser] = React.useState<number>();

  const [responseCode, setResponseCode] = React.useState<number>();
  const [responseText, setResponseText] = React.useState<number>();

  async function fetchCompetition() {
    const response = await fetch(`${url_path}api/competition`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
    });

    const resp = await response.json();
    console.log(statusUser);
    console.log(USERNAME);
    if (response.status == 200) {
      setCompetition(resp);
      resp.forEach((user: CompetitionT) => {
        if (user.username == USERNAME) {
          setStatusUser(user.registered);
        }
      });
    } else {
      setResponseText(resp.detail);
    }
    console.log(statusUser);

    setResponseCode(response.status);
  }

  async function updateComp(newStatus: number) {
    let payload = {
      registered: newStatus,
    };
    const response = await fetch(`${url_path}api/updatecompetition`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
      body: JSON.stringify(payload),
    });

    const resp = await response.json();
    if (response.ok) {
      setResponseCode(undefined);
      fetchCompetition();
      //toggleAlert(true, "Ordet ble sendt inn til ordboka!", "success");
    } else {
      toggleAlert(true, "Noe gikk galt", "error");
    }
  }

  //error toggle
  const [_alert, setAlert] = React.useState<boolean>(false);
  const [_alertType, setAlertType] = React.useState<AlertT>({
    type: "info",
    msg: "",
  });
  // Toggle error with message
  function toggleAlert(
    isActive: boolean,
    msg: string = "",
    type: AlertColor = "info"
  ) {
    setAlert(isActive);
    setAlertType({ type: type, msg: msg });
  }

  useEffect(() => {
    fetchCompetition();
  }, [USERNAME]);

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

  if (responseCode !== 200) {
    return <NoAccess responseCode={responseCode} responseText={responseText} />;
  }
  return (
    <>
      {/* Alert component to show error/success messages */}
      <AlertComp
        setAlert={setAlert}
        _alert={_alert}
        _alertType={_alertType}
        toggleAlert={toggleAlert}
      ></AlertComp>
      <h1>Betting-konkurranse!</h1>
      <div style={{ justifyContent: "center", display: "flex" }}>
        <Card sx={{ width: 400 }}>
          <h3>P??melding:</h3>
          <p>
            {statusUser == 3 || statusUser == undefined
              ? "Du er verken p??meldt eller avmeldt"
              : statusUser == 1
              ? "Du er p??meldt til konkurransen"
              : statusUser == 2
              ? "Du er avmeldt fra konkurransen"
              : ""}
          </p>
          <div className="competition-flex-container">
            <div>
              <Chip
                onClick={() => {
                  updateComp(1);
                }}
                label="???"
                variant="outlined"
                sx={{
                  borderColor: statusUser == 1 ? "#2ed100" : "",
                  backgroundColor: statusUser == 1 ? "#adff96" : "",
                }}
              />
            </div>
            <div>
              <Chip
                onClick={() => {
                  updateComp(2);
                }}
                label="???"
                variant="outlined"
                sx={{
                  borderColor: statusUser == 2 ? "#ff6952" : "",
                  backgroundColor: statusUser == 2 ? "#ff8080" : "",
                }}
              />
            </div>
            <div>
              <Chip
                onClick={() => {
                  updateComp(3);
                }}
                label="???"
                variant="outlined"
                sx={{
                  borderColor: statusUser == 3 ? "#7a7a7a" : "",
                  backgroundColor: statusUser == 3 ? "#cccccc" : "",
                }}
              />
            </div>
          </div>
          <br />
          <h3>??? P??meldte:</h3>
          {competition.map((user) => {
            if (user.registered == 1) {
              return (
                <>
                  {user.username} <br />
                </>
              );
            }
          })}
          <h3>??? Avmeldte:</h3>
          {competition.map((user) => {
            if (user.registered == 2) {
              return (
                <>
                  {user.username} <br />
                </>
              );
            }
          })}
          <h3>??? Ikke svart enda:</h3>
          {competition.map((user) => {
            if (user.registered == 3 || user.registered == undefined) {
              return (
                <>
                  {user.username} <br />
                </>
              );
            }
          })}
          <br />
        </Card>
      </div>
      <br />
      <div style={{ maxWidth: 800, margin: "auto", marginBottom: 60 }}>
        <h1>Hvordan vinne:</h1>
        Personen som har mest LauCoins inne p?? Laubet den 15. juni 2023 vinner
        konkurransen.
        <h1>Premie:</h1>
        Vinneren f??r en helaften p?? byen (middag, alt av drikke) p??spandert av
        de andre deltakerne av konkurransen! Hvilken by m?? vi komme tilbake til
        n??r det n??rmer seg.
        <h1>Regler:</h1>
        LauBet ??nsker en ganske h??y takh??yde n??r det kommer til inside info,
        kampfiksing osv, men vi m?? ha noen regler. Det er{" "}
        <b>
          <i>ikke</i>
        </b>{" "}
        lov ?? bette p?? et spill man helt enkelt kan styre utfallet av selv, for
        egen vinning. <br /> <br />
        Det er derimot lov ?? bette p?? seg selv i mange tilfeller hvor man better
        p?? et utfall man m?? jobbe for ?? f?? til, og noe man ogs?? selv
        sannsynligvis ??nsker ?? oppn??. <br />
        <br />
        <h3>Eksempel p?? noe som er lov:</h3>
        <div>
          <ul className="CompList">
            <li>
              Mats spiller p?? at han selv skal vinne et slag i bondebridge
            </li>
            <li>
              Somdal spiller p?? at han selv skal f?? seg noe en l??rdag i Bergen
            </li>
            <li>
              Simen spiller p?? at sitt eget lag skal komme topp 4 i Ribbecupen
            </li>
          </ul>
        </div>
        <h3>Eksempel p?? noe som ikke er lov:</h3>
        <div>
          <ul className="CompList">
            <li>
              Lau spiller p?? at han selv skal bruke over eller under 300 kr p??
              byen 2. juledag
            </li>
            <li>
              Thom spiller p?? at Halvor skal vinne bondebridge som han selv er
              med i. (For ??vrig et sv??rt usannsynlig eksempel)
            </li>
          </ul>
          <br />
          <div
            style={{
              maxWidth: 500,
              display: "grid",
              margin: "auto",
              textAlign: "center",
            }}
          >
            <Alert severity="info">
              Kom gjerne med innspill hvis det er noe som m?? tydeliggj??res!
            </Alert>
          </div>
        </div>
      </div>
    </>
  );
}
