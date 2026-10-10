# web — 플레이그라운드 UI

[Jev 호환 `/v1/systemone` API](https://github.com/) 를 만져보는 React UI 입니다.
**추론은 하지 않습니다.** 브라우저에서 서버로 직접 `fetch` 합니다.

전체 프로젝트(백엔드 포함)는 저장소 루트를 보세요 → [README](../README.md)

## 단독 실행

```bash
npm install
npm run dev      # vite, 기본 5173
npm test         # node --test
npm run build    # -> dist/ 및 단독 실행 HTML (dist/jev-lab.html)
npm run preview
```

## 기본 요청 대상

```
http://localhost:8000/v1/systemone
```

화면 위에서 바꿀 수 있습니다. 로컬 서버가 인증하지 않는다면 Bearer 토큰 칸은 비워 두세요.

## HTTPS 는 로컬 HTTP 서버를 호출할 수 없습니다

배포본(GitHub Pages 등)에서 이 페이지를 열면 브라우저 보안 정책이
`http://localhost:8000` 요청을 차단합니다. 아래 중 하나를 쓰세요.

- `npm run dev` 로 로컬에서 열기 (`http://`)
- `dist/jev-lab.html` 을 내려받아 파일로 열기
- HTTPS + CORS 를 지원하는 서버 URL 지정

## HMR 이 안 될 때

WSL2 에서 Windows 드라이브를 9p(drvfs) 로 마운트하면 inotify 가 전달되지 않아
변경 감지가 안 됩니다. `vite.config.js` 가 이 경로를 감지해 polling 으로 전환하지만,
그래도 안 되면 dev 서버를 재시작하세요.

```bash
ps aux | grep "[v]ite" | awk '{print $2}' | xargs -r kill && npm run dev
```