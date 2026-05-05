const app = require("./app");
const PORT = Number(process.env.PORT) || 3040;

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
