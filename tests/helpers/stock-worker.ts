// Runs in its own thread with its OWN SQLite connection, to prove concurrent sales can't oversell.
// The test bundles this file with esbuild before starting the threads.
import { parentPort, workerData } from "node:worker_threads";
import { openDatabase } from "@/db/connection";
import { InsufficientStockError, applyStockMovement, withStockTransaction } from "@/server/inventory/stock";

type Input = { index: number; dbPath: string; variantId: string; attempts: number; gate: SharedArrayBuffer };
const input = workerData as Input;

const db = openDatabase(input.dbPath);
const result = { sold: 0, soldOut: 0, otherErrors: [] as string[] };

// Signal "ready", then block until the test releases every worker at the same instant.
const gate = new Int32Array(input.gate);
Atomics.add(gate, 1, 1);
Atomics.wait(gate, 0, 0);

for (let i = 0; i < input.attempts; i++) {
  try {
    withStockTransaction(db, (tx) =>
      applyStockMovement(tx, {
        variantId: input.variantId,
        delta: -1,
        type: "STORE_SALE",
        referenceId: `order-${input.index}-${i}`,
        operatorId: "system",
      }),
    );
    result.sold += 1;
  } catch (error) {
    if (error instanceof InsufficientStockError) result.soldOut += 1;
    else result.otherErrors.push(error instanceof Error ? error.message : String(error));
  }
}

db.$client.close();
parentPort?.postMessage(result);
