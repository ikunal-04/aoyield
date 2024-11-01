import { Toaster } from "react-hot-toast";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "@/layouts/AppLayout";
import Landing from "@/pages/landing/Landing";
// import VestPage from "@/pages/app/vest/Vest";
import Protocols from "@/pages/app/protocols/Protocols";
// import HistoryPage from "@/pages/app/history/History";
import Portfolio from "@/pages/app/portfolio/Portfolio";
import NotFound404Page from "@/pages/404/NotFound404";
import PrivateRoute from "@/components/PrivateRoute";
import NotFound from "@/pages/not-found/NotFound";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          index
          path="/"
          element={
            <AppLayout>
              <Landing />
            </AppLayout>
          }
        />
        <Route
          path="/app/protocols"
          element={
            <PrivateRoute>
              <AppLayout>
                <Protocols />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/app/portfolio"
          element={
            <PrivateRoute>
              <AppLayout>
                <Portfolio />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/404"
          element={
            <AppLayout>
              <NotFound404Page />
            </AppLayout>
          }
        />
        <Route
          path="/not-connected"
          element={
            <AppLayout>
              <NotFound />
            </AppLayout>
          }
        />
        <Route
          path="*"
          element={
            <AppLayout>
              <Navigate to="/404" />
            </AppLayout>
          }
        />
      </Routes>

      <Toaster position="bottom-center" />
    </HashRouter>
  );
}
export default App;