export default function ActionButtons({ handleDownload, openInstagram }) {
  return (
    <div className="absolute bottom-4 right-4 flex gap-2 z-30">
      <button
        onClick={handleDownload}
        className="flex items-center justify-center p-2 bg-white text-black rounded-full shadow hover:bg-gray-100"
        title="Download"
      >
        <img src="/download-icon.jpg" alt="Download" className="w-5 h-5" />
      </button>

      <button
        onClick={openInstagram}
        className="flex items-center justify-center p-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-full"
        title="Open Instagram"
      >
        <img src="/instagram-icon.png" alt="Instagram" className="w-5 h-5" />
      </button>
    </div>
  );
}
