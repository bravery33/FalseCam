export default function VlogRecordCard({ imageList, currentIndex, setCurrentIndex, openPreview }) {
  const currentItem = imageList[currentIndex];

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
        {/* ◀ 이전 버튼 */}
        {currentIndex !== 0 && (
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white text-3xl hover:text-primary transition"
            aria-label="이전 이미지"
          >
            ◀
          </button>
        )}

        {/* 썸네일 이미지 */}
        {/* 썸네일 이미지 */}
        <div className="w-full h-[180px] overflow-hidden rounded-lg bg-black flex items-center justify-center">
          <img
            src={currentItem.src}
            onClick={() => openPreview(currentIndex)}
            alt={`브이로그 썸네일 ${currentIndex + 1}`}
            className="max-h-full max-w-full object-contain cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          />

          {/* 영상 재생 아이콘 */}
          {currentItem.type === 'video' && (
            <div className="absolute bottom-2 right-2 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full border border-white shadow-[0_0_12px_#f472b6] flex items-center justify-center">
              <div className="w-0 h-0 border-t-6 border-b-6 border-l-8 border-t-transparent border-b-transparent border-l-white ml-[2px]" />
            </div>
          )}
        </div>


        {/* ▶ 다음 버튼 */}
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % imageList.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white text-3xl hover:text-primary transition"
          aria-label="다음 이미지"
        >
          ▶
        </button>
      </div>

      <div className="flex justify-center mt-4">
        <div className="flex items-center space-x-2 max-w-[240px] overflow-x-auto px-4 py-2 
  bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-inner scrollbar-hide mt-2">
          {imageList.map((_, idx) => (
            <span
              key={idx}
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${idx === currentIndex ? 'bg-white' : 'bg-gray-500'} transition`}
            />
          ))}
        </div>
      </div>



      <p className="text-center text-gray-300 mt-6 mb-1 italic tracking-wide font-light">
        {new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'short',
        })}
      </p>
    </div>
  );
}
