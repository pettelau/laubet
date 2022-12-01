from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from .postgresPool import pool
from string import Template
import bcrypt

try:
    connection = pool.getconn()

except (Exception, psycopg2.DatabaseError) as error:
    print("Error while connecting to PostgreSQL", error)


def fetchDB(query):
    cursor = connection.cursor()
    cursor.execute(query)
    result = cursor.fetchall()
    return result


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


@app.get("/", tags=["root"])
async def read_root() -> dict:
    return {"message": "Welcome to your todo list."}


@app.get("/api/testfetch", tags=["root"])
async def read_root() -> dict:
    return {"message": "Testing response"}


@app.post("/api/testpost", tags=["root"])
async def read_root(dict: dict) -> dict:
    print(dict)
    return {"message": "Testing response POST"}


@app.get("/api/testing", tags=["root"])
async def read_root() -> dict:
    return {"melding": "Welcome to testing."}


@app.get("/api/openbets")
async def read_root() -> dict:
    bets = fetchDB("select * from bets where bet_status = 1")
    bets_with_options = []
    for bet in bets:
        bet_with_option = {
            "title": bet[2],
            "bet_status": bet[3],
            "bet_id": bet[0],
            "category": bet[1],
        }
        options = fetchDB(f"select * from bet_options where bet = {bet[0]}")
        options_list = []
        for option in options:
            option_dict = {
                "latest_odds": option[1],
                "option": option[3],
                "option_id": option[0],
                "option_status": option[2],
            }
            options_list.append(option_dict)
        bet_with_option["bet_options"] = options_list
        bets_with_options.append(bet_with_option)

    return bets_with_options


@app.get("/api/accums/{user_id}")
async def read_root(user_id) -> dict:
    accums = fetchDB(
        f"select accum_id, stake, total_odds from accums where user_id={user_id}"
    )
    accums_with_options = []
    for accum in accums:
        accum_dict = {"accum_id": accum[0], "stake": accum[1], "total_odds": accum[2]}
        accum_options = fetchDB(
            f"select bets.title, accum_options.user_odds, bet_options.option, bet_options.option_status from bet_options natural join accum_options left join bets on bet_options.bet = bets.bet_id inner join accums on accum_options.accum_id = accums.accum_id where accums.accum_id = {accum[0]};"
        )
        options_list = []
        for option in accum_options:
            option_dict = {
                "bet": option[0],
                "user_odds": option[1],
                "chosen_option": option[2],
                "option_status": option[3],
            }
            options_list.append(option_dict)
        accum_dict["accumBets"] = options_list
        accums_with_options.append(accum_dict)
    print(accums_with_options)

    return accums_with_options


# @app.get("/admin/allaccums")
# async def read_root() -> dict:
#     return {"message": "Admin"}


@app.get("/api/userAvailability/{user}")
async def read_root(user: str) -> dict:
    res = fetchDB(f"select exists(select 1 from users where username = '{user}')")
    if res[0][0]:
        return {"userTaken": True}
    else:
        return {"userTaken": False}


@app.get("/api/login/")
async def add_user(user, password) -> dict:
    user_pass = fetchDB(
        Template(
            "select password from users where username = '$username'"
        ).safe_substitute({"username": user})
    )

    try:
        user_pass = user_pass[0][0]
    except IndexError:
        return {"loggedIn": False}
    if bcrypt.checkpw(password.encode("utf-8"), user_pass.encode("utf-8")):
        return {"loggedIn": True}
    else:
        return {"loggedIn": False}


@app.post("/api/createUser")
async def add_user(user: dict) -> dict:

    hashed = bcrypt.hashpw(bytes(user["password"], encoding="utf-8"), bcrypt.gensalt())

    res = insertDB(
        Template(
            "insert into users(username, password, balance, firstname, lastname) values ('$username', '$password', 1000, '$firstname', '$lastname')"
        ).safe_substitute(
            {
                "username": user["username"],
                "password": hashed.decode("utf-8"),
                "firstname": user["firstname"],
                "lastname": user["lastname"],
            }
        )
    )
    print(res)
    return {"userCreated": True}
