import express from "express";
import { config } from "dotenv";
import { executeCheck } from "./src/main.mjs";

config();

const app = express();
const port = process.env.PORT || 3001;

const handleOptions = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.end();
};

const handleRequest = (req, res) => {
  console.log("requested!");
  executeCheck().then((result) => res.type('json').send(result));
};

app.options("/", handleOptions);
app.get("/", handleRequest);

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

