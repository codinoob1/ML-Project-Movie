import os
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pydantic import BaseModel
import uvicorn
import httpx
import numpy as np
import pickle


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
    result: List[dict], limit: int = 20) -> List[TMDBMovieCard]:
    out:List[TMDBMovieCard] = []
    for i in (result or [])[:limit]:
        out.append(TMDBMovieCard(
            tmdb_id=int(i["id"]),
                title=i.get("title") or i.get("name") or "",
                poster_url=making_img_url(i.get("poster_path")),
                release_date=i.get("release_date"),
                vote_average=i.get("vote_average"),
        ))
    
    return out


async def omdb_movie_details(movie_id: int) -> TMDBMovieDetails:
    data = await omdb_get(f"/movie/{movie_id}", {"language": "en-US"})
    return TMDBMovieDetails(
        tmdb_id=int(data["id"]),
        title=data.get("title") or "",
        overview=data.get("overview"),
        release_date=data.get("release_date"),
        poster_url=making_img_url(data.get("poster_path")),
        backdrop_url=omdb_get(data.get("backdrop_path")),
        genres=data.get("genres", []) or [],
    )


async def omdb_search_movies(query: str, page: int = 1) -> Dict[str, Any]:
    """
    Raw TMDB response for keyword search (MULTIPLE results).
    Streamlit will use this for suggestions and grid.
    """
    return await omdb_get(
        "/search/movie",
        {
            "query": query,
            "include_adult": "false",
            "language": "en-US",
            "page": page,
        },
    )


async def omdb_search_first(query: str) -> Optional[dict]:
    data = await omdb_search_movies(query=query, page=1)
    results = data.get("results", [])
    return results[0] if results else None




#TF-IDF HELPER


def build_title_to_idx_map(indices: Any) -> Dict[str, int]:
    """
    indices.pkl can be:
    - dict(title -> index)
    - pandas Series (index=title, value=index)
    We normalize into TITLE_TO_IDX.
    """
    title_to_idx: Dict[str, int] = {}

    if isinstance(indices, dict):
        for k, v in indices.items():
            title_to_idx[_norm_title(k)] = int(v)
        return title_to_idx

    # pandas Series or similar mapping
    try:
        for k, v in indices.items():
            title_to_idx[_norm_title(k)] = int(v)
        return title_to_idx
    except Exception:
        # last resort: if it's a list-like etc.
        raise RuntimeError(
            "indices.pkl must be dict or pandas Series-like (with .items())"
        )


def get_local_idx_by_title(title: str) -> int:
    global TITLE_TO_IDX
    if TITLE_TO_IDX is None:
        raise HTTPException(status_code=500, detail="TF-IDF index map not initialized")
    key = _norm_title(title)
    if key in TITLE_TO_IDX:
        return int(TITLE_TO_IDX[key])
    raise HTTPException(
        status_code=404, detail=f"Title not found in local dataset: '{title}'"
    )


def tfidf_recommend_titles(
    query_title: str, top_n: int = 10
) -> List[tuple[str, float]]:
    """
    Returns list of (title, score) from local df using cosine similarity on TF-IDF matrix.
    Safe against missing columns/rows.
    """
    global df, tfidf_matrix
    if df is None or tfidf_matrix is None:
        raise HTTPException(status_code=500, detail="TF-IDF resources not loaded")

    idx = get_local_idx_by_title(query_title)

    # query vector
    qv = tfidf_matrix[idx]
    scores = (tfidf_matrix @ qv.T).toarray().ravel()

    # sort descending
    order = np.argsort(-scores)

    out: List[tuple[str, float]] = []
    for i in order:
        if int(i) == int(idx):
            continue
        try:
            title_i = str(df.iloc[int(i)]["title"])
        except Exception:
            continue
        out.append((title_i, float(scores[int(i)])))
        if len(out) >= top_n:
            break
    return out


async def attach_tmdb_card_by_title(title: str) -> Optional[TMDBMovieCard]:
    """
    Uses TMDB search by title to fetch poster for a local title.
    If not found, returns None (never crashes the endpoint).
    """
    try:
        m = await omdb_search_first(title)
        if not m:
            return None
        return TMDBMovieCard(
            tmdb_id=int(m["id"]),
            title=m.get("title") or title,
            poster_url=making_img_url(m.get("poster_path")),
            release_date=m.get("release_date"),
            vote_average=m.get("vote_average"),
        )
    except Exception:
        return None


# =========================
# STARTUP: LOAD PICKLES
# =========================
@app.on_event("startup")
def load_pickles():
    global df, indices_obj, tfidf_matrix, tfidf_obj, TITLE_TO_IDX

    # Load df
    with open(DF_PATH, "rb") as f:
        df = pickle.load(f)

    # Load indices
    with open(INDICES_PATH, "rb") as f:
        indices_obj = pickle.load(f)

    # Load TF-IDF matrix (usually scipy sparse)
    with open(TFIDF_MATRIX_PATH, "rb") as f:
        tfidf_matrix = pickle.load(f)

    # Load tfidf vectorizer (optional, not used directly here)
    with open(TFIDF_PATH, "rb") as f:
        tfidf_obj = pickle.load(f)

    # Build normalized map
    TITLE_TO_IDX = build_title_to_idx_map(indices_obj)

    # sanity
    if df is None or "title" not in df.columns:
        raise RuntimeError("df.pkl must contain a DataFrame with a 'title' column")
    
    
#Routes
@app.get("/home",response_model=List[TMDBMovieCard])
async def home(
    cat:str = Query("popular"),
    limit: int = Query(24,ge=1,le=50)
):
    try:
        if cat == "trending":
            data = await omdb_get("/trending/movie/day", {"language": "en-US"})
            return await omdb_card_from_res(data.get("results", []), limit=limit)

        if cat not in {"popular", "top_rated", "upcoming", "now_playing"}:
            raise HTTPException(status_code=400, detail="Invalid category")

        data = await omdb_get(f"/movie/{cat}", {"language": "en-US", "page": 1})
        return await omdb_card_from_res(data.get("results", []), limit=limit)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Home route failed: {e}")
    

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
