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
    { src: '/vlog1.jpg', type: 'image' },
    { src: '/vlog2.jpg', type: 'image' },
    { src: '/vlog3.jpg', type: 'image' },
    { src: '/vlog4.jpg', type: 'image' },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSummoning, setIsSummoning] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

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
  const handleGenerate = async () => {
    setIsSummoning(true);

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('style', style);
      formData.append('age', age);
      formData.append('gender', gender);

      if (file) {
        formData.append('image', file);
      }

      const response = await fetch('http://127.0.0.1:8000/generate/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.image) {
        setImageList((prev) => [
          {
            src: result.image,
            type: 'image',
          },
          ...prev,
        ]);
      }


      if (result.success) {
        setImageList(prev => [{ src: result.image, type: 'image' }, ...prev]);
        console.log('이미지 생성 성공!', result.image);
      } else {
        console.error('이미지 생성 실패:', result.error);
      }
    } catch (error) {
      console.error('API 호출 실패:', error);
    } finally {
      setIsSummoning(false);
    }
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

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 px-6 mt-20 pb-64 items-stretch">

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