import { useState } from 'react';
import MainTitle from '../components/MainTitle';
import DailyJournalInput from '../components/DailyJournalInput';
import InfoInputCard from '../components/InfoInputCard';
import GenerationCard from '../components/GenerationCard';
import VlogRecordCard from '../components/VlogRecordCard';
import ImagePreviewModal from '../components/ImagePreviewModal';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [style, setStyle] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageList, setImageList] = useState([
    'vlog1.jpg',
    'vlog2.jpg',
    'vlog3.jpg',
    'vlog4.jpg',
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSummoning, setIsSummoning] = useState(false); // "소환" 버튼 로딩 상태

  const handleFileChange = (e) => {
    const uploaded = e.target.files[0];
    setFile(uploaded);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageList[currentIndex];
    link.download = `vlog_${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openInstagram = () => {
    window.open('https://www.instagram.com/', '_blank');
  };

  const openPreview = (index) => {
    setCurrentIndex(index);
    setPreviewOpen(true);
    // 미리보기 시의 로딩 (이미지 생성과는 별개)
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  // "오늘 하루 소환!" 버튼 클릭 시 실행될 함수
  const handleGenerate = () => {
    setIsSummoning(true); // 로딩 시작
    setTimeout(() => {
      // 여기에 실제 이미지 생성 API 호출 로직을 구현합니다.
      setIsSummoning(false); // 로딩 완료
    }, 3000); // 3초 동안 로딩 시뮬레이션
  };

  return (
    <div
      className="w-full min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url('/beach.jpg')` }}
    >
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none bg-[#0f1028]/60 backdrop-blur-sm" />

      <div className="relative z-10 text-white font-sans">
        <MainTitle />
        <DailyJournalInput text={text} setText={setText} />

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 px-6 mt-40 pb-64 items-stretch">
          <InfoInputCard
            style={style}
            setStyle={setStyle}
            age={age}
            setAge={setAge}
            gender={gender}
            setGender={setGender}
          />
          <GenerationCard
            file={file}
            handleFileChange={handleFileChange}
            loading={isSummoning} // isSummoning 상태를 loading prop으로 전달
            handleGenerate={handleGenerate}
          />
          <VlogRecordCard
            imageList={imageList}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            openPreview={openPreview}
          />
        </div>
      </div>

      <ImagePreviewModal
        isOpen={previewOpen}
        setIsOpen={setPreviewOpen}
        loading={loading} // 미리보기 로딩 상태
        imageList={imageList}
        currentIndex={currentIndex}
        prevImage={prevImage}
        nextImage={nextImage}
        handleDownload={handleDownload}
        openInstagram={openInstagram}
      />

      {/* "소환" 버튼 클릭 시 나타나는 로딩 화면 */}
      {isSummoning && <LoadingSpinner />}
    </div>
  );
}