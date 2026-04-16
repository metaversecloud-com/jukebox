import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./router/routes.js";
import path from "path";

import { cleanReturnPayload } from "./utils/cleanReturnPayload.js";
import { fileURLToPath } from "url";
import webhookRouter from "./router/webhooks.js";


// import youtubeRouter from "./youtubeRoutes";
dotenv.config({ path: "../.env"});


function checkEnvVariables() {
  const requiredEnvVariables = ["INTERACTIVE_KEY", "INTERACTIVE_SECRET"];
  const missingVariables = requiredEnvVariables.filter((variable) => !process.env[variable]);

  if (missingVariables.length > 0) {
    throw new Error(`Missing required environment variables in the .env file: ${missingVariables.join(", ")}`);
  } else {
    console.log("All required environment variables provided.");
  }
}
checkEnvVariables();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV === "development") {
  const corsOptions = {
    origin: "http://localhost:3001",
    credentials: true, //access-control-allow-credentials:true
    optionSuccessStatus: 200,
  };
  app.use(cors(corsOptions));
}

app.use(function (req, res, next) {
  const ogSend = res.send;
  res.send = function (data) {
    if (data) {
      try {
        const cleanData = cleanReturnPayload(
          typeof data === "string" ? JSON.parse(data) : data,
          // @ts-ignore
          "topia"
        );
        res.send = ogSend;
        return res.send(cleanData);
      } catch (error) {
        console.error(error);
        next();
      }
    }
  };
  next();
});

app.use("/api", router);
app.use("/webhook", webhookRouter);

if (process.env.NODE_ENV !== "development") {
  // Node serves the files for the React app
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use(express.static(path.resolve(__dirname, "../../client/build")));

  // All other GET requests not handled before will return our React app
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../../client/build", "index.html"));
  });
}


// Prevent crashes from unhandled promise rejections (e.g., API timeouts after response sent)
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  // ERR_HTTP_HEADERS_SENT is non-fatal — response was already sent, just log it
  if ((error as any).code === "ERR_HTTP_HEADERS_SENT") {
    console.error("Caught ERR_HTTP_HEADERS_SENT (response already sent):", error.message);
    return;
  }
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
