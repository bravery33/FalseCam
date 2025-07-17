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
      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        {currentIndex !== 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white text-4xl hover:text-primary transition"
            aria-label="이전 이미지"
          >
            ◀
          </button>
        )}

        <img
          src={imageList[currentIndex].src}
          alt="브이로그 미리보기"
          onClick={(e) => e.stopPropagation()}
          className="object-contain max-w-full max-h-[90vh] rounded-xl shadow-2xl mx-auto"
        />

        {currentIndex !== imageList.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white text-4xl hover:text-primary transition"
            aria-label="다음 이미지"
          >
            ▶
          </button>
        )}

        <ActionButtons
          handleDownload={handleDownload}
          openInstagram={openInstagram}
        />
      </div>
    </div>
  );
}