const SH256 = require("crypto-js/sha256");
const fs = require("fs");
class Block {
    constructor(index, timestamp, data, previousHash = "") {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        return SH256(this.index +
            this.timestamp +
            JSON.stringify(this.data) +
            this.nonce +
            this.previousHash
        ).toString();
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log("Block mined: " + this.hash);
    }
}
class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
    }

    createGenesisBlock() {
        return new Block(0, "01/01/2022", "Genesis Block", "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.mineBlock(this.difficulty);
        this.chain.push(newBlock);
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }
}

let RtuCoin = new Blockchain();
for (let i = 1; i <= 10; i++) {
    RtuCoin.addBlock(new Block(i, "01/0" + (i + 1) + "/2022", { amount: Math.floor(Math.random() * 10) }));
}

console.log(JSON.stringify(RtuCoin, null, 4));

// ---------------------------------------------------------------
// Visualization: writes chain.html - open it in any web browser
// ---------------------------------------------------------------
function visualize(blockchain, file = "chain.html") {
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const short = (h) => h.length > 16 ? h.slice(0, 16) + "…" : h;

    const blocks = blockchain.chain.map((b, i) => {
        // a block is OK if its stored hash is correct and it points to the previous block
        const hashOk = b.hash === b.calculateHash();
        const linkOk = i === 0 || b.previousHash === blockchain.chain[i - 1].hash;
        const ok = hashOk && linkOk;
        const arrow = i === 0 ? "" : `<div class="arrow ${linkOk ? "" : "broken"}">➜</div>`;
        return `${arrow}
        <div class="block ${ok ? "ok" : "bad"}">
            <h2>Block #${b.index}${i === 0 ? " (genesis)" : ""}</h2>
            <p><b>Timestamp:</b> ${esc(b.timestamp)}</p>
            <p><b>Data:</b> ${esc(JSON.stringify(b.data))}</p>
            <p><b>Previous hash:</b><br><code title="${b.previousHash}">${short(b.previousHash)}</code></p>
            <p><b>Hash:</b><br><code title="${b.hash}">${short(b.hash)}</code></p>
            <p class="status">${ok ? "✓ valid" : "✗ " + (!hashOk ? "hash does not match data" : "broken link")}</p>
        </div>`;
    }).join("");

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>RtuCoin chain</title>
<style>
  body { font-family: Arial, sans-serif; background: #f6f6f4; margin: 30px; color: #111; }
  .chain { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
  .block { background: #fff; border: 3px solid; border-radius: 10px; padding: 12px 16px; width: 230px; }
  .block.ok  { border-color: #0ca30c; }
  .block.bad { border-color: #d03b3b; background: #fbe9e9; }
  .block h2 { font-size: 17px; margin: 0 0 8px; }
  .block p  { font-size: 13px; margin: 6px 0; }
  code { font-size: 12px; color: #444; }
  .status { font-weight: bold; }
  .arrow { font-size: 30px; color: #555; }
  .arrow.broken { color: #d03b3b; }
</style></head>
<body>
  <h1>RtuCoin blockchain (${blockchain.chain.length} blocks)</h1>
  <p>Each block stores the hash of the block before it. Hover over a hash to see it in full.</p>
  <div class="chain">${blocks}</div>
</body></html>`;

    fs.writeFileSync(file, html);
    console.log("Visualization saved to " + file + " - open it in your browser.");
}

visualize(RtuCoin);