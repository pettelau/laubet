from random import random
import os
from passlib.context import CryptContext
from jose import jwt
from jose.exceptions import JOSEError
from fastapi import HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import bcrypt
from credentials import Credentials
import psycopg2
from postgresPool import pool
from string import Template
from psycopg2.extras import RealDictCursor


SECRET = Credentials.secret
ALGORITHM = Credentials.algorithm

try:
    connection = pool.getconn()

except (Exception, psycopg2.DatabaseError) as error:
    print("Error while connecting to PostgreSQL", error)


def fetchDBJson(query):
    cursor = connection.cursor(cursor_factory=RealDictCursor)
    cursor.execute(query)
    result = cursor.fetchall()
    return result


class AuthUtils:
    """Token needs to implement exp date"""

    def __init__(self):
        self.JWT_ALGORITHM = ALGORITHM
        self.JWT_SECRET_KEY = SECRET

    async def create_hashed_password(self, password: str) -> str:
        bcrypt.hashpw(bytes(password, encoding="utf-8"), bcrypt.gensalt())
        return self.password_context.hash(password)

    async def verify_password(self, password: str, user_pass: str) -> bool:
        verified = bcrypt.checkpw(password.encode("utf-8"), user_pass.encode("utf-8"))
        if verified:
            return True
        else:
            return False

    async def create_access_token(self, user: str, user_id: int) -> str:
        to_encode = {"user": user, "user_id": user_id}
        encoded_jwt = jwt.encode(to_encode, self.JWT_SECRET_KEY, self.JWT_ALGORITHM)
        return encoded_jwt

    async def validate_access_token(
        self,
        credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    ):
        print("i am here")
        token = credentials.credentials
        try:
            payload = jwt.decode(
                token, self.JWT_SECRET_KEY, algorithms=[self.JWT_ALGORITHM]
            )

            res = fetchDBJson(
                Template(
                    "select whitelist from users where username = '$username'"
                ).safe_substitute({"username": payload["user"]})
            )
            print(res[0])
            if res[0]["whitelist"]:
                return payload
            else:
                raise HTTPException(status_code=403, detail="You are not whitelisted")
        except JOSEError as e:
            raise HTTPException(status_code=401, detail="You are not logged in")

    async def validate_access_token_nowhitelist(
        self, credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
    ):
        token = credentials.credentials

        try:
            payload = jwt.decode(
                token, self.JWT_SECRET_KEY, algorithms=[self.JWT_ALGORITHM]
            )

        except JOSEError as e:
            raise HTTPException(status_code=401, detail=str(e))
        return payload


authUtils = AuthUtils()
