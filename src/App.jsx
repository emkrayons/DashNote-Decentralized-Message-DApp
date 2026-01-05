import { useEffect, useState } from "react";
import { ethers } from "ethers";

const contractAddress = "0x85ef0fb997d8765a73f3e83654eed022a5de90a2";

const abi = [
  "function message() view returns (string)",
  "function count() view returns (uint256)",
  "function setMessage(string _message)",
  "event MessageUpdated(address indexed sender, string newMessage, uint256 count)"
];

function App() {
  const [account, setAccount] = useState("");
  const [message, setMessage] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  // ✅ Ensure Sepolia network
  async function ensureSepolia() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();

  if (network.chainId !== 11155111n) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }] // Sepolia
      });
    } catch (err) {
      setError("Please switch to Sepolia testnet");
    }
  }
}


  // 🔗 Connect Wallet
 async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask");
    return;
  }

  await ensureSepolia();

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts"
  });

  setAccount(accounts[0]);
}


  // 📖 Read message
  async function readMessage() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, abi, provider);
    const msg = await contract.message();
    setMessage(msg);
  }

  // ✍️ Write message
  async function writeMessage() {
    try {
      setLoading(true);
      setError("");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      const tx = await contract.setMessage(newMessage);
      setTxHash(tx.hash);

      await tx.wait();
      setNewMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 🔔 Listen to events
  function listenToEvents() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, abi, provider);

    contract.on("MessageUpdated", (sender, newMsg) => {
      console.log("Event:", sender, newMsg);
      setMessage(newMsg);
    });

    return contract;
  }

  useEffect(() => {
    if (!window.ethereum) return;

    readMessage();
    const contract = listenToEvents();

    return () => {
      contract.removeAllListeners("MessageUpdated");
    };
  }, []);

  return (
  <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
    <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">
        DashNote - Decentralized Message DApp
      </h2>

      <button
        onClick={connectWallet}
        className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded mb-4"
      >
        {account
          ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
          : "Connect Wallet"}
      </button>

      <p className="mb-2 text-sm text-gray-300">
        <strong>Stored Message:</strong>
      </p>
      <div className="bg-gray-700 p-2 rounded mb-4">
        {message || "No message yet"}
      </div>

      <input
        className="w-full p-2 rounded text-white mb-3"
        placeholder="Enter new message"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />

      <button
        onClick={writeMessage}
        disabled={loading}
        className={`w-full py-2 rounded ${
          loading
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "Transaction pending..." : "Update Message"}
      </button>

      {txHash && (
        <p className="text-xs mt-3 text-center">
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 underline"
          >
            View transaction on Etherscan
          </a>
        </p>
      )}

      {error && (
        <p className="text-red-400 text-sm mt-3 text-center">
          {error}
        </p>
      )}
    </div>
  </div>
);

}

export default App;
