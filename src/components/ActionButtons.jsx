export default function ActionButtons({ handleDownload, openInstagram }) {
  return (
    <div className="absolute bottom-4 right-4 flex gap-2 z-30">
      <button
        onClick={handleDownload}
        className="flex items-center justify-center p-2 bg-white text-black rounded-full shadow hover:bg-gray-100"
        title="Download"
      >
        <img src="/download-icon.jpg" alt="Download" className="w-7 h-7" />
      </button>

      <button
        onClick={openInstagram}
        className="flex items-center justify-center p-2 bg-white rounded-full shadow-md hover:scale-105 transition"
        title="Open Instagram"
      >
        <img src="/instagram-icon.png" alt="Instagram" className="w-7 h-7" />
      </button>


    </div>
  );
}
