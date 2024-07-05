from typing import List
from fastapi import APIRouter, HTTPException

from db_instance import database

bb_router = APIRouter()

## BONDEBRIDGE

from psycopg2 import IntegrityError
from pydantic import BaseModel


class UserCreate(BaseModel):
    nickname: str


class GameCreate(BaseModel):
    money_multiplier: int
    extra_cost_loser: int
    extra_cost_second_last: int
    players: List[int]  # List of player IDs


class RoundCreate(BaseModel):
    game_id: int
    num_cards: int
    dealer_index: int


class PlayerScoreCreate(BaseModel):
    round_id: int
    num_tricks: int
    stand: bool


@bb_router.post("/adduser")
async def add_player(player: dict):
    check_query = "SELECT COUNT(*) FROM bonde_users WHERE nickname = :nickname"
    result = await database.fetch_one(check_query, {"nickname": player["nickname"]})

    if result[0] > 0:
        raise HTTPException(
            status_code=400, detail="Brukernavn finnes allerede i databasen"
        )

    insert_query = "INSERT INTO bonde_users(nickname) VALUES (:nickname)"
    await database.execute(insert_query, {"nickname": player["nickname"]})
    return {"addUser": True}


@bb_router.get("/games")
async def get_users():
    # try:
    query = "SELECT * FROM games ORDER BY game_id DESC;"
    games = fetchDBJsonNew(query)

    # Loop through each game and get the players for that game
    for game in games:
        players_query = """
            SELECT game_players.player_id, game_player_id, nickname, score
            FROM games
            NATURAL JOIN game_players
            LEFT JOIN bonde_users ON game_players.player_id = bonde_users.player_id
            WHERE game_id = %s;
        """
        players_result = fetchDBJsonNew(players_query, (game["game_id"],))
        game["players"] = [
            {"nickname": player["nickname"], "score": player["score"]}
            for player in players_result
        ]

    # except Exception as e:
    #     return HTTPException(
    #         status_code=500, detail="Something wrong. Could not fetch games"
    #     )
    return {"games": games}


# @bb_router.get("/game/{game_id}")
# async def get_game(game_id: int):
#     query = "SELECT * FROM games WHERE game_id = %s;"
#     game = fetchDBJsonNew(query, (game_id,))

#     # Fetch corresponding rounds
#     rounds_query = "SELECT round_id, num_cards, dealer_index, locked FROM rounds WHERE game_id = %s;"
#     rounds = fetchDBJsonNew(rounds_query, (game_id,))

#     for round in rounds:
#         round_scores_qurey = "SELECT player_scores_id, num_tricks, stand FROM player_scores WHERE round_id = %s ORDER BY player_scores_id ASC;"
#         round_scores = fetchDBJsonNew(round_scores_qurey, (round["round_id"],))
#         round["player_scores"] = round_scores

#     players_query = """
#             SELECT nickname, game_player_id, game_players.player_id
#             FROM games
#             NATURAL JOIN game_players
#             LEFT JOIN bonde_users ON game_players.player_id = bonde_users.player_id
#             WHERE game_id = %s ORDER BY game_player_id ASC;
#         """
#     players = fetchDBJsonNew(players_query, (game_id,))

#     return {"game": game, "rounds": rounds, "players": players}


# @bb_router.get("/users")
# async def get_users():
#     try:
#         query = "SELECT player_id, nickname FROM bonde_users;"
#         users = fetchDBJson(query)
#     except Exception as e:
#         return HTTPException(
#             status_code=500, detail="Something wrong. Could not fetch users"
#         )
#     return {"users": users}


# @bb_router.post("/game")
# async def create_game(game: GameCreate):
#     # try:
#     cursor = connection.cursor()
#     query1 = "INSERT INTO games(money_multiplier, extra_cost_loser, extra_cost_second_last) VALUES (%s, %s, %s) RETURNING game_id;"
#     cursor.execute(
#         query1,
#         (game.money_multiplier, game.extra_cost_loser, game.extra_cost_second_last),
#     )
#     game_id = cursor.fetchone()[0]

#     game_player_ids = []
#     # Add players to game_players table
#     for player_id in game.players:
#         query = "INSERT INTO game_players(game_id, player_id) VALUES (%s, %s) RETURNING game_player_id;"
#         cursor.execute(query, (game_id, player_id))
#         game_player_ids.append(cursor.fetchone()[0])

#     connection.commit()
#     # except Exception as e:
#     #     return HTTPException(
#     #         status_code=500, detail="Something wrong. Could not create game"
#     #     )

#     return {
#         "game_id": game_id,
#         "game_player_ids": game_player_ids,
#     }


# @bb_router.post("/rounds")
# async def create_rounds(rounds: dict):
#     try:
#         cursor = connection.cursor()
#         round_ids = []
#         player_scores_ids = []
#         game_id = rounds["game_id"]

#         # Add all rounds
#         for round in rounds["rounds"]:
#             query = "INSERT INTO rounds(game_id, num_cards, dealer_index) VALUES (%s, %s, %s) RETURNING round_id;"
#             cursor.execute(query, (game_id, round["num_cards"], round["dealer_index"]))
#             round_id = cursor.fetchone()[0]
#             round_ids.append(round_id)

#             # Add all player scores for each round
#             scores_id_round = []

#             for _ in range(rounds["num_players"]):
#                 query = "INSERT INTO player_scores(round_id) VALUES (%s) RETURNING player_scores_id;"
#                 cursor.execute(query, (round_id,))
#                 player_scores_id = cursor.fetchone()[0]
#                 scores_id_round.append(player_scores_id)

#             player_scores_ids.append(scores_id_round)

#         connection.commit()
#     except Exception as e:
#         return HTTPException(
#             status_code=500, detail="Something wrong. Could not update round"
#         )

#     return {"created": True}


# @bb_router.put("/rounds")
# async def update_round(data: dict):
#     # Connect to the database
#     # try:
#     cursor = connection.cursor()

#     # # Update the rounds table
#     # cursor.execute(
#     #     "UPDATE rounds SET num_cards = %s, dealer_index = %s, locked = %s WHERE round_id = %s",
#     #     (
#     #         roundData["num_cards"],
#     #         roundData["dealer_index"],
#     #         roundData["locked"],
#     #         round_id,
#     #     ),
#     # )
#     # Update player_scores
#     print(data)
#     for round in data["rounds"]:
#         for player_score in round["player_scores"]:
#             cursor.execute(
#                 "UPDATE player_scores SET num_tricks = %s, stand = %s WHERE player_scores_id = %s",
#                 (
#                     player_score["num_tricks"],
#                     player_score["stand"],
#                     player_score["player_scores_id"],
#                 ),
#             )
#     connection.commit()
#     # except Exception as e:
#     #     return HTTPException(
#     #         status_code=500, detail="Something wrong. Could not update round"
#     #     )

#     return {"message": "Round updated successfully"}


# @bb_router.put("/playerdata")
# async def update_player_scores(data: dict):
#     # Connect to the database
#     # try:
#     print(data)
#     cursor = connection.cursor()

#     # Update player_scores
#     for player in data["playerData"]:
#         try:
#             cursor.execute(
#                 "UPDATE game_players SET score = %s WHERE game_player_id = %s",
#                 (
#                     player["score"],
#                     player["game_player_id"],
#                 ),
#             )
#         except KeyError:
#             print("KeyError")
#     connection.commit()
#     # except Exception as e:
#     #     return HTTPException(
#     #         status_code=500, detail="Something wrong. Could not update player scores"
#     #     )

#     return {"message": "Player scores updated successfully"}


# @bb_router.put("/api/game/complete/{game_id}")
# async def update_round(game_id: int):
#     # Connect to the database
#     try:
#         cursor = connection.cursor()
#         cursor.execute(
#             "UPDATE games SET status = 'finished' WHERE game_id = %s",
#             (game_id,),
#         )

#         connection.commit()
#     except Exception as e:
#         return HTTPException(
#             status_code=500, detail="Something wrong. Could not complete game"
#         )

#     return {"message": "Game completed successfully"}
