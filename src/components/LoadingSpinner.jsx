export default function LoadingSpinner() {
    return (
      <div className="fixed inset-0 w-full h-full z-50 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center">
        <img src="/logo.png" alt="FalseCam 로고" className="w-20 h-20 animate-spin mb-4" />
        <p className="text-white text-lg">당신의 하루에 마법을 걸고 있어요 ✨</p>
      </div>
    );
  }