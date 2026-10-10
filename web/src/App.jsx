import React, { useEffect, useReducer, useRef, useState } from "react";
import PayloadEditor from "./components/PayloadEditor.jsx";
import ResponsePanel from "./components/ResponsePanel.jsx";
import { editorReducer, initialEditor, parseDocument } from "./payload.js";

export default function App() {
  const [editor, dispatch] = useReducer(
    editorReducer,
    undefined,
    initialEditor,
  );
  const [mode, setMode] = useState("ui");
  const [endpoint, setEndpoint] = useState(
    "http://localhost:8000/v1/systemone",
  );
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null);
  const formRef = useRef(null);
  const inFlight = useRef(false);

  async function send() {
    if (inFlight.current) return;
    if (mode === "ui" && !formRef.current.reportValidity()) return;
    let data, url;
    try {
      data = parseDocument(editor.json, true);
    } catch (error) {
      dispatch({ type: "error", message: error.message });
      return;
    }
    try {
      url = new URL(endpoint.trim());
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      setResult({
        kind: "failure",
        label: "URL 확인 필요",
        body: "http:// 또는 https://로 시작하는 요청 URL을 입력하세요.",
      });
      return;
    }
    inFlight.current = true;
    setPending(true);
    setResult(null);
    const started = performance.now();
    try {
      const headers = { "Content-Type": "application/json" };
      if (token.trim()) headers.Authorization = `Bearer ${token.trim()}`;
      const response = await fetch(url.href, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      const raw = await response.text();
      let body;
      try {
        body = raw ? JSON.parse(raw) : "(빈 응답)";
      } catch {
        body = raw;
      }
      setResult({
        kind: response.ok ? "success" : "failure",
        label: response.ok ? "요청 성공" : "요청 실패",
        body,
        meta: [
          `HTTP ${response.status} ${response.statusText}`,
          `${Math.round(performance.now() - started)} ms`,
          response.headers.get("content-type") || "Content-Type 없음",
        ],
      });
    } catch (error) {
      setResult({
        kind: "failure",
        label: "연결 실패",
        body: `요청을 완료하지 못했습니다: ${error.message}\n\n서버 주소, 서버 실행 상태, CORS 설정 및 브라우저의 혼합 콘텐츠(HTTPS → HTTP) 차단 여부를 확인하세요.`,
      });
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        send();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  return (
    <>
      <header className="top">
        <div className="brand">
          <span>Jev Test Page</span>
        </div>
        <small>System One API playground</small>
      </header>
      <main className="wrap">
        <div className="heading">
          <div>
            <h1>Jev 요청 테스트</h1>
            <p>서버를 지정하고 페이로드를 편집해 응답을 확인하세요.</p>
          </div>
        </div>
        <div className="workspace">
          <div className="stack">
            <section className="panel" aria-labelledby="server-title">
              <div className="panel-head">
                <div>
                  <h2 id="server-title">서버 설정</h2>
                </div>
                <span>01 / 02</span>
              </div>

              <div className="panel-body">
                <div className="fields">
                  <div className="field wide">
                    <label htmlFor="endpoint">요청 URL</label>
                    <input
                      id="endpoint"
                      type="url"
                      value={endpoint}
                      onChange={(event) => setEndpoint(event.target.value)}
                      spellCheck={false}
                    />
                    <div className="hint">
                      전체 URL을 입력하세요. 로컬 서버라면 CORS 허용이
                      필요합니다.
                    </div>
                  </div>
                  <div className="field wide">
                    <label htmlFor="apiKey">
                      Bearer 토큰{" "}
                      <span style={{ fontWeight: 400, color: "#91a0ad" }}>
                        (선택)
                      </span>
                    </label>
                    <div className="input-with-button">
                      <input
                        id="apiKey"
                        type={showToken ? "text" : "password"}
                        autoComplete="off"
                        value={token}
                        onChange={(event) => setToken(event.target.value)}
                        placeholder="로컬 서버에서 인증하지 않는다면 비워 두세요"
                      />
                      <button
                        type="button"
                        className="inline"
                        onClick={() => setShowToken((value) => !value)}
                      >
                        {showToken ? "숨기기" : "보기"}
                      </button>
                    </div>
                    <div className="hint">
                      입력한 토큰은 현재 탭의 요청 헤더에만 사용하며 저장하지
                      않습니다.
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <PayloadEditor
              editor={editor}
              dispatch={dispatch}
              mode={mode}
              setMode={setMode}
              formRef={formRef}
              pending={pending}
              onSend={send}
            />
          </div>
          <div className="stack">
            <ResponsePanel result={result} pending={pending} />
          </div>
        </div>
        <p className="notice">
          브라우저에서 서버로 직접 요청합니다. 로컬 HTTP 서버 요청은 브라우저
          보안 정책으로 차단될 수 있습니다. 이 경우{" "}
          <a href="./jev-lab.html" download="jev-lab.html">
            페이지를 내려받아
          </a>{" "}
          로컬에서 열거나, HTTPS와 CORS를 지원하는 서버 URL을 사용하세요.
        </p>
      </main>
    </>
  );
}
