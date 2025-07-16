export default function GenerationCard({ file, handleFileChange, loading, handleGenerate }) {
  const uploadedImageUrl = file ? URL.createObjectURL(file) : null;

  return (
    <div className="w-full max-w-sm rounded-xl p-6
      bg-[rgba(255,255,255,0.05)]
      backdrop-blur-xl
      border border-[rgba(255,255,255,0.12)]
      shadow-[inset_0_0_0.5px_rgba(255,255,255,0.3),_0_4px_30px_rgba(0,0,0,0.25)]
      text-white transition-all duration-300
      hover:scale-[1.13] transition-transform ease-in-out"
    >
      <h2 className="text-center text-lg font-semibold mb-6">새로운 브이로그 생성</h2>

      {/* ✅ 업로드 박스 */}
      <label
        htmlFor="file-upload"
        className="relative w-full h-40 flex flex-col items-center justify-center mb-6 
        bg-[rgba(255,255,255,0.05)] backdrop-blur-xl
        border border-dashed border-[rgba(255,255,255,0.2)]
        shadow-[inset_0_0_0.5px_rgba(255,255,255,0.2),_0_0_20px_rgba(0,0,0,0.15)]
        rounded-lg text-gray-300 text-center cursor-pointer transition-all duration-300 hover:border-pink-300 overflow-hidden"
      >
        {/* ✅ 업로드 이미지가 있으면 보여줌 */}
        {uploadedImageUrl && (
          <img
            src={uploadedImageUrl}
            alt="미리보기"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        )}

        {/* ✅ 기본 안내 문구 (이미지가 없을 때만) */}
        {!uploadedImageUrl && (
          <>
            <img src="/upload.png" alt="업로드" className="w-10 h-10 mb-2 opacity-70 z-10" />
            <span className="text-center leading-snug z-10 px-4">
              얼굴 넣으면 "나만의 드라마"<br />
              안 넣으면 "AI가 꾸민 가짜 기억 여행"
            </span>
          </>
        )}

        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {/* ✅ 파일 이름 출력 */}
      {file && (
        <p className="mt-1 text-sm text-green-400 text-center truncate">{file.name}</p>
      )}

      {/* 버튼 */}
      <button
        onClick={handleGenerate}
        className="block mx-auto px-6 py-3 rounded-full text-white font-semibold 
        bg-[#ff4d8b] 
        shadow-[0_0_12px_#ff3e70] 
        hover:shadow-[0_0_24px_#ff3e70,0_0_60px_#ff3e70]
        hover:scale-105 transition-all duration-300 ease-in-out
        tracking-wide mt-4"
      >
        <span className="inline-flex items-center gap-2">
          {loading ? (
            <svg className="w-5 h-5 animate-spin text-white">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          ) : (
            <span className="text-lg">✔</span>
          )}
          {loading ? '✨ 생성 중...' : '오늘 하루 소환!'}
        </span>
      </button>

      <p className="text-sm text-gray-300 mt-4 text-center">
        올려주신 사진은 생성 후 삭제됩니다
      </p>
    </div>
  );
}
