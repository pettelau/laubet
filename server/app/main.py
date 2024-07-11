import uvicorn
from fastapi import FastAPI
from api import api_router
from bondebridge import bb_router

from fastapi.middleware.cors import CORSMiddleware

from db_instance import database

app = FastAPI()

app.include_router(api_router)
app.include_router(bb_router, prefix="/api/bonde")

origins = ["*"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
