import os
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pydantic import BaseModel
import uvicorn
import httpx

load_dotenv()

# Grabs the key out of your local .env file
Movie_DB = os.getenv("TMDB_API_KEY")

if not Movie_DB:
    raise RuntimeError("TMDB Key is Missing Buddy!")

# FIXED: Converted to proper f-strings so the variable evaluates dynamically
TMDB_Img_500 = f"http://img.omdbapi.com/?apikey={Movie_DB}&"
BASE_Key = f"http://www.omdbapi.com/?apikey={Movie_DB}&"

app = FastAPI(title="Movie Recommend API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#definig everything and connceting to one path file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DF_PATH = os.path.join(BASE_DIR, "data.pkl")
INDICES_PATH = os.path.join(BASE_DIR, "indecies.pkl")
TFIDF_MATRIX_PATH = os.path.join(BASE_DIR, "tfidf_matrix.pkl")
TFIDF_PATH = os.path.join(BASE_DIR, "tfidf_vectorize.pkl")

df: Optional[pd.DataFrame] = None
indices_obj: Any = None
tfidf_matrix: Any = None
tfidf_obj: Any = None

TITLE_TO_IDX: Optional[Dict[str, int]] = None

# =========================
# MODELS
# =========================


class TMDBMovieCard(BaseModel):
    tmdb_id: int
    title: str
    poster_url: Optional[str] = None
    release_date: Optional[str] = None
    vote_average: Optional[float] = None


class TMDBMovieDetails(BaseModel):
    tmdb_id: int
    title: str
    overview: Optional[str] = None
    release_date: Optional[str] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    genres: List[dict] = []


class TFIDFRecItem(BaseModel):
    title: str
    score: float
    tmdb: Optional[TMDBMovieCard] = None


class SearchBundleResponse(BaseModel):
    query: str
    movie_details: TMDBMovieDetails
    tfidf_recommendations: List[TFIDFRecItem]
    genre_recommendations: List[TMDBMovieCard]
    

# =========================
# UTILS
# =========================

def _norm_title(t:str)-> str:
    return str(t).strip().lower()

def making_img_url(path:Optional[str]) -> Optional[str]:
    if not path:
        return None
    
    return f"{TMDB_Img_500}{path}"


async def omdb_get(path:str,params: Dict[str,Any]) -> Dict[str,Any]:
    q = dict(params)
    q["apikey"] = Movie_DB
    
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(BASE_Key, params=q)
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=502,
            detail=f"OMDb request error: {type(e).__name__} | {repr(e)}",
        )
        
    if r.status_code != 200:
        raise HTTPException(
            status_code=502, detail=f"OMDb error {r.status_code}: {r.text}"
        )
 
    data = r.json()
    
    
    
 
    # OMDb-specific: failures come back as HTTP 200 with Response=False,
    # not as a non-200 status code. TMDB's pattern misses this entirely.
    if data.get("Response") == "False":
        raise HTTPException(
            status_code=404, detail=f"OMDb: {data.get('Error', 'Unknown error')}"
        )
 
    return data

async def omdb_card_from_res(
    
):
    ...
    
    


@app.get("/")
def root():
    return {"message": "Movie Recommend API is running"}


@app.get("/health")
def health():
    return {"status": "I am working"}


if __name__ == "__main__":
    uvicorn.run(
        "Main:app",
        host="127.0.0.1",
        port=8080,
        reload=True
    )
