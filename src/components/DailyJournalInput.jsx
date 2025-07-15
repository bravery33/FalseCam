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
      <textarea
        ref={textareaRef} // textarea에 ref를 연결합니다.
        placeholder="오늘 하루를 한 줄로 남겨볼까요?(최대100자)"
        value={text}
        maxLength={100}
        onChange={(e) => setText(e.target.value)} // 높이 조절 로직은 useEffect로 옮겼습니다.
        // rows="1"을 추가하고 h-14를 제거하여 시작 높이를 한 줄로 만듭니다.
        rows="1"
        className="max-w-2xl w-full p-4 bg-[#08091d] border border-[#30363d] 
                   rounded-xl text-white placeholder-gray-400 shadow-lg 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 
                   resize-none overflow-hidden leading-relaxed transition-all duration-200"
      />
    </div>
  );
}