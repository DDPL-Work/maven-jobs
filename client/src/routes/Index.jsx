//routes/index.jsx
import { RouterProvider } from "react-router-dom";
import { appRouter } from "./routes";

export default function AppRoutes() {
  return <RouterProvider router={appRouter} />;
}
