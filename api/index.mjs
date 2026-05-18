// Vercel Serverless Function entry point
// Imports the pre-bundled Express app (built by build-vercel.mjs)
import app from "../artifacts/api-server/dist-vercel/app.mjs";
export default app;
