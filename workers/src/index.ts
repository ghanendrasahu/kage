import { config } from "dotenv";
config({ path: "../.env" });

import { createRedisConnection, closeRedisConnection } from "@kage/queue";
import { ResearchWorker } from "./processors/research";
import { OutreachWorker } from "./processors/outreach";
import { SendEmailWorker } from "./processors/send-email";

async function main() {
  console.log("Starting KAGE workers...");

  const connection = createRedisConnection();

  const researchWorker = new ResearchWorker();
  const outreachWorker = new OutreachWorker();
  const sendEmailWorker = new SendEmailWorker();

  researchWorker.start();
  outreachWorker.start();
  sendEmailWorker.start();

  console.log("Workers started: research, outreach, send-email");

  const shutdown = async () => {
    console.log("Shutting down workers...");
    await researchWorker.stop();
    await outreachWorker.stop();
    await sendEmailWorker.stop();
    await closeRedisConnection();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Failed to start workers:", error);
  process.exit(1);
});
