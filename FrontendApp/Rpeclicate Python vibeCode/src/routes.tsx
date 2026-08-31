import { createBrowserRouter } from "react-router";
import Landing from "./Landing";
import MovieRoom from "./MovieRoom";

export const router = createBrowserRouter([
  { path: "/", Component: Landing },
  { path: "/app", Component: MovieRoom },
]);
