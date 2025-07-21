// ActionButtons.jsx

export default function ActionButtons({ handleDownload }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={handleDownload}
        className="w-11 h-11 p-2 bg-white rounded-full shadow-md hover:scale-105 transition download-icon-btn"
        title="Download"
      />
    </div>
  );
}
