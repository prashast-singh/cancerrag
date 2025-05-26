import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("OPENAI_API_KEY") || ""
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (apiKey) localStorage.setItem("OPENAI_API_KEY", apiKey);
    else localStorage.removeItem("OPENAI_API_KEY");
  }, [apiKey]);

  const handleSubmit = async () => {
    if (!input.trim() || !apiKey.trim()) return;
    setLoading(true);
    setAnswer("");
    setCitations([]);
    setError("");

    try {
      const body = {
        messages: [
          {
            role: "system",
            content: "You are a medical assistant to treat breast cancer.",
          },
          { role: "user", content: input },
        ],
        data_sources: [
          {
            type: "azure_search",
            parameters: {
              endpoint: "https://aisearchrag0001.search.windows.net/",
              index_name: "indexpdfguidelines",
              authentication: {
                type: "system_assigned_managed_identity",
              },
              query_type: "vector_simple_hybrid",
              embedding_dependency: {
                type: "deployment_name",
                deployment_name: "text-embedding-ada-002",
              },
              semantic_configuration: "default",
            },
          },
        ],
      };

      const { data } = await axios.post(
        "https://openaiwestus001.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2025-01-01-preview",
        body,
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey.trim(),
          },
        }
      );

      const msg = data.choices[0].message;
      setAnswer(msg.content);

      // Clean up any trailing "\naHR0..." junk from each citation
      const raw = msg.context?.citations || [];
      const cleaned = raw.map((c) => ({
        ...c,
        content: c.content.replace(/\naHR0.+$/, ""),
      }));
      setCitations(cleaned);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput("");
    setAnswer("");
    setCitations([]);
    setError("");
  };

  return (
    <div className="container">
      <header>
        <h1>💗 Breast Cancer Decision Support</h1>
        <p className="subheading">Powered by GPT nad RAG</p>
      </header>

      <div className="api-key-box">
        <label htmlFor="api-key">Azure OpenAI API Key:</label>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste your key here"
        />
      </div>

      {apiKey.trim() ? (
        <main className="main-box">
          <h2>Ask Your Medical Questions</h2>
          <p>
            Get evidence-based information about breast cancer prevention,
            treatment, and support. Our AI uses the latest medical research to
            provide helpful insights.
          </p>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., What are the early signs of breast cancer?"
          />

          <div className="button-group">
            <button onClick={handleClear} className="clear-btn">
              Clear
            </button>
            <button
              onClick={handleSubmit}
              className="submit-btn"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Question"}
            </button>
          </div>

          {answer && (
            <div className="response">
              {answer}
              {citations.length > 0 && (
                <div className="citations">
                  <strong>Citations:</strong>
                  <ul>
                    {citations.map((c, i) => (
                      <li key={i}>
                        <a href={c.url} target="_blank" rel="noreferrer">
                          {c.title}
                        </a>
                        : {c.content}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && <div className="error">⚠️ {error}</div>}
        </main>
      ) : (
        <div className="no-key-msg">
          🔒 Please enter your API key above to start chatting.
        </div>
      )}

      <footer>
        <div className="disclaimer">
          <strong>Important Medical Disclaimer:</strong> This AI assistant
          provides educational information only and is not a substitute for
          professional medical advice, diagnosis, or treatment. Always seek the
          advice of your physician or other qualified health provider with any
          questions you may have regarding a medical condition.
        </div>
      </footer>
    </div>
  );
}

export default App;
