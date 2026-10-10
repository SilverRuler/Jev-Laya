import React, { useEffect, useState } from 'react';
import { renameKey, removeKey, uniqueKey } from '../payload.js';

const kind = value => value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
const fresh = type => ({ string: '', number: 0, boolean: false, object: {}, array: [], null: null })[type];

export function NameInput({ value, siblings, onChange, label, required = false, className = '' }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <input className={className} aria-label={label} value={draft} required={required} onChange={event => {
    const next = event.target.value;
    setDraft(next);
    const invalid = required && !next.trim() ? '이름을 입력하세요.' : next !== value && Object.hasOwn(siblings, next) ? '중복된 이름입니다.' : '';
    event.target.setCustomValidity(invalid);
    if (!invalid) onChange(next);
  }} />;
}
function NumberInput({ value, onChange, label }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return <input type="number" step="any" required aria-label={label} value={draft} onChange={event => {
    setDraft(event.target.value);
    if (Number.isFinite(event.target.valueAsNumber)) onChange(event.target.valueAsNumber);
  }} />;
}

export default function ValueEditor({ value, onChange, label }) {
  const type = kind(value);
  const collection = type === 'array' || type === 'object';
  return <div className="node">
    <div className="node-controls">
      <select aria-label={`${label} 데이터 타입`} value={type} onChange={event => onChange(fresh(event.target.value))}>
        {['string', 'number', 'boolean', 'object', 'array', 'null'].map(item => <option key={item}>{item}</option>)}
      </select>
      <div className="node-value">
        {type === 'string' && <textarea aria-label={label} value={value} onChange={event => onChange(event.target.value)} />}
        {type === 'number' && <NumberInput value={value} label={label} onChange={onChange} />}
        {type === 'boolean' && <select aria-label={label} value={String(value)} onChange={event => onChange(event.target.value === 'true')}><option>true</option><option>false</option></select>}
      </div>
    </div>
    {collection && <div className="tree-children">
      {Object.entries(value).map(([key, child], index) => <div className="tree-row" key={index}>
        {type === 'array' ? <span className="hint">#{index + 1}</span> : <NameInput className="tree-key" label={`${label} 필드 이름`} value={key} siblings={value} onChange={next => onChange(renameKey(value, key, next))} />}
        <ValueEditor label={`${label} ${key}`} value={child} onChange={next => onChange(type === 'array' ? value.map((item, i) => i === index ? next : item) : { ...value, [key]: next })} />
        <button type="button" className="remove" aria-label={`${label} ${key} 삭제`} onClick={() => onChange(type === 'array' ? value.filter((_, i) => i !== index) : removeKey(value, key))}>삭제</button>
      </div>)}
      <button type="button" className="chip" onClick={() => onChange(type === 'array' ? [...value, ''] : { ...value, [uniqueKey(value, 'field')]: '' })}>{type === 'array' ? '＋ 항목 추가' : '＋ 필드 추가'}</button>
    </div>}
  </div>;
}
