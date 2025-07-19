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
    const currentItem = imageList[currentIndex];

    const link = document.createElement('a');

    if (currentItem.type === 'video') {
      link.href = currentItem.video_url;
      link.download = `vlog_video_${currentIndex + 1}.mp4`;
    } else {
      link.href = currentItem.src;
      link.download = `vlog_image_${currentIndex + 1}.png`;
    }

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
    if (!text.trim()) {
      setAlertMessage("일기 내용을 먼저 작성해주세요!");
      setAlertSubMessage("오늘 있었던 일을 간단하게 들려주세요.");
      setShowAlert(true);
      return;
    }

    setIsSummoning(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('style', style);
      formData.append('age', age);
      formData.append('gender', gender);

      if (file) {
        formData.append('image', file);
      }

      const sessionID = getSessionID();
      const response = await fetch('https://falsecam.onrender.com/generate/image', {
        method: 'POST',
        headers: {
          'sessionID': sessionID
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.image) {
        const newImageItem = { src: result.image, type: 'image', date: new Date() };
        setImageList((prev) => [newImageItem, ...prev]);
        setCurrentIndex(0);
        console.log('이미지 생성 성공!', result.image);

        const videoRes = await fetch('https://falsecam.onrender.com/generate/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'sessionID': sessionID },
          body: JSON.stringify({
            prompt: text,
            image_url: result.image,
            style,
            age,
            gender,
          }),
        });
        const videoResult = await videoRes.json();

        if (videoResult.success && videoResult.video_url) {
          console.log('비디오 생성 성공!', videoResult.video_url);
          const newVideoItem = {
            src: result.image,
            type: 'video',
            video_url: videoResult.video_url,
            date: new Date()
          };
          setImageList(prevList => [newVideoItem, ...prevList]);
        } else {
          console.error('비디오 생성 실패:', videoResult.error);
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
        <div className="absolute top-0 left-4 md:left-16 flex items-center px-6 py-2 rounded-2xl z-50">
          <img
            src="/logo.png"
            alt="로고"
            className="h-[3rem] w-[3rem] md:h-[5rem] md:w-[5rem] mr-0"
            style={{
              filter: "brightness(99%) saturate(80%) blur(0.5px)",
              transition: "filter 0.3s ease-in-out",
              background: "transparent"
            }}
          />
          <span
            className="text-[1.25rem] md:text-[1.5rem] font-bold tracking-tight"
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

      {isSummoning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 text-white">
          <p className="mb-1 text-lg">당신의 하루를 마법처럼 소환 중이에요...</p>
          <p className="mb-10 text-sm text-gray-400">영상과 이미지를 동시에 생성중이오니 약 2분만 기다려 주세요</p>

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