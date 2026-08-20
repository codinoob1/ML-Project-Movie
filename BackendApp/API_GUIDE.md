# Movie Recommendation API - Frontend Integration Guide

This document is a comprehensive integration guide for frontend developers connecting to the **Movie Recommendation API** backend. 

The backend is built with **FastAPI** and uses a hybrid recommendation approach: **Content-Based Filtering** (using local TF-IDF cosine similarity matrices) and **Genre/Popularity-based discovery** via external movie databases.

---

## 🚀 Quick Start & Environment

- **Base URL (Local)**: `http://127.0.0.1:8080`
- **CORS Configuration**: Enabled for all origins (`"*"`) for headers, methods, and credentials.
- **Port**: `8080` (Running on Uvicorn)

---

## 📦 Data Models (TypeScript Definitions)

To ensure type-safe integration in your React/Angular/Vue frontend, you can use the following TypeScript interfaces corresponding to the Pydantic schemas in the backend.

```typescript
// Standard card used for listings, grids, and recommendation lists
export interface TMDBMovieCard {
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  release_date: string | null;
  vote_average: number | null;
}

// Full detailed representation of a specific movie
export interface TMDBMovieDetails {
  tmdb_id: number;
  title: string;
  overview: string | null;
  release_date: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  genres: Array<{ id: number; name: string }>;
}

// Single content-based recommendation item calculated using TF-IDF
export interface TFIDFRecItem {
  title: string;
  score: number; // Cosine similarity score [0.0 - 1.0]
  tmdb: TMDBMovieCard | null; // Detailed provider metadata/card if found
}

// Hybrid recommendation search bundle
export interface SearchBundleResponse {
  query: string;
  movie_details: TMDBMovieDetails;
  tfidf_recommendations: TFIDFRecItem[];
  genre_recommendations: TMDBMovieCard[];
}
```

---

## 📡 API Endpoints

### 1. Root Check
* **Endpoint**: `GET /`
* **Description**: Verifies if the API is online.
* **Response**:
  ```json
  {
    "message": "Movie Recommend API is running"
  }
  ```

---

### 2. Health Check
* **Endpoint**: `GET /health`
* **Description**: Simple server health verification.
* **Response**:
  ```json
  {
    "status": "I am working"
  }
  ```

---

### 3. Movie Home Feed
* **Endpoint**: `GET /home`
* **Description**: Returns movies based on categories (popular, trending, top rated, upcoming, or now playing).
* **Query Parameters**:
  - `cat` (string, optional): One of `"popular"`, `"top_rated"`, `"upcoming"`, `"now_playing"`, or `"trending"`. *Default:* `"popular"`.
  - `limit` (integer, optional): Max cards to return. Range: `1` to `50`. *Default:* `24`.
* **Sample Request**:
  `GET http://127.0.0.1:8080/home?cat=popular&limit=5`
* **Response (`TMDBMovieCard[]`)**:
  ```json
  [
    {
      "tmdb_id": 550,
      "title": "Fight Club",
      "poster_url": "http://img.omdbapi.com/?apikey=YOUR_KEY&/bptfV8Y76OIunv9f9996rK8v3f.jpg",
      "release_date": "1999-10-15",
      "vote_average": 8.433
    }
  ]
  ```

---

### 4. Raw Provider Movie Search
* **Endpoint**: `GET /odbm/search`
* **Description**: Performs a direct keyword query on the backing movie database for multi-result matches (ideal for autocomplete or search grids).
* **Query Parameters**:
  - `query` (string, required): Title keyword or query phrase. *Min length: 2*.
  - `page` (integer, optional): Page offset. Range: `1` to `10`. *Default:* `1`.
* **Sample Request**:
  `GET http://127.0.0.1:8080/odbm/search?query=interstellar&page=1`
* **Response**: Returns the raw JSON payload from the data provider search API.

---

### 5. Detailed Movie Lookup
* **Endpoint**: `GET /movie/id/{tmdb_id}`
* **Description**: Resolves comprehensive details for a movie.
* **Path Parameters**:
  - `tmdb_id` (integer or string, required): Unique identifier of the movie.
* **Response (`TMDBMovieDetails`)**:
  ```json
  {
    "tmdb_id": 157336,
    "title": "Interstellar",
    "overview": "The adventures of a group of explorers who make use of a newly discovered wormhole...",
    "release_date": "2014-11-05",
    "poster_url": "http://img.omdbapi.com/?apikey=YOUR_KEY&/gEU2Qv6Xg778g3v6vG6uU467U.jpg",
    "backdrop_url": "http://img.omdbapi.com/?apikey=YOUR_KEY&/xJH0z8mgoisb6933uW8u.jpg",
    "genres": [
      { "id": 12, "name": "Adventure" },
      { "id": 18, "name": "Drama" },
      { "id": 878, "name": "Science Fiction" }
    ]
  }
  ```
* **⚠️ WARNING (Known Bug)**: This endpoint is currently broken on the backend (it attempts to `await` the integer `tmdb_id`). See the **Bugs & Patches** section below for details.

---

### 6. Genre-Based Recommendations
* **Endpoint**: `GET /recommendations/genra` *(Note spelling: `/genra`)*
* **Description**: Pulls similar recommendations belonging to the same primary genre of a given reference movie ID.
* **Query Parameters**:
  - `tbdm_id` (integer, required): Reference movie ID. *(Note spelling: `tbdm_id`)*
  - `limit` (integer, optional): Maximum recommendations. *Default/Internal validation warning: see below.*
* **⚠️ WARNING (Known Bug)**: This endpoint will fail with a `422 Validation Error` or `500 Server Error` under default values. Refer to the **Bugs & Patches** section below before calling.

---

### 7. Search & Hybrid Recommendation Bundle
* **Endpoint**: `GET /search/movies`
* **Description**: The main entry point for a detailed details-and-recommendations view. Given a single movie query, it returns the best matched movie's details, localized content-based TF-IDF recommendations, and genre-similar movies.
* **Query Parameters**:
  - `query` (string, required): Title search query. *Min length: 1*.
  - `tfidf_top_n` (integer, optional): Max TF-IDF content recommendations. Range: `1` to `30`. *Default:* `12`.
  - `genre_limit` (integer, optional): Max genre-based recommendations. Range: `1` to `30`. *Default:* `12`.
* **Response (`SearchBundleResponse`)**:
  ```json
  {
    "query": "Inception",
    "movie_details": {
      "tmdb_id": 27205,
      "title": "Inception",
      "overview": "Cobb, a skilled thief...",
      "release_date": "2010-07-15",
      "poster_url": "http://img.omdbapi.com/?apikey=YOUR_KEY&/t3clWb2E4aYh2X7q3K.jpg",
      "backdrop_url": "http://img.omdbapi.com/?apikey=YOUR_KEY&/qisb28G7X8.jpg",
      "genres": [
        { "id": 28, "name": "Action" },
        { "id": 878, "name": "Science Fiction" }
      ]
    },
    "tfidf_recommendations": [
      {
        "title": "Interstellar",
        "score": 0.812401,
        "tmdb": {
          "tmdb_id": 157336,
          "title": "Interstellar",
          "poster_url": "...",
          "release_date": "2014-11-05",
          "vote_average": 8.3
        }
      }
    ],
    "genre_recommendations": [
      {
        "tmdb_id": 299536,
        "title": "Avengers: Infinity War",
        "poster_url": "...",
        "release_date": "2018-04-25",
        "vote_average": 8.3
      }
    ]
  }
  ```
* **⚠️ WARNING (Known Bug)**: This endpoint contains critical typos that prevent it from completing. See below.

---

## 🛠️ Known Backend Bugs & Recommended Patches (For Backend Devs)

If you are developing the frontend and experience errors, the backend code has some structural bugs. Share these exact fixes with the backend developer or patch `Main.py` directly:

### 1. `/movie/id/{tmdb_id}` is non-functional
- **The Issue**: It attempts to `await` the path parameter `tmdb_id` (a string/integer) directly, causing a `TypeError`.
- **The Fix**: Change the router function to correctly await `omdb_movie_details`:
  ```python
  @app.get("/movie/id/{tmdb_id}", response_model=TMDBMovieDetails)
  async def movie_deatils(tmdb_id: int):
      return await omdb_movie_details(tmdb_id)
  ```

### 2. `/recommendations/genra` throws validation/runtime errors
- **The Issues**:
  1. `limit` default is `18` but has constraint `le=5`, throwing validation errors immediately.
  2. The function assigns to `deatils` but attempts to read from `details` on the next line (raises `NameError`).
  3. The `response_model` is a single card (`TMDBMovieCard`), but the function returns a `List[TMDBMovieCard]` (raises response validation error).
- **The Fix**:
  ```python
  @app.get("/recommendations/genra", response_model=List[TMDBMovieCard])
  async def Recommendations(
      tbdm_id : int = Query(...),
      limit: int = Query(18, ge=1, le=50) # Increased le to allow defaults
  ):
      details = await omdb_movie_details(tbdm_id) # Correct spelling
      if not details.genres:
          return []
      
      genre_id = details.genres[0]["id"]
      discover = await omdb_get(
          "/discover/movie",
          {
              "with_genres": genre_id,
              "language": "en-US",
              "sort_by": "popularity.desc",
              "page": 1,
          },
      )
      cards = await omdb_card_from_res(discover.get("results", []), limit=limit)
      return [c for c in cards if c.tmdb_id != tbdm_id]
  ```

### 3. `/search/movies` crashes during search resolution
- **The Issues**:
  1. It tries to get `best["id"]` from the search response dict. However, the search response wraps list items under a `"results"` key, making `best` a container, not a single movie.
  2. In `omdb_movie_details`, `backdrop_url=omdb_get(data.get("backdrop_path"))` is calling `omdb_get` synchronously without `await` and with missing arguments.
  3. It calls `await omdb_get(discover.get("results", []), limit=genre_limit)` inside `/search/movies` which crashes. It was supposed to call the mapping utility `omdb_card_from_res`.
- **The Fix**:
  ```python
  # Correcting omdb_movie_details backdrop_url assignment:
  async def omdb_movie_details(movie_id: int) -> TMDBMovieDetails:
      data = await omdb_get(f"/movie/{movie_id}", {"language": "en-US"})
      return TMDBMovieDetails(
          tmdb_id=int(data["id"]),
          title=data.get("title") or "",
          overview=data.get("overview"),
          release_date=data.get("release_date"),
          poster_url=making_img_url(data.get("poster_path")),
          backdrop_url=making_img_url(data.get("backdrop_path")), # Fixed helper call
          genres=data.get("genres", []) or [],
      )

  # Correcting /search/movies route handler:
  @app.get("/search/movies", response_model=SearchBundleResponse)
  async def Search_mov(
      query: str = Query(..., min_length=1),
      tfidf_top_n: int = Query(12, ge=1, le=30),
      genre_limit: int = Query(12, ge=1, le=30),
  ):
      best_raw = await odbm_search(query)
      results = best_raw.get("results", [])
      if not results:
          raise HTTPException(
              status_code=404, detail=f"No TMDB movie found for query: {query}"
          )

      best = results[0] # Grab the first matched movie dict
      tmdb_id = int(best["id"])
      details = await omdb_movie_details(tmdb_id)

      # 1) TF-IDF recommendations
      tfidf_items: List[TFIDFRecItem] = []
      recs: List[tuple[str, float]] = []
      try:
          recs = tfidf_recommend_titles(details.title, top_n=tfidf_top_n)
      except Exception:
          try:
              recs = tfidf_recommend_titles(query, top_n=tfidf_top_n)
          except Exception:
              recs = []

      for title, score in recs:
          card = await attach_tmdb_card_by_title(title)
          tfidf_items.append(TFIDFRecItem(title=title, score=score, tmdb=card))

      # 2) Genre recommendations (TMDB discover by first genre)
      genre_recs: List[TMDBMovieCard] = []
      if details.genres:
          genre_id = details.genres[0]["id"]
          discover = await omdb_get(
              "/discover/movie",
              {
                  "with_genres": genre_id,
                  "language": "en-US",
                  "sort_by": "popularity.desc",
                  "page": 1,
              },
          )
          # Changed from omdb_get to omdb_card_from_res
          cards = await omdb_card_from_res(
              discover.get("results", []), limit=genre_limit
          )
          genre_recs = [c for c in cards if c.tmdb_id != details.tmdb_id]

      return SearchBundleResponse(
          query=query,
          movie_details=details,
          tfidf_recommendations=tfidf_items,
          genre_recommendations=genre_recs,
      )
  ```

---

## 💡 Frontend Integration Example (axios / native fetch)

Below is an elegant React utility block demonstrating how to integrate these endpoints:

```typescript
import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8080';

export const movieApi = {
  // Get home categories (e.g. popular, trending)
  getHomeFeed: async (category = 'popular', limit = 24): Promise<TMDBMovieCard[]> => {
    const response = await axios.get(`${BASE_URL}/home`, {
      params: { cat: category, limit }
    });
    return response.data;
  },

  // Perform search / recommendations bundle
  getMovieBundle: async (query: string): Promise<SearchBundleResponse> => {
    const response = await axios.get(`${BASE_URL}/search/movies`, {
      params: { query }
    });
    return response.data;
  }
};
```
