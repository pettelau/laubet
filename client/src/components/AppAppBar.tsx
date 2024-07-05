import * as React from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import AppBar from "../components/AppBar";
import Toolbar from "../components/Toolbar";
import {
  Button,
  Chip,
  Divider,
  Fade,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// Icons
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PaidIcon from "@mui/icons-material/Paid";
import MenuIcon from "@mui/icons-material/Menu";
import ScheduleSendIcon from "@mui/icons-material/ScheduleSend";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import DynamicFeedIcon from "@mui/icons-material/DynamicFeed";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import InterestsIcon from '@mui/icons-material/Interests';

import Tooltip from "@mui/material/Tooltip";
import { useAppSelector } from "../redux/hooks";
import { selectBalance, selectUsername } from "../redux/userSlice";
import useWindowDimensions from "../utils/deviceSizeInfo";

import { AlignHorizontalCenter } from "@mui/icons-material";

// test

export default function AppAppBar() {
  const SIZE = useWindowDimensions();
  const navigate = useNavigate();

  const loggedInUser = useAppSelector(selectUsername);
  const balance = useAppSelector(selectBalance);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <AppBar position="fixed">
        {SIZE.width > 1350 ? (
          <Toolbar
            sx={{
              backgroundColor: "#303c6c",
              color: "#f4976c",
              justifyContent: "space-between",
            }}
          >
            <Box
              sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}
            >
              <img
                onClick={() => {
                  navigate("/");
                }}
                style={{ maxHeight: 30, marginRight: 25, marginTop: 8 }}
                src={"/laubet_simple.png"}
              />
              {/* <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={() => {
                  navigate("/");
                }}
              >
                <HomeIcon />
                <Typography sx={{ color: "white", marginLeft: 1 }}>
                  Hjem
                </Typography>
              </IconButton> */}
              <IconButton
                id="betting-button"
                size="large"
                edge="start"
                color="inherit"
                sx={{ mr: 2, display: "flex", flexDirection: "row" }}
                onClick={() => {
                  navigate("/bettinghome");
                }}
              >
                <LocalAtmIcon />
                <Typography sx={{ color: "white", marginLeft: 1 }}>
                  Odds
                </Typography>
              </IconButton>
              <IconButton
                id="my-accums-button"
                size="large"
                edge="start"
                color="inherit"
                sx={{ mr: 2, display: "flex", flexDirection: "row" }}
                onClick={() => {
                  navigate("/myaccums");
                }}
              >
                <ReceiptIcon />
                <Typography sx={{ color: "white", marginLeft: 1 }}>
                  Mine spill
                </Typography>
              </IconButton>
              <IconButton
                id="my-accums-button"
                size="large"
                edge="start"
                color="inherit"
                sx={{ mr: 2, display: "flex", flexDirection: "row" }}
                onClick={() => {
                  navigate("/requestbet");
                }}
              >
                <ScheduleSendIcon />
                <Typography sx={{ color: "white", marginLeft: 1 }}>
                  Request-a-bet
                </Typography>
              </IconButton>
              <IconButton
                id="leaderboard-button"
                size="large"
                edge="start"
                color="inherit"
                sx={{ mr: 2, display: "flex", flexDirection: "row" }}
                onClick={() => {
                  navigate("/leaderboard");
                }}
              >
                <LeaderboardIcon />
                <Typography sx={{ color: "white", marginLeft: 1 }}>
                  Leaderboard
                </Typography>
              </IconButton>
              <IconButton
                id="dict-button"
                size="large"
                edge="start"
                color="inherit"
                sx={{ mr: 2, display: "flex", flexDirection: "row" }}
                onClick={() => {
                  navigate("/dictionary");
                }}
              >
                <MenuBookIcon />
                <Typography sx={{ color: "white", marginLeft: 1 }}>
                  Ordboka
                </Typography>
              </IconButton>
              <IconButton
                id="feed-button"
                size="large"
                edge="start"
                color="inherit"
                sx={{ mr: 2, display: "flex", flexDirection: "row" }}
                onClick={() => {
                  navigate("/betfeed");
                }}
              >
                <DynamicFeedIcon />
                <Typography sx={{ color: "white", marginLeft: 1 }}>
                  BetFeed
                </Typography>
              </IconButton>
              <IconButton
                id="feed-button"
                size="large"
                edge="start"
                color="inherit"
                sx={{ mr: 2, display: "flex", flexDirection: "row" }}
                onClick={() => {
                  navigate("/bondebridge");
                }}
              >
                <InterestsIcon />
                <Typography sx={{ color: "white", marginLeft: 1 }}>
                  Bondebridge
                </Typography>
              </IconButton>
            </Box>
            {/* <Box sx={{ flex: 1 }}>
              
              <img
                onClick={() => {
                  navigate("/");
                }}
                style={{ maxHeight: 45 }}
                src={"/laubet_simple.png"}
              />
            </Box> */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <IconButton
                id="login-button"
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={() => {
                  navigate("/login");
                }}
              >
                <Typography sx={{ color: "white", marginRight: 1 }}>
                  {loggedInUser == "" ? (
                    <Chip
                      icon={<PersonIcon />}
                      sx={{ backgroundColor: "#303c6c", color: "#f4976c" }}
                      label={"Logg inn"}
                    ></Chip>
                  ) : (
                    <>
                      <Chip
                        icon={<PaidIcon />}
                        sx={{
                          ":hover": { cursor: "pointer" },
                          backgroundColor: "white",

                          marginRight: 1,
                        }}
                        label={balance + " kr"}
                      ></Chip>
                      <Chip
                        icon={<PersonIcon />}
                        sx={{
                          ":hover": { cursor: "pointer" },
                          backgroundColor: "white",
                        }}
                        label={loggedInUser}
                      ></Chip>
                    </>
                  )}
                </Typography>
              </IconButton>
            </Box>
          </Toolbar>
        ) : (
          <Toolbar
            sx={{
              backgroundColor: "#303c6c",
              color: "#f4976c",
              justifyContent: "space-between",
            }}
          >
            <Box
              sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}
            >
              <Chip
                label={"Meny"}
                sx={{ backgroundColor: "white" }}
                icon={<MenuIcon />}
                id="fade-button"
                aria-controls={open ? "fade-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={handleClick}
              ></Chip>
              <Menu
                id="fade-menu"
                MenuListProps={{
                  "aria-labelledby": "fade-button",
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                TransitionComponent={Fade}
              >
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    navigate("/");
                  }}
                >
                  <HomeIcon sx={{ mr: 1 }} />
                  Hjem
                </MenuItem>
                <Divider />

                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    navigate("/bettinghome");
                  }}
                >
                  <LocalAtmIcon sx={{ mr: 1 }} />
                  Odds
                </MenuItem>
                <Divider />

                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    navigate("/myaccums");
                  }}
                >
                  <ReceiptIcon sx={{ mr: 1 }} />
                  Mine spill
                </MenuItem>
                <Divider />

                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    navigate("/requestbet");
                  }}
                >
                  <ScheduleSendIcon sx={{ mr: 1 }} />
                  Request-a-bet
                </MenuItem>
                <Divider />

                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    navigate("/leaderboard");
                  }}
                >
                  <LeaderboardIcon sx={{ mr: 1 }} />
                  Leaderboard
                </MenuItem>
                <Divider />

                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    navigate("/dictionary");
                  }}
                >
                  <MenuBookIcon sx={{ mr: 1 }} />
                  Ordboka
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    navigate("/betfeed");
                  }}
                >
                  <DynamicFeedIcon sx={{ mr: 1 }} />
                  BetFeed
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    navigate("/bondebridge");
                  }}
                >
                  <InterestsIcon sx={{ mr: 1 }} />
                  Bondebridge
                </MenuItem>
              </Menu>
              {/* <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={() => {
                  navigate("/");
                }}
              >
                <HomeIcon />
                <Typography sx={{ color: "white", marginLeft: 1 }}>
                  Hjem
                </Typography>
              </IconButton>
              <IconButton
                id="betting-button"
                size="large"
                edge="start"
                color="inherit"
                sx={{ mr: 2, display: "flex", flexDirection: "row" }}
                onClick={() => {
                  navigate("/bettinghome");
                }}
              >
                <LocalAtmIcon />
                <Typography sx={{ color: "white", marginLeft: 1 }}>
                  Odds
                </Typography>
              </IconButton>
              <IconButton
                id="my-accums-button"
                size="large"
                edge="start"
                color="inherit"
                sx={{ mr: 2, display: "flex", flexDirection: "row" }}
                onClick={() => {
                  navigate("/myaccums");
                }}
              >
                <ReceiptIcon />
                <Typography sx={{ color: "white", marginLeft: 1 }}>
                  Mine spill
                </Typography>
              </IconButton> */}
            </Box>
            <Box sx={{ flex: 1 }}>
              <img
                onClick={() => {
                  navigate("/");
                }}
                style={{ maxHeight: 30, marginTop: 5 }}
                src={"/laubet_simple.png"}
              />
            </Box>
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Typography sx={{ color: "white" }}>
                {loggedInUser == "" ? (
                  <Chip
                    onClick={() => {
                      navigate("/login");
                    }}
                    icon={
                      <PersonIcon sx={{ ":hover": { cursor: "pointer" } }} />
                    }
                    sx={{
                      backgroundColor: "white",
                    }}
                    label={"Logg inn"}
                  ></Chip>
                ) : (
                  <>
                    <Chip
                      onClick={() => {
                        navigate("/login");
                      }}
                      icon={<PersonIcon />}
                      sx={{
                        backgroundColor: "white",
                      }}
                      label={balance + " kr"}
                    ></Chip>
                  </>
                )}
              </Typography>
            </Box>
          </Toolbar>
        )}
      </AppBar>
      <Toolbar />
    </div>
  );
}
