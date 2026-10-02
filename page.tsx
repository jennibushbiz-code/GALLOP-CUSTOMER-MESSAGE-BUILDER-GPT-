"use client";

import { FormEvent, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Source = { title?: string; url: string };
type ApiResult = { text: string; sources?: Source[]; requestId?: string };

export default function Home() {
  const [offer, setOffer] = useState("");
  const [market, setMarket] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!offer.trim() || !market.trim()) {
      setError("Please complete the first two fields.");
      return;
    }

    setLoading(true);
    const phases = [
      "Researching your market…",
      "Looking at real customer demand…",
      "Checking relevant marketing constraints…",
      "Separating evidence from assumptions…",
      "Building your Customer & Message Profile…"
    ];
    let phase = 0;
    setStatus(phases[0]);

    const timer = window.setInterval(() => {
      phase = Math.min(phase + 1, phases.length - 1);
      setStatus(phases[phase]);
    }, 3500);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer: offer.trim(),
          market: market.trim(),
          context: context.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");

      setResult(data);
      window.setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      window.clearInterval(timer);
      setLoading(false);
      setStatus("");
    }
  }

  function reset() {
    setOffer("");
    setMarket("");
    setContext("");
    setResult(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copyRichText() {
    const node = outputRef.current;
    if (!node) return;

    const html = node.innerHTML;
    const plain = node.innerText;

    try {
      if ("ClipboardItem" in window && navigator.clipboard?.write) {
        const item = new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" })
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      setStatus("Copied");
      window.setTimeout(() => setStatus(""), 1600);
    } catch {
      await navigator.clipboard.writeText(plain);
      setStatus("Copied");
      window.setTimeout(() => setStatus(""), 1600);
    }
  }

  return (
    <main>
      <header className="topbar">
        <div className="brandWrap">
          <div className="brandMark">G</div>
          <div>
            <div className="eyebrow">GALLOP BUSINESS FOUNDATIONS · JENNI BUSH</div>
            <div className="topTitle">Customer & Message Builder</div>
          </div>
        </div>
        <button className="ghostButton" onClick={reset} type="button">↻ New Profile</button>
      </header>

      <section className="hero">
        {!result ? (
          <form className="card formCard" onSubmit={handleSubmit}>
            <div className="cardHeading">
              <div className="brandMark large">G</div>
              <div>
                <div className="eyebrow pink">GALLOP BUSINESS FOUNDATIONS · JENNI BUSH</div>
                <h1>Customer & Message Profile Generator</h1>
              </div>
            </div>

            <p className="intro">
              This is <strong>not a generic avatar questionnaire.</strong> Give me the basic business facts below
              and the tool will research the real market, separate evidence from assumptions, check relevant
              marketing constraints and build a commercially useful Customer & Message Profile.
            </p>

            <label>
              <span>1. WHAT EQUESTRIAN SERVICE OR PRODUCT DO YOU SELL? *</span>
              <input
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                placeholder="e.g. Equine physiotherapy, riding tights, equestrian photography…"
                disabled={loading}
              />
            </label>

            <label>
              <span>2. WHERE AND HOW CAN CUSTOMERS BUY OR USE IT? *</span>
              <input
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                placeholder="e.g. Colchester + 25 miles; UK-wide online; online consultations across the UK…"
                disabled={loading}
              />
            </label>

            <label>
              <span>3. ANYTHING ELSE WE SHOULD KNOW? <em>(Optional)</em></span>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. common enquiries, actual customer feedback, qualifications, prices, product features, existing customers…"
                rows={4}
                disabled={loading}
              />
            </label>

            {error && <div className="errorBox">{error}</div>}

            <button className="primaryButton" disabled={loading} type="submit">
              {loading ? "Building your profile…" : "✧  Build My Customer & Message Profile  →"}
            </button>

            {loading && (
              <div className="loadingPanel" aria-live="polite">
                <div className="spinner" />
                <div>
                  <strong>{status}</strong>
                  <p>Real research takes a little longer than a generic AI answer.</p>
                </div>
              </div>
            )}
          </form>
        ) : (
          <div className="resultsShell">
            <div className="resultsToolbar">
              <div>
                <div className="eyebrow pink">GALLOP BUSINESS FOUNDATIONS · JENNI BUSH</div>
                <h1>Your Customer & Message Profile</h1>
              </div>
              <div className="toolbarButtons">
                <button className="secondaryButton" onClick={copyRichText} type="button">Copy profile</button>
                <button className="ghostButton dark" onClick={reset} type="button">New profile</button>
              </div>
            </div>

            {status === "Copied" && <div className="copiedNotice">Copied to clipboard</div>}

            <article className="card resultCard" ref={outputRef}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.text}</ReactMarkdown>

              {!!result.sources?.length && (
                <section className="sourceSection">
                  <h2>Research sources</h2>
                  <ul>
                    {result.sources.map((s, i) => (
                      <li key={`${s.url}-${i}`}>
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.title || s.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </article>

            <div className="bottomActions">
              <button className="primaryButton compact" onClick={copyRichText} type="button">Copy profile</button>
              <button className="secondaryButton compact" onClick={reset} type="button">Build another profile</button>
            </div>
          </div>
        )}
      </section>

      <footer>GALLOP Business Foundations · Customer & Message Builder</footer>
    </main>
  );
}
