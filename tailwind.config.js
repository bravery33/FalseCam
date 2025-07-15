/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C084FC',     // 라벤더 퍼플
        secondary: '#F472B6',   // 로즈 핑크
        light: '#f7f8fa',       // 밝은 배경
        dark: '#1E293B',        // 다크 모달 배경
        muted: '#D1D5DB',       // 회색 서브톤
        text: '#111827',        // 메인 텍스트
        subtext: '#6B7280',     // 서브 텍스트
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
