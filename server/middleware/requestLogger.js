/**
 * Request Logger Middleware
 * Logs incoming HTTP requests, response status codes, and execution times
 * directly to the terminal with clean color formatting.
 * Uses zero external dependencies.
 */
const requestLogger = (req, res, next) => {
  // Ignore automatic browser favicon requests so logs remain clean
  if (req.url === "/favicon.ico") {
    return next();
  }

  const start = Date.now();
  const timestamp = new Date().toLocaleTimeString();

  // Capture response completion to log final status code and response time
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // ANSI colors for readable terminal logs
    const RESET = "\x1b[0m";
    const GREEN = "\x1b[32m";
    const YELLOW = "\x1b[33m";
    const CYAN = "\x1b[36m";
    const RED = "\x1b[31m";
    const MAGENTA = "\x1b[35m";

    let statusColor = GREEN;
    if (status >= 500) {
      statusColor = RED;
    } else if (status >= 400) {
      statusColor = YELLOW;
    } else if (status >= 300) {
      statusColor = CYAN;
    }

    const methodColor =
      req.method === "GET"
        ? GREEN
        : req.method === "POST"
          ? YELLOW
          : req.method === "PUT"
            ? CYAN
            : req.method === "DELETE"
              ? RED
              : MAGENTA;

    console.log(
      `[${timestamp}] ${methodColor}${req.method.padEnd(6)}${RESET} ${req.originalUrl || req.url} ${statusColor}${status}${RESET} (${duration}ms)`,
    );
  });

  next();
};

module.exports = requestLogger;
