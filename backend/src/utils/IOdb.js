import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function readItems() {
    const data = await fs.readFile(path.join(__dirname, '../../data/inventoryDB.json'), 'utf-8')
    const items = JSON.parse(data)

    return items
}

async function writeItems(items) {
    await fs.writeFile(
        path.join(__dirname, '../../data/inventoryDB.json'),
        JSON.stringify(items, null, 2),
        'utf-8'
    )
}

export {readItems, writeItems}