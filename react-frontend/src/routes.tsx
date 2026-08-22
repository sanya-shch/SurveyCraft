import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";
import ProtectedRoute from "./components/ProtectedRoute";

const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const FormBuilder = lazy(() => import("./pages/builder/FormBuilder"));
const PublicFormPage = lazy(() => import("./pages/viewer/PublicFormPage"));
const FormAnalyticsPage = lazy(() => import("./pages/analytics/FormAnalyticsPage"));
const QuestionDetailsPage = lazy(() => import("./pages/analytics/components/QuestionDetailsPage"));

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
