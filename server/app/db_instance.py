from databases import Database
from credentials import Credentials

DATABASE_URL = f"postgresql://{Credentials.user}:{Credentials.password}@{Credentials.host}/{Credentials.db}"

database = Database(DATABASE_URL)
