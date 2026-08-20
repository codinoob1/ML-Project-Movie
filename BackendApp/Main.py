import os
import difflib
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pydantic import BaseModel
import uvicorn
import httpx
import numpy as np
import pickle


load_dotenv()


OMDB_API_KEY = os.getenv("OMDB_API_KEY") or os.getenv("TMDB_API_KEY")

if not OMDB_API_KEY:
    raise RuntimeError("OMDB_API_KEY is missing. Set it in your .env file.")

OMDB_BASE_URL = "https://www.omdbapi.com/"


@asynccontextmanager
async def lifespan(app):
    global df, indices_obj, tfidf_matrix, tfidf_obj, TITLE_TO_IDX

    with open(DF_PATH, "rb") as f:
        df = pickle.load(f)
    with open(INDICES_PATH, "rb") as f:
        indices_obj = pickle.load(f)
    with open(TFIDF_MATRIX_PATH, "rb") as f:
        tfidf_matrix = pickle.load(f)
    with open(TFIDF_PATH, "rb") as f:
        tfidf_obj = pickle.load(f)

    TITLE_TO_IDX = build_title_to_idx_map(indices_obj)

    if df is None or "title" not in df.columns:
        raise RuntimeError("df.pkl must contain a DataFrame with a 'title' column")

    yield


app = FastAPI(title="Movie Recommend API", version="2.0-omdb", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# defining everything and connecting to one path file
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

# Simple in-memory cache so we don't re-hit OMDb for the same title
# across requests (OMDb free tier is rate-limited, TMDB wasn't as strict).
_OMDB_CARD_CACHE: Dict[str, Optional["OMDBMovieCard"]] = {}

# =========================
# MODELS
# ============================================================
# OMDB CHANGE: TMDB used numeric integer ids (tmdb_id). OMDb uses
# string IMDb ids like "tt1285016" -> imdb_id: Optional[str].
# It's Optional because a local dataset title might not resolve
# to an OMDb match (e.g. name mismatch), and we still want to
# return the card with local data in that case.
# ============================================================


class OMDBMovieCard(BaseModel):
    imdb_id: Optional[str] = None
    title: str
    poster_url: Optional[str] = None
    year: Optional[str] = None
    # From your LOCAL dataset (data.pkl) - OMDb has no "popularity" field,
    # and its imdbRating requires a separate detail call, so home/genre
    # feeds use your local vote_average instead.
    local_rating: Optional[float] = None


class OMDBMovieDetails(BaseModel):
    imdb_id: Optional[str] = None
    title: str
    plot: Optional[str] = None
    year: Optional[str] = None
    poster_url: Optional[str] = None
    genres: List[str] = []
    imdb_rating: Optional[str] = None
    runtime: Optional[str] = None
    director: Optional[str] = None
    actors: Optional[str] = None


class TFIDFRecItem(BaseModel):
    title: str
    score: float
    omdb: Optional[OMDBMovieCard] = None


class SearchBundleResponse(BaseModel):
    query: str
    movie_details: OMDBMovieDetails
    tfidf_recommendations: List[TFIDFRecItem]
    genre_recommendations: List[OMDBMovieCard]


# =========================
# UTILS
# =========================


def _norm_title(t: str) -> str:
    return str(t).strip().lower()


def parse_poster(poster: Optional[str]) -> Optional[str]:
    """OMDb returns the literal string 'N/A' instead of null when there's no poster."""
    if not poster or poster == "N/A":
        return None
    return poster


def parse_genres(genre_field: Optional[str]) -> List[str]:
    """
    OMDb's `Genre` field (from /movie details) is a comma-separated string,
    e.g. "Animation, Comedy, Family". Your LOCAL df's `genres` column is
    space-separated, e.g. "Animation Comedy Family" (see parse_local_genres).
    """
    if not genre_field or genre_field == "N/A":
        return []
    return [g.strip() for g in genre_field.split(",") if g.strip()]


def parse_local_genres(local_genre_field: Optional[str]) -> List[str]:
    if not local_genre_field or not isinstance(local_genre_field, str):
        return []
    return [g.strip() for g in local_genre_field.split() if g.strip()]


async def omdb_get(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    OMDB CHANGE: no more `path` argument. TMDB was a REST API with
    different URL paths per resource (/movie/{id}, /discover/movie...).
    OMDb is a single flat endpoint - everything is controlled by query
    params (i=, t=, s=, plot=, page=...).
    """
    q = dict(params)
    q["apikey"] = OMDB_API_KEY

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(OMDB_BASE_URL, params=q)
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


def omdb_card_from_search_result(item: dict, local_rating: Optional[float] = None) -> OMDBMovieCard:
    """
    OMDB CHANGE: builds a card straight from an OMDb *search* result item
    (the `Search` array from s=), which already has imdbID/Title/Year/Poster -
    no extra "details" call needed just to render a card.
    """
    return OMDBMovieCard(
        imdb_id=item.get("imdbID"),
        title=item.get("Title") or "",
        poster_url=parse_poster(item.get("Poster")),
        year=item.get("Year"),
        local_rating=local_rating,
    )


async def omdb_search_movies(query: str, page: int = 1) -> Dict[str, Any]:
    """
    OMDB CHANGE: `s=` is OMDb's keyword search (equivalent to TMDB's
    /search/movie). Returns {"Search": [...], "totalResults": "...", "Response": "True"}
    instead of TMDB's {"results": [...], "total_pages": ...}.
    """
    return await omdb_get({"s": query, "type": "movie", "page": page})


async def omdb_search_first(query: str) -> Optional[dict]:
    data = await omdb_search_movies(query=query, page=1)
    results = data.get("Search", [])
    return results[0] if results else None


async def omdb_movie_details_by_id(imdb_id: str) -> OMDBMovieDetails:
    """OMDB CHANGE: `i=` looks up by exact IMDb ID (was /movie/{tmdb_id})."""
    data = await omdb_get({"i": imdb_id, "plot": "full"})
    return _details_from_omdb_payload(data)


async def omdb_movie_details_by_title(title: str) -> OMDBMovieDetails:
    """OMDB CHANGE: `t=` looks up by exact title match."""
    data = await omdb_get({"t": title, "plot": "full"})
    return _details_from_omdb_payload(data)


def _details_from_omdb_payload(data: dict) -> OMDBMovieDetails:
    return OMDBMovieDetails(
        imdb_id=data.get("imdbID"),
        title=data.get("Title") or "",
        plot=data.get("Plot") if data.get("Plot") != "N/A" else None,
        year=data.get("Year"),
        poster_url=parse_poster(data.get("Poster")),
        genres=parse_genres(data.get("Genre")),
        imdb_rating=data.get("imdbRating") if data.get("imdbRating") != "N/A" else None,
        runtime=data.get("Runtime") if data.get("Runtime") != "N/A" else None,
        director=data.get("Director") if data.get("Director") != "N/A" else None,
        actors=data.get("Actors") if data.get("Actors") != "N/A" else None,
    )


async def attach_omdb_card_by_title(
    title: str, local_rating: Optional[float] = None
) -> Optional[OMDBMovieCard]:
    """
    Uses OMDb search-by-title to enrich a local dataset title with a
    poster/imdb_id/year. Cached, and never crashes the endpoint if OMDb
    doesn't have a match (falls back to a card with just local data).
    """
    key = _norm_title(title)
    if key in _OMDB_CARD_CACHE:
        cached = _OMDB_CARD_CACHE[key]
        if cached is not None:
            cached = cached.model_copy(update={"local_rating": local_rating})
        return cached

    try:
        m = await omdb_search_first(title)
        if not m:
            _OMDB_CARD_CACHE[key] = None
            return OMDBMovieCard(title=title, local_rating=local_rating)
        card = omdb_card_from_search_result(m, local_rating=local_rating)
        _OMDB_CARD_CACHE[key] = card
        return card
    except HTTPException:
        _OMDB_CARD_CACHE[key] = None
        return OMDBMovieCard(title=title, local_rating=local_rating)


# =========================
# LOCAL DATASET HELPERS (unchanged logic, now doing more work
# since OMDb can't browse/discover/filter by genre on its own)
# =========================


def build_title_to_idx_map(indices: Any) -> Dict[str, int]:
    title_to_idx: Dict[str, int] = {}

    if isinstance(indices, dict):
        for k, v in indices.items():
            title_to_idx[_norm_title(k)] = int(v)
        return title_to_idx

    try:
        for k, v in indices.items():
            title_to_idx[_norm_title(k)] = int(v)
        return title_to_idx
    except Exception:
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


def find_local_title_match(query: str) -> Optional[str]:
    """
    OMDB CHANGE: previously we searched TMDB first, then ran TF-IDF off
    whatever TMDB matched. Now the local dataset is searched FIRST
    (exact match, then fuzzy match), since TF-IDF/genre recs only work
    for titles that exist locally - OMDb is just used to decorate them
    with posters afterwards.
    """
    global TITLE_TO_IDX, df
    key = _norm_title(query)
    if TITLE_TO_IDX and key in TITLE_TO_IDX:
        return str(df.iloc[TITLE_TO_IDX[key]]["title"])

    if df is None:
        return None

    all_titles = df["title"].astype(str).tolist()
    close = difflib.get_close_matches(query, all_titles, n=1, cutoff=0.6)
    return close[0] if close else None


def tfidf_recommend_titles(
    query_title: str, top_n: int = 10
) -> List[tuple[str, float]]:
    global df, tfidf_matrix
    if df is None or tfidf_matrix is None:
        raise HTTPException(status_code=500, detail="TF-IDF resources not loaded")

    idx = get_local_idx_by_title(query_title)

    qv = tfidf_matrix[idx]
    scores = (tfidf_matrix @ qv.T).toarray().ravel()

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


def local_genre_recommend(query_title: str, limit: int = 12) -> pd.DataFrame:
    """
    OMDB CHANGE: replaces TMDB's /discover/movie?with_genres=... entirely.
    OMDb has no genre-browse endpoint, so genre-based recs now come from
    YOUR local dataset's `genres` column, ranked by vote_average/popularity.
    """
    global df
    if df is None:
        raise HTTPException(status_code=500, detail="Dataset not loaded")

    idx = get_local_idx_by_title(query_title)
    target_row = df.iloc[idx]
    target_genres = set(parse_local_genres(target_row.get("genres")))

    if not target_genres:
        return df.iloc[0:0]

    def overlaps(g):
        return bool(set(parse_local_genres(g)) & target_genres)

    candidates = df[df["genres"].apply(overlaps)]
    candidates = candidates[candidates.index != idx]

    sort_cols = [c for c in ["vote_average", "popularity"] if c in df.columns]
    if sort_cols:
        candidates = candidates.sort_values(sort_cols, ascending=False)

    return candidates.head(limit)


# =========================
# ROUTES
# =========================


@app.get("/home", response_model=List[OMDBMovieCard])
async def home(
    sort: str = Query("popular", pattern="^(popular|top_rated)$"),
    limit: int = Query(24, ge=1, le=50),
):
    """
    OMDB CHANGE: TMDB's /trending, /movie/popular, /movie/top_rated,
    /movie/upcoming, /movie/now_playing don't exist in OMDb - it has no
    browse endpoints at all, only lookup-by-title/id and keyword search.
    (`upcoming`/`now_playing` are also dropped since your local dataset
    has no release date column to sort by.)
    This now pulls the top N rows from your LOCAL dataset, sorted by
    popularity or vote_average, then enriches each with an OMDb poster.
    """
    global df
    if df is None:
        raise HTTPException(status_code=500, detail="Dataset not loaded")

    sort_col = "popularity" if sort == "popular" else "vote_average"
    if sort_col not in df.columns:
        raise HTTPException(status_code=500, detail=f"'{sort_col}' not in dataset")
    
    df[sort_col] = pd.to_numeric(df[sort_col], errors='coerce')

    top = df.sort_values(sort_col, ascending=False).head(limit)

    cards: List[OMDBMovieCard] = []
    for _, row in top.iterrows():
        card = await attach_omdb_card_by_title(
            str(row["title"]), local_rating=row.get("vote_average")
        )
        if card:
            cards.append(card)
    return cards


@app.get("/omdb/search")
async def omdb_search(
    query: str = Query(..., min_length=2),
    page: int = Query(1, ge=1, le=10),
):
    """OMDB CHANGE: was /odbm/search (typo) hitting TMDB's /search/movie shape."""
    return await omdb_search_movies(query=query, page=page)


@app.get("/movie/id/{imdb_id}", response_model=OMDBMovieDetails)
async def movie_details_by_id(imdb_id: str):
    """OMDB CHANGE: path param is now a string IMDb id like 'tt1285016', not an int."""
    return await omdb_movie_details_by_id(imdb_id)


@app.get("/movie/title/{title}", response_model=OMDBMovieDetails)
async def movie_details_by_title(title: str):
    """New helper - OMDb supports exact-title lookup directly, TMDB didn't."""
    return await omdb_movie_details_by_title(title)


# ---------- Generate Recommendations ----------


@app.get("/recommendations/genre", response_model=List[OMDBMovieCard])
async def recommendations_by_genre(
    title: str = Query(..., description="A title that exists in the local dataset"),
    limit: int = Query(18, ge=1, le=50),
):
    """
    OMDB CHANGE: takes a `title` (matched against your local dataset)
    instead of a `tbdm_id` int, since OMDb has no genre-id system and
    no /discover endpoint to query by it.
    """
    candidates = local_genre_recommend(title, limit=limit)

    cards: List[OMDBMovieCard] = []
    for _, row in candidates.iterrows():
        card = await attach_omdb_card_by_title(
            str(row["title"]), local_rating=row.get("vote_average")
        )
        if card:
            cards.append(card)
    return cards


# -------- TF-IDF and search Bundle -------------


@app.get("/search/movies", response_model=SearchBundleResponse)
async def search_movies(
    query: str = Query(..., min_length=1),
    tfidf_top_n: int = Query(12, ge=1, le=30),
    genre_limit: int = Query(12, ge=1, le=30),
):
    """
    OMDB CHANGE: previously searched TMDB first and derived everything
    from that match. Now the LOCAL dataset is matched first (exact,
    then fuzzy via difflib), since TF-IDF and genre recs only work for
    titles that exist locally. OMDb is only used to fetch poster/plot/
    rating for the matched title and for enriching each recommendation.
    """
    matched_title = find_local_title_match(query)

    if not matched_title:
        # Not in the local dataset at all - still try to return OMDb
        # details so the endpoint isn't a dead end, just with empty recs.
        details = await omdb_movie_details_by_title(query)
        return SearchBundleResponse(
            query=query,
            movie_details=details,
            tfidf_recommendations=[],
            genre_recommendations=[],
        )

    try:
        details = await omdb_movie_details_by_title(matched_title)
    except HTTPException:
        # OMDb doesn't have this title either - fall back to a details
        # object built purely from local data so recs can still run.
        row = df.iloc[get_local_idx_by_title(matched_title)]
        details = OMDBMovieDetails(
            title=matched_title,
            genres=parse_local_genres(row.get("genres")),
            plot=row.get("overview"),
        )

    # 1) TF-IDF recommendations
    tfidf_items: List[TFIDFRecItem] = []
    recs = tfidf_recommend_titles(matched_title, top_n=tfidf_top_n)
    for rec_title, score in recs:
        card = await attach_omdb_card_by_title(rec_title)
        tfidf_items.append(TFIDFRecItem(title=rec_title, score=score, omdb=card))

    # 2) Genre recommendations (local dataset, see local_genre_recommend)
    genre_candidates = local_genre_recommend(matched_title, limit=genre_limit)
    genre_recs: List[OMDBMovieCard] = []
    for _, row in genre_candidates.iterrows():
        card = await attach_omdb_card_by_title(
            str(row["title"]), local_rating=row.get("vote_average")
        )
        if card:
            genre_recs.append(card)

    return SearchBundleResponse(
        query=query,
        movie_details=details,
        tfidf_recommendations=tfidf_items,
        genre_recommendations=genre_recs,
    )


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
        reload=True,
        log_level="info",
    )