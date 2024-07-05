import {
  AlertColor,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  InputLabel,
  Modal,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef } from "react";
import { selectPath } from "../redux/envSlice";
import { useAppSelector } from "../redux/hooks";
import { AccumBets, Accums, AlertT, DictionaryT } from "../types";
import NoAccess from "./NoAccess";
import Slider from "@mui/material/Slider";
import AlertComp from "./Alert";
import { selectAdmin, selectUsername } from "../redux/userSlice";

import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Popover from "@mui/material/Popover";
import SentimentVerySatisfiedIcon from "@mui/icons-material/SentimentVerySatisfied";
import SentimentSatisfiedIcon from "@mui/icons-material/SentimentSatisfied";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";

const SORT_FILTERS = [
  "Nyeste",
  "Eldste",
  "Hyppighet synkende",
  "Hyppighet stigende",
];

export default function Dictionary() {
  const USERNAME = useAppSelector(selectUsername);
  const isAdmin = useAppSelector(selectAdmin);

  const url_path = useAppSelector(selectPath);

  const [dictionary, setDictionary] = React.useState<DictionaryT[]>([]);

  const [responseCode, setResponseCode] = React.useState<number>();
  const [responseText, setResponseText] = React.useState<number>();

  const [persons, setPersons] = React.useState<string[]>([]);
  const [chosenPerson, setChosenPerson] =
    React.useState<string>("Alle bidragsytere");

  const [chosenFilter, setChosenFilter] = React.useState<string>("Nyeste");

  const [word, setWord] = React.useState<string>("");
  const [frequency, setFrequency] = React.useState<number>(5);
  const [description, setDescription] = React.useState<string>("");

  const [selectedWord, setSelectedWord] = React.useState<DictionaryT | null>(
    null
  );

  const handleClose = (option?: string, word?: DictionaryT) => {
    setOpenedMenuId(null);
    if (option && word) {
      setSelectedOption(option);
      setSelectedWord(word);
      setModalOpen(true);
    } else {
      setModalOpen(false);
    }
  };

  // Modal

  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<string | null>(
    null
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (selectedWord) {
      setSelectedWord(
        (prevWord) =>
          ({
            ...prevWord,
            [name]: value,
          } as DictionaryT)
      );
    }
  };

  // ... similar handlers for other edit types

  const renderModalContent = () => {
    if (!selectedWord || !selectedOption) return null;

    switch (selectedOption) {
      case "Endre tittel":
        return (
          <>
            <TextField
              fullWidth
              label="Endre tittel"
              name="word"
              value={selectedWord?.word}
              onChange={handleInputChange}
            />
            <br />
            <br />
            <Button variant="contained" onClick={updateWord}>
              Oppdater
            </Button>
            <Button
              onClick={() => {
                handleClose();
              }}
            >
              Avbryt
            </Button>
          </>
        );
      case "Endre hyppighet":
        return (
          <>
            <Typography id="input-slider" gutterBottom>
              Hyppighet (1-10):
            </Typography>
            <Slider
              sx={{ width: 250 }}
              aria-label="Frequency"
              value={selectedWord?.frequency}
              onChange={handleSliderEditChange}
              valueLabelDisplay="auto"
              min={1}
              max={10}
            />
            <br />
            <Button
              variant="contained"
              disabled={selectedWord?.frequency === null}
              onClick={() => {
                if (selectedWord?.frequency !== null) {
                  updateWord();
                }
              }}
            >
              Oppdater
            </Button>
            <Button
              onClick={() => {
                handleClose();
              }}
            >
              Avbryt
            </Button>
          </>
        );
      case "Endre beskrivelse":
        return (
          <>
            <TextField
              fullWidth
              label="Endre beskrivelse"
              name="description"
              value={selectedWord?.description}
              onChange={handleInputChange}
              multiline
            />
            <br />
            <br />
            <Button variant="contained" onClick={updateWord}>
              Oppdater
            </Button>
            <Button
              onClick={() => {
                handleClose();
              }}
            >
              Avbryt
            </Button>
          </>
        );
      case "Slett ord":
        return (
          <>
            <p>
              Er du sikker på at du vil slette ordet <b>{selectedWord.word}</b>{" "}
              fra ordboka til LauBet?
            </p>
            <Button
              variant="contained"
              onClick={() => deleteWord(selectedWord.word_id)}
            >
              Ja
            </Button>
            <Button
              onClick={() => {
                handleClose();
              }}
            >
              Avbryt
            </Button>
          </>
        );
      default:
        return null;
    }
  };

  async function fetchDictionary() {
    const response = await fetch(`${url_path}api/dictionary`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
    });

    const resp = await response.json();
    setResponseCode(response.status);

    if (response.status == 200) {
      setDictionary(resp);
      let persons: string[] = ["Alle bidragsytere"];
      resp.forEach((word: DictionaryT) => {
        if (persons.indexOf(word.submitter.toLowerCase()) === -1) {
          persons.push(word.submitter.toLowerCase());
        }
      });
      setPersons(persons);
    } else {
      setResponseText(resp.detail);
    }
  }

  async function updateWord() {
    if (!selectedWord) return;

    try {
      const response = await fetch(`${url_path}api/dictionary/updateword`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify(selectedWord),
      });

      if (response.status === 200) {
        // Update the original dictionary state object with the newly updated word
        setDictionary((prevDictionary) =>
          prevDictionary.map((word) =>
            word.word_id === selectedWord.word_id ? selectedWord : word
          )
        );
        handleClose(); // Close the modal after updating
      } else {
        // Handle any non-200 responses
        console.error("Failed to update word");
      }
    } catch (error) {
      console.error("Error updating word:", error);
    }
  }
  async function deleteWord(word_id: number) {
    if (!selectedWord) return;

    try {
      const response = await fetch(
        `${url_path}api/dictionary/deleteword/${word_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        }
      );

      if (response.status === 200) {
        setDictionary((prevDictionary) =>
          prevDictionary.filter((word) => word.word_id !== word_id)
        );
        handleClose(); // Close the modal after updating
      } else {
        // Handle any non-200 responses
        console.error("Failed to delete word");
      }
    } catch (error) {
      console.error("Error updating word:", error);
    }
  }

  const handlePersonChange = (
    event: React.SyntheticEvent,
    newValue: string
  ) => {
    setChosenPerson(newValue);
  };

  const handleFilterChange = (event: string) => {
    let oldValue = [...dictionary];

    if (event == "Nyeste") {
      oldValue.sort((a, b) => (a.word_id < b.word_id ? 1 : -1));
    } else if (event == "Eldste") {
      oldValue.sort((a, b) => (a.word_id > b.word_id ? 1 : -1));
    } else if (event == "Hyppighet synkende") {
      oldValue.sort((a, b) => (a.frequency < b.frequency ? 1 : -1));
    } else {
      oldValue.sort((a, b) => (a.frequency > b.frequency ? 1 : -1));
    }
    setChosenFilter(event);
    setDictionary(oldValue);
  };

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    setFrequency(newValue as number);
  };

  const handleSliderEditChange = (
    event: Event,
    newValue: number | number[]
  ) => {
    setSelectedWord(
      (prevWord) =>
        ({
          ...prevWord,
          frequency: newValue as number,
        } as DictionaryT)
    );
  };

  async function submitWord() {
    let payload = {
      word: word,
      frequency: frequency,
      description: description,
    };
    const response = await fetch(`${url_path}api/submitword`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
      body: JSON.stringify(payload),
    });

    const resp = await response.json();
    if (response.ok) {
      fetchDictionary();
      toggleAlert(true, "Ordet ble sendt inn til ordboka!", "success");
      setWord("");
      setFrequency(5);
      setDescription("");
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
    fetchDictionary();
  }, []);

  const [openedMenuId, setOpenedMenuId] = React.useState<number | null>(null);

  function toggleMenu(e: React.MouseEvent<HTMLButtonElement>, word_id: number) {
    e.stopPropagation();
    setOpenedMenuId((prevId) => (prevId === word_id ? null : word_id));
  }

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const menu = document.querySelector(".menu");
      if (openedMenuId && menu && !menu.contains(event.target as Node)) {
        setOpenedMenuId(null); // Close the menu
      }
    }

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [openedMenuId]);

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
      <h1>Ordboka!</h1>
      <div style={{ justifyContent: "center", display: "flex" }}>
        <Card sx={{ width: 400 }}>
          <h3>Legg til nytt ord:</h3>
          <TextField
            label="Ord"
            value={word}
            onChange={(e) => setWord(e.target.value)}
          />
          <br />
          <br />
          <Typography id="input-slider" gutterBottom>
            Hyppighet (1-10):
          </Typography>
          <Slider
            sx={{ width: 250 }}
            aria-label="Frequency"
            value={frequency}
            onChange={handleSliderChange}
            valueLabelDisplay="auto"
            min={1}
            max={10}
          />
          <TextField
            label="Beskrivelse"
            multiline
            minRows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <br />
          <br />
          <Button
            variant="contained"
            onClick={() => {
              submitWord();
            }}
          >
            Send inn ord
          </Button>
          <br />
          <br />
        </Card>
      </div>
      <br />
      <InputLabel id="demo-simple-select-label">Sorter etter</InputLabel>
      <Select
        labelId="demo-simple-select-label"
        value={chosenFilter}
        onChange={(e) => {
          handleFilterChange(e.target.value);
        }}
      >
        {SORT_FILTERS.map((filter: string) => {
          return <MenuItem value={filter}>{filter}</MenuItem>;
        })}
      </Select>
      <Tabs
        sx={{
          boxShadow: "3px 3px 5px 2px rgba(0,0,0,.1)",
          backgroundColor: "white",
          margin: 2,
        }}
        value={chosenPerson}
        onChange={handlePersonChange}
        variant="scrollable"
        scrollButtons="auto"
      >
        {persons.map((person: string) => {
          return <Tab label={person} value={person} />;
        })}
      </Tabs>
      <div className="accums-flex-container">
        {dictionary.map((word: DictionaryT) => {
          if (
            chosenPerson == "Alle bidragsytere" ||
            chosenPerson == word.submitter.toLowerCase()
          ) {
            return (
              <>
                <div>
                  <Card
                    sx={{
                      overflow: "visible",
                      backgroundColor: "white",
                      padding: 1,
                      width: 345,
                      position: "relative", // This ensures the IconButton is positioned relative to the Card
                    }}
                  >
                    {word.submitter.toLowerCase() === USERNAME.toLowerCase() ||
                    isAdmin ? (
                      <div className="word-card">
                        <h3>{word.word}</h3>
                        <button
                          className="kebab-menu"
                          onClick={(e) => toggleMenu(e, word.word_id)}
                        >
                          &#8942;
                        </button>
                        <div
                          className="menu"
                          style={{
                            borderRadius: 6,
                            display:
                              openedMenuId === word.word_id ? "block" : "none",
                          }}
                        >
                          <button
                            onClick={() => handleClose("Endre tittel", word)}
                          >
                            Endre tittel
                          </button>
                          <Divider />
                          <button
                            onClick={() => handleClose("Endre hyppighet", word)}
                          >
                            Endre hyppighet
                          </button>
                          <Divider />
                          <button
                            onClick={() =>
                              handleClose("Endre beskrivelse", word)
                            }
                          >
                            Endre beskrivelse
                          </button>
                          <Divider />
                          <button
                            onClick={() => handleClose("Slett ord", word)}
                          >
                            Slett ord
                          </button>
                        </div>
                      </div>
                    ) : (
                      <h3>{word.word}</h3>
                    )}
                    Hyppighet: {word.frequency} <br />
                    Innsendt av: {word.submitter} <br />
                    {word.description} <br />
                  </Card>
                </div>
              </>
            );
          }
        })}
        <Modal
          open={modalOpen}
          onClose={() => handleClose()}
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <div
            style={{
              width: "98%",
              maxWidth: 400,
              padding: "30px",
              backgroundColor: "white",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            {renderModalContent()}
          </div>
        </Modal>
      </div>
    </>
  );
}
