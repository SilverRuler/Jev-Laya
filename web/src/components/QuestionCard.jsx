import React from 'react';
import ValueEditor, { NameInput } from './ValueEditor.jsx';
import { questionTypes } from '../payload.js';

const criteriaFor = type => type === 'choice' ? { option_1: '첫 번째 선택지', option_2: '두 번째 선택지' } : type === 'score' ? ['낮음', '보통', '높음'] : { true: '예에 해당하는 조건', false: '아니오에 해당하는 조건' };

export default function QuestionCard({ name, question, siblings, onRename, onChange, onRemove }) {
  const updateType = type => {
    const { criteria, ...next } = question;
    onChange({ ...next, type, ...(type === 'noul' ? {} : { criteria: criteriaFor(type) }) });
  };
  return <section className="question-card" aria-label={`${name} 질문`}>
    <div className="question-top">
      <NameInput value={name} siblings={siblings} onChange={onRename} label="질문 ID" required />
      <select aria-label="질문 타입" value={question.type} onChange={event => updateType(event.target.value)}>{questionTypes.map(type => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</select>
      <button type="button" className="remove" onClick={onRemove}>삭제</button>
    </div>
    <div className="question-label">판단할 질문 · instructions</div>
    <ValueEditor label={`${name} instructions`} value={question.instructions ?? ''} onChange={instructions => onChange({ ...question, instructions })} />
    <div className="question-label">{question.type === 'choice' ? '선택지와 설명 · criteria' : question.type === 'score' ? '낮은 단계부터 순서대로 · criteria' : '예 / 아니오 판단 기준 · criteria (선택)'}</div>
    {question.criteria !== undefined ? <>
      <ValueEditor label={`${name} criteria`} value={question.criteria} onChange={criteria => onChange({ ...question, criteria })} />
      {question.type === 'noul' && <button type="button" className="minor" onClick={() => { const { criteria, ...next } = question; onChange(next); }}>기준 제거</button>}
    </> : <button type="button" className="chip" onClick={() => onChange({ ...question, criteria: criteriaFor(question.type) })}>＋ 판단 기준 추가</button>}
  </section>;
}
