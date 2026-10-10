import { defineConfig } from "vite";

// WSL2 는 Windows 드라이브를 9p(drvfs) 로 마운트한다. 이 경로는 inotify 이벤트가
// Windows -> WSL 로 제대로 전달되지 않아 파일을 고쳐도 HMR 이 동작하지 않고,
// Vite 가 예전 변환본을 계속 서빙한다. 파일 감시만 polling 으로 바꿔 해결한다.
const isDrvfs = process.platform === "linux" && /^\/(mnt\/[a-z]|run\/user\/.*\/drvfs)/.test(
  process.cwd(),
);

export default defineConfig({
  server: {
    watch: isDrvfs
      ? { usePolling: true, interval: 300 }
      : undefined,
    host: "0.0.0.0",
  },
});