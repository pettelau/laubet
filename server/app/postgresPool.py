import psycopg2
from psycopg2 import pool
from credentials import Credentials

pool = pool.SimpleConnectionPool(
    1,
    20,
    host=Credentials.host,
    database=Credentials.db,
    user=Credentials.user,
    password=Credentials.password,
)
