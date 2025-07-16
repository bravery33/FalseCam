import { useEffect, useRef } from 'react';

export default function DailyJournalInput({ text, setText }) {
  // textarea DOM 요소에 직접 접근하기 위해 useRef를 사용합니다.
  const textareaRef = useRef(null);

  // text 상태가 변경될 때마다 실행됩니다.
  useEffect(() => {
    if (textareaRef.current) {
      // 높이를 초기화해서 scrollHeight를 정확하게 계산하도록 합니다.
      textareaRef.current.style.height = 'auto';
      // scrollHeight를 기반으로 실제 높이를 설정합니다.
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]); // 의존성 배열에 'text'를 넣어 text가 바뀔 때마다 이 코드가 실행되게 합니다.

  return (
    <div className="flex justify-center mt-10 px-4">
      <div className="w-full max-w-2xl px-5 py-3 
        bg-[#2d2e45]/80 
        backdrop-blur-xl 
        border-2 border-[#ff4d8b]
        shadow-[0_0_20px_rgba(95,143,255,0.3)] 
        rounded-xl transition-all duration-300">
      <textarea
        ref={textareaRef} // textarea에 ref를 연결합니다.
        placeholder="오늘 하루를 한 줄로 남겨볼까요?(최대100자)"
        value={text}
        maxLength={100}
        onChange={(e) => setText(e.target.value)} 
        rows="1"
        className="w-full bg-transparent border-none text-white placeholder-gray-400 
                 focus:outline-none resize-none overflow-hidden leading-relaxed"
    />
    </div>
  </div>
  );
}