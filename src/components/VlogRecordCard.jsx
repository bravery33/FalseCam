import { useRef, useEffect } from "react";

export default function VlogRecordCard({ imageList, currentIndex, setCurrentIndex, openPreview }) {
  const isEmpty = imageList.length === 0;
  const currentItem = imageList[currentIndex]; // 현재 아이템 정보 가져오기

  const indicatorRef = useRef(null);

  useEffect(() => {
    if (!indicatorRef.current) return;
    const container = indicatorRef.current;
    const dots = container.querySelectorAll('button');
    if (dots.length === 0) return;
    const activeDot = dots[currentIndex];
    if (!activeDot) return;

    const scrollLeft =
      activeDot.offsetLeft - container.offsetWidth / 2 + activeDot.offsetWidth / 2;
    container.scrollTo({ left: scrollLeft, behavior: "smooth" });
  }, [currentIndex, imageList.length]);

  return (
    <div className="w-full max-w-sm rounded-xl p-6
      bg-[rgba(255,255,255,0.05)]
      backdrop-blur-xl
      border border-[rgba(255,255,255,0.12)]
      shadow-[inset_0_0_0.5px_rgba(255,255,255,0.3),_0_4px_30px_rgba(0,0,0,0.25)]
      text-white transition-all duration-300
      hover:scale-[1.13] transition-transform ease-in-out">

      <h2 className="text-center text-lg font-semibold mb-6">내 브이로그 기록</h2>

      <div className="relative w-full flex justify-center items-center">
        {/* 아래 div의 h-[180px]를 h-48로 변경하여 높이를 늘립니다. */}
        <div className="w-full h-48 overflow-hidden rounded-lg bg-transparent flex items-center justify-center">
          {isEmpty ? (
            <div className="text-gray-400 text-center w-full">브이로그가 아직 없습니다.</div>
          ) : (
            <div className="relative w-full h-full" onClick={() => openPreview(currentIndex)}>
              <img
                src={currentItem.src}
                alt={`브이로그 썸네일 ${currentIndex + 1}`}
                className="rounded-lg w-full h-full object-contain cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
              />
              {/* 현재 아이템이 비디오 타입이면 재생 아이콘 표시 */}
              {currentItem.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                  <span className="text-white text-5xl drop-shadow-lg">▶</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!isEmpty && (
        <div className="flex flex-col items-center mt-4">
          <div
            ref={indicatorRef}
            className="flex items-center space-x-2 max-w-[240px] overflow-x-auto px-4 py-2 
              bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-inner
              scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent mt-2"
          >
            {imageList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full shrink-0 
                  ${idx === currentIndex ? 'bg-white' : 'bg-gray-500'} 
                  transition focus:outline-none`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-300 mt-6 mb-1 italic tracking-wide font-light">
            {new Date(currentItem.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            })}
          </p>
        </div>
      )}
    </div>
  );
}