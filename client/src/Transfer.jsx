import { useState } from "react";
import server from "./server";
import { sign } from "ethereum-cryptography/secp256k1";
import { keccak256 } from "ethereum-cryptography/keccak";
import { utf8ToBytes } from "ethereum-cryptography/utils";

function Transfer({ setBalance, setAddress }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  function hashMessage(message) {
    const bytes = utf8ToBytes(message);
    return keccak256(bytes);
  }
  async function transfer(evt) {
    evt.preventDefault();
    const message = {
      amount: parseInt(sendAmount),
      recipient,
    };
    const messageHash = hashMessage(JSON.stringify(message));
    const [sig, recoveryBit] = await sign(messageHash, privateKey, {
      recovered: true,
    });

    try {
      const {
        data: { balance, sender },
      } = await server.post(`send`, {
        message: message,
        sig: sig,
        recoveryBit: recoveryBit,
      });
      setAddress(sender);
      setBalance(balance);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Enter Private Key
        <input
          placeholder="0x...."
          value={privateKey}
          onChange={setValue(setPrivateKey)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
