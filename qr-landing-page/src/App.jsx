import { Routes, Route } from "react-router-dom";
import CompanyOverviewPage from "./pages/Home";

function App() {
  return (
    <Routes>
      <Route index path="/landing/:token" element={<CompanyOverviewPage />} />
    </Routes>
  );
}

export default App;
