require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const apiRoutes = require("./backend/routes/api");

const app = express();

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "tiny")
);
app.use(express.json({ limit: "100kb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

app.use("/api", apiRoutes);

app.use(express.static(path.join(__dirname, "frontend")));

app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message =
    status === 500 && process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Internal Server Error";
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: message });
});

module.exports = app;
