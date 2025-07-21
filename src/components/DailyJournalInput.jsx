import { useEffect, useRef } from 'react';

export default function DailyJournalInput({ text, setText }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  return (
    <div className="flex justify-center mt-16 px-4">
      <div className="w-full max-w-xl px-5 py-3 
        bg-[#2d2e45]/80 
        backdrop-blur-xl 
        border-2 border-[#ff4d8b] 
        rounded-xl 
        shadow-[0_0_10px_rgba(95,143,255,0.3)] 
        transition-all duration-300 
        hover:border-[#68394a] 
        hover:shadow-[0_0_25px_4px_rgba(255,77,139,0.4)]">

        <textarea
          ref={textareaRef}
          placeholder="오늘 하루를 한 줄로 남겨볼까요?(최대100자)"
          value={text}
          maxLength={100}
          onChange={(e) => setText(e.target.value)}
          rows="1"
          className="w-full bg-transparent border-none text-white placeholder-gray-100 
                 focus:outline-none resize-none overflow-hidden leading-relaxed"
        />
      </div>
    </div>
  );
}