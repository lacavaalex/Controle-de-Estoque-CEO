import { readFile, writeFile } from "node:fs/promises";
import type { Item } from "../entities/Item.js";
import path from "path";

const filePath = path.resolve(process.cwd(), "data", "InventoryDB.json");

async function readItems(): Promise<Item[]> {
  const data = await readFile(filePath, "utf-8");
  return JSON.parse(data);
}

async function writeItems(inventory: object) {
  await writeFile(
    filePath,
    JSON.stringify(inventory, null, 2),
    "utf-8"
  );
}

export { readItems, writeItems }
