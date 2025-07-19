// ActionButtons.jsx

export default function ActionButtons({ handleDownload, openInstagram }) {
  // div에서 absolute, bottom, right, z-index 클래스 제거
  return (
    <div className="flex gap-2"> 
      <button
        onClick={handleDownload}
        className="w-11 h-11 p-2 bg-white rounded-full shadow-md hover:scale-105 transition download-icon-btn"
        title="Download"
      />
      <button
        onClick={openInstagram}
        className="w-11 h-11 p-2 bg-white rounded-full shadow-md hover:scale-105 transition instagram-icon-btn"
        title="Open Instagram"
      />
    </div>
  );
}