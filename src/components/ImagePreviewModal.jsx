import ActionButtons from './ActionButtons';
import { useEffect, useState } from 'react';

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

  const currentItem = imageList[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={() => setIsOpen(false)}
    >
      <div className="relative w-full h-full flex items-center justify-center p-4">
        
        {/* 이전 버튼 */}
        <button
          onClick={(e) => { e.stopPropagation(); prevImage(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white text-4xl p-2 rounded-full hover:bg-white/10 transition"
          aria-label="이전"
        >
          ◀
        </button>

        {/* 메인 컨텐츠 (이미지 또는 비디오) */}
        <div className="relative w-auto h-full max-h-[90vh] flex items-center" onClick={(e) => e.stopPropagation()}>
          {currentItem && currentItem.type === 'video' ? (
            <video
              key={currentItem.video_url} // URL이 바뀔 때마다 비디오를 새로 로드
              src={`http://127.0.0.1:8000/generated_image_proxy?url=${encodeURIComponent(currentItem.video_url)}`}
              controls
              autoPlay
              loop
              className="object-contain max-w-full max-h-full rounded-xl shadow-2xl"
            >
              브라우저가 비디오 태그를 지원하지 않습니다.
            </video>
          ) : (
            <img
              src={currentItem?.src}
              alt="브이로그 미리보기"
              className="object-contain max-w-full max-h-full rounded-xl shadow-2xl"
            />
          )}
        </div>

        {/* 다음 버튼 */}
        <button
          onClick={(e) => { e.stopPropagation(); nextImage(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white text-4xl p-2 rounded-full hover:bg-white/10 transition"
          aria-label="다음"
        >
          ▶
        </button>

        <ActionButtons
          handleDownload={handleDownload}
          openInstagram={openInstagram}
        />
      </div>
    </div>
  );
}