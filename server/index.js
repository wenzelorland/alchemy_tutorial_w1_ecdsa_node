const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const secp = require("ethereum-cryptography/secp256k1");
const { utf8ToBytes } = require("ethereum-cryptography/utils");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex } = require("ethereum-cryptography/utils");

app.use(cors());
app.use(express.json());

const balances = {
  "04bf6586092635e4eb99b5173aff1e966d8e9d6033ab997b5daa190d32606da313f79bad8f23f88a050699e7a124c942e685bf0a9519a12280257c37e78df8a512": 100,
  "04292f2d89da1f69a2eae37ff52897c3d8a7f2256f4b2911ebf03298670e55e5df54b0e293aaf24e530a0621b5344983d91c081adb9a60b543778710f5abffad57": 50,
  "04c2d23fe27dd79e3c867505d43713e57bd40001feeec8d76931f019e2a87294dd3d987f5e95dd74a5a58e12023190cb488724b7d042b64e8d64e0085774ae1d0f": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { message, sig, recoveryBit } = req.body;
  const sigArray = Uint8Array.from(Object.values(sig));
  const messageHash = hashMessage(JSON.stringify(message));
  const senderKey = recoverKey(messageHash, sigArray, recoveryBit);
  const sender = toHex(senderKey);
  const { recipient, amount } = message;
  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    console.log("res", { balance: balances[sender], sender: sender });
    res.send({ balance: balances[sender], sender: sender });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}

function recoverKey(message, signature, recoveryBit) {
  console.log("type", typeof message);
  console.log("message", message);
  console.log("signature", typeof signature, signature);
  console.log("recoveryBit", typeof recoveryBit, recoveryBit);

  return secp.recoverPublicKey(message, signature, recoveryBit);
}

function hashMessage(message) {
  const bytes = utf8ToBytes(message);
  return keccak256(bytes);
}
