export default function VlogRecordCard({ imageList, currentIndex, setCurrentIndex, openPreview }) {
    return (
      <div className="bg-[#08091d]/60 backdrop-blur-md rounded-2xl p-6 shadow border border-[#30363d] flex flex-col items-center relative">
        <h2 className="text-lg font-semibold mb-4 self-start">내 브이로그 기록</h2>
  
        <div className="relative w-full flex justify-center items-center">
          {currentIndex !== 0 && (
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length)}
              className="absolute left-0 z-10 text-white text-2xl px-2 py-1 bg-black/30 rounded-full hover:bg-black/60"
            >
              ←
            </button>
          )}
  
          <img
            src={imageList[currentIndex]}
            onClick={() => openPreview(currentIndex)}
            alt={`브이로그 썸네일 ${currentIndex + 1}`}
            // 👇 이 부분의 클래스를 수정하여 높이를 고정합니다.
            className="rounded-lg w-full h-[180px] object-cover cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          />
  
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % imageList.length)}
            className="absolute right-0 z-10 text-white text-2xl px-2 py-1 bg-black/30 rounded-full hover:bg-black/60"
          >
            →
          </button>
        </div>
  
        <div className="flex justify-center space-x-2 mt-4">
          {imageList.map((_, idx) => (
            <span
              key={idx}
              className={`w-2.5 h-2.5 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-gray-500'} transition`}
            />
          ))}
        </div>
  
        <p className="text-sm text-gray-300 mt-6 mb-1 italic tracking-wide font-light">
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