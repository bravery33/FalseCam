export default function GenerationCard({ file, handleFileChange, loading, handleGenerate }) {
    return (
      <div className="bg-[#08091d]/60 backdrop-blur-md rounded-2xl p-6 shadow border border-[#30363d] flex flex-col justify-between">
        <h2 className="text-lg font-semibold mb-4">새로운 브이로그 생성</h2>
  
        <div className="w-full mb-4 p-6 border border-dashed border-[#30363d] rounded-lg text-center text-gray-400 bg-[#08091d]">
          <label className="cursor-pointer block">
            얼굴 들어가면 니얼굴<br />
            아니면 랜덤임
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {file && <p className="mt-2 text-sm text-green-400">{file.name}</p>}
        </div>
  
        <button
          onClick={handleGenerate}
          className="mt-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 
           text-white text-lg font-semibold tracking-wide 
           transition transform hover:scale-105 hover:shadow-xl active:scale-95 group disabled:opacity-60"
          disabled={loading}
        >
          <span className="inline-flex items-center gap-2">
            {loading ? (
              <svg
                className="w-5 h-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            ) : (
              <span className="text-lg">✔</span>
            )}
            {loading ? '✨ 생성 중...' : '오늘 하루 소환! 🔮'}
          </span>
        </button>
  
        <p className="text-sm text-gray-400 mt-2 text-center">
          올려주신 사진은 생성 후 삭제됩니다
        </p>
      </div>
    );
  }