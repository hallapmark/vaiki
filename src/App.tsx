import { Route, Routes } from "react-router-dom";
import "./App.css";
import { MovieListPage } from "./pages/MovieListPage.tsx";
import { MovieDetailsPage } from "./pages/MovieDetailsPage.tsx";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<MovieListPage />} />
        <Route path="/movie/:slug" element={<MovieDetailsPage />} />
      </Routes>
    </div>
  );
}

export default App;
