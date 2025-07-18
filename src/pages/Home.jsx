import { useState } from 'react';
import MainTitle from '../components/MainTitle';
import DailyJournalInput from '../components/DailyJournalInput';
import InfoInputCard from '../components/InfoInputCard';
import GenerationCard from '../components/GenerationCard';
import VlogRecordCard from '../components/VlogRecordCard';
import ImagePreviewModal from '../components/ImagePreviewModal';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomAlertModal from '../components/CustomAlertModal';
import { getSessionID } from '../utils/session';


export default function Home() {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [style, setStyle] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageList, setImageList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSummoning, setIsSummoning] = useState(false);

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




  const handleGenerate = async () => {
    setIsSummoning(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 2;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('style', style);
      formData.append('age', age);
      formData.append('gender', gender);

      if (file) {
        formData.append('image', file);
      }

      const sessionID = getSessionID(); // 이 줄 추가
      const response = await fetch('https://falsecam.onrender.com/generate/image', {
        method: 'POST',
        headers: {
          'sessionID': sessionID // 이 줄 추가!
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.image) {
        setImageList((prev) => [{ src: result.image, type: 'image' }, ...prev]);
        setCurrentIndex(0);
        console.log('이미지 생성 성공!', result.image);
        // [여기] 비디오 생성 API 호출
        try {
          const videoRes = await fetch('https://falsecam.onrender.com/generate/video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json','sessionID': sessionID // 이것도 추가!
  },
            body: JSON.stringify({
              prompt: text,
              image_url: result.image,
              style,
              age,
              gender,
            }),
          });
          const videoResult = await videoRes.json();
          if (videoResult.success) {
            console.log('비디오 생성 성공!', videoResult);
            // 필요시 setState 등 후처리
          } else {
            console.error('비디오 생성 실패:', videoResult.error);
          }
        } catch (err) {
          console.error('비디오 생성 API 호출 오류:', err);
        }

      } else {
        console.error('이미지 생성 실패:', result.error);
      }
    } catch (error) {
      console.error('API 호출 실패:', error);
    } finally {
      setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsSummoning(false);
        }, 500);
      }, 2000);
    }
  };

  return (
    <div
      className="w-full min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url('/beach.jpg')` }}
    >
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none bg-[#0f1028]/60 backdrop-blur-sm" />




      <div className="relative z-10 text-white font-sans">
  <div className="absolute top-0 left-16 flex items-center px-6 py-2 rounded-2xl z-50">
    <img
      src="/logo.png"
      alt="로고"
      className="h-20 w-20 mr-0"
      style={{
        filter: "brightness(99%) saturate(80%) blur(0.5px)",
        transition: "filter 0.3s ease-in-out",
        background: "transparent"
      }}
    />
    <span
      className="text-2xl font-bold tracking-tight"
      style={{ letterSpacing: "0.03em" }}
    >
      FalseCam
    </span>
  </div>






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
            loading={isSummoning}
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
        loading={loading}
        imageList={imageList}
        currentIndex={currentIndex}
        prevImage={prevImage}
        nextImage={nextImage}
        handleDownload={handleDownload}
        openInstagram={openInstagram}
      />

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