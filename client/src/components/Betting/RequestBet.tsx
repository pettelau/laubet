import React, { useEffect } from "react";
import {
  AlertColor,
  Button,
  Card,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
} from "@mui/material";
import { useAppSelector } from "../../redux/hooks";
import { selectPath } from "../../redux/envSlice";
import { selectAdmin } from "../../redux/userSlice";
import { useNavigate } from "react-router-dom";
import NoAccess from "../NoAccess";
import { AlertT, Bet, BetOption, NewBetType, NewOptionType } from "../../types";
import AlertComp from "../Alert";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { flexbox } from "@mui/system";

export default function RequestBet() {
  const url_path = useAppSelector(selectPath);

  const [responseCode, setResponseCode] = React.useState<number>();
  const [responseText, setResponseText] = React.useState<number>();

  const [title, setTitle] = React.useState<string>("");
  const [category, setCategory] = React.useState<string>("");
  const [closeDate, setCloseDate] = React.useState<Dayjs | null>(
    dayjs().add(7, "day")
  );

  const [options, setOptions] = React.useState<NewOptionType[]>([
    { option: "", latest_odds: null },
  ]);

  const [bets, setBets] = React.useState<Bet[]>([]);

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

  const navigate = useNavigate();

  function updateOption(value: string, index: number) {
    let optionsCopy = [...options];
    optionsCopy[index].option = value;
    setOptions(optionsCopy);
  }

  function updateOdds(value: string, index: number) {
    let optionsCopy = [...options];
    if (value) {
      optionsCopy[index].latest_odds = Number(value);
    } else {
      optionsCopy[index].latest_odds = null;
    }
    setOptions(optionsCopy);
  }

  async function fetchExistingReqs() {
    const response = await fetch(`${url_path}api/requestedbets`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
    });
    const resp = await response.json();
    setResponseCode(response.status);
    if (response.status == 200) {
      setBets(resp);
    } else {
      setResponseText(resp.detail);
    }
  }

  const MONTHS = [
    "januar",
    "februar",
    "mars",
    "april",
    "mai",
    "juni",
    "juli",
    "august",
    "september",
    "oktober",
    "november",
    "desember",
  ];
  useEffect(() => {
    fetchExistingReqs();
  }, []);

  async function sendRequest() {
    if (closeDate == null) {
      toggleAlert(
        true,
        "Du må legge inn en forventet stengetid for bettet. Bare sett denne langt fram i tid om du ikke vet",
        "error"
      );
      return;
    }
    if (options.length == 0) {
      toggleAlert(true, "Du må ha minst ett spillalternativ", "error");
      return;
    }
    if (category == "") {
      toggleAlert(true, "Du må skrive enn kategori for spillet", "error");
      return;
    }
    if (title == "") {
      toggleAlert(true, "Du må skrive inn selve bettet", "error");
      return;
    }
    let bet_packet: any = {
      title: title,
      category: category,
      close_date: closeDate,
      options: options,
    };
    const response = await fetch(`${url_path}api/requestbet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
      body: JSON.stringify(bet_packet),
    });

    const resp = await response.json();
    if (response.ok) {
      fetchExistingReqs();
      toggleAlert(true, "Bettet ble requestet!", "success");
      setOptions([]);
      setTitle("");
      setCategory("");
    } else {
      toggleAlert(true, resp["errorMsg"], "error");
    }
  }
  let totalodds = 0;
  options.forEach((option) => {
    if (typeof option.latest_odds === "number") {
      totalodds += option.latest_odds;
    }
  });

  function removeOption(index: number) {
    let optionsCopy = [...options];
    optionsCopy.splice(index, 1);
    setOptions(optionsCopy);
  }

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
      <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
        <Card sx={{ width: 400 }}>
          <h2>Request-a-bet</h2>
          <TextField
            sx={{ width: 370 }}
            multiline
            label="Bet"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <br />
          <TextField
            sx={{ width: 370 }}
            label="Kateogri"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <br />
          <br />
          <h3>Forventet tidspunkt for spillstopp:</h3>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              value={closeDate}
              onChange={(newValue) => setCloseDate(newValue)}
              ampm={false}
            />
          </LocalizationProvider>
          <br />
          <br />
          <h3>Spillalternativer:</h3>
          {options.map((option: NewOptionType, index: number) => {
            return (
              <>
                <div>
                  <TextField
                    label="Bet option"
                    value={option.option}
                    onChange={(e) => updateOption(e.target.value, index)}
                  />
                  <TextField
                    sx={{ width: 100 }}
                    type={"number"}
                    label="Odds"
                    value={option.latest_odds}
                    onChange={(e) => updateOdds(e.target.value, index)}
                  />

                  <IconButton
                    onClick={() => {
                      removeOption(index);
                    }}
                  >
                    <DeleteForeverIcon sx={{ fontSize: 40 }} />
                  </IconButton>
                  <br />
                  <br />
                </div>
              </>
            );
          })}
          <Button
            variant="outlined"
            onClick={() => {
              setOptions([...options, { option: "", latest_odds: null }]);
            }}
          >
            Legg til alternativ
          </Button>{" "}
          <br />
          <br />
          {/* <div>
        Tilbakebetalingsprosent:{" "}
        {((totalodds / options.length - 1) * 100).toFixed(1)}%
      </div>
      <br /> */}
          <Button
            variant="contained"
            onClick={() => {
              sendRequest();
            }}
          >
            Send Bet
          </Button>
          <br />
          <br />
        </Card>
      </div>

      <Divider />
      <br />
      {bets.length > 0 ? (
        <>
          <h3>Venter på godkjenning fra Lau:</h3>
          <div className="bet-flex-container">
            {bets.map((bet: Bet) => {
              return (
                <>
                  <div>
                    <Card sx={{ padding: 2 }}>
                      <>
                        {bet.title} <br />
                        😈 Innsendt av: <b>{bet.submitter}</b> 😈 <br />
                        {bet.bet_options.map((option: BetOption) => {
                          return (
                            <>
                              <Button
                                disabled={true}
                                variant={"contained"}
                                sx={{
                                  m: 1,
                                  mt: 1,
                                }}
                              >
                                {option.option} - {option.latest_odds}
                              </Button>
                            </>
                          );
                        })}
                      </>
                    </Card>
                  </div>
                </>
              );
            })}
          </div>
        </>
      ) : (
        ""
      )}
    </>
  );
}
