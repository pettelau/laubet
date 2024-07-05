import React, { useEffect } from "react";
import { AlertColor, Button, TextField } from "@mui/material";
import { useAppSelector } from "../../redux/hooks";
import { selectPath } from "../../redux/envSlice";
import { selectAdmin } from "../../redux/userSlice";
import { useNavigate } from "react-router-dom";
import NoAccess from "../NoAccess";
import { AlertT, NewBetType, NewOptionType } from "../../types";
import { SendToMobileTwoTone } from "@mui/icons-material";
import AlertComp from "../Alert";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

export default function NewBet() {
  const url_path = useAppSelector(selectPath);

  const isAdmin = useAppSelector(selectAdmin);

  const [responseCode, setResponseCode] = React.useState<number>();
  const [responseText, setResponseText] = React.useState<number>();

  const [title, setTitle] = React.useState<string>("");
  const [category, setCategory] = React.useState<string>("");
  const [closeDate, setCloseDate] = React.useState<Dayjs | null>(dayjs());

  const [options, setOptions] = React.useState<NewOptionType[]>([
    { option: "", latest_odds: null },
  ]);

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

  async function sendBet() {
    if (closeDate == null) {
      toggleAlert(true, "Must include close date", "error");
    } else {
      let bet_packet: any = {
        title: title,
        category: category,
        close_date: closeDate,
        options: options,
      };
      const response = await fetch(`${url_path}api/admin/createbet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify(bet_packet),
      });

      const resp = await response.json();
      if (resp["createBet"]) {
        toggleAlert(true, "Bettet ble opprettet!", "success");
        setOptions([{ option: "", latest_odds: null }]);
        setTitle("");
        setCategory("");
      } else {
        toggleAlert(true, resp["errorMsg"], "error");
      }
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

  return (
    <>
      {/* Alert component to show error/success messages */}
      <AlertComp
        setAlert={setAlert}
        _alert={_alert}
        _alertType={_alertType}
        toggleAlert={toggleAlert}
      ></AlertComp>
      <h2>Add nytt bet</h2>
      {isAdmin ? (
        <>
          <TextField
            sx={{ width: 400 }}
            label="Bet"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <br />
          <TextField
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
          <h3>Options:</h3>
          {options.map((option: NewOptionType, index: number) => {
            return (
              <>
                <TextField
                  label="Bet option"
                  value={option.option}
                  onChange={(e) => updateOption(e.target.value, index)}
                />
                <TextField
                  type={"number"}
                  label="Odds"
                  value={option.latest_odds}
                  onChange={(e) => updateOdds(e.target.value, index)}
                />
                <Button
                  onClick={() => {
                    removeOption(index);
                  }}
                  color="error"
                  variant="contained"
                >
                  X
                </Button>
                <br />
                <br />
              </>
            );
          })}
          <br />
          <Button
            variant="outlined"
            onClick={() => {
              setOptions([...options, { option: "", latest_odds: null }]);
            }}
          >
            Legg til option
          </Button>{" "}
          <br />
          <br />
          <div>
            Tilbakebetalingsprosent:{" "}
            {((totalodds / options.length / options.length) * 100).toFixed(1)}%
          </div>
          <br />
          <Button
            variant="outlined"
            onClick={() => {
              sendBet();
            }}
          >
            Send Bet
          </Button>
        </>
      ) : (
        <div>Du er dessverre ikke admin... Spør Lau om du kan bli?</div>
      )}
    </>
  );
}
