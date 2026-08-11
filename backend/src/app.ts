import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes.js";
import formRoutes from "./modules/form/form.routes.js";
import responseRoutes from "./modules/response/response.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import exportRoutes from "./modules/export/export.routes.js";

import { errorHandler } from "./shared/middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
    optionsSuccessStatus: 200,
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Бекенд працює і доступний!");
});

app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/forms", responseRoutes);
app.use("/api/forms", analyticsRoutes);
app.use("/api/forms", exportRoutes);

app.use(errorHandler);

export default app;
