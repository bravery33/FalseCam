import ActionButtons from './ActionButtons';

export default function ImagePreviewModal({
  isOpen,
  setIsOpen,
  loading,
  imageList,
  currentIndex,
  prevImage,
  nextImage,
  handleDownload,
  openInstagram,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={() => setIsOpen(false)}
    >
      {loading && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-50">
          <img src="/loading-pixel.gif" alt="로딩 중" className="w-20 h-20 mb-4" />
          <p className="text-white text-lg animate-pulse">이미지를 생성 중입니다...</p>
        </div>
      )}

      <div className="relative">
        {currentIndex !== 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-black/50 rounded-full px-3 py-2 hover:bg-black/70 transition z-20"
          >
            ←
          </button>
        )}

        <img
          src={imageList[currentIndex]}
          alt="브이로그 미리보기"
          className="w-[60vw] h-auto max-h-[80vh] rounded-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            nextImage();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-black/50 rounded-full px-3 py-2 hover:bg-black/70 transition z-20"
        >
          →
        </button>
        
        <ActionButtons 
          handleDownload={handleDownload}
          openInstagram={openInstagram}
        />
      </div>
    </div>
  );
}