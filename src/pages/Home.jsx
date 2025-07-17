import { useState } from 'react';
import MainTitle from '../components/MainTitle';
import DailyJournalInput from '../components/DailyJournalInput';
import InfoInputCard from '../components/InfoInputCard';
import GenerationCard from '../components/GenerationCard';
import VlogRecordCard from '../components/VlogRecordCard';
import ImagePreviewModal from '../components/ImagePreviewModal';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomAlertModal from '../components/CustomAlertModal';

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
    if (!uploaded) return;

    if (!uploaded.type.startsWith("image/")) {
      setAlertMessage("이미지 파일만 업로드할 수 있어요!");
      setAlertSubMessage("이미지 파일을 추가해주세요!");
      setShowAlert(true);
      e.target.value = "";
      return;
    }

    if (uploaded.size > 5 * 1024 * 1024) {
      setAlertMessage("5MB 이하 이미지 파일만 업로드할 수 있어요!");
      setAlertSubMessage("5MB 이하의 파일을 올려주세요!");
      setShowAlert(true);
      e.target.value = "";
      return;
    }

    setFile(uploaded);
  };


  const [showAlert, setShowAlert] = useState(false);
  const [alertSubMessage, setAlertSubMessage] = useState('');




  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageList[currentIndex].src;
    link.download = `vlog_${currentIndex + 1}.png`;
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

  const [progress, setProgress] = useState(0);

  const [alertMessage, setAlertMessage] = useState('');




  // "오늘 하루 소환!" 버튼 클릭 시 실행될 함수
  const handleGenerate = async () => {
    setIsSummoning(true);
    setProgress(0); // 시작할 때 0으로 초기화

    // 가짜 게이지 애니메이션 시작
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval); // 너무 미리 100 되지 않게 제한
          return prev;
        }
        return prev + 2;
      });
    }, 200); // 0.2초마다 증가

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('style', style);
      formData.append('age', age);
      formData.append('gender', gender);

      if (file) {
        formData.append('image', file);
      }

      // 'https://falsecam.onrender.com/generate/image',
      const response = await fetch('http://127.0.0.1:8000/generate/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.image) {
        setImageList((prev) => [{ src: result.image, type: 'image' }, ...prev]);
        console.log('이미지 생성 성공!', result.image);
      } else {
        console.error('이미지 생성 실패:', result.error);
      }
    } catch (error) {
      console.error('API 호출 실패:', error);
    } finally {
      // 응답이 빨리 와도 최소 2초는 로딩 보여줌
      setTimeout(() => {
        setProgress(100); // 게이지는 마지막에 100% 도달
        setTimeout(() => {
          setIsSummoning(false); // 로딩 종료
        }, 500); // 0.5초 후 종료
      }, 2000); // 최소 로딩 시간 2초 확보
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
      {/* "소환" 버튼 클릭 시 나타나는 로딩 화면 */}
      {isSummoning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 text-white">
          <p className="mb-4 text-lg">당신의 하루를 마법처럼 소환 중이에요...</p>

          {/* 캐릭터 + 게이지 */}
          <div className="relative w-64 h-12 mb-2">
            <img
              src="/rabbit.jpg"
              alt="Rabbit"
              className="absolute bottom-4 left-0 w-12 h-12 animate-bounce"
              style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
            />

            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="text-sm">{progress}%</p>
        </div>
      )}
      <CustomAlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        message={alertMessage}
        subMessage={alertSubMessage}
      />



    </div>
  );
}