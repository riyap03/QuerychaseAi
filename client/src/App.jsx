import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [documentText, setDocumentText] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setFileName(e.target.files[0]?.name || "");
    setUploadStatus("");
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus("⚠️ Please select a document first!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      setLoading(true);
      setUploadStatus("Uploading...");
      const res = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDocumentText(res.data.text);
      setUploadStatus("✅ Document uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("❌ Failed to upload document.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) {
      setResponse("⚠️ Please enter a question!");
      return;
    }

    try {
      setLoading(true);
      setResponse("Thinking...");
      const res = await axios.post("http://localhost:5000/api/ai/query", {
        prompt: `${documentText}\n\nQuestion: ${query}`,
      });

      setResponse(res.data.answer || "No response.");
    } catch (error) {
      console.error("Query error:", error);
      setResponse("❌ Error: Failed to fetch AI response.");
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setResponse("");
    setQuery("");
  };

  return (
    <div className="app-container">
      <h1 className="title">✨ Query Chase AI ✨</h1>

      <div className="upload-section">
        <label className="file-label">
          {fileName || "📂 Drag or Choose Document"}
          <input type="file" accept=".pdf,.docx,.eml" onChange={handleFileChange} />
        </label>
        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
      <p className="upload-status">{uploadStatus}</p>

    <textarea
  className="query-box"
  placeholder="Ask your question..."
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  rows="4"
/>

      <div className="button-group">
        <button onClick={handleQuery} disabled={loading}>
          {loading ? "Thinking..." : "Ask AI"}
        </button>
        <button className="clear-btn" onClick={clearChat}>
          Clear Chat
        </button>
      </div>

      <div className="response-section">
        <h3>Response:</h3>
        <div className="response-box">{response || "No response yet."}</div>
      </div>
    </div>
  );
}

export default App;
