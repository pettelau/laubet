from collections import defaultdict
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Response

from db_instance import database

bb_router = APIRouter()

## BONDEBRIDGE

from pydantic import BaseModel


class UserCreate(BaseModel):
    nickname: str


class GameCreate(BaseModel):
    money_multiplier: int
    extra_cost_loser: int
    extra_cost_second_last: int
    players: List[int]


class PlayerScoreCreate(BaseModel):
    player_scores_id: Optional[int] = None
    game_player_id: Optional[int] = None
    num_tricks: Optional[int] = None
    stand: Optional[bool] = None


class RoundCreate(BaseModel):
    dealer_index: int
    locked: bool
    num_cards: int
    player_scores: List[PlayerScoreCreate]


class RoundsCreate(BaseModel):
    game_id: int
    game_player_ids: List[int]
    rounds: List[RoundCreate]


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
    games_query = "SELECT * FROM games ORDER BY game_id DESC;"
    try:
        games = await database.fetch_all(games_query)
    except Exception as e:
        # Log the exception and raise a 500 error
        print("Error fetching games:", str(e))
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching games"
        )

    # Initialize the list of games with players
    games_with_players = []

    for game in games:
        players_query = """
            SELECT game_players.player_id, game_player_id, nickname, score
            FROM games
            NATURAL JOIN game_players
            LEFT JOIN bonde_users ON game_players.player_id = bonde_users.player_id
            WHERE game_id = :game_id;
        """
        try:
            players_result = await database.fetch_all(
                players_query, {"game_id": game["game_id"]}
            )
        except Exception as e:
            # Log the exception and raise a 500 error
            print(f"Error fetching players for game_id {game['game_id']}:", str(e))
            raise HTTPException(
                status_code=500, detail="An error occurred while fetching players"
            )

        game_with_players = dict(game)
        game_with_players["players"] = [
            {"nickname": player["nickname"], "score": player["score"]}
            for player in players_result
        ]
        games_with_players.append(game_with_players)

    return {"games": games_with_players}


@bb_router.get("/game/{game_id}")
async def get_game(game_id: int):
    game_query = "SELECT * FROM games WHERE game_id = :game_id;"
    try:
        game = await database.fetch_one(game_query, {"game_id": game_id})
    except Exception as e:
        print(f"Error fetching game with game_id {game_id}:", str(e))
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching the game"
        )
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    rounds_query = "SELECT round_id, num_cards, dealer_index, locked FROM rounds WHERE game_id = :game_id;"
    try:
        rounds = await database.fetch_all(rounds_query, {"game_id": game_id})
    except Exception as e:
        print(f"Error fetching rounds for game_id {game_id}:", str(e))
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching rounds"
        )

    rounds_with_scores = []
    for round in rounds:
        round_dict = dict(round)
        round_scores_query = "SELECT player_scores_id, num_tricks, stand FROM player_scores WHERE round_id = :round_id ORDER BY player_scores_id ASC;"
        try:
            round_scores = await database.fetch_all(
                round_scores_query, {"round_id": round["round_id"]}
            )
            round_dict["player_scores"] = round_scores
            rounds_with_scores.append(round_dict)
        except Exception as e:
            print(
                f"Error fetching player scores for round_id {round['round_id']}:",
                str(e),
            )
            raise HTTPException(
                status_code=500, detail="An error occurred while fetching player scores"
            )

    players_query = """
        SELECT nickname, bleedings, warnings, score, game_player_id, game_players.player_id
        FROM games
        NATURAL JOIN game_players
        LEFT JOIN bonde_users ON game_players.player_id = bonde_users.player_id
        WHERE game_id = :game_id ORDER BY game_player_id ASC;
    """
    try:
        players = await database.fetch_all(players_query, {"game_id": game_id})
    except Exception as e:
        print(f"Error fetching players for game_id {game_id}:", str(e))
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching players"
        )
    return {"game": game, "rounds": rounds_with_scores, "players": players}


@bb_router.get("/users")
async def get_users():
    query = "SELECT player_id, nickname FROM bonde_users;"
    try:
        users = await database.fetch_all(query)
    except Exception as e:
        print(f"Error fetching users: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Something went wrong. Could not fetch users"
        )
    return {"users": users}


@bb_router.post("/game")
async def create_game(game: GameCreate):
    try:
        query1 = """
            INSERT INTO games(money_multiplier, extra_cost_loser, extra_cost_second_last)
            VALUES (:money_multiplier, :extra_cost_loser, :extra_cost_second_last)
            RETURNING game_id;
        """
        game_id = await database.execute(
            query1,
            {
                "money_multiplier": game.money_multiplier,
                "extra_cost_loser": game.extra_cost_loser,
                "extra_cost_second_last": game.extra_cost_second_last,
            },
        )

        game_player_ids = []
        # Add players to game_players table
        for player_id in game.players:
            query2 = """
                INSERT INTO game_players(game_id, player_id)
                VALUES (:game_id, :player_id)
                RETURNING game_player_id;
            """
            game_player_id = await database.execute(
                query2, {"game_id": game_id, "player_id": player_id}
            )
            game_player_ids.append(game_player_id)

    except Exception as e:
        print(f"Error creating game: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Something went wrong. Could not create game"
        )

    return {
        "game_id": game_id,
        "game_player_ids": game_player_ids,
    }


@bb_router.post("/rounds")
async def create_rounds(rounds: RoundsCreate):
    try:
        round_ids = []
        player_scores_ids = []
        game_id = rounds.game_id

        # Add all rounds
        for round in rounds.rounds:
            query = """
                INSERT INTO rounds(game_id, num_cards, dealer_index)
                VALUES (:game_id, :num_cards, :dealer_index)
                RETURNING round_id;
            """
            round_id_result = await database.fetch_one(
                query,
                {
                    "game_id": game_id,
                    "num_cards": round.num_cards,
                    "dealer_index": round.dealer_index,
                },
            )
            if not round_id_result:
                raise HTTPException(
                    status_code=500, detail="Failed to retrieve the created round ID"
                )

            round_id = round_id_result["round_id"]
            round_ids.append(round_id)

            # Add all player scores for each round
            scores_id_round = []
            for game_player_id in rounds.game_player_ids:
                query = """
                    INSERT INTO player_scores(round_id, game_player_id)
                    VALUES (:round_id, :game_player_id)
                    RETURNING player_scores_id;
                """
                player_scores_id_result = await database.fetch_one(
                    query,
                    {
                        "round_id": round_id,
                        "game_player_id": game_player_id,
                    },
                )
                if not player_scores_id_result:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to add player score for round {round_id}",
                    )
                scores_id_round.append(player_scores_id_result["player_scores_id"])

            player_scores_ids.append(scores_id_round)

    except Exception as e:
        print(f"Error creating rounds: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Something went wrong. Could not create rounds"
        )

    return {
        "created": True,
        "round_ids": round_ids,
        "player_scores_ids": player_scores_ids,
    }


@bb_router.put("/rounds")
async def update_round(data: dict):
    try:
        # Update player_scores
        for round in data["rounds"]:
            for player_score in round["player_scores"]:
                query = """
                    UPDATE player_scores
                    SET num_tricks = :num_tricks, stand = :stand
                    WHERE player_scores_id = :player_scores_id
                """
                await database.execute(
                    query,
                    {
                        "num_tricks": player_score["num_tricks"],
                        "stand": player_score["stand"],
                        "player_scores_id": player_score["player_scores_id"],
                    },
                )

    except Exception as e:
        print(f"Error updating round: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Something went wrong. Could not update round"
        )

    return {"message": "Round updated successfully"}


@bb_router.put("/playerdata")
async def update_player_scores(data: dict):
    try:
        # Update player_scores
        for player in data["playerData"]:
            try:
                query = """
                    UPDATE game_players
                    SET score = :score,
                    warnings = :warnings,
                    bleedings = :bleedings
                    WHERE game_player_id = :game_player_id
                """
                await database.execute(
                    query,
                    {
                        "score": player["score"],
                        "warnings": player["warnings"],
                        "bleedings": player["bleedings"],
                        "game_player_id": player["game_player_id"],
                    },
                )
            except KeyError:
                print("KeyError: One of the expected keys was not found in the data")

    except Exception as e:
        print(f"Error updating player scores: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong. Could not update player scores",
        )

    return {"message": "Player scores updated successfully"}


@bb_router.put("/game/complete/{game_id}")
async def update_round(game_id: int):
    try:
        query = "UPDATE games SET status = 'finished' WHERE game_id = :game_id"
        await database.execute(query, {"game_id": game_id})

    except Exception as e:
        print(f"Error completing game with game_id {game_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Something went wrong. Could not complete game"
        )

    return {"message": "Game completed successfully"}


## STATISTICS


async def calc_player_earnings(playerIds: Optional[str]):
    try:
        game_ids_query = "SELECT game_id, money_multiplier, extra_cost_loser, extra_cost_second_last FROM games WHERE status = 'finished'"
        games = await database.fetch_all(game_ids_query)

        player_earnings = dict()  # Format {1: -40, 2: 54, 3: 187 ...}
        player_nicknames = dict()  # To store player_id to nickname mapping

        for game in games:
            players_query = """
                SELECT score, bonde_users.player_id, nickname
                FROM game_players
                LEFT JOIN bonde_users ON game_players.player_id = bonde_users.player_id
                WHERE game_id = :game_id
            """
            players = await database.fetch_all(
                players_query, {"game_id": game["game_id"]}
            )

            # Update player_nicknames dictionary
            for player in players:
                player_nicknames[player["player_id"]] = player["nickname"]

            player_ids_list = playerIds.split(",") if playerIds else None
            game_player_ids = [str(player["player_id"]) for player in players]

            if player_ids_list is None or set(player_ids_list) == set(game_player_ids):
                # Sort players by scores
                players.sort(key=lambda x: x["score"], reverse=True)

                if len(players) < 4:
                    continue
                # Calculate earnings/losses
                first_place, last_place = players[0], players[-1]
                second_place, second_last_place = players[1], players[-2]

                # Initialize earnings and losses
                first_place_earnings = second_place_earnings = 0
                last_place_earnings = second_last_earnings = 0

                # Check for ties between first and second, and last and second last
                if first_place["score"] == second_place["score"]:
                    # If first and second place tie, split combined earnings
                    total_earnings = (
                        (first_place["score"] - last_place["score"])
                        * game["money_multiplier"]
                        + game["extra_cost_loser"]
                    ) + (
                        (second_place["score"] - second_last_place["score"])
                        * game["money_multiplier"]
                        + game["extra_cost_second_last"]
                    )
                    first_place_earnings = second_place_earnings = total_earnings / 2
                else:
                    # Calculate earnings for first and second places normally
                    first_place_earnings = (
                        first_place["score"] - last_place["score"]
                    ) * game["money_multiplier"] + game["extra_cost_loser"]
                    second_place_earnings = (
                        second_place["score"] - second_last_place["score"]
                    ) * game["money_multiplier"] + game["extra_cost_second_last"]

                if last_place["score"] == second_last_place["score"]:
                    # If last and second last tie, split the total losses
                    total_loss = -(first_place_earnings + second_place_earnings)
                    last_place_earnings = second_last_earnings = total_loss / 2
                else:
                    last_place_earnings = -first_place_earnings
                    second_last_earnings = -second_place_earnings

                # Special edge cases
                if (
                    first_place["score"]
                    == second_place["score"]
                    == second_last_place["score"]
                    == last_place["score"]
                ):
                    first_place_earnings = second_place_earnings = (
                        second_last_earnings
                    ) = last_place_earnings = 0
                elif (
                    first_place["score"]
                    == second_place["score"]
                    == second_last_place["score"]
                ):
                    first_place_earnings = second_place_earnings = (
                        second_last_earnings
                    ) = (last_place_earnings / 3)
                elif (
                    second_place["score"]
                    == second_last_place["score"]
                    == last_place["score"]
                ):
                    second_place_earnings = second_last_earnings = (
                        last_place_earnings
                    ) = 0
                if second_last_place["score"] == second_place["score"]:
                    second_last_earnings = second_place_earnings = 0

                # Update player_earnings
                for player in players:
                    player_id = player["player_id"]
                    if player_id == first_place["player_id"]:
                        earnings = first_place_earnings
                    elif player_id == last_place["player_id"]:
                        earnings = last_place_earnings
                    elif player_id == second_place["player_id"]:
                        earnings = second_place_earnings
                    elif player_id == second_last_place["player_id"]:
                        earnings = second_last_earnings
                    else:
                        earnings = 0  # For players not in first, second, last, or second last place

                    if player_id in player_earnings:
                        player_earnings[player_id] += earnings
                    else:
                        player_earnings[player_id] = earnings
            else:
                continue

        # Swap player_id with nickname
        final_earnings = {
            player_nicknames[player_id]: earnings
            for player_id, earnings in player_earnings.items()
            if player_id in player_nicknames
        }

        return final_earnings

    except Exception as e:
        print(f"Error calculating player earnings: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error calculating player earnings: {e}"
        )


@bb_router.get("/stats")
async def get_stats(
    playerIds: Optional[str] = None, exclusiveselect: Optional[str] = "False"
):
    # Fetching needed data from db
    try:
        base_query1 = """
        SELECT SUM(num_tricks), MAX(num_cards) as num_cards
        FROM player_scores
        NATURAL JOIN rounds LEFT JOIN games on rounds.game_id = games.game_id
        WHERE stand IS NOT NULL
        """
        base_query2 = """
        SELECT 
            r.num_cards,
            ps.num_tricks,
            ROUND(100.0 * SUM(CASE WHEN ps.stand THEN 1 ELSE 0 END) / COUNT(*), 2) AS stand_percentage,
            COUNT(*) AS total_occurrences
        FROM 
            rounds r
        JOIN 
            player_scores ps ON r.round_id = ps.round_id
        JOIN
            games ON r.game_id = games.game_id
        WHERE 
            ps.num_tricks IS NOT NULL
        """
        base_query3 = """
        select
            bu.nickname,
            r.num_cards,
            ROUND(AVG(ps.num_tricks), 1) AS avg_tricks,
            COUNT(DISTINCT r.round_id) AS num_rounds
        from
            player_scores ps
        left join rounds r on
            ps.round_id = r.round_id
        left join game_players gp on
            ps.game_player_id = gp.game_player_id
        left join bonde_users bu on
            gp.player_id = bu.player_id
        left join games g on r.game_id = g.game_id 
        """
        base_query4 = """
        select
            bu.nickname,
            r.num_cards,
            ROUND(AVG(ps.num_tricks), 1) AS avg_tricks,
            COUNT(DISTINCT r.round_id) AS num_rounds
        from
            player_scores ps
        left join rounds r on
            ps.round_id = r.round_id
        left join game_players gp on
            ps.game_player_id = gp.game_player_id
        left join bonde_users bu on
            gp.player_id = bu.player_id
        left join games g on r.game_id = g.game_id 
        """
        exclusive = exclusiveselect.lower() == "true"
        # If playerIds are provided, filter results
        if playerIds:
            ids_list = playerIds.split(",")
            ids_list = [int(id) for id in ids_list]
            player_condition = f" AND games.game_id IN (SELECT game_id \
                            FROM game_players \
                            WHERE player_id IN ({','.join([str(id) for id in ids_list])}) \
                            GROUP BY game_id"
            if exclusive:
                player_condition += (
                    f" HAVING COUNT(DISTINCT player_id) = {len(ids_list)})"
                )
            else:
                player_condition += ")"
            base_query1 += player_condition
            base_query2 += player_condition
            base_query3 += f" WHERE gp.player_id IN ({','.join([str(id) for id in ids_list])}) and g.status = 'finished'"
            base_query4 += f" WHERE gp.player_id IN ({','.join([str(id) for id in ids_list])}) and ps.stand = TRUE group by r.num_cards, bu.nickname"
        else:
            base_query3 += "WHERE g.status = 'finished'"
            base_query4 += "WHERE ps.stand = TRUE group by r.num_cards, bu.nickname"
        base_query1 += " GROUP BY round_id ORDER BY num_cards DESC;"
        base_query2 += (
            "  GROUP BY r.num_cards, ps.num_tricks ORDER BY r.num_cards, ps.num_tricks"
        )
        base_query3 += " group by r.num_cards, bu.nickname"

        print("Executing base_query1:", base_query1)
        result1 = await database.fetch_all(base_query1)
        print("Result1:", result1)

        print("Executing base_query2:", base_query2)
        result2 = await database.fetch_all(base_query2)
        print("Result2:", result2)

        print("Executing base_query3:", base_query3)
        result3 = await database.fetch_all(base_query3)
        print("Result3:", result3)

        print("Executing base_query4:", base_query4)
        result4 = await database.fetch_all(base_query4)
        print("Result4:", result4)

        if not result1 or not result2 or not result3 or not result4:
            return Response(status_code=204)

        player_earnings = await calc_player_earnings(playerIds)

        bleedings_query = "select nickname, SUM(bleedings) as total_bleedings, SUM(warnings) as total_warnings from game_players left join bonde_users on game_players.player_id = bonde_users.player_id group by bonde_users.nickname order by total_bleedings DESC"
        bleedings = await database.fetch_all(bleedings_query)

        if result1 and result2:
            num_underbid = 0
            num_overbid = 0
            total_diff = 0
            diffs = {}
            counts = {}
            chart_data = []
            for row in result1:
                sum_val = row["sum"]
                num_cards = row["num_cards"]
                if sum_val < num_cards:
                    num_underbid += 1
                else:
                    num_overbid += 1
                total_diff += sum_val - num_cards
                difference = sum_val - num_cards
                if num_cards in diffs:
                    diffs[num_cards] += difference
                    counts[num_cards] += 1
                else:
                    diffs[num_cards] = difference
                    counts[num_cards] = 1
            total_avg_diff = round((total_diff / len(result1)), 1)
            for num_cards in diffs:
                avg_diff = round(diffs[num_cards] / counts[num_cards], 2)
                chart_data.append({"name": str(num_cards), "value": avg_diff})

            perc_underbid = round(num_underbid / len(result1) * 100, 1)

            success_rate_data = dict()
            for row in result2:
                print("row", row)
                num_cards = row["num_cards"]
                num_tricks = row["num_tricks"]
                stand_percentage = row["stand_percentage"]
                total_occurrences = row["total_occurrences"]

                if num_cards not in success_rate_data:
                    success_rate_data[num_cards] = {}

                success_rate_data[num_cards][num_tricks] = {
                    "stand_percentage": stand_percentage,
                    "total_occurrences": total_occurrences,
                }
            avg_bids_by_cards = {}
            for item in result3:
                num_cards = item["num_cards"]
                nickname = item["nickname"]
                avg = round(item["avg_tricks"], 1)
                if num_cards not in avg_bids_by_cards:
                    avg_bids_by_cards[num_cards] = {"num_cards": num_cards}
                avg_bids_by_cards[num_cards][nickname] = avg
            player_aggression = list(avg_bids_by_cards.values())
            avg_bids_by_cards_stand = {}
            for item in result4:
                num_cards = item["num_cards"]
                nickname = item["nickname"]
                avg = round(item["avg_tricks"], 1)
                if num_cards not in avg_bids_by_cards_stand:
                    avg_bids_by_cards_stand[num_cards] = {"num_cards": num_cards}
                avg_bids_by_cards_stand[num_cards][nickname] = avg
            player_aggression_stand = list(avg_bids_by_cards_stand.values())
            success_rate_data = dict(success_rate_data)

            return {
                "perc_underbid": perc_underbid,
                "total_avg_diff": total_avg_diff,
                "avg_diffs": chart_data,
                "success_rates": success_rate_data,
                "player_earnings": player_earnings,
                "bleedings": bleedings,
                "player_aggression": player_aggression,
                "player_aggression_stand": player_aggression_stand,
            }
        else:
            return Response(status_code=204)

    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail=f"Error: {e}")
