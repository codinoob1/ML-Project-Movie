# Movie Recommendation API - Frontend Integration Guide

This document is a comprehensive integration guide for frontend developers connecting to the **Movie Recommendation API** backend. 

The backend is built with **FastAPI** and uses a hybrid recommendation approach: **Content-Based Filtering** (using local TF-IDF cosine similarity matrices) and **Genre/Popularity-based discovery** via OMDb and the local dataset.

---

## 🚀 Quick Start & Environment

- **Base URL (Local)**: `http://127.0.0.1:8080`
- **CORS Configuration**: Enabled for all origins (`"*"`) for headers, methods, and credentials.
- **Port**: `8080` (Running on Uvicorn)

---

## 🔄 TMDB to OMDb Migration Highlights
If you are upgrading from an older version of this API, note the following critical changes:
- **IMDb IDs**: All movie identifiers are now alphanumeric string IMDb IDs (`imdb_id`, e.g., `"tt0137523"`) instead of TMDB integer IDs (`tmdb_id`, e.g., `550`).
- **Home Feed**: The `/home` endpoint query parameter `cat` has been replaced with `sort`. The backend now sorts local dataset entries instead of using external TMDB feeds.
- **Genre Recommendations**: The `/recommendations/genre` endpoint (fixed typo from `/genra`) now queries by movie `title` (string) rather than a TMDB genre/movie ID.
- **Genres Array**: Genres are returned as a flat list of strings (`string[]`), e.g., `["Action", "Sci-Fi"]` instead of an array of TMDB genre objects.

---

## 📦 Data Models (TypeScript Definitions)

To ensure type-safe integration in your React/Angular/Vue frontend, you can use the following TypeScript interfaces corresponding to the Pydantic schemas in the backend.

```typescript
// Standard card used for listings, grids, and recommendation lists
export interface OMDBMovieCard {
  imdb_id: string | null;
  title: string;
  poster_url: string | null;
  year: string | null;
  local_rating: number | null; // From local dataset (vote_average/popularity)
}

// Full detailed representation of a specific movie
export interface OMDBMovieDetails {
  imdb_id: string | null;
  title: string;
  plot: string | null;
  year: string | null;
  poster_url: string | null;
  genres: string[]; // Flat list of parsed genre names
  imdb_rating: string | null;
  runtime: string | null;
  director: string | null;
  actors: string | null;
}

// Single content-based recommendation item calculated using TF-IDF
export interface TFIDFRecItem {
  title: string;
  score: number; // Cosine similarity score [0.0 - 1.0]
  omdb: OMDBMovieCard | null; // Detailed provider metadata/card if found
}

// Hybrid recommendation search bundle
export interface SearchBundleResponse {
  query: string;
  movie_details: OMDBMovieDetails;
  tfidf_recommendations: TFIDFRecItem[];
  genre_recommendations: OMDBMovieCard[];
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
* **Description**: Returns movies sorted by popularity or rating from the local dataset, enriched with OMDb posters and metadata.
* **Query Parameters**:
  - `sort` (string, optional): One of `"popular"` or `"top_rated"`. *Default:* `"popular"`.
  - `limit` (integer, optional): Max cards to return. Range: `1` to `50`. *Default:* `24`.
* **Sample Request**:
  `GET http://127.0.0.1:8080/home?sort=popular&limit=5`
* **Response (`OMDBMovieCard[]`)**:
  ```json
  [
    {
      "imdb_id": "tt0137523",
      "title": "Fight Club",
      "poster_url": "https://m.media-amazon.com/images/M/MV5BNDIzNDU0YzEtYzE5Ni00ZjlkLTk5ZjgtNjM3NWE4YzA3Nzk3XkEyXkFqcGdeQXVyMjUzOTY1NTc@._V1_SX300.jpg",
      "year": "1999",
      "local_rating": 8.3
    }
  ]
  ```

---

### 4. Raw OMDb Movie Search
* **Endpoint**: `GET /omdb/search`
* **Description**: Performs a direct keyword query on the backing OMDb database for multi-result matches (ideal for autocomplete or search grids).
* **Query Parameters**:
  - `query` (string, required): Title keyword or query phrase. *Min length: 2*.
  - `page` (integer, optional): Page offset. Range: `1` to `10`. *Default:* `1`.
* **Sample Request**:
  `GET http://127.0.0.1:8080/omdb/search?query=interstellar&page=1`
* **Response**: Returns the raw JSON payload from the OMDb Search API. This typically takes the form:
  ```json
  {
    "Search": [
      {
        "Title": "Interstellar",
        "Year": "2014",
        "imdbID": "tt0816692",
        "Type": "movie",
        "Poster": "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGI1LWEyYTUtYjU5NjE0YTg0NGY5XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg"
      }
    ],
    "totalResults": "1",
    "Response": "True"
  }
  ```

---

### 5. Detailed Movie Lookup by IMDb ID
* **Endpoint**: `GET /movie/id/{imdb_id}`
* **Description**: Resolves comprehensive details for a movie using its IMDb string identifier.
* **Path Parameters**:
  - `imdb_id` (string, required): Unique string IMDb identifier of the movie (e.g., `"tt0816692"`).
* **Response (`OMDBMovieDetails`)**:
  ```json
  {
    "imdb_id": "tt0816692",
    "title": "Interstellar",
    "plot": "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    "year": "2014",
    "poster_url": "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGI1LWEyYTUtYjU5NjE0YTg0NGY5XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
    "genres": [
      "Adventure",
      "Drama",
      "Sci-Fi"
    ],
    "imdb_rating": "8.7",
    "runtime": "169 min",
    "director": "Christopher Nolan",
    "actors": "Matthew McConaughey, Anne Hathaway, Jessica Chastain"
  }
  ```

---

### 6. Detailed Movie Lookup by Title
* **Endpoint**: `GET /movie/title/{title}`
* **Description**: Directly looks up comprehensive movie details on OMDb using an exact title string.
* **Path Parameters**:
  - `title` (string, required): Exact title of the movie (e.g., `"Interstellar"`).
* **Response (`OMDBMovieDetails`)**: Same structure as `GET /movie/id/{imdb_id}`.

---

### 7. Genre-Based Recommendations
* **Endpoint**: `GET /recommendations/genre`
* **Description**: Pulls similar recommendations belonging to the same primary genres from the local dataset, sorted by ratings.
* **Query Parameters**:
  - `title` (string, required): Reference movie title (must exist in the local dataset).
  - `limit` (integer, optional): Maximum recommendations. Range: `1` to `50`. *Default:* `18`.
* **Response (`OMDBMovieCard[]`)**:
  ```json
  [
    {
      "imdb_id": "tt1375666",
      "title": "Inception",
      "poster_url": "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
      "year": "2010",
      "local_rating": 8.1
    }
  ]
  ```

---

### 8. Search & Hybrid Recommendation Bundle
* **Endpoint**: `GET /search/movies`
* **Description**: The main entry point for a detailed details-and-recommendations view. Given a single movie query, it matches the title in the local dataset first (fuzzy match if exact is not found), fetches OMDb details, and generates both localized content-based TF-IDF recommendations and genre-similar recommendations.
* **Query Parameters**:
  - `query` (string, required): Title search query. *Min length: 1*.
  - `tfidf_top_n` (integer, optional): Max TF-IDF content recommendations. Range: `1` to `30`. *Default:* `12`.
  - `genre_limit` (integer, optional): Max genre-based recommendations. Range: `1` to `30`. *Default:* `12`.
* **Response (`SearchBundleResponse`)**:
  ```json
  {
    "query": "Inception",
    "movie_details": {
      "imdb_id": "tt1375666",
      "title": "Inception",
      "plot": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
      "year": "2010",
      "poster_url": "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
      "genres": [
        "Action",
        "Sci-Fi",
        "Adventure"
      ],
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
          "poster_url": "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGI1LWEyYTUtYjU5NjE0YTg0NGY5XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
          "year": "2014",
          "local_rating": 8.3
        }
      }
    ],
    "genre_recommendations": [
      {
        "imdb_id": "tt4154988",
        "title": "Avengers: Infinity War",
        "poster_url": "https://m.media-amazon.com/images/M/MV5BMTk4ODQzNDY3Ml5BMl5BanBnXkFtZTcwNDg0MDY3ODk@._V1_SX300.jpg",
        "year": "2018",
        "local_rating": 8.3
      }
    ]
  }
  ```

---

## 💡 Frontend Integration Example (axios / TypeScript)

Below is an elegant React utility block demonstrating how to integrate these endpoints with proper type-safety:

```typescript
import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8080';

export const movieApi = {
  // Get home categories (e.g. popular, top_rated)
  getHomeFeed: async (sort: 'popular' | 'top_rated' = 'popular', limit = 24): Promise<OMDBMovieCard[]> => {
    const response = await axios.get<OMDBMovieCard[]>(`${BASE_URL}/home`, {
      params: { sort, limit }
    });
    return response.data;
  },

  // Perform search / recommendations bundle
  getMovieBundle: async (query: string, tfidfTopN = 12, genreLimit = 12): Promise<SearchBundleResponse> => {
    const response = await axios.get<SearchBundleResponse>(`${BASE_URL}/search/movies`, {
      params: { query, tfidf_top_n: tfidfTopN, genre_limit: genreLimit }
    });
    return response.data;
  },

  // Lookup by IMDb ID
  getMovieDetailsById: async (imdbId: string): Promise<OMDBMovieDetails> => {
    const response = await axios.get<OMDBMovieDetails>(`${BASE_URL}/movie/id/${imdbId}`);
    return response.data;
  },

  // Lookup by Exact Title
  getMovieDetailsByTitle: async (title: string): Promise<OMDBMovieDetails> => {
    const response = await axios.get<OMDBMovieDetails>(`${BASE_URL}/movie/title/${encodeURIComponent(title)}`);
    return response.data;
  }
};
```
