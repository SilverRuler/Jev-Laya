export const questionTypes = ['noul', 'choice', 'score'];

// ＋ Noul / ＋ Choice / ＋ Score 버튼이 만드는 기본 질문.
// 시나리오에 묶이지 않도록 범용 문구로 두어 어떤 state 에도 그대로 쓸 수 있게 합니다.
export const presets = {
  noul: { type: 'noul', instructions: '이 문장은 참(true)인가요?', criteria: { true: '참으로 판정할 조건', false: '거짓으로 판정할 조건' } },
  choice: { type: 'choice', instructions: '가장 적합한 항목을 선택하세요.', criteria: { option_a: '첫 번째 선택지', option_b: '두 번째 선택지', option_c: '세 번째 선택지' } },
  score: { type: 'score', instructions: '정도에 따라 등급을 매기세요.', criteria: ['낮음', '보통', '높음', '최고'] },
};

export const initialPayload = {
  model: 'jev-latest',
  state: {
    message: '어제부터 39도 고열과 기침이 계속됩니다. 3일째 체온이 내려가지 않아 오늘 밤 응급실에 가야 할 것 같습니다.',
    days_symptomatic: 3,
    max_temperature_c: 39.1,
    age: 34,
    high_risk_conditions: false,
  },
  questions: {
    is_emergency: {
      type: 'noul',
      instructions: '지금 당일 진료가 필요한 상황입니까?',
    },
    handling: {
      type: 'choice',
      instructions: '어떤 진료 경로가 가장 적절합니까?',
      criteria: {
        self_care: '자가 관리',
        clinic: '내일 진료 예약',
        urgent_care: '당일 진료',
        emergency_room: '응급실',
      },
    },
    assessment: {
      type: 'score',
      instructions: '지금 이 환자의 진료 시급성을 평가하세요.',
      criteria: ['지연 가능: 내일 진료', '당일 진료 필요', '응급실 진료 필요', '입원 또는 관찰 필요'],
    },
  },
};
export const formatJson = value => JSON.stringify(value, null, 2);
export const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export function parseDocument(text, forRequest = false) {
  const data = JSON.parse(text);
  if (!isObject(data)) throw new Error('JSON 객체를 입력하세요.');
  if (typeof data.model !== 'string') throw new Error('model은 문자열이어야 합니다.');
  if (!Object.hasOwn(data, 'state')) throw new Error('state 필드가 필요합니다.');
  if (!isObject(data.questions)) throw new Error('questions는 객체여야 합니다.');
  for (const [name, question] of Object.entries(data.questions)) {
    if (!isObject(question) || !questionTypes.includes(question.type)) throw new Error(`${name}: Noul, Choice, Score 타입을 사용하세요.`);
  }
  if (forRequest) {
    if (!data.model.trim()) throw new Error('model을 입력하세요.');
    if (!Object.keys(data.questions).length) throw new Error('하나 이상의 질문을 추가하세요.');
    if (Object.keys(data.questions).some(name => !name.trim())) throw new Error('각 질문의 ID를 입력하세요.');
  }
  return data;
}
export function initialEditor() {
  const document = structuredClone(initialPayload);
  return { document, json: formatJson(document), error: '' };
}
export function editorReducer(state, action) {
  switch (action.type) {
    case 'ui': return { document: action.document, json: formatJson(action.document), error: '' };
    case 'json': {
      try { return { document: parseDocument(action.text), json: action.text, error: '' }; }
      catch (error) { return { ...state, json: action.text, error: `${error.message} 마지막으로 유효했던 UI 내용을 유지합니다.` }; }
    }
    case 'format': {
      try { const document = parseDocument(state.json); return { document, json: formatJson(document), error: '' }; }
      catch (error) { return { ...state, error: error.message }; }
    }
    case 'error': return { ...state, error: action.message };
    default: return state;
  }
}
export function renameKey(value, oldKey, newKey) {
  if (oldKey !== newKey && Object.hasOwn(value, newKey)) throw new Error('중복된 이름입니다.');
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key === oldKey ? newKey : key, item]));
}
export function uniqueKey(value, base) {
  let key = base, index = 1;
  while (Object.hasOwn(value, key)) key = `${base}_${index++}`;
  return key;
}
export function removeKey(value, key) {
  return Object.fromEntries(Object.entries(value).filter(([name]) => name !== key));
}
