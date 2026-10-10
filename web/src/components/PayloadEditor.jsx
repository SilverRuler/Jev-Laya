import React from 'react';
import ValueEditor from './ValueEditor.jsx';
import QuestionCard from './QuestionCard.jsx';
import { presets, questionTypes, renameKey, removeKey, uniqueKey } from '../payload.js';

export default function PayloadEditor({ editor, dispatch, mode, setMode, formRef, pending, onSend }) {
  const document = editor.document;
  const update = document => dispatch({ type: 'ui', document });
  const updateQuestions = questions => update({ ...document, questions });
  const changeMode = next => {
    if (next === mode) return;
    if (mode === 'ui' && !formRef.current.reportValidity()) return;
    if (mode === 'json' && editor.error) return;
    setMode(next);
  };

  return <section className="panel" aria-labelledby="payload-title">
    <div className="panel-head"><h2 id="payload-title">요청 페이로드</h2><span>02 / 02</span></div>
    <div className="panel-body">
      <div className="mode-switch" role="group" aria-label="페이로드 편집 방식">{[['ui', 'UI 편집'], ['json', 'JSON 편집']].map(([value, text]) => <button key={value} type="button" className={mode === value ? 'active' : ''} aria-pressed={mode === value} onClick={() => changeMode(value)}>{text}</button>)}</div>
      <form ref={formRef} hidden={mode !== 'ui'} noValidate onSubmit={event => event.preventDefault()}>
        <div className="builder-section"><label htmlFor="model">모델</label><input id="model" required value={document.model} onChange={event => update({ ...document, model: event.target.value })} /></div>
        <div className="builder-section"><div className="section-row"><h3>State</h3><span className="hint">평가할 데이터</span></div><ValueEditor label="State" value={document.state} onChange={state => update({ ...document, state })} /></div>
        <div className="builder-section"><div className="section-row"><h3>Questions {Object.keys(document.questions).length}</h3></div><p className="hint">각 질문은 동일한 state를 평가합니다. 타입을 섞어 추가할 수 있습니다.</p>
          {Object.entries(document.questions).map(([name, question], index) => <QuestionCard key={index} name={name} question={question} siblings={document.questions} onRename={next => updateQuestions(renameKey(document.questions, name, next))} onChange={next => updateQuestions({ ...document.questions, [name]: next })} onRemove={() => updateQuestions(removeKey(document.questions, name))} />)}
          <div className="add-question">{questionTypes.map(type => <button key={type} type="button" className="chip" onClick={() => { if (formRef.current.reportValidity()) updateQuestions({ ...document.questions, [uniqueKey(document.questions, type)]: structuredClone(presets[type]) }); }}>＋ {type[0].toUpperCase() + type.slice(1)}</button>)}</div>
        </div>
      </form>
      <div hidden={mode !== 'json'}><div className="toolbar"><span className="hint">수정 즉시 UI와 양방향으로 동기화됩니다.</span><button type="button" className="minor" style={{ marginLeft: 'auto' }} onClick={() => dispatch({ type: 'format' })}>JSON 정렬</button></div><label htmlFor="payload" style={{ marginTop: 17 }}>JSON 본문</label><textarea id="payload" className={`editor${editor.error ? ' editor-invalid' : ''}`} spellCheck={false} aria-describedby="jsonError" value={editor.json} onChange={event => dispatch({ type: 'json', text: event.target.value })} /></div>
      <div id="jsonError" className="error-text" role="alert">{editor.error}</div>
      <div className="actions"><span className="shortcut">⌘ / Ctrl + Enter로 요청</span><button type="button" className="primary" disabled={pending} onClick={onSend}>{pending ? '요청 중…' : '요청 보내기 ↗'}</button></div>
    </div>
  </section>;
}
