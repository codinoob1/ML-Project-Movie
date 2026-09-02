# Movie Recommendation API — Frontend Integration Guide

This document is a comprehensive integration guide for frontend developers connecting to the **Movie Recommendation API** backend.

The backend is built with **FastAPI** and uses a hybrid recommendation approach: **Content-Based Filtering** (local TF-IDF cosine similarity over a precomputed matrix) combined with **Genre/Popularity-based discovery** served from a local movie dataset, all **enriched with external metadata (posters, plots, ratings) from the OMDb API**.

> **Purpose**: This guide is written for frontend/AI agents so they can wire up the UI to the backend quickly, type-safely, and without guessing at response shapes.

---

## 🚀 Quick Start & Environment

| Item | Value |
|------|-------|
| **Base URL (Local)** | `http://127.0.0.1:8080` |
| **Server** | Uvicorn (single-process) |
| **Port** | `8080` |
| **CORS** | Enabled for all origins (`*`), all methods, all headers, credentials allowed |
| **Auth** | **None** — all endpoints are public |
| **All methods** | `GET` only (read-only API; no POST/PUT/DELETE) |
| **Response format** | JSON |

**Run command:**
```bash
cd BackendApp
uvicorn Main:app --reload --host 127.0.0.1 --port 8080
# or simply: python Main.py
```

---

## 🧠 Architecture Overview

The backend has **no database persistence**. At startup (`lifespan`), it loads four serialized **pickle** files into memory:

- `data.pkl` — a pandas `DataFrame` of movies (columns: `title`, `genres` [space-separated], `overview`, `vote_average`, `popularity`).
- `indecies.pkl` — maps title → index (normalized into `TITLE_TO_IDX`).
- `tfidf_matrix.pkl` — precomputed TF-IDF sparse matrix for cosine similarity.
- `tfidf_vectorize.pkl` — the TF-IDF vectorizer object.

Requests are served from these in-memory structures plus live (cached) OMDb lookups.

**Key behaviors to remember when integrating:**
- The backend mediarles `omdb_id` as an alphanumeric **string** IMDb ID (e.g. `"tt0816692"`), **not** an integer TMDB ID.
- Genres are always returned as a flat `string[]` (e.g. `["Action", "Sci-Fi"]`).
- The main discovery endpoint is `/search/movies`, which returns a **bundle** of details + both recommendation types in one call.
- A small in-memory cache (`_OMDB_CARD_CACHE`) reduces repeated OMDb hits, so identical lookups are fast.

---

## 🔄 TMDB → OMDb Migration Notes

If you integrated against an older TMDB-based version of this API, note:

- **Identifiers**: `tmdb_id` (int) → `imdb_id` (string, e.g. `"tt0137523"`).
- **Home feed param**: `cat` → `sort` (`"popular"` | `"top_rated"`).
- **Genre endpoint typo fixed**: `/recommendations/genra` → `/recommendations/genre`; now takes `title` instead of a genre/movie ID.
- **Genres**: array of objects → flat `string[]`.

---

## 📦 Data Models (TypeScript Definitions)

These correspond 1:1 to the backend Pydantic schemas.

```typescript
// Standard card used for listings, grids, and recommendation lists.
export interface OMDBMovieCard {
  imdb_id: string | null;
  title: string;
  poster_url: string | null;
  year: string | null;
  local_rating: number | null; // From local dataset (vote_average/popularity)
}

// Full detailed representation of a movie.
export interface OMDBMovieDetails {
  imdb_id: string | null;
  title: string;
  plot: string | null; // "N/A" from OMDb becomes null
  year: string | null;
  poster_url: string | null;
  genres: string[]; // Flat list of parsed genre names
  imdb_rating: string | null; // "N/A" -> null
  runtime: string | null; // e.g. "169 min"
  director: string | null;
  actors: string | null;
}

// A single content-based (TF-IDF) recommendation item.
export interface TFIDFRecItem {
  title: string;
  score: number; // Cosine similarity [0.0 - 1.0]
  omdb: OMDBMovieCard | null; // Enriched card metadata if found
}

// The hybrid "search bundle" — the main discovery response.
export interface SearchBundleResponse {
  query: string;
  movie_details: OMDBMovieDetails;
  tfidf_recommendations: TFIDFRecItem[];
  genre_recommendations: OMDBMovieCard[];
}
```

---

## 📡 API Endpoints

All endpoints are `GET`. Query params marked *(required)* must be provided; all others are optional.

---

### 1. Root Check

- **Endpoint**: `GET /`
- **Description**: Verifies the API is online.
- **Response**:
  ```json
  {
    "message": "Movie Recommend API is running"
  }
  ```

---

### 2. Health Check

- **Endpoint**: `GET /health`
- **Description**: Simple server health verification.
- **Response**:
  ```json
  {
    "status": "I am working"
  }
  ```

---

### 3. Movie Home Feed

- **Endpoint**: `GET /home`
- **Description**: Returns movies sorted by popularity or rating from the local dataset, each enriched with an OMDb poster/IMDb id. Ideal for a landing/home grid.
- **Query Parameters**:
  - `sort` *(optional, string)*: `"popular"` or `"top_rated"`. Default: `"popular"`.
  - `limit` *(optional, int)*: max cards to return, `1`–`50`. Default: `24`.
- **Sample Request**:
  ```
  GET http://127.0.0.1:8080/home?sort=popular&limit=5
  ```
- **Response (`OMDBMovieCard[]`)**:
  ```json
  [
    {
      "imdb_id": "tt0137523",
      "title": "Fight Club",
      "poster_url": "https://m.media-amazon.com/images/M/...._V1_SX300.jpg",
      "year": "1999",
      "local_rating": 8.3
    }
  ]
  ```
- **Errors**: `500` if the dataset is not loaded or the sort column is missing.

---

### 4. Raw OMDb Search

- **Endpoint**: `GET /omdb/search`
- **Description**: Direct keyword query against OMDb for multi-result matches. Useful for autocomplete or a search grid.
- **Query Parameters**:
  - `query` *(required, string)*: title keyword, min length `2`.
  - `page` *(optional, int)*: page offset, `1`–`10`. Default: `1`.
- **Sample Request**:
  ```
  GET http://127.0.0.1:8080/omdb/search?query=interstellar&page=1
  ```
- **Response** — raw OMDb Search payload:
  ```json
  {
    "Search": [
      {
        "Title": "Interstellar",
        "Year": "2014",
        "imdbID": "tt0816692",
        "Type": "movie",
        "Poster": "https://m.media-amazon.com/images/M/...._V1_SX300.jpg"
      }
    ],
    "totalResults": "1",
    "Response": "True"
  }
  ```
> Note: field names here are title-cased (`Title`, `imdbID`, `Poster`) because this endpoint proxies OMDb directly and does NOT re-shape to the camelCase models above.

---

### 5. Movie Details by IMDb ID

- **Endpoint**: `GET /movie/id/{imdb_id}`
- **Description**: Resolves full details for a movie using its IMDb string identifier.
- **Path Parameters**:
  - `imdb_id` *(required, string)*: e.g. `"tt0816692"`.
- **Response (`OMDBMovieDetails`)**:
  ```json
  {
    "imdb_id": "tt0816692",
    "title": "Interstellar",
    "plot": "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    "year": "2014",
    "poster_url": "https://m.media-amazon.com/images/M/...._V1_SX300.jpg",
    "genres": ["Adventure", "Drama", "Sci-Fi"],
    "imdb_rating": "8.7",
    "runtime": "169 min",
    "director": "Christopher Nolan",
    "actors": "Matthew McConaughey, Anne Hathaway, Jessica Chastain"
  }
  ```

---

### 6. Movie Details by Title

- **Endpoint**: `GET /movie/title/{title}`
- **Description**: Looks up full details on OMDb using an exact title string.
- **Path Parameters**:
  - `title` *(required, string)*: exact title, e.g. `"Interstellar"` (URL-encode spaces).
- **Response (`OMDBMovieDetails`)**: Same structure as endpoint 5.

---

### 7. Genre-Based Recommendations

- **Endpoint**: `GET /recommendations/genre`
- **Description**: Returns movies sharing at least one genre with the reference title, sourced from the **local dataset** (not OMDb), sorted by rating/popularity.
- **Query Parameters**:
  - `title` *(required, string)*: reference movie title (**must exist in the local dataset**).
  - `limit` *(optional, int)*: max recommendations, `1`–`50`. Default: `18`.
- **Sample Request**:
  ```
  GET http://127.0.0.1:8080/recommendations/genre?title=Inception&limit=5
  ```
- **Response (`OMDBMovieCard[]`)**:
  ```json
  [
    {
      "imdb_id": "tt1375666",
      "title": "Inception",
      "poster_url": "https://m.media-amazon.com/images/M/...._V1_SX300.jpg",
      "year": "2010",
      "local_rating": 8.1
    }
  ]
  ```
- **Errors**: `404` if the title is not in the local dataset.

---

### 8. Search & Hybrid Recommendation Bundle ⭐

- **Endpoint**: `GET /search/movies`
- **Description**: The **main** endpoint for a details + recommendations view. Given one movie query, it:
  1. Matches the title against the local dataset (exact match via `TITLE_TO_IDX`, then fuzzy via `difflib.get_close_matches`, cutoff `0.6`).
  2. Fetches OMDb details for the matched title (falls back to local-built details if OMDb has no match).
  3. Computes **TF-IDF content-based recommendations** (cosine similarity).
  4. Computes **genre-similar recommendations** from the local dataset.
- **Query Parameters**:
  - `query` *(required, string)*: title search, min length `1`.
  - `tfidf_top_n` *(optional, int)*: max TF-IDF recs, `1`–`30`. Default: `12`.
  - `genre_limit` *(optional, int)*: max genre recs, `1`–`30`. Default: `12`.
- **Sample Request**:
  ```
  GET http://127.0.0.1:8080/search/movies?query=Inception&tfidf_top_n=5&genre_limit=5
  ```
- **Response (`SearchBundleResponse`)**:
  ```json
  {
    "query": "Inception",
    "movie_details": {
      "imdb_id": "tt1375666",
      "title": "Inception",
      "plot": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
      "year": "2010",
      "poster_url": "https://m.media-amazon.com/images/M/...._V1_SX300.jpg",
      "genres": ["Action", "Sci-Fi", "Adventure"],
      "imdb_rating": "8.8",
      "runtime": "148 min",
      "director": "Christopher Nolan",
      "actors": "Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page"
    },
    "tfidf_recommendations": [
      {
        "title": "Interstellar",
        "score": 0.812401,
        "omdb": {
          "imdb_id": "tt0816692",
          "title": "Interstellar",
          "poster_url": "https://m.media-amazon.com/images/M/...._V1_SX300.jpg",
          "year": "2014",
          "local_rating": 8.3
        }
      }
    ],
    "genre_recommendations": [
      {
        "imdb_id": "tt4154988",
        "title": "Avengers: Infinity War",
        "poster_url": "https://m.media-amazon.com/images/M/...._V1_SX300.jpg",
        "year": "2018",
        "local_rating": 8.3
      }
    ]
  }
  ```
- **Fallback behavior**: if the query is not in the local dataset, the response still includes OMDb `movie_details` but with empty recommendation arrays.

---

## 💡 Frontend Integration Example (axios + TypeScript)

A ready-to-use type-safe client:

```typescript
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8080";

export const movieApi = {
  // Home feed (popular / top-rated)
  getHomeFeed: async (
    sort: "popular" | "top_rated" = "popular",
    limit = 24
  ): Promise<OMDBMovieCard[]> => {
    const { data } = await axios.get<OMDBMovieCard[]>(`${BASE_URL}/home`, {
      params: { sort, limit },
    });
    return data;
  },

  // Search + hybrid recommendation bundle (main discovery endpoint)
  getMovieBundle: async (
    query: string,
    tfidfTopN = 12,
    genreLimit = 12
  ): Promise<SearchBundleResponse> => {
    const { data } = await axios.get<SearchBundleResponse>(
      `${BASE_URL}/search/movies`,
      { params: { query, tfidf_top_n: tfidfTopN, genre_limit: genreLimit } }
    );
    return data;
  },

  // Genre-based recommendations
  getGenreRecommendations: async (
    title: string,
    limit = 18
  ): Promise<OMDBMovieCard[]> => {
    const { data } = await axios.get<OMDBMovieCard[]>(
      `${BASE_URL}/recommendations/genre`,
      { params: { title, limit } }
    );
    return data;
  },

  // Raw OMDb search (title-cased fields!)
  searchOmdb: async (query: string, page = 1): Promise<any> => {
    const { data } = await axios.get(`${BASE_URL}/omdb/search`, {
      params: { query, page },
    });
    return data;
  },

  // Details by IMDb ID
  getMovieDetailsById: async (
    imdbId: string
  ): Promise<OMDBMovieDetails> => {
    const { data } = await axios.get<OMDBMovieDetails>(
      `${BASE_URL}/movie/id/${imdbId}`
    );
    return data;
  },

  // Details by exact title
  getMovieDetailsByTitle: async (
    title: string
  ): Promise<OMDBMovieDetails> => {
    const { data } = await axios.get<OMDBMovieDetails>(
      `${BASE_URL}/movie/title/${encodeURIComponent(title)}`
    );
    return data;
  },
};
```

---

## ⚠️ Integration Gotchas

1. **No auth** — no tokens or headers required.
2. **IDs are strings** — always treat `imdb_id` as a string.
3. **Genres are flat arrays** — do not expect TMDB-style objects.
4. **`/omdb/search` returns raw, title-cased OMDb JSON** — do not send it straight into the typed `OMDBMovieCard`/`OMDBMovieDetails` components; map `Title → title`, `imdbID → imdb_id`, `Poster → poster_url` yourself.
5. **`/recommendations/genre` requires a local title** — if the title isn't in the dataset you'll get `404`; fall back to `/omdb/search` or `/search/movies`.
6. **Local ratings** may be `null` when the movie isn't in the local dataset.
7. **CORS is open** (`*`) — fine for local dev, no special config needed.
8. **OMDb field caveats** — `plot`, `imdb_rating`, `poster_url` etc. can be `null` (mapped from OMDb `"N/A"`), so always null-guard images and text in the UI.
