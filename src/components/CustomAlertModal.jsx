export default function CustomAlertModal({ isOpen, onClose, message, subMessage }) {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-[rgba(255,255,255,0.1)] backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-sm w-full text-white text-center shadow-xl">
          <img
            src="/warning/rabbit.png"
            alt="경고"
            className="w-24 h-24 mx-auto mb-4 drop-shadow-md"
          />
          <p className="text-lg font-semibold mb-2">{message}</p>
          <p className="text-sm text-gray-300 mb-4">{subMessage}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-md transition"
          >
            확인 🐰
          </button>
        </div>
      </div>
    );
  }
  