const path = require("node:path");
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const studentRoutes = require("./routes/studentRoutes");
const requestLogger = require("./middleware/requestLogger");

dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });

const app = express();
app.use(express.json({ limit: "100kb" }));

// Terminal Request Logger
app.use(requestLogger);

app.get("/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "unavailable",
    message: "Student Records Manager API",
    database: connected ? "connected" : "disconnected",
  });
});

// Student CRUD Routes
app.use("/api/students", studentRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const startServer = async () => {
  const port = Number(process.env.PORT ?? 5000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("PORT must be an integer between 0 and 65535.");
  }

  await connectDB();
  try {
    const server = await new Promise((resolve, reject) => {
      const listener = app.listen(port, "127.0.0.1");
      listener.once("error", reject);
      listener.once("listening", () => resolve(listener));
    });
    console.log(`Server listening on http://127.0.0.1:${server.address().port}`);
    return server;
  } catch (error) {
    await mongoose.disconnect();
    throw new Error(error.code === "EADDRINUSE"
      ? `Port ${port} is already in use. Stop the other process or change PORT.`
      : "HTTP server failed to start.");
  }
};

if (require.main === module) {
  startServer().then((server) => {
    const shutdown = () => {
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  }).catch((error) => {
    console.error(`Startup failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
