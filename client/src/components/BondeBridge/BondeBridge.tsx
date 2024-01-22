import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  Input,
  InputAdornment,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  SelectChangeEvent,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  BondeUser,
  Player,
  PlayerScore,
  Prizes,
  Round,
  Game,
} from "../../types";
import { useAppSelector } from "../../redux/hooks";
import { selectPath } from "../../redux/envSlice";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import { IconButton } from "@mui/material";
import { InfoOutlined, Person, EditAttributes } from "@mui/icons-material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditIcon from "@mui/icons-material/Edit";

import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import PlayerCard from "./PlayerCard";
import { BleedingsTable } from "./StatsCharts";

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  minWidth: 400,
  bgcolor: "background.paper",
  borderRadius: "10px",
  boxShadow: 24,
  p: 4,
};

export default function BondeBridge() {
  const navigate = useNavigate();
  const params = useParams();
  const GAME_ID = params.game_id;

  const url_path = useAppSelector(selectPath);

  const [resultOpen, setResultOpen] = React.useState<boolean>(false);
  const handleResultClose = () => setResultOpen(false);

  const [infoModalOpen, setInfoModalOpen] = React.useState<boolean>(false);
  const handleInfoClose = () => setInfoModalOpen(false);

  const [editModalOpen, setEditModalOpen] = React.useState<boolean>(false);
  const handleEditClose = () => setEditModalOpen(false);

  const [newPlayerModalOpen, setNewPlayerModalOpen] =
    React.useState<boolean>(false);
  const handleNewPlayerClose = () => setNewPlayerModalOpen(false);

  const [finalModalOpen, setFinalModalOpen] = React.useState<boolean>(false);
  const handleFinalClose = () => setFinalModalOpen(false);

  const [currentGame, setCurrentGame] = useState<Game>();

  const [reBitState, setReBidState] = useState<boolean>(false);

  const [blueberryMode, setBlueberryMode] = useState<boolean>(false);

  const [players, setPlayers] = useState<Player[]>([]);

  const [prizes, setPrizes] = useState<Prizes>();

  const [showGif, setShowGif] = useState(false);
  const [shouldShowGif, setShouldShowGif] = useState(false);

  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [dealerIndex, setDealerIndex] = useState<number>(0);

  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number | null>(
    null
  );

  const [alertOpen, setAlertOpen] = useState<boolean>(false);
  const [invalidTricksAlertOpen, setInvalidTricksAlertOpen] =
    useState<boolean>(false);

  // Initialize trickInputs state
  const [trickInputs, setTrickInputs] = useState<string[]>([]);

  // Update trickInputs when selectedRoundIndex changes
  useEffect(() => {
    if (selectedRoundIndex !== null) {
      setTrickInputs(
        rounds[selectedRoundIndex].player_scores.map((ps) =>
          ps.num_tricks !== null ? ps.num_tricks.toString() : ""
        )
      );
    }
  }, [selectedRoundIndex, rounds]);

  // Handle input change
  const handleInputChange = (value: string, playerIndex: number) => {
    const newTrickInputs = [...trickInputs];
    newTrickInputs[playerIndex] = value;
    setTrickInputs(newTrickInputs);

    // Call handleTrickChange with 0 if the input is empty, otherwise with the number
    handleTrickChange(
      value === "" ? 0 : Number(value),
      selectedRoundIndex as number, // TypeScript cast since we check for null before
      playerIndex
    );
  };

  const updateWarningsForPlayer = (playerId: number, increment: boolean) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.player_id === playerId
          ? {
              ...player,
              warnings: increment
                ? player.warnings + 1
                : Math.max(player.warnings - 1, 0),
            }
          : player
      )
    );
  };

  const updateBleedingsForPlayer = (playerId: number, increment: boolean) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.player_id === playerId
          ? {
              ...player,
              bleedings: increment
                ? player.bleedings + 1
                : Math.max(player.bleedings - 1, 0),
            }
          : player
      )
    );
  };

  // const NUMBER_OF_ROUNDS = 3;
  const NUMBER_OF_ROUNDS = Math.floor(52 / players.length);

  const [error, setError] = useState<null | string>(null);

  const handleRoundSelectChange = (event: SelectChangeEvent<number | null>) => {
    setSelectedRoundIndex(event.target.value as number);
  };

  function handleTrickChange(
    newNumTricks: string | number | null,
    roundIndex: number,
    playerIndex: number
  ) {
    if (reBitState) {
      // setReBidState(false);
      setRounds((prev) => {
        const newRounds = [...prev];
        // newRounds[currentRoundIndex].locked = true;
        return newRounds;
      });
    }
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      const updatedPlayerScore = {
        ...newRounds[roundIndex].player_scores[playerIndex],
        num_tricks: Number(newNumTricks),
      };
      const updatedPlayerScores = [
        ...newRounds[roundIndex].player_scores.slice(0, playerIndex),
        updatedPlayerScore,
        ...newRounds[roundIndex].player_scores.slice(playerIndex + 1),
      ];
      newRounds[roundIndex] = {
        ...newRounds[roundIndex],
        player_scores: updatedPlayerScores,
      };
      return newRounds;
    });
  }

  function handleStandChange(
    newStandStatus: boolean,
    roundIndex: number,
    playerIndex: number
  ) {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      const updatedPlayerStatus = {
        ...newRounds[roundIndex].player_scores[playerIndex],
        stand: newStandStatus,
      };
      const updatedPlayerStatuses = [
        ...newRounds[roundIndex].player_scores.slice(0, playerIndex),
        updatedPlayerStatus,
        ...newRounds[roundIndex].player_scores.slice(playerIndex + 1),
      ];
      newRounds[roundIndex] = {
        ...newRounds[roundIndex],
        player_scores: updatedPlayerStatuses,
      };
      return newRounds;
    });
  }

  function handleLockRound(round: Round) {
    // if (
    //   round.player_scores.every((score) => typeof score.num_tricks === "number")
    // ) {
    const modRound = {
      ...round,
      player_scores: round.player_scores.map((score) => ({
        ...score,
        num_tricks: score.num_tricks === null ? 0 : score.num_tricks,
      })),
    };

    let totalTrickSum = 0;
    modRound.player_scores.forEach((score: PlayerScore) => {
      if (score.num_tricks) totalTrickSum += score.num_tricks;
    });
    if (totalTrickSum === modRound.num_cards) {
      setReBidState(true);
      alert("Dealer må gå opp eller ned");
      return;
    } else {
      modRound.locked = !modRound.locked;
      setRounds((prevRounds) => {
        const newRounds = [...prevRounds]; // Create a shallow copy
        newRounds[currentRoundIndex] = modRound; // Update the round at the current index
        return newRounds;
      });
    }

    // } else {
    //   alert("Alle spillere må ha valgt et antall stikk");
    // }
  }

  function handleNextRound() {
    for (let i = 0; i < players.length; i++) {
      if (rounds[currentRoundIndex].player_scores[i].stand === null) {
        handleStandChange(false, currentRoundIndex, i);
      }
    }
    setReBidState(false);
    setResultOpen(false);
    if (shouldShowGif) {
      setShowGif(true);
      setShouldShowGif(false);
      // Set a timer to hide the GIF after its duration
      const timer = setTimeout(() => {
        setShowGif(false);
      }, 5000);
    }
    if (currentRoundIndex + 1 < rounds.length) {
      setCurrentRoundIndex((prev) => prev + 1);
    } else {
      if (currentGame) {
        // updateRound();
        // updatePlayerScores();
        completeGame(currentGame?.game_id);
      }
      setFinalModalOpen(true);
    }
  }

  function sortPlayerScoresInRounds(rounds: Round[]) {
    return rounds.map((round) => {
      // Clone the round object first to avoid mutating the original
      const clonedRound = { ...round };

      // Sort player_scores by player_scores_id
      clonedRound.player_scores.sort((a, b) => {
        // Handle potential undefined values
        const idA = a.player_scores_id || 0;
        const idB = b.player_scores_id || 0;

        return idA - idB; // Sort in ascending order
      });

      return clonedRound;
    });
  }

  function calcScores() {
    const sortedRounds = sortPlayerScoresInRounds(rounds);

    for (let i = 0; i < players.length; i++) {
      let playerScore = 0;
      let consecutiveFails = 0;
      let consecutiveStands = 0;
      for (let j = 0; j <= currentRoundIndex; j++) {
        if (sortedRounds[j].player_scores[i].stand === null) {
          break;
        }
        if (sortedRounds[j].player_scores[i].stand) {
          playerScore +=
            10 +
            Math.pow(Number(sortedRounds[j].player_scores[i].num_tricks), 2);
          consecutiveFails = 0;
          consecutiveStands += 1;
        } else {
          consecutiveFails += 1;
          consecutiveStands = 0;
        }
        if (consecutiveFails == 3) {
          playerScore -= 10;
        } else if (consecutiveFails == 6) {
          playerScore -= 30;
        } else if (consecutiveFails == 9) {
          playerScore -= 50;
        }
        if (consecutiveStands == 8) {
          playerScore += 30;
          if (
            j === currentRoundIndex &&
            currentRoundIndex < sortedRounds.length - 1
          ) {
            setShouldShowGif(true);
          }
        } else if (consecutiveStands == 12) {
          playerScore += 30;
          if (
            j === currentRoundIndex &&
            currentRoundIndex < sortedRounds.length - 1
          ) {
            setShouldShowGif(true);
          }
        } else if (consecutiveStands == 16) {
          playerScore += 30;
          if (
            j === currentRoundIndex &&
            currentRoundIndex < sortedRounds.length - 1
          ) {
            setShouldShowGif(true);
          }
        } else if (consecutiveStands == 20) {
          playerScore += 30;
          if (
            j === currentRoundIndex &&
            currentRoundIndex < sortedRounds.length - 1
          ) {
            setShouldShowGif(true);
          }
        }
      }
      setPlayers((prev) => {
        const newPlayers = [...prev];
        newPlayers.sort((a, b) => a.game_player_id - b.game_player_id)[
          i
        ].score =
          playerScore -
          Math.floor(
            newPlayers.sort((a, b) => a.game_player_id - b.game_player_id)[i]
              .warnings / 2
          ) *
            10;
        return newPlayers;
      });
    }
  }

  function calcHalfwayScores(i: number, halfway: boolean) {
    let playerScore = 0;
    let consecutiveFails = 0;
    let consecutiveStands = 0;

    const sortedRounds = sortPlayerScoresInRounds(rounds);

    let loopTo = halfway
      ? Math.min(currentRoundIndex, sortedRounds.length / 2)
      : currentRoundIndex + 1;
    for (let j = 0; j < loopTo; j++) {
      if (sortedRounds[j].player_scores[i].stand === null) {
        break;
      }
      if (sortedRounds[j].player_scores[i].stand) {
        playerScore +=
          10 + Math.pow(Number(sortedRounds[j].player_scores[i].num_tricks), 2);
        consecutiveFails = 0;
        consecutiveStands += 1;
      } else {
        consecutiveFails += 1;
        consecutiveStands = 0;
      }
      if (consecutiveFails == 3) {
        playerScore -= 10;
      } else if (consecutiveFails == 6) {
        playerScore -= 30;
      } else if (consecutiveFails == 9) {
        playerScore -= 50;
      }
      if (consecutiveStands == 8) {
        playerScore += 30;
      } else if (consecutiveStands == 12) {
        playerScore += 30;
      } else if (consecutiveStands == 16) {
        playerScore += 30;
      } else if (consecutiveStands == 20) {
        playerScore += 30;
      }
    }
    playerScore =
      playerScore -
      Math.floor(
        players.sort((a, b) => a.game_player_id - b.game_player_id)[i]
          .warnings / 2
      ) *
        10;
    return playerScore;
  }

  function calcMoneyPrizes() {
    const sortedPlayers = players.slice().sort((a, b) => b.score - a.score);
    if (currentGame !== undefined && players.length > 0) {
      // Calculate the difference between the winner and loser, and second and second last
      const winnerLoserDifference =
        sortedPlayers[0].score - sortedPlayers[sortedPlayers.length - 1].score;
      const secondSecondLastDifference =
        sortedPlayers[1].score - sortedPlayers[sortedPlayers.length - 2].score;
      // Calculate the total sum for the loser to give to the winner
      const loserToWinner =
        winnerLoserDifference * currentGame.money_multiplier +
        currentGame.extra_cost_loser;
      // Calculate the total sum for the second last to give to the second place
      const secondLastToSecond =
        secondSecondLastDifference * currentGame.money_multiplier +
        currentGame.extra_cost_second_last;
      setPrizes({
        winner: sortedPlayers[0].nickname,
        loser: sortedPlayers[sortedPlayers.length - 1].nickname,
        winnerPrize: loserToWinner,
        second: sortedPlayers[1].nickname,
        secondLoser: sortedPlayers[sortedPlayers.length - 2].nickname,
        secondPrize: secondLastToSecond,
      });
    }
  }

  const fetchGame = async () => {
    try {
      const response = await fetch(`${url_path}api/bonde/game/${GAME_ID}`);
      const data = await response.json();
      setCurrentGame(data.game[0]);
      setRounds(data.rounds);
      setPlayers(data.players);

      let lastIndex = 0;

      if (data.game[0].status === "finished") {
        setCurrentRoundIndex(data.rounds.length - 1);
      } else {
        for (let i = 0; i < data.rounds.length; i++) {
          const round = data.rounds[i];
          const isSettled = round.player_scores.every(
            (playerScore: PlayerScore) => typeof playerScore.stand === "boolean"
          );

          if (isSettled) {
            lastIndex = i + 1;
          } else {
            break;
          }
        }
        setCurrentRoundIndex(lastIndex);
      }
    } catch (err) {
      setError("Noe gikk galt. Kunne ikke hente nåværende spill");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGame();
  }, []);

  function getPlayerEarnings(place: number) {
    if (place === 0) {
      return prizes?.winnerPrize;
    } else if (place === 1) {
      return prizes?.secondPrize;
    } else if (place === players.length - 2) {
      return prizes?.secondPrize ? -prizes.secondPrize : undefined;
    } else if (place === players.length - 1) {
      return prizes?.winnerPrize ? -prizes.winnerPrize : undefined;
    } else {
      return undefined;
    }
  }

  useEffect(() => {
    calcScores();
    if (rounds[currentRoundIndex] !== undefined) {
      if (
        rounds[currentRoundIndex].player_scores.every(
          (score) => score.stand === true
        )
      ) {
        setAlertOpen(true);
      } else {
        setAlertOpen(false);
      }
    }
    let totalStandTricks = 0;

    if (
      currentRoundIndex >= 0 &&
      currentRoundIndex < rounds.length &&
      rounds[currentRoundIndex]?.player_scores !== undefined
    ) {
      rounds[currentRoundIndex].player_scores.map((player) => {
        if (player.stand && player.num_tricks) {
          totalStandTricks += player.num_tricks;
        }
      });

      // Check if totalTricks is greater than num_cards for the round
      if (totalStandTricks > rounds[currentRoundIndex].num_cards) {
        setInvalidTricksAlertOpen(true);
      } else {
        setInvalidTricksAlertOpen(false);
      }
    }
  }, [rounds]);

  useEffect(() => {
    if (currentGame) {
      calcMoneyPrizes();
      updatePlayerScores();
    }
  }, [players]);
  // useEffect(() => {
  //   if (players.every((player) => player.game_player_id !== null)) {
  //   }
  // }, [players]);

  useEffect(() => {
    updatePlayerScores();
    calcScores();
    updateRound();
  }, [currentRoundIndex]);

  useEffect(() => {
    if (currentGame?.status === "finished") {
      updatePlayerScores();
      updateRound();
    }
  }, [currentGame]);
  async function updateRound() {
    try {
      const response = await fetch(`${url_path}api/bonde/rounds`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rounds: rounds }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update round: ${response.statusText}`);
      }

      const data = await response.json();
    } catch (error) {
      console.error("Error updating round:", error);
    }
  }

  async function updatePlayerScores() {
    if (players.length > 0) {
      try {
        const response = await fetch(`${url_path}api/bonde/playerdata`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ playerData: players }),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to update player scores: ${response.statusText}`
          );
        }

        const data = await response.json();
      } catch (error) {
        console.error("Error updating player scores:", error);
      }
    }
  }

  async function completeGame(game_id: number) {
    try {
      const response = await fetch(`${url_path}api/game/complete/${game_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`${response.statusText}`);
      } else {
        if (currentGame) {
          setCurrentGame({
            ...currentGame,
            status: "finished",
          });
        }
      }

      const data = await response.json();
    } catch (error) {
      console.error(error);
    }
  }

  function getGreenGradient(consecutiveStands: number) {
    let minAlpha = 0.2; // Start transparency
    let maxAlpha = 1; // End transparency
    let alpha;

    if (consecutiveStands <= 8) {
      alpha = ((maxAlpha - minAlpha) * consecutiveStands) / 8 + minAlpha;
      const minGreen = 180;
      const maxGreen = 255;
      return `rgba(50, ${
        ((maxGreen - minGreen) * consecutiveStands) / 8 + minGreen
      }, 50, ${alpha})`;
    } else if (consecutiveStands <= 12) {
      alpha = ((maxAlpha - minAlpha) * (consecutiveStands - 8)) / 4 + minAlpha;
      const minGreen = 200;
      const maxGreen = 255;
      return `rgba(30, 130, ${
        ((maxGreen - minGreen) * (consecutiveStands - 8)) / 4 + minGreen
      }, ${alpha})`;
    } else if (consecutiveStands <= 16) {
      alpha = ((maxAlpha - minAlpha) * (consecutiveStands - 12)) / 4 + minAlpha;
      const minGreen = 200;
      const maxGreen = 255;
      return `rgba(255, 90, ${
        ((maxGreen - minGreen) * (consecutiveStands - 12)) / 4 + minGreen
      }, ${alpha})`;
    } else {
      // for 17 to 20
      alpha = ((maxAlpha - minAlpha) * (consecutiveStands - 16)) / 4 + minAlpha;
      const minGreen = 0;
      const maxGreen = 130;
      return `rgba(${
        ((maxGreen - minGreen) * (consecutiveStands - 16)) / 4 + minGreen
      }, 255, 150, ${alpha})`;
    }
  }

  const getConsecutiveStands = (
    playerIndex: number,
    currentRoundIndex: number,
    rounds: Round[]
  ) => {
    let consecutiveStands = 0;
    for (let i = currentRoundIndex; i >= 0; i--) {
      if (rounds[i].player_scores[playerIndex].stand) consecutiveStands += 1;
      else break;
    }
    return consecutiveStands;
  };

  return (
    <>
      <div id="rules" style={{ marginBottom: "70px" }}>
        {rounds[0] === undefined ? (
          <>Henter runde ...</>
        ) : (
          <>
            {showGif && (
              <div className="modalOverlay">
                <img
                  src={`/bm${Math.floor(Math.random() * 17) + 1}.gif`}
                  alt="Description of GIF"
                />
              </div>
            )}
            <br />
            <div
              style={{
                height: "90vh",
                overflow: "scroll",
                marginBottom: "25px",
              }}
            >
              <Table aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    {players
                      .sort((a, b) => a.game_player_id - b.game_player_id)
                      .map((player: Player) => {
                        return (
                          <>
                            <TableCell align="center" sx={{ padding: 0.5 }}>
                              <span
                                onClick={() =>
                                  updateWarningsForPlayer(
                                    player.player_id,
                                    true
                                  )
                                }
                                style={{
                                  cursor: "pointer",
                                  border: "1px solid #F96B03",
                                  display: "inline-block",
                                  backgroundColor: "orange",
                                  color: "white",
                                  borderRadius: "5px",
                                  padding: "2px 4px",
                                  margin: "2px",
                                  fontWeight: "bold",
                                  fontSize: "12px",
                                  marginRight: "10px",
                                }}
                              >
                                W +
                              </span>
                              <span
                                onClick={() =>
                                  updateBleedingsForPlayer(
                                    player.player_id,
                                    true
                                  )
                                }
                                style={{
                                  cursor: "pointer",
                                  border: "1px solid red",
                                  display: "inline-block",
                                  backgroundColor: "#ffcccc",
                                  color: "red",
                                  borderRadius: "5px",
                                  padding: "2px 4px",
                                  margin: "2px",
                                  fontWeight: "bold",
                                  fontSize: "12px",
                                }}
                              >
                                🩸 +
                              </span>
                            </TableCell>
                          </>
                        );
                      })}
                    <TableCell colSpan={2}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          paddingRight: "0px",
                        }}
                      >
                        <img
                          height="30"
                          src="/blueberry.png"
                          alt="Blueberry"
                          style={{
                            filter: blueberryMode ? "none" : "grayscale(100%)",
                          }}
                        />
                        <Switch
                          style={{ marginRight: "5px" }}
                          checked={blueberryMode}
                          onChange={() => {
                            setBlueberryMode((prev) => !prev);
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow
                    sx={{
                      position: "sticky",
                      top: "-1px",
                      zIndex: 1,
                      backgroundColor: "white",
                    }}
                  >
                    <>
                      <TableCell>
                        <b>#</b>
                      </TableCell>
                      {players
                        .sort((a, b) => a.game_player_id - b.game_player_id)
                        .map((player: Player) => {
                          return (
                            <>
                              <TableCell align="center" sx={{ padding: 0.5 }}>
                                <b>{player.nickname}</b>
                                {player.bleedings > 0 || player.warnings > 0 ? (
                                  <>
                                    {Array.from({
                                      length: player.warnings,
                                    }).map((_, index) => (
                                      <span
                                        onClick={() =>
                                          updateWarningsForPlayer(
                                            player.player_id,
                                            false
                                          )
                                        }
                                        key={index}
                                        style={{
                                          display: "inline-block",
                                          backgroundColor: "orange",
                                          color: "white",
                                          borderRadius: "5px", // Adjust for more or less rounded corners
                                          padding: "0px 2px", // Adjust padding to your preference
                                          margin: "2px", // Adjust for spacing between boxes
                                          fontWeight: "bold",
                                          fontSize: "10px", // Adjust font size as needed
                                        }}
                                      >
                                        W
                                      </span>
                                    ))}
                                    {Array.from({
                                      length: player.bleedings,
                                    }).map((_, index) => (
                                      <span
                                        onClick={() =>
                                          updateBleedingsForPlayer(
                                            player.player_id,
                                            false
                                          )
                                        }
                                        key={index}
                                        style={{
                                          border: "1px solid red",
                                          display: "inline-block",
                                          backgroundColor: "#ffcccc",
                                          color: "white",
                                          borderRadius: "5px", // Adjust for more or less rounded corners
                                          padding: "0px 2px", // Adjust padding to your preference
                                          margin: "2px", // Adjust for spacing between boxes
                                          fontWeight: "bold",
                                          fontSize: "10px", // Adjust font size as needed
                                        }}
                                      >
                                        🩸
                                      </span>
                                    ))}
                                  </>
                                ) : (
                                  <></>
                                )}
                              </TableCell>
                            </>
                          );
                        })}
                    </>
                    <TableCell
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconButton
                        onClick={() => {
                          setInfoModalOpen(true);
                        }}
                        aria-label="info"
                      >
                        <InfoOutlined />
                      </IconButton>
                    </TableCell>
                    <TableCell align="left" sx={{ padding: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditModalOpen(true);
                        }}
                        aria-label="edit"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rounds.map((round: Round, roundIndex: number) => {
                    return (
                      <>
                        <TableRow sx={{ marginRight: 0 }}>
                          <TableCell>
                            <b>{round.num_cards}</b>
                          </TableCell>
                          {round.player_scores.map(
                            (score: PlayerScore, playerIndex) => {
                              const consecutiveStands = getConsecutiveStands(
                                playerIndex,
                                roundIndex,
                                rounds
                              );
                              const backgroundColor =
                                score.stand === false
                                  ? "#ff9d96"
                                  : score.stand === true
                                  ? getGreenGradient(consecutiveStands)
                                  : "";
                              const numTricks = score.num_tricks ?? 0;

                              return (
                                <>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      height: 53,
                                      padding: 0,
                                      width: 300,
                                      backgroundColor:
                                        blueberryMode && !score.stand
                                          ? "white"
                                          : backgroundColor,
                                    }}
                                  >
                                    {currentRoundIndex === roundIndex &&
                                    currentGame?.status !== "finished" ? (
                                      <div>
                                        <button
                                          id="button-bonde"
                                          disabled={
                                            round.locked ||
                                            (reBitState &&
                                              round.dealer_index !==
                                                playerIndex) ||
                                            numTricks <= 0
                                          }
                                          onClick={() =>
                                            handleTrickChange(
                                              numTricks - 1,
                                              roundIndex,
                                              playerIndex
                                            )
                                          }
                                        >
                                          -
                                        </button>
                                        <span id="span-bonde">{numTricks}</span>
                                        <button
                                          id="button-bonde"
                                          disabled={
                                            round.locked ||
                                            (reBitState &&
                                              round.dealer_index !==
                                                playerIndex) ||
                                            numTricks >= round.num_cards
                                          }
                                          onClick={() =>
                                            handleTrickChange(
                                              numTricks + 1,
                                              roundIndex,
                                              playerIndex
                                            )
                                          }
                                        >
                                          +
                                        </button>
                                      </div>
                                    ) : score.num_tricks !== null ? (
                                      blueberryMode && !score.stand ? (
                                        <img
                                          height={43}
                                          src="/blueberry.png"
                                          alt="Blueberry"
                                          style={{ marginTop: "4px" }}
                                        />
                                      ) : (
                                        10 + Math.pow(score.num_tricks, 2)
                                      )
                                    ) : (
                                      ""
                                    )}
                                  </TableCell>
                                </>
                              );
                            }
                          )}
                          {currentRoundIndex === roundIndex &&
                          currentGame?.status === "in-progress" ? (
                            <>
                              <TableCell
                                sx={{
                                  width: 100,
                                  margin: "auto",
                                }}
                              >
                                {rounds[currentRoundIndex].locked ? (
                                  <>
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <IconButton
                                        onClick={() => {
                                          setResultOpen(true);
                                        }}
                                      >
                                        ✅
                                      </IconButton>
                                      <IconButton
                                        onClick={() => {
                                          handleLockRound(round);
                                        }}
                                      >
                                        ↩️
                                      </IconButton>
                                      {round.player_scores.reduce(
                                        (total, playerScore) =>
                                          total + (playerScore.num_tricks || 0),
                                        0
                                      ) > round.num_cards ? (
                                        <div
                                          style={{
                                            backgroundColor:
                                              "rgba(255, 178, 64, 0.7)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "right",
                                          }}
                                        >
                                          {round.player_scores.reduce(
                                            (total, playerScore) =>
                                              total +
                                              (playerScore.num_tricks || 0),
                                            0
                                          ) - round.num_cards}{" "}
                                          ⬆
                                        </div>
                                      ) : (
                                        <div
                                          style={{
                                            backgroundColor:
                                              "rgba(173, 216, 230, 0.7)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "right",
                                          }}
                                        >
                                          {round.num_cards -
                                            round.player_scores.reduce(
                                              (total, playerScore) =>
                                                total +
                                                (playerScore.num_tricks || 0),
                                              0
                                            )}{" "}
                                          ⬇
                                        </div>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <IconButton
                                        onClick={() => {
                                          handleLockRound(round);
                                        }}
                                      >
                                        🔒
                                      </IconButton>
                                    </div>
                                  </>
                                )}
                              </TableCell>
                            </>
                          ) : (
                            <TableCell>
                              {round.player_scores.some(
                                (playerScore) => playerScore.stand === null
                              ) ? (
                                ""
                              ) : round.player_scores.reduce(
                                  (total, playerScore) =>
                                    total + (playerScore.num_tricks || 0),
                                  0
                                ) > round.num_cards ? (
                                <div
                                  style={{
                                    backgroundColor: "rgba(255, 178, 64, 0.7)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "right",
                                  }}
                                >
                                  {round.player_scores.reduce(
                                    (total, playerScore) =>
                                      total + (playerScore.num_tricks || 0),
                                    0
                                  ) - round.num_cards}{" "}
                                  ⬆
                                </div>
                              ) : (
                                <div
                                  style={{
                                    backgroundColor: "rgba(173, 216, 230, 0.7)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "right",
                                  }}
                                >
                                  {round.num_cards -
                                    round.player_scores.reduce(
                                      (total, playerScore) =>
                                        total + (playerScore.num_tricks || 0),
                                      0
                                    )}{" "}
                                  ⬇
                                </div>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            {players[
                              rounds[roundIndex].dealer_index
                            ].nickname[0].toUpperCase()}
                          </TableCell>
                        </TableRow>
                        {roundIndex + 1 === rounds.length ? (
                          <>
                            <TableRow
                              sx={{
                                borderBottom: "4px solid black",
                                borderTop: "4px solid black",
                              }}
                            >
                              <TableCell>
                                <b>=</b>
                              </TableCell>
                              {players.map((player: Player, index: number) => {
                                return (
                                  <>
                                    <TableCell align="center">
                                      {calcHalfwayScores(index, false)}
                                    </TableCell>
                                  </>
                                );
                              })}
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </>
                        ) : (
                          ""
                        )}
                        {roundIndex + 1 === rounds.length / 2 ? (
                          <>
                            <TableRow
                              sx={{
                                borderBottom: "4px solid black",
                                borderTop: "4px solid black",
                              }}
                            >
                              <TableCell>
                                <b>=</b>
                              </TableCell>
                              {players.map((player: Player, index: number) => {
                                return (
                                  <>
                                    <TableCell align="center">
                                      {calcHalfwayScores(index, true)}
                                    </TableCell>
                                  </>
                                );
                              })}
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </>
                        ) : (
                          ""
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {currentGame?.status === "finished" ? (
              <>
                <Button
                  variant="contained"
                  onClick={() => {
                    setFinalModalOpen(true);
                  }}
                >
                  Se resultat
                </Button>
                <br />
                <br />
                <Button
                  variant="outlined"
                  onClick={() => {
                    navigate("/bondebridge");
                  }}
                >
                  Tilbake til meny
                </Button>
              </>
            ) : (
              ""
            )}
          </>
        )}

        <Modal open={resultOpen} onClose={handleResultClose}>
          <Box sx={style}>
            <div style={{ textAlign: "center" }}>
              <b>Kryss av alle spillere som sto sin runde:</b> <br />
              <br />
              <div style={{ marginLeft: 10, textAlign: "left" }}>
                {rounds[0] !== undefined
                  ? rounds[currentRoundIndex].player_scores.map(
                      (player: PlayerScore, index: number) => {
                        return (
                          <>
                            <div style={{ marginBottom: "10px" }}>
                              <Checkbox
                                checked={!!player.stand}
                                onChange={(event) => {
                                  handleStandChange(
                                    event.target.checked,
                                    currentRoundIndex,
                                    index
                                  );
                                }}
                              />{" "}
                              <b>
                                {
                                  players.sort(
                                    (a, b) =>
                                      a.game_player_id - b.game_player_id
                                  )[index].nickname
                                }
                              </b>
                              <br />
                            </div>
                          </>
                        );
                      }
                    )
                  : ""}
              </div>
              {alertOpen ? (
                <>
                  <Alert severity="warning">
                    Alle spillere kan ikke stå samme runde
                  </Alert>
                </>
              ) : (
                ""
              )}
              {invalidTricksAlertOpen ? (
                <>
                  <Alert severity="warning">
                    Antall stikk som står er høyere enn antall stikk for runden
                  </Alert>
                </>
              ) : (
                ""
              )}
              <br />
              {currentRoundIndex + 1 == rounds.length ? (
                <Button
                  disabled={alertOpen}
                  variant="contained"
                  onClick={() => {
                    handleNextRound();
                  }}
                >
                  Avslutt og regn ut
                </Button>
              ) : (
                <Button
                  disabled={alertOpen || invalidTricksAlertOpen}
                  variant="contained"
                  onClick={() => {
                    handleNextRound();
                  }}
                >
                  Gå videre til neste runde
                </Button>
              )}
            </div>
          </Box>
        </Modal>
        <Modal open={infoModalOpen} onClose={handleInfoClose}>
          <div id="result-modal">
            <br />
            Diff x <b>{currentGame?.money_multiplier}</b> | Sisteplass:{" "}
            <b>+ {currentGame?.extra_cost_loser} kr</b> | Nest sist:{" "}
            <b>+ {currentGame?.extra_cost_second_last} kr</b>
            <h2>Foreløpig score:</h2>
            {players
              .sort((a, b) => b.score - a.score)
              .map((player: Player, index: number) => {
                return (
                  <>
                    <PlayerCard
                      position={index + 1}
                      name={player.nickname}
                      score={player.score}
                      // score={calcHalfwayScores(index, false)}
                      earnings={getPlayerEarnings(index)}
                      diff_down={
                        index < players.length - 1
                          ? player.score -
                            players.sort((a, b) => b.score - a.score)[index + 1]
                              .score
                          : undefined
                      }
                    />
                  </>
                );
              })}
            <Button
              sx={{ marginTop: "20px" }}
              variant="contained"
              onClick={() => {
                setInfoModalOpen(false);
              }}
            >
              Lukk
            </Button>
          </div>
        </Modal>

        <Modal open={editModalOpen} onClose={handleEditClose}>
          <div id="rules" style={{ paddingTop: 10 }}>
            <h2>Endre score</h2>
            Velg runden du vil endre: <br />
            <Select
              placeholder="Velg runde"
              value={selectedRoundIndex}
              onChange={handleRoundSelectChange}
            >
              {rounds.map((round, index) => {
                if (
                  round.player_scores.every((player) => player.stand !== null)
                ) {
                  return (
                    <MenuItem key={round.round_id} value={index}>
                      {round.num_cards}{" "}
                      {index + 1 / rounds.length < 12 ? "uten " : "med "}trumf
                    </MenuItem>
                  );
                }
              })}
            </Select>
            <br />
            <br />
            {selectedRoundIndex !== null &&
              rounds[selectedRoundIndex]?.player_scores.map(
                (playerScore, index) => (
                  <div key={playerScore.player_scores_id}>
                    <TextField
                      sx={{ marginBottom: 1 }}
                      type="number"
                      label={`${
                        players.sort(
                          (a, b) => a.game_player_id - b.game_player_id
                        )[index].nickname
                      }`}
                      value={trickInputs[index] || ""}
                      onChange={(e) => handleInputChange(e.target.value, index)}
                    />
                    <Switch
                      checked={playerScore.stand ?? false}
                      onChange={(e) =>
                        handleStandChange(
                          e.target.checked,
                          selectedRoundIndex,
                          index
                        )
                      }
                    />
                  </div>
                )
              )}
            <br />
            <Button
              variant="contained"
              onClick={() => {
                setEditModalOpen(false);
              }}
            >
              Lukk
            </Button>
          </div>
        </Modal>

        <Modal open={finalModalOpen} onClose={handleFinalClose}>
          <div id="result-modal">
            <h1>Resultat</h1>

            {players
              .sort((a, b) => b.score - a.score)
              .map((player: Player, index: number) => {
                return (
                  <>
                    <PlayerCard
                      position={index + 1}
                      name={player.nickname}
                      score={player.score}
                      earnings={getPlayerEarnings(index)}
                      diff_down={
                        index < players.length - 1
                          ? player.score -
                            players.sort((a, b) => b.score - a.score)[index + 1]
                              .score
                          : undefined
                      }
                    />
                  </>
                );
              })}
            <Button
              sx={{ marginTop: "20px" }}
              variant="contained"
              onClick={() => {
                setFinalModalOpen(false);
              }}
            >
              Lukk
            </Button>
          </div>
        </Modal>
      </div>
    </>
  );
}
