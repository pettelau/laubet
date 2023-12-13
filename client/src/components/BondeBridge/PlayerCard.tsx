import React from "react";
import { Card, CardContent, Typography, Grid, Chip } from "@mui/material";

type PlayerCardProps = {
  position: number;
  name: string;
  score: number;
  earnings: number | undefined;
  diff_down: number | undefined;
};

const PlayerCard: React.FC<PlayerCardProps> = ({
  position,
  name,
  score,
  earnings,
  diff_down,
}) => {
  return (
    <>
      <div
        style={{
          maxWidth: "400px",
          position: "relative",
          margin: "0 auto",
          marginBottom: 0,
        }}
      >
        <Card
          sx={{
            zIndex: 10,
            display: "flex",
            width: "80%",
            margin: "0 auto",
            maxWidth: "400px",
            justifyContent: "space-between",
            borderRadius: "20px",
            backgroundColor: "#FFFBF0",
          }}
        >
          <CardContent
            sx={{ flex: "1 0 auto", paddingBottom: "16px !important" }}
          >
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid item xs>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item>
                    <Typography component="div">{position}.</Typography>
                  </Grid>
                  <Grid item>
                    <Typography component="div">{name}</Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs style={{ textAlign: "right" }}>
                {earnings ? (
                  <Chip
                    sx={{
                      borderColor: "white",
                      backgroundColor: earnings > 0 ? "#5CC689" : "#F1593E",
                      color: "white",
                    }}
                    label={
                      earnings > 0 ? `+ ${earnings} kr` : `- ${-earnings} kr`
                    }
                    variant="outlined"
                  />
                ) : (
                  ""
                )}
              </Grid>
              <Grid xs={2} item>
                <Typography component="div" sx={{ textAlign: "right" }}>
                  <b>{score} p</b>
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        {diff_down ? (
          <>
            <br />
            <Chip
              sx={{
                fontSize: "14px",
                backgroundColor: "#BFF2F5",
                padding: 0,
                width: "73px",
                position: "absolute",
                right: 5,
                marginTop: "-27px",
                zIndex: 100,
              }}
              label={`\u21D5 ${diff_down} p`}
            ></Chip>
          </>
        ) : (
          ""
        )}
      </div>
    </>
  );
};

export default PlayerCard;
