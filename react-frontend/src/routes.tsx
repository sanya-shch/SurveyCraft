import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import FormBuilder from "./pages/builder/FormBuilder";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicFormPage from "./pages/viewer/PublicFormPage";
import FormAnalyticsPage from "./pages/analytics/FormAnalyticsPage";
import QuestionDetailsPage from "./pages/analytics/components/QuestionDetailsPage";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/public/forms/:shareId", element: <PublicFormPage /> },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/builder/:formId",
    element: (
      <ProtectedRoute>
        <FormBuilder />
      </ProtectedRoute>
    ),
  },
  {
    path: "/analytics/:formId",
    element: (
      <ProtectedRoute>
        <FormAnalyticsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/analytics/:formId/questions/:questionId",
    element: (
      <ProtectedRoute>
        <QuestionDetailsPage />
      </ProtectedRoute>
    ),
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
