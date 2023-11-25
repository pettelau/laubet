import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Fab,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  SelectChangeEvent,
  Snackbar,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  BondeUser,
  PlayerScore,
  Round,
  Game,
  GamePlayer,
  PlayerPreGame,
  Stats,
  SimplePieChartProps,
  PositiveAndNegativeBarChartProps,
} from "../../types";
import { useAppSelector } from "../../redux/hooks";
import { selectPath } from "../../redux/envSlice";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

import MuiAlert, { AlertProps } from "@mui/material/Alert";

import { useNavigate, useParams } from "react-router-dom";
import {
  GaugeWithNeedle,
  PlayerEarningsTable,
  PositiveAndNegativeBarChart,
  SimplePieChart,
  SuccessRates,
} from "./StatsCharts";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function BondeBridgeHome() {
  const navigate = useNavigate();

  const url_path = useAppSelector(selectPath);

  const [newPlayerModalOpen, setNewPlayerModalOpen] =
    React.useState<boolean>(false);
  const handleNewPlayerClose = () => setNewPlayerModalOpen(false);

  const [newGameModalOpen, setNewGameModalOpen] =
    React.useState<boolean>(false);
  const handleNewGameClose = () => setNewGameModalOpen(false);

  const [moneyMultiplier, setMoneyMultiplier] = useState<number | null>(2);
  const [extraCostLoser, setExtraCostLoser] = useState<number | null>(100);
  const [extraCostSecondLast, setExtraCostSecondLast] = useState<number | null>(
    50
  );

  const [stats, setStats] = useState<Stats>();

  const [users, setUsers] = useState<BondeUser[]>([]);

  const [selectedUserIDs, setSelectedUserIDs] = useState<number[]>([]);

  const [exclusiveSelect, setExclusiveSelect] = useState<boolean>(false);

  const [emptyStatsSet, setEmptyStatsSet] = useState<boolean>(false);

  const [players, setPlayers] = useState<PlayerPreGame[]>([]);

  const [games, setGames] = useState<Game[]>([]);

  const [dealerIndex, setDealerIndex] = useState<number>(0);

  // const NUMBER_OF_ROUNDS = 3;
  const NUMBER_OF_ROUNDS = Math.floor(52 / players.length);

  const [nickname, setNickname] = useState<string>("");
  const [error, setError] = useState<null | string>(null);

  async function initGame() {
    try {
      // Step 1: Create a new game and get the game ID
      const gameResponse = await fetch(`${url_path}api/bonde/game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          players: players.map((p) => p.player_id),
          extra_cost_loser: extraCostLoser,
          extra_cost_second_last: extraCostSecondLast,
          money_multiplier: moneyMultiplier,
        }),
      });
      const { game_id, created_on, game_player_ids } =
        await gameResponse.json();

      const updatedPlayers = players.map((player, index) => ({
        ...player,
        game_player_id: game_player_ids[index],
      }));

      setPlayers(updatedPlayers);

      // Steps 2 and 3: Generate rounds and send them to the backend
      let tempRounds = generateRounds(); // Function to generate empty rounds
      const roundsResponse = await fetch(`${url_path}api/bonde/rounds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: game_id,
          rounds: tempRounds,
          num_players: players.length,
        }),
      });

      const { created } = await roundsResponse.json();
      if (created) {
        handleSnackClick();
        fetchGames();
        setValue(0);
        setPlayers([]);
      }
    } catch (error) {
      console.error("Error initializing game:", error);
    }
  }

  function generateRounds() {
    let _dealerIndex = dealerIndex;
    let tempRounds: Round[] = [];
    let tempPlayerScores: PlayerScore[] = [];
    for (let i = 0; i < players.length; i++) {
      tempPlayerScores.push({
        player_scores_id: undefined,
        num_tricks: null,
        stand: null,
      });
    }
    // Down rounds
    for (let j = NUMBER_OF_ROUNDS; j > 1; j--) {
      tempRounds.push({
        round_id: null,
        dealer_index: _dealerIndex % players.length,
        num_cards: j,
        locked: false,
        player_scores: tempPlayerScores,
      });
      _dealerIndex += 1;
    }

    // Up rounds
    for (let k = 2; k < NUMBER_OF_ROUNDS + 1; k++) {
      tempRounds.push({
        round_id: null,
        dealer_index: _dealerIndex % players.length,
        num_cards: k,
        locked: false,
        player_scores: tempPlayerScores,
      });
      _dealerIndex += 1;
    }
    return tempRounds;
  }

  const handleAddPlayer = async () => {
    try {
      const response = await fetch(`${url_path}api/bonde/adduser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname }),
      });
      const data = await response.json();

      if (data.addUser === false) {
        setError(data.errorMsg);
      } else {
        setError(null);
        setNickname("");
        setNewPlayerModalOpen(false);
        fetchUsers();
        // Refetch users below
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${url_path}api/bonde/users`);
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError("Kunne ikke hente brukere");
      console.error(err);
    }
  };

  const fetchGames = async () => {
    try {
      const response = await fetch(`${url_path}api/bonde/games`);
      const data = await response.json();
      setGames(data.games);
    } catch (err) {
      setError("Noe gikk galt. Kunne ikke hente eksisterende spill");
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      let endpoint = `${url_path}api/bonde/stats`;

      const queryParams = [];
      // Convert the playerIds array to a comma-separated string and attach as a query parameter
      if (selectedUserIDs.length) {
        const idsString = selectedUserIDs.join(",");
        queryParams.push(`playerIds=${idsString}`);
      }

      if (exclusiveSelect) {
        queryParams.push("exclusiveselect=True");
      }

      if (queryParams.length) {
        endpoint += `?${queryParams.join("&")}`;
      }

      const response = await fetch(endpoint);
      if (response.status === 204) {
        setEmptyStatsSet(true);
        setStats(undefined);
        return;
      }
      const data = await response.json();

      setStats(data as Stats);
    } catch (err) {
      setEmptyStatsSet(false);
      setError("Noe gikk galt. Kunne ikke hente eksisterende spill");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchGames();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [selectedUserIDs, exclusiveSelect]);

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExclusiveSelect(event.target.checked);
  };

  const handlePlayerSelect = (event: any, newValues: BondeUser[] | null) => {
    // Convert the BondeUser to Player type with score initialized to 0
    if (newValues) {
      const newPlayers = newValues.map((user) => ({
        player_id: user.player_id,
        game_player_id: undefined,
        nickname: user.nickname,
        score: 0,
      }));
      setPlayers(newPlayers);
    } else {
      setPlayers([]); // clear the selected players if newValues is null
    }
  };

  // TAB MENU
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // SUCCESS SNACKBAR
  const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref
  ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  const [snackOpen, setSnackOpen] = React.useState(false);

  const handleSnackClick = () => {
    setSnackOpen(true);
  };

  const handleSnackClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setSnackOpen(false);
  };

  return (
    <>
      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={handleSnackClose}
      >
        <Alert
          onClose={handleSnackClose}
          severity="success"
          sx={{ width: "100%" }}
        >
          Spillet ble opprettet!
        </Alert>
      </Snackbar>
      <div id="rules">
        <br />
        <h1>LauBet Bondebridge</h1>
        <Divider />
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            centered
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
          >
            <Tab label="Eksisterende spill" {...a11yProps(0)} />
            <Tab label="Lag nytt spill" {...a11yProps(1)} />
            <Tab label="Statistikk" {...a11yProps(2)} />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
          {games.map((game) => {
            return (
              <Card
                style={{
                  margin: "20px",
                  backgroundColor:
                    game.status == "in-progress" ? "#B2FFF9" : "#D4E6EC",
                }}
              >
                <CardContent>
                  <Typography variant="h5">Game ID: {game.game_id}</Typography>
                  <Typography variant="body1">Status: {game.status}</Typography>
                  <Typography variant="body1">
                    Multiplikator: <b>{game.money_multiplier}</b>
                  </Typography>
                  <Typography variant="body1">
                    Ekstra kostnad (Taper): <b>{game.extra_cost_loser}</b>
                  </Typography>
                  <Typography variant="body1">
                    Ekstra kostnad (Nest sist):{" "}
                    <b>{game.extra_cost_second_last}</b>
                  </Typography>
                  <Typography variant="body1">
                    Opprettet:{" "}
                    <b>{new Date(game.created_on).toLocaleString()}</b>
                  </Typography>
                  <br />
                  <Grid
                    container
                    justifyContent="center"
                    spacing={1}
                    style={{ display: "flex", flexWrap: "wrap" }}
                  >
                    {game.players.map((player: GamePlayer, index) => (
                      <Grid item key={index}>
                        <Chip label={`${player.nickname}, ${player.score}`} />
                      </Grid>
                    ))}
                  </Grid>
                  <br />
                  <Grid>
                    <Button
                      variant="contained"
                      onClick={() => {
                        navigate(`/bondebridge/${game.game_id}`);
                      }}
                    >
                      Gå til runde
                    </Button>
                  </Grid>
                </CardContent>
              </Card>
            );
          })}
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          <div id="rules">
            <Button
              onClick={() => {
                setNewPlayerModalOpen(true);
              }}
              variant="outlined"
              startIcon={<PersonAddIcon />}
            >
              Legg til ny bruker i databasen
            </Button>
            <br />
            <br />
            <div
              style={{
                maxWidth: "90%",
                width: "100%",
                margin: "auto",
              }}
            >
              <Autocomplete
                multiple
                filterSelectedOptions
                options={users}
                getOptionLabel={(option) => option.nickname}
                //@ts-ignore
                onChange={handlePlayerSelect}
                value={players} // Map selected players to BondeUser type for Autocomplete
                isOptionEqualToValue={(option, value) =>
                  option.player_id === value.player_id
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Legg til spillere for denne runden"
                    variant="outlined"
                  />
                )}
              />
            </div>
            <br />
            <div
              style={{
                maxWidth: "60%",
                width: "100%",
                margin: "auto",
              }}
            >
              {" "}
              <Alert variant="outlined" severity="info">
                Husk å legge til spillerne i den rekkefølgen dere sitter
              </Alert>
            </div>
            {players.length > 2 ? (
              <>
                <br />
                <TextField
                  size="small"
                  label="Differanse ganges med"
                  type="number"
                  value={moneyMultiplier === null ? "" : moneyMultiplier}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setMoneyMultiplier(null);
                    } else {
                      setMoneyMultiplier(Number(e.target.value));
                    }
                  }}
                />
                <br />
                <br />
                <TextField
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">kr</InputAdornment>
                    ),
                  }}
                  size="small"
                  label={`Sum ${players.length}. plass til 1. plass`}
                  type="number"
                  value={extraCostLoser === null ? "" : extraCostLoser}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setExtraCostLoser(null);
                    } else {
                      setExtraCostLoser(Number(e.target.value));
                    }
                  }}
                />
              </>
            ) : (
              ""
            )}
            {players.length > 3 ? (
              <>
                <br />
                <br />
                <TextField
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">kr</InputAdornment>
                    ),
                  }}
                  size="small"
                  label={`Sum ${players.length - 1}. plass til 2. plass`}
                  type="number"
                  value={
                    extraCostSecondLast === null ? "" : extraCostSecondLast
                  }
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setExtraCostSecondLast(null);
                    } else {
                      setExtraCostSecondLast(Number(e.target.value));
                    }
                  }}
                />
                <br />
              </>
            ) : (
              ""
            )}
            {players.length > 2 ? (
              <>
                <br />
                <br />
                <FormControl sx={{ minWidth: 210 }}>
                  <InputLabel id="dealer-select-label">
                    Dealer første runde
                  </InputLabel>
                  <Select
                    size="small"
                    labelId="dealer-select-label"
                    id="dealer-select"
                    value={players[dealerIndex].nickname}
                    label="Dealer første runde"
                    defaultValue="hello"
                    onChange={(event: SelectChangeEvent) => {
                      setDealerIndex(
                        players.findIndex(
                          (player) => player.nickname === event.target.value
                        )
                      );
                    }}
                  >
                    {players.map((player: PlayerPreGame, index: number) => {
                      return (
                        <MenuItem value={player.nickname}>
                          {player.nickname}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
                <br />
              </>
            ) : (
              ""
            )}
            <br />
            <Button
              disabled={
                players.length < 3 ||
                moneyMultiplier === null ||
                extraCostLoser === null ||
                extraCostSecondLast === null
              }
              variant="contained"
              onClick={() => {
                initGame();
              }}
            >
              Opprett spill!
            </Button>
            <br />
          </div>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
          <div id="stats">
            <div
              style={{
                maxWidth: "90%",
                width: "100%",
                margin: "auto",
              }}
            >
              <Autocomplete
                multiple
                id="player-select"
                options={users}
                getOptionLabel={(option) => option.nickname}
                value={users.filter((user) =>
                  selectedUserIDs.includes(user.player_id)
                )}
                onChange={(_, newValue) => {
                  setSelectedUserIDs(newValue.map((user) => user.player_id));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Filtrer statistikk på spillere"
                    placeholder="Spillere"
                  />
                )}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={exclusiveSelect}
                    disabled={selectedUserIDs.length < 2 ? true : false}
                    onChange={handleSwitchChange}
                    inputProps={{ "aria-label": "controlled" }}
                  />
                }
                label="Vis kun stats hvor alle de valgte spillere er involvert samtidig"
              />
            </div>
            {stats ? (
              <>
                <h2>UNDERMELDT VS OVERMELDT</h2>
                <SimplePieChart
                  data={[
                    { name: "Undermeldt", value: stats.perc_underbid },
                    { name: "Overmeldt", value: 100 - stats.perc_underbid },
                  ]}
                />
                <h2>GJ.SNITT OVER/UNDERMELDT PER ANTALL KORT</h2>
                <PositiveAndNegativeBarChart data={stats.avg_diffs} />
                <h2>
                  GJENNOMSNITTLIG <br />
                  UNDERMELDT/OVERMELDT:
                </h2>
                <div style={{ marginTop: -100, paddingLeft: 94 }}>
                  <GaugeWithNeedle value={stats.total_avg_diff} />
                </div>
                <h2>{stats.total_avg_diff}</h2>
                <h2>Success rates</h2>
                <SuccessRates successRateData={stats.success_rates} />
                <h2>Pengerrrrr</h2>
                <PlayerEarningsTable playerEarnings={stats.player_earnings} />
              </>
            ) : emptyStatsSet ? (
              <>
                <br />
                <Alert severity="info">
                  Det finnes ingen spill med disse spillerne involvert samtidig.
                </Alert>
              </>
            ) : (
              "Laster stats ..."
            )}
          </div>
        </CustomTabPanel>

        <Modal open={newPlayerModalOpen} onClose={handleNewPlayerClose}>
          <>
            <div id="rules">
              {error && <Alert severity="error">{error}</Alert>}
              <br />
              <h2>Legg til ny bruker i databasen</h2>
              <TextField
                size="small"
                label="BB-brukernavn"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <br />
              <br />
              <Button variant="contained" onClick={handleAddPlayer}>
                Legg til bruker
              </Button>
            </div>
          </>
        </Modal>
      </div>
    </>
  );
}
