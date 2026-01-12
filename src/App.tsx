import { Route, Routes } from "react-router-dom";
import "./App.css";
import { MovieListPage } from "./pages/MovieListPage.tsx";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<MovieListPage />} />
      </Routes>
      
    </div>
  );
}

export default App;
