import React, { useState } from 'react';
import { isObject, formatJson } from '../payload.js';

export default function ResponsePanel({ result, pending }) {
  const [copyState, setCopyState] = useState('');
  const raw = result ? typeof result.body === 'string' ? result.body : formatJson(result.body) : '';
  const answers = isObject(result?.body?.answers) ? Object.entries(result.body.answers) : [];
  const status = pending ? 'loading' : result?.kind || '';
  const label = pending ? '요청 중' : result?.label || '대기 중';
  
  async function copy() {
    try { await navigator.clipboard.writeText(raw); setCopyState('복사됨'); }
    catch { setCopyState('복사 실패'); }
    setTimeout(() => setCopyState(''), 1600);
  }

  return <section className="panel" aria-labelledby="response-title">
    <div className="panel-head"><h2 id="response-title">응답</h2><div className={`status ${status}`} role="status"><span className="dot" /><span>{label}</span></div></div>
    <div className="response-body">
      {pending || !result ? <div className="empty"><div className="empty-icon">{pending ? '···' : '{ }'}</div><strong>{pending ? '응답을 기다리는 중' : '아직 응답이 없습니다'}</strong>{!pending && <span>왼쪽에서 요청을 보내면 결과가 여기에 표시됩니다.</span>}</div> : <>
        {result.meta && <div className="meta">{result.meta.map((text, i) => <span className="badge" key={i}>{text}</span>)}</div>}
        {answers.length > 0 && <div className="answer-grid">{answers.map(([name, answer]) => {
          const value = isObject(answer) ? answer.choice ?? answer.score ?? answer.noul ?? answer.value : answer;
          const probability = answer?.noul;
          return <div className="answer" key={name}><div className="answer-name">{name}</div><div className="answer-value">{value == null ? JSON.stringify(answer) : typeof value === 'object' ? JSON.stringify(value) : String(value)}</div>{typeof probability === 'number' && probability >= 0 && probability <= 1 && <><div className="meter"><span style={{ width: `${probability * 100}%` }} /></div><small>{(probability * 100).toFixed(1)}%</small></>}</div>;
        })}</div>}
        <div className="response-toolbar"><strong>원본 응답</strong><button type="button" className="minor" onClick={copy}>{copyState || '복사'}</button></div><pre className="result">{raw}</pre>
      </>}
    </div>
  </section>;
}
