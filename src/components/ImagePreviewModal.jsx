import ActionButtons from './ActionButtons';

export default function ImagePreviewModal({
  isOpen,
  setIsOpen,
  imageList,
  currentIndex,
  prevImage,
  nextImage,
  handleDownload,
  openInstagram,
}) {
  if (!isOpen) return null;

  const currentItem = imageList[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="relative w-auto h-full max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 이전 버튼 */}
        {currentIndex !== 0 && (
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white text-4xl hover:text-primary transition"
            aria-label="이전"
          >
            ◀
          </button>
        )}

        {/* 다음 버튼 */}
        {currentIndex !== imageList.length - 1 && (
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white text-4xl hover:text-primary transition"
            aria-label="다음"
          >
            ▶
          </button>
        )}

        {/* 메인 이미지/비디오 */}
        {currentItem && currentItem.type === 'video' ? (
          <video
            key={currentItem.video_url}
            src={currentItem.video_url}
            controls
            autoPlay
            loop
            className="object-contain w-full h-full rounded-xl shadow-2xl"
          >
            브라우저가 비디오 태그를 지원하지 않습니다.
          </video>
        ) : (
          <img
            src={currentItem?.src}
            alt="브이로그 미리보기"
            className="object-contain w-full h-full rounded-xl shadow-2xl"
          />
        )}

        {/* 하단 액션 버튼 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
          <ActionButtons
            handleDownload={handleDownload}
            openInstagram={openInstagram}
          />
        </div>
      </div>
    </div>
  );
}