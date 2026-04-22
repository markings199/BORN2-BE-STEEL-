require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const apiRoutes = require("./backend/routes/api");

const app = express();
const PORT = Number(process.env.PORT) || 3040;

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

const PREFERRED_PORT = PORT;
const PORT_TRIES = Math.max(1, Number(process.env.PORT_TRY_COUNT) || 15);
let listenPort = PREFERRED_PORT;
let tries = 0;

const server = app.listen(listenPort);

function onListening() {
  const addr = server.address();
  const bound =
    typeof addr === "object" && addr && addr.port != null ? addr.port : listenPort;
  if (bound === PREFERRED_PORT) {
    console.log(`\n  http://localhost:${bound}  (API + frontend)\n`);
  } else {
    console.log(
      `\n  http://localhost:${bound}  (API + frontend)\n` +
        `  Note: wanted ${PREFERRED_PORT}; close extra Node terminals or set PORT in .env.\n`
    );
  }
}

server.once("listening", onListening);

server.on("error", (err) => {
  if (err.code !== "EADDRINUSE") {
    console.error(err);
    process.exit(1);
  }
  tries += 1;
  if (tries >= PORT_TRIES) {
    console.error(
      `No free port after ${PORT_TRIES} tries from ${PREFERRED_PORT}. Set PORT in .env or run: netstat -ano | findstr :${PREFERRED_PORT}`
    );
    process.exit(1);
  }
  listenPort += 1;
  server.listen(listenPort);
});
