const serverless = require("serverless-http");
import app from "../artifacts/api-server/src/app";

const handler = serverless(app);

export default async function (req: any, res: any) {
  return handler(req, res);
}

export const config = {
  runtime: "nodejs20.x",
};
