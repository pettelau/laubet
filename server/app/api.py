from collections import defaultdict
from typing import List, Optional
from fastapi import HTTPException, Response
from time import sleep
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from .postgresPool import pool
from string import Template
import bcrypt
from .auth_utils import authUtils
from psycopg2.extras import RealDictCursor
import datetime
import pytz
from dateutil import parser
from zoneinfo import ZoneInfo

from psycopg2.errors import UniqueViolation
from psycopg2 import IntegrityError


try:
    connection = pool.getconn()

except (Exception, psycopg2.DatabaseError) as error:
    print("Error while connecting to PostgreSQL", error)


def fetchDB(query):
    cursor = connection.cursor()
    cursor.execute(query)
    result = cursor.fetchall()
    return result


def fetchDBJson(query):
    cursor = connection.cursor(cursor_factory=RealDictCursor)
    cursor.execute(query)
    result = cursor.fetchall()
    return result


def fetchDBJsonNew(query, params=None):
    cursor = connection.cursor(cursor_factory=RealDictCursor)
    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        result = cursor.fetchall()
        return result
    except Exception as e:
        print("Error:", e)
        return None


def insertDB(query):
    cursor = connection.cursor()
    cursor.execute(query)
    connection.commit()


# conn = psycopg2.connect(
# host=Credentials.host,
# database=Credentials.db,
# user=Credentials.user,
# password=Credentials.password,
# )
# # create a cursor
# cur = conn.cursor()


# # execute a statement
# print("PostgreSQL database version:")
# cur.execute("SELECT * from accounts;")

# # display the PostgreSQL database server version
# db_version = cur.fetchone()
# print(db_version)


app = FastAPI()

origins = ["*"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/openbets")
async def get_open_bets(token: str = Depends(authUtils.validate_access_token)):
    bets = fetchDBJson(
        "select * from bets where bet_status = 1 and is_accepted = true and close_timestamp > NOW() and closed_early IS NULL ORDER BY close_timestamp ASC"
    )
    bets_with_options = []
    for bet in bets:
        options = fetchDBJson(
            Template(
                "select option_id, latest_odds, option_status, option from bet_options where bet = $bet"
            ).safe_substitute({"bet": bet["bet_id"]})
        )
        bet_with_option = bet
        bet_with_option["bet_options"] = options
        bets_with_options.append(bet_with_option)
    return bets_with_options


@app.get("/api/requestedbets")
async def get_open_bets(token: str = Depends(authUtils.validate_access_token)):
    bets = fetchDBJson("select * from bets where is_accepted = false")
    bets_with_options = []
    for bet in bets:
        options = fetchDBJson(
            Template(
                "select option_id, latest_odds, option_status, option from bet_options where bet = $bet"
            ).safe_substitute({"bet": bet["bet_id"]})
        )
        bet_with_option = bet
        bet_with_option["bet_options"] = options
        bets_with_options.append(bet_with_option)
    return bets_with_options


# leaderboard date range, currently not implemented
# @app.get("/api/leaderboard/")
# async def get_open_bets(
#     fromDate, toDate, token: str = Depends(authUtils.validate_access_token)
# ) :
#     print(fromDate, toDate)


@app.get("/api/leaderboard")
async def get_leaderboard(
    token: str = Depends(authUtils.validate_access_token),
):
    leaderboard_data = []
    try:
        users = fetchDBJson("select username, user_id, balance from users")
        for user in users:
            user_data = {"username": user["username"], "balance": user["balance"]}
            won_accums = fetchDBJson(
                Template(
                    "select count(*) from accums where user_id = $user_id and paid_out=true"
                ).safe_substitute({"user_id": user["user_id"]})
            )
            total_accums = fetchDBJson(
                Template(
                    "select count(*) from accums where user_id = $user_id"
                ).safe_substitute({"user_id": user["user_id"]})
            )
            user_data["won_accums"] = won_accums[0]["count"]
            user_data["total_accums"] = total_accums[0]["count"]

            leaderboard_data.append(user_data)
    except Exception as e:
        print("feil her", e)
    return leaderboard_data


def is_admin(username):
    res = fetchDBJson(
        Template(
            "select admin from users where username = '$username'"
        ).safe_substitute({"username": username})
    )
    if res[0]["admin"]:
        return True
    else:
        return False


@app.get("/api/admin/allbets")
async def get_all_admin_bets(
    token: str = Depends(authUtils.validate_access_token),
):
    if is_admin(token["user"]):
        bets = fetchDBJson("select * from bets")
        bets_with_options = []
        for bet in bets:
            options = fetchDBJson(
                Template(
                    "select option_id, latest_odds, option_status, option from bet_options where bet = $bet"
                ).safe_substitute({"bet": bet["bet_id"]})
            )
            bet_with_option = bet
            bet_with_option["bet_options"] = options
            bets_with_options.append(bet_with_option)
        return bets_with_options
    else:
        raise HTTPException(status_code=403, detail="You are not admin")


@app.get("/api/dictionary")
async def get_dictionary(token: str = Depends(authUtils.validate_access_token)):
    res = fetchDBJson("select * from dictionary order by word_id DESC")
    return res


@app.get("/api/competition")
async def get_dictionary(token: str = Depends(authUtils.validate_access_token)):
    res = fetchDBJson(
        "select username, registered from users left join competition on users.user_id = competition.user_id"
    )
    return res


@app.post("/api/submitword")
async def add_to_dictionary(
    payload: dict, token: str = Depends(authUtils.validate_access_token)
):
    try:
        cursor = connection.cursor()
        query = Template(
            "insert into dictionary(frequency, description, submitter, word) values ($frequency, '$description', '$submitter', '$word')"
        ).safe_substitute(
            {
                "frequency": payload["frequency"],
                "description": payload["description"],
                "submitter": token["user"],
                "word": payload["word"],
            }
        )
        cursor.execute(query)
        connection.commit()
        return {"submitWord": True}
    except Exception as e:
        raise HTTPException(status_code=403, detail="Something went wrong")


@app.put("/api/dictionary/updateword")
async def update_dictionary(
    payload: dict, token: str = Depends(authUtils.validate_access_token)
):
    print(payload)
    try:
        if token["user"].lower() == payload["submitter"].lower() or is_admin(
            token["user"]
        ):
            if isinstance(payload["frequency"], int):
                cursor = connection.cursor()
                query = Template(
                    "update dictionary set word='$word', frequency=$frequency, description='$description' where word_id=$word_id;"
                ).safe_substitute(
                    {
                        "word": payload["word"],
                        "frequency": payload["frequency"],
                        "description": payload["description"],
                        "word_id": payload["word_id"],
                    }
                )
                cursor.execute(query)
                connection.commit()
                return {"updatedWord": True}
            else:
                raise HTTPException(
                    status_code=422, detail="Frequency must be an integer"
                )
        else:
            raise HTTPException(
                status_code=403, detail="You cannot update another person's word"
            )
    except Exception as e:
        raise HTTPException(status_code=403, detail="Something went wrong")


@app.delete("/api/dictionary/deleteword/{word_id}")
async def delete_in_dictionary(
    word_id: str, token: str = Depends(authUtils.validate_access_token)
):
    try:
        cursor = connection.cursor()
        query = Template(
            "delete from dictionary where word_id=$word_id"
        ).safe_substitute({"word_id": word_id})
        cursor.execute(query)
        connection.commit()
        return {"deleteWord": True}
    except Exception as e:
        raise HTTPException(status_code=403, detail="Could not delete word")


@app.post("/api/updatecompetition")
async def update_comp(
    payload: dict, token: str = Depends(authUtils.validate_access_token)
):
    try:
        cursor = connection.cursor()
        query = Template(
            "insert into competition (user_id, registered) values ($user_id, $registered) on conflict (user_id) do update set user_id = excluded.user_id, registered = excluded.registered"
        ).safe_substitute(
            {"user_id": token["user_id"], "registered": payload["registered"]}
        )
        cursor.execute(query)
        connection.commit()
        return {"submitWord": True}
    except Exception as e:
        raise HTTPException(status_code=403, detail="Something went wrong")


@app.get("/api/accums")
async def get_accums(token: str = Depends(authUtils.validate_access_token)):
    accums = fetchDBJson(
        Template(
            "select accum_id, stake, total_odds, username, placed_timestamp from accums left join users on accums.user_id = users.user_id where accums.user_id = $user_id order by placed_timestamp DESC"
        ).safe_substitute({"user_id": token["user_id"]})
    )
    accums_with_options = []
    for accum in accums:
        accum = accum
        accum_options = fetchDBJson(
            Template(
                "select bets.title, accum_options.user_odds, bet_options.option, bet_options.option_status from bet_options natural join accum_options left join bets on bet_options.bet = bets.bet_id inner join accums on accum_options.accum_id = accums.accum_id where accums.accum_id = $accum_id"
            ).safe_substitute({"accum_id": accum["accum_id"]})
        )

        accum["accumBets"] = accum_options
        accums_with_options.append(accum)
    return accums_with_options


@app.get("/api/useraccums/")
async def get_accums(user, token: str = Depends(authUtils.validate_access_token)):
    accums = fetchDBJson(
        Template(
            "select accum_id, stake, total_odds, username, placed_timestamp from accums left join users on accums.user_id = users.user_id where users.username = '$user' order by placed_timestamp DESC"
        ).safe_substitute({"user": user})
    )
    accums_with_options = []
    for accum in accums:
        accum = accum
        accum_options = fetchDBJson(
            Template(
                "select bets.title, accum_options.user_odds, bet_options.option, bet_options.option_status from bet_options natural join accum_options left join bets on bet_options.bet = bets.bet_id inner join accums on accum_options.accum_id = accums.accum_id where accums.accum_id = $accum_id"
            ).safe_substitute({"accum_id": accum["accum_id"]})
        )

        accum["accumBets"] = accum_options
        accums_with_options.append(accum)
    return accums_with_options


@app.get("/api/publicuserdata/")
async def get_accums(user, token: str = Depends(authUtils.validate_access_token)):
    data = fetchDBJson(
        Template(
            "select balance, firstname, lastname, last_login from users where username = '$user'"
        ).safe_substitute({"user": user})
    )
    return data


@app.get("/api/allaccums")
async def get_accums(token: str = Depends(authUtils.validate_access_token)):
    accums = fetchDBJson(
        "select accum_id, stake, total_odds, username, placed_timestamp from accums left join users on accums.user_id = users.user_id order by placed_timestamp DESC"
    )
    accums_with_options = []
    for accum in accums:
        accum = accum
        accum_options = fetchDBJson(
            Template(
                "select bets.title, accum_options.user_odds, bet_options.option, bet_options.option_status from bet_options natural join accum_options left join bets on bet_options.bet = bets.bet_id inner join accums on accum_options.accum_id = accums.accum_id where accums.accum_id = $accum_id"
            ).safe_substitute({"accum_id": accum["accum_id"]})
        )

        accum["accumBets"] = accum_options
        accums_with_options.append(accum)
    return accums_with_options


# @app.get("/admin/allaccums")
# async def read_root() :
#     return {"message": "Admin"}


@app.get("/api/userAvailability/{user}")
async def user_availability(user: str):
    res = fetchDB(f"select exists(select 1 from users where username = '{user}')")
    if res[0][0]:
        return {"userTaken": True}
    else:
        return {"userTaken": False}


@app.get("/api/login/")
async def login(user, password):
    user_pass = fetchDB(
        Template(
            "select user_id, password from users where username = '$username'"
        ).safe_substitute({"username": user})
    )
    try:
        user_id = user_pass[0][0]
        user_pass = user_pass[0][1]

    except IndexError:
        return {"loggedIn": False}
    if bcrypt.checkpw(password.encode("utf-8"), user_pass.encode("utf-8")):
        jwt = await authUtils.create_access_token(user, user_id)
        update_last_login = Template(
            "update users set last_login = NOW() where user_id = $user_id"
        ).safe_substitute({"user_id": user_id})
        cursor = connection.cursor()
        cursor.execute(update_last_login)
        connection.commit()
        return {"loggedIn": True, "jwt": jwt}
    else:
        return {"loggedIn": False}


@app.get("/api/login/details")
async def add_user(
    token: str = Depends(authUtils.validate_access_token_nowhitelist),
):
    res = fetchDBJson(
        Template(
            "select username, balance, firstname, lastname, admin, created_on from users where username = '$username'"
        ).safe_substitute({"username": token["user"]})
    )
    update_last_login = Template(
        "update users set last_login = NOW() where user_id = $user_id"
    ).safe_substitute({"user_id": token["user_id"]})
    cursor = connection.cursor()
    cursor.execute(update_last_login)
    inc_numb_logins = Template(
        "update users set number_of_logins = number_of_logins + 1 where user_id = $user_id"
    ).safe_substitute({"user_id": token["user_id"]})
    cursor.execute(inc_numb_logins)
    connection.commit()
    return res


@app.get("/api/admin/users")
async def get_users(token: str = Depends(authUtils.validate_access_token)):
    if is_admin(token["user"]):
        res = fetchDBJson(
            "select user_id, username, balance, created_on, last_login, firstname, lastname, admin, whitelist, number_of_logins from users"
        )
        return res
    else:
        raise HTTPException(status_code=403, detail="You are not admin")


# {category: "string", title: "string", options: [{latest_odds: number, option: "string"}]}
@app.post("/api/admin/createbet")
async def create_bet(bet: dict, token: str = Depends(authUtils.validate_access_token)):
    # date_time_obj = datetime.datetime.strptime(
    #     bet["close_date"], "%Y-%m-%d %H:%M:%S.%f"
    # )
    close_date = parser.parse(bet["close_date"])
    # close_date = parser.parse(bet["close_date"]).replace(
    #     tzinfo=ZoneInfo("Europe/Berlin")
    # )
    if is_admin(token["user"]):
        # create bet
        cursor = connection.cursor()
        query1 = Template(
            "insert into bets(category, title, is_accepted, submitter, close_timestamp) values ('$category', '$title', true, '$submitter', '$close_date') RETURNING bet_id"
        ).safe_substitute(
            {
                "category": bet["category"],
                "title": bet["title"],
                "submitter": token["user"],
                "close_date": close_date,
            }
        )
        cursor.execute(query1)
        id_of_bet = cursor.fetchone()[0]

        for option in bet["options"]:
            query2 = Template(
                "insert into bet_options(latest_odds, option, bet) values ($latest_odds, '$option', $bet)"
            ).safe_substitute(
                {
                    "latest_odds": float(option["latest_odds"]),
                    "option": option["option"],
                    "bet": id_of_bet,
                }
            )
            cursor.execute(query2)
        connection.commit()
        return {"settleBet": True}
    else:
        # TODO:
        # change to this and implement frontend to support:
        # raise HTTPException(status_code=403, detail="You are not admin")
        return {"settleBet": False, "errorMsg": "Du er ikke admin"}


@app.post("/api/admin/acceptbet")
async def accept_bet(bet: dict, token: str = Depends(authUtils.validate_access_token)):
    if is_admin(token["user"]):
        try:
            cursor = connection.cursor()
            query = Template(
                "update bets set is_accepted = true where bet_id = $bet_id"
            ).safe_substitute({"bet_id": bet["bet_id"]})
            cursor.execute(query)
            connection.commit()
            return {"closeBet": True}
        except Exception as e:
            raise HTTPException(status_code=403, detail="Something went wrong")


@app.post("/api/admin/updateoption")
async def accept_bet(
    option: dict, token: str = Depends(authUtils.validate_access_token)
):
    if is_admin(token["user"]):
        try:
            cursor = connection.cursor()
            query = Template(
                "update bet_options set option = '$option', latest_odds = $latest_odds where option_id = $option_id"
            ).safe_substitute(
                {
                    "option": option["option"],
                    "latest_odds": option["latest_odds"],
                    "option_id": option["option_id"],
                }
            )
            cursor.execute(query)
            connection.commit()
            return {"updateOption": True}
        except Exception as e:
            print(e)
            raise HTTPException(status_code=403, detail="Something went wrong")


@app.post("/api/admin/addoption")
async def accept_bet(
    option: dict, token: str = Depends(authUtils.validate_access_token)
):
    if is_admin(token["user"]):
        try:
            cursor = connection.cursor()
            query = Template(
                "insert into bet_options(latest_odds, option, bet) values ($latest_odds, '$option', $bet)"
            ).safe_substitute(
                {
                    "latest_odds": option["latest_odds"],
                    "option": option["option"],
                    "bet": option["bet"],
                }
            )
            cursor.execute(query)
            connection.commit()
            return {"addOption": True}
        except Exception as e:
            print(e)
            raise HTTPException(status_code=403, detail="Something went wrong")


@app.post("/api/admin/updatewl")
async def accept_bet(
    payload: dict, token: str = Depends(authUtils.validate_access_token)
):
    if is_admin(token["user"]):
        try:
            cursor = connection.cursor()
            query = Template(
                "update users set whitelist = $whitelisted where user_id = $user_id"
            ).safe_substitute(
                {"whitelisted": payload["whitelisted"], "user_id": payload["user_id"]}
            )
            cursor.execute(query)
            connection.commit()
            return {"updateWhitelist": True}
        except Exception as e:
            raise HTTPException(status_code=403, detail="Something went wrong")


@app.post("/api/admin/closebet")
async def accept_bet(bet: dict, token: str = Depends(authUtils.validate_access_token)):
    if is_admin(token["user"]):
        try:
            cursor = connection.cursor()
            query = Template(
                "update bets set closed_early = NOW() where bet_id = $bet_id"
            ).safe_substitute({"bet_id": bet["bet_id"]})
            cursor.execute(query)
            connection.commit()
            return {"acceptBet": True}
        except Exception as e:
            raise HTTPException(status_code=403, detail="Something went wrong")


@app.post("/api/admin/resetPassword")
async def reset_password(
    payload: dict, token: str = Depends(authUtils.validate_access_token)
):
    if is_admin(token["user"]):
        try:
            hashed = bcrypt.hashpw(
                bytes(payload["new_password"], encoding="utf-8"), bcrypt.gensalt()
            )

            update_password = Template(
                "update users set password = '$password' where user_id = $user_id"
            ).safe_substitute(
                {"password": hashed.decode("utf-8"), "user_id": payload["user_id"]}
            )
            cursor = connection.cursor()
            cursor.execute(update_password)
            connection.commit()
            return {"updatePassword": True}
        except Exception as e:
            return HTTPException(
                status_code=500, detail="Something wrong. Could not reset password"
            )


@app.post("/api/resetPassword")
async def reset_password(
    payload: dict, token: str = Depends(authUtils.validate_access_token_nowhitelist)
):
    try:
        hashed = bcrypt.hashpw(
            bytes(payload["new_password"], encoding="utf-8"), bcrypt.gensalt()
        )

        update_password = Template(
            "update users set password = '$password' where user_id = $user_id"
        ).safe_substitute(
            {"password": hashed.decode("utf-8"), "user_id": token["user_id"]}
        )
        cursor = connection.cursor()
        cursor.execute(update_password)
        connection.commit()
        return {"updatePassword": True}
    except Exception as e:
        return HTTPException(
            status_code=500, detail="Something wrong. Could not reset password"
        )


@app.post("/api/requestbet")
async def create_bet(bet: dict, token: str = Depends(authUtils.validate_access_token)):
    # date_time_obj = datetime.datetime.strptime(
    #     bet["close_date"], "%Y-%m-%d %H:%M:%S.%f"
    # )
    try:
        close_date = parser.parse(bet["close_date"])
        # close_date = parser.parse(bet["close_date"]).replace(
        #     tzinfo=ZoneInfo("Europe/Berlin")
        # )
        # create bet
        cursor = connection.cursor()
        query1 = Template(
            "insert into bets(category, title, submitter, close_timestamp) values ('$category', '$title', '$submitter', '$close_date') RETURNING bet_id"
        ).safe_substitute(
            {
                "category": bet["category"],
                "title": bet["title"],
                "submitter": token["user"],
                "close_date": close_date,
            }
        )
        cursor.execute(query1)
        id_of_bet = cursor.fetchone()[0]

        for option in bet["options"]:
            query2 = Template(
                "insert into bet_options(latest_odds, option, bet) values ($latest_odds, '$option', $bet)"
            ).safe_substitute(
                {
                    "latest_odds": float(option["latest_odds"]),
                    "option": option["option"],
                    "bet": id_of_bet,
                }
            )
            cursor.execute(query2)
        connection.commit()
        return {"requestBet": True}
    except error as e:
        # raise HTTPException(status_code=403, detail="You are not admin")
        return {"requestBet": False, "errorMsg": e}


@app.post("/api/admin/settlebet")
async def settle_bet(bet: dict, token: str = Depends(authUtils.validate_access_token)):
    if is_admin(token["user"]):
        # settle bet
        cursor = connection.cursor()
        query1 = Template(
            "update bets set bet_status = 2 where bet_id = $bet_id"
        ).safe_substitute(
            {
                "bet_id": bet["bet_id"],
            }
        )
        cursor.execute(query1)
        for option in bet["bet_options"]:
            query2 = Template(
                "update bet_options set option_status = $option_status where option_id = $option_id"
            ).safe_substitute(
                {
                    "option_status": option["option_status"],
                    "option_id": option["option_id"],
                }
            )
            cursor.execute(query2)
        query_accum_ids = Template(
            "select distinct accum_id from accums natural join accum_options natural join bet_options where bet = $bet_id"
        ).safe_substitute(
            {
                "bet_id": bet["bet_id"],
            }
        )
        accum_ids = fetchDBJson(query_accum_ids)
        for accum in accum_ids:
            accum_id = accum["accum_id"]
            query_accum = Template(
                "select option_status, stake, total_odds, user_id from accum_options left join bet_options on accum_options.option_id = bet_options.option_id left join accums on accum_options.accum_id = accums.accum_id where accums.accum_id = $accum_id"
            ).safe_substitute(
                {
                    "accum_id": accum_id,
                }
            )
            accum = fetchDBJson(query_accum)
            bet_went_in = True
            for option in accum:
                if option["option_status"] != 2:
                    bet_went_in = False
                    break
            if bet_went_in:
                user_id = accum[0]["user_id"]
                pay_out_sum = accum[0]["stake"] * accum[0]["total_odds"]
                query_update_balance = Template(
                    "update users set balance = balance + $pay_out_sum where user_id = $user_id"
                ).safe_substitute(
                    {
                        "pay_out_sum": pay_out_sum,
                        "user_id": user_id,
                    }
                )
                cursor.execute(query_update_balance)
                query_set_paid_out = Template(
                    "update accums set paid_out = true where accum_id = $accum_id"
                ).safe_substitute(
                    {
                        "accum_id": accum_id,
                    }
                )
                cursor.execute(query_set_paid_out)
        connection.commit()
        return {"settleBet": True}
    else:
        # TODO:
        # change to this and implement frontend to support:
        # raise HTTPException(status_code=403, detail="You are not admin")
        return {"settleBet": False, "errorMsg": "Du er ikke admin"}


@app.post("/api/placebet")
async def place_bet(bet: dict, token: str = Depends(authUtils.validate_access_token)):
    res = fetchDBJson(
        Template(
            "select balance from users where username = '$username'"
        ).safe_substitute({"username": token["user"]})
    )
    # TODO add check if closetime is in future and closed_early is none

    if res[0]["balance"] >= bet["totalodds"]:
        cursor = connection.cursor()
        query1 = Template(
            "insert into accums(stake, total_odds, user_id) values ($stake, $total_odds, $user_id) RETURNING accum_id"
        ).safe_substitute(
            {
                "stake": float(bet["stake"]),
                "total_odds": float(bet["totalodds"]),
                "user_id": int(token["user_id"]),
            }
        )
        cursor.execute(query1)
        id_of_new_accum = cursor.fetchone()[0]
        for option in bet["bets"]:
            query = Template(
                "insert into accum_options(option_id, accum_id, user_odds) values ($option_id, $accum_id, $user_odds)"
            ).safe_substitute(
                {
                    "option_id": option["option"]["option_id"],
                    "accum_id": id_of_new_accum,
                    "user_odds": option["option"]["latest_odds"],
                }
            )
            cursor.execute(query)
        balance_query = Template(
            "update users set balance = balance - $stake where user_id = $user_id"
        ).safe_substitute(
            {"stake": float(bet["stake"]), "user_id": int(token["user_id"])}
        )
        cursor.execute(balance_query)
        connection.commit()
    else:
        return {
            "placeBet": False,
            "errorMsg": "Ikke nok penger på konto. Feil? Snakk med Lau",
        }

    return {"placeBet": True}


@app.post("/api/createUser")
async def add_user(user: dict):
    # hashed = authUtils.create_hashed_password(user["password"])
    hashed = bcrypt.hashpw(bytes(user["password"], encoding="utf-8"), bcrypt.gensalt())
    res = insertDB(
        Template(
            "insert into users(username, password, balance, firstname, lastname) values ('$username', '$password', 5000, '$firstname', '$lastname')"
        ).safe_substitute(
            {
                "username": user["username"],
                "password": hashed.decode("utf-8"),
                "firstname": user["firstname"],
                "lastname": user["lastname"],
            }
        )
    )
    return {"userCreated": True}


@app.post("/api/updatePassword")
async def update_password(
    payload: dict, token: str = Depends(authUtils.validate_access_token)
):
    # hashed = authUtils.create_hashed_password(user["password"])
    try:
        hashed = bcrypt.hashpw(
            bytes(payload["password"], encoding="utf-8"), bcrypt.gensalt()
        )

        update_password = Template(
            "update users set password = $password where user_id = $user_id"
        ).safe_substitute(
            {"password": hashed.decode("utf-8"), "user_id": int(token["user_id"])}
        )
        cursor = connection.cursor()
        cursor.execute(update_password)
        connection.commit()
    except Exception as e:
        return HTTPException(
            status_code=500, detail="Something wrong. Could not update password"
        )
    else:
        return {"userCreated": True}


## BONDEBRIDGE

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


@app.post("/api/bonde/adduser")
async def add_player(player: dict):
    cursor = connection.cursor()
    try:
        query = "INSERT INTO bonde_users(nickname) VALUES (%s);"
        cursor.execute(query, (player["nickname"],))
        connection.commit()
    except IntegrityError as e:
        connection.rollback()  # Important to roll back the failed transaction
        if e.pgcode == "23505":
            return {
                "addUser": False,
                "errorMsg": "Brukernavn finnes allerede i databasen",
            }
        else:
            return {
                "addUser": False,
                "errorMsg": "An error occurred",
            }
    return {"addUser": True}


@app.get("/api/bonde/games")
async def get_users():
    # try:
    query = "SELECT * FROM games ORDER BY game_id DESC;"
    games = fetchDBJsonNew(query)

    # Loop through each game and get the players for that game
    if games:
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


def calc_player_earnings(playerIds: Optional[str]):
    game_ids_query = "select game_id, money_multiplier, extra_cost_loser, extra_cost_second_last from games where status = 'finished'"
    games = fetchDBJsonNew(game_ids_query)

    player_earnings = dict()  # Format {1: -40, 2: 54, 3: 187 ...}
    player_nicknames = dict()  # To store player_id to nickname mapping

    for game in games:
        players_query = "select score, bonde_users.player_id, nickname from game_players left join bonde_users on game_players.player_id = bonde_users.player_id where game_id = %s"
        players = fetchDBJsonNew(players_query, (game["game_id"],))

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
                first_place_earnings = (
                    second_place_earnings
                ) = second_last_earnings = last_place_earnings = 0
            elif (
                first_place["score"]
                == second_place["score"]
                == second_last_place["score"]
            ):
                first_place_earnings = second_place_earnings = second_last_earnings = (
                    last_place_earnings / 3
                )
            elif (
                second_place["score"]
                == second_last_place["score"]
                == last_place["score"]
            ):
                second_place_earnings = second_last_earnings = last_place_earnings = 0
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
    print(player_earnings)

    # Swap player_id with nickname
    final_earnings = {
        player_nicknames[player_id]: earnings
        for player_id, earnings in player_earnings.items()
        if player_id in player_nicknames
    }

    return final_earnings


@app.get("/api/bonde/stats")
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

            # Convert the string IDs to integers
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
            base_query3 += (
                f" WHERE gp.player_id IN ({','.join([str(id) for id in ids_list])})"
            )
            base_query4 += f" WHERE gp.player_id IN ({','.join([str(id) for id in ids_list])}) ps.stand = TRUE group by r.num_cards, bu.nickname"
        else:
            base_query4 += "WHERE ps.stand = TRUE group by r.num_cards, bu.nickname"

        base_query1 += " GROUP BY round_id ORDER BY num_cards DESC;"
        base_query2 += (
            "  GROUP BY r.num_cards, ps.num_tricks ORDER BY r.num_cards, ps.num_tricks"
        )
        base_query3 += " group by r.num_cards, bu.nickname"

        result1 = fetchDBJsonNew(base_query1)
        result2 = fetchDBJsonNew(base_query2)
        result3 = fetchDBJsonNew(base_query3)
        result4 = fetchDBJsonNew(base_query4)

        player_earnings = calc_player_earnings(playerIds)

        bleedings_query = "select nickname, SUM(bleedings) as total_bleedings, SUM(warnings) as total_warnings from game_players left join bonde_users on game_players.player_id = bonde_users.player_id group by bonde_users.nickname order by total_bleedings DESC"

        bleedings = fetchDBJsonNew(bleedings_query)
        print(bleedings)

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

                # Update diffs and counts dictionaries
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

            # Initialize an empty defaultdict
            success_rate_data = defaultdict(dict)

            # Populate the defaultdict with the query results
            for row in result2:
                num_cards = row["num_cards"]
                num_tricks = row["num_tricks"]
                stand_percentage = row["stand_percentage"]
                total_occurrences = row["total_occurrences"]
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

            # Convert the dictionary into a list for Recharts
            player_aggression = list(avg_bids_by_cards.values())

            avg_bids_by_cards_stand = {}

            for item in result4:
                num_cards = item["num_cards"]
                nickname = item["nickname"]
                avg = round(item["avg_tricks"], 1)

                if num_cards not in avg_bids_by_cards_stand:
                    avg_bids_by_cards_stand[num_cards] = {"num_cards": num_cards}

                avg_bids_by_cards_stand[num_cards][nickname] = avg

            # Convert the dictionary into a list for Recharts
            player_aggression_stand = list(avg_bids_by_cards_stand.values())

            # Convert the defaultdict to a regular dict
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


@app.get("/api/bonde/game/{game_id}")
async def get_game(game_id: int):
    try:
        query = "SELECT * FROM games WHERE game_id = %s;"
        game = fetchDBJsonNew(query, (game_id,))

        # Fetch corresponding rounds
        rounds_query = "SELECT round_id, num_cards, dealer_index, locked FROM rounds WHERE game_id = %s;"
        rounds = fetchDBJsonNew(rounds_query, (game_id,))

        for round in rounds:
            round_scores_qurey = "SELECT player_scores_id, num_tricks, stand FROM player_scores WHERE round_id = %s ORDER BY player_scores_id ASC;"
            round_scores = fetchDBJsonNew(round_scores_qurey, (round["round_id"],))
            round["player_scores"] = round_scores

        players_query = """
                SELECT nickname, bleedings, warnings, game_player_id, game_players.player_id 
                FROM games 
                NATURAL JOIN game_players 
                LEFT JOIN bonde_users ON game_players.player_id = bonde_users.player_id 
                WHERE game_id = %s ORDER BY game_player_id ASC;
            """
        players = fetchDBJsonNew(players_query, (game_id,))
    except Exception as e:
        return HTTPException(
            status_code=500, detail="Something wrong. Could not fetch games"
        )
    return {"game": game, "rounds": rounds, "players": players}


@app.get("/api/bonde/users")
async def get_users():
    # try:
    query = "SELECT player_id, nickname FROM bonde_users;"
    users = fetchDBJsonNew(query)

    # except Exception as e:
    #     return HTTPException(
    #         status_code=500, detail="Something wrong. Could not fetch users"
    #     )
    return {"users": users}


@app.post("/api/bonde/game")
async def create_game(game: GameCreate):
    try:
        cursor = connection.cursor()
        query1 = "INSERT INTO games(money_multiplier, extra_cost_loser, extra_cost_second_last) VALUES (%s, %s, %s) RETURNING game_id;"
        cursor.execute(
            query1,
            (game.money_multiplier, game.extra_cost_loser, game.extra_cost_second_last),
        )
        game_id = cursor.fetchone()[0]

        game_player_ids = []
        # Add players to game_players table
        for player_id in game.players:
            query = "INSERT INTO game_players(game_id, player_id) VALUES (%s, %s) RETURNING game_player_id;"
            cursor.execute(query, (game_id, player_id))
            game_player_ids.append(cursor.fetchone()[0])

        connection.commit()
    except Exception as e:
        return HTTPException(
            status_code=500, detail="Something wrong. Could not create game"
        )

    return {
        "game_id": game_id,
        "game_player_ids": game_player_ids,
    }


@app.post("/api/bonde/rounds")
async def create_rounds(rounds: dict):
    try:
        cursor = connection.cursor()
        round_ids = []
        player_scores_ids = []
        game_id = rounds["game_id"]

        # Add all rounds
        for round in rounds["rounds"]:
            query = "INSERT INTO rounds(game_id, num_cards, dealer_index) VALUES (%s, %s, %s) RETURNING round_id;"
            cursor.execute(query, (game_id, round["num_cards"], round["dealer_index"]))
            round_id = cursor.fetchone()[0]
            round_ids.append(round_id)

            # Add all player scores for each round
            scores_id_round = []

            for game_player_id in rounds["game_player_ids"]:
                query = "INSERT INTO player_scores(round_id, game_player_id) VALUES (%s, %s) RETURNING player_scores_id;"
                cursor.execute(query, (round_id, game_player_id))
                player_scores_id = cursor.fetchone()[0]
                scores_id_round.append(player_scores_id)

            player_scores_ids.append(scores_id_round)

        connection.commit()
    except Exception as e:
        return HTTPException(
            status_code=500, detail="Something wrong. Could not update round"
        )

    return {"created": True}


@app.put("/api/bonde/rounds")
async def update_round(data: dict):
    # Connect to the database
    try:
        cursor = connection.cursor()

        # # Update the rounds table
        # cursor.execute(
        #     "UPDATE rounds SET num_cards = %s, dealer_index = %s, locked = %s WHERE round_id = %s",
        #     (
        #         roundData["num_cards"],
        #         roundData["dealer_index"],
        #         roundData["locked"],
        #         round_id,
        #     ),
        # )
        # Update player_scores
        for round in data["rounds"]:
            for player_score in round["player_scores"]:
                cursor.execute(
                    "UPDATE player_scores SET num_tricks = %s, stand = %s WHERE player_scores_id = %s",
                    (
                        player_score["num_tricks"],
                        player_score["stand"],
                        player_score["player_scores_id"],
                    ),
                )
        connection.commit()
    except Exception as e:
        return HTTPException(
            status_code=500, detail="Something wrong. Could not update round"
        )

    return {"message": "Round updated successfully"}


@app.put("/api/bonde/playerdata")
async def update_player_scores(data: dict):
    # Connect to the database
    try:
        cursor = connection.cursor()

        # Update player_scores
        for player in data["playerData"]:
            try:
                cursor.execute(
                    "UPDATE game_players SET score = %s, warnings = %s, bleedings = %s WHERE game_player_id = %s",
                    (
                        player["score"],
                        player["warnings"],
                        player["bleedings"],
                        player["game_player_id"],
                    ),
                )
            except KeyError:
                print("KeyError")
        connection.commit()
    except Exception as e:
        return HTTPException(
            status_code=500, detail="Something wrong. Could not update player scores"
        )

    return {"message": "Player scores updated successfully"}


@app.put("/api/game/complete/{game_id}")
async def update_round(game_id: int):
    # Connect to the database
    try:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE games SET status = 'finished' WHERE game_id = %s",
            (game_id,),
        )

        connection.commit()
    except Exception as e:
        return HTTPException(
            status_code=500, detail="Something wrong. Could not complete game"
        )

    return {"message": "Game completed successfully"}
