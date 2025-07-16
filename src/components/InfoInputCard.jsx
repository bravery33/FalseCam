import Select from 'react-select';

export default function InfoInputCard({ style, setStyle, age, setAge, gender, setGender }) {
  const styleOptions = [
    { value: 'random', label: '선택안함 (랜덤)' },
    { value: 'realistic', label: '실사' },
    { value: '2d', label: '2D 애니메이션' },
    { value: '3d', label: '3D 애니메이션' },
    { value: 'cyberpunk', label: '사이버펑크' },
    { value: 'dot', label: '도트그래픽' },
  ];

  const ageOptions = [
    { value: 'random', label: '선택안함 (랜덤)' },
    { value: '9', label: '9세 이하' },
    { value: '10', label: '10대' },
    { value: '20', label: '20대' },
    { value: '30', label: '30대' },
    { value: '40', label: '40대' },
    { value: '50', label: '50대' },
    { value: '60', label: '60대 이상' },
  ];

  const genderOptions = [
    { value: 'random', label: '선택안함 (랜덤)' },
    { value: 'male', label: '나는 멋진 형이야 💪' },
    { value: 'female', label: '오늘은 예쁜 누나야 💃' },
    { value: 'other', label: '정체성은 내가 만든다 🧩' },
  ];

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderColor: 'rgba(255,255,255,0.2)',
      color: 'white',
      borderRadius: '0.75rem',
      padding: '0.25rem 0.5rem',
      backdropFilter: 'blur(12px)',
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'rgba(30,30,30,0.9)',
      color: 'white',
      backdropFilter: 'blur(8px)',
      zIndex: 50,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? 'rgba(255,255,255,0.1)' : 'transparent',
      color: 'white',
      cursor: 'pointer',
    }),
    singleValue: (base) => ({
      ...base,
      color: 'white',
    }),
    placeholder: (base) => ({
      ...base,
      color: 'rgba(255,255,255,0.5)',
    }),
    input: (base) => ({
      ...base,
      color: 'white',
    }),
  };

  return (
    <div className="w-full max-w-sm rounded-xl p-6
      bg-[rgba(255,255,255,0.05)]
      backdrop-blur-xl
      border border-[rgba(255,255,255,0.12)]
      shadow-[inset_0_0_0.5px_rgba(255,255,255,0.3),_0_4px_30px_rgba(0,0,0,0.25)]
      text-white transition-all duration-300
      hover:scale-[1.13] transition-transform ease-in-out">

      <h2 className="text-center text-lg font-semibold mb-6">정보 입력</h2>

      {/* 화풍 선택 */}
      <div className="mb-6">
        <Select
          value={style ? styleOptions.find((opt) => opt.value === style) : null}
          onChange={(selected) => setStyle(selected.value)}
          options={styleOptions}
          placeholder="오늘 하루를 그려볼까요?"
          styles={customSelectStyles}
        />
      </div>

      {/* 나이 선택 */}
      <div className="mb-6">
        <Select
          value={ageOptions.find((opt) => opt.value === age) || null}
          onChange={(selected) => setAge(selected.value)}
          options={ageOptions}
          placeholder="몇 살이길 원해요?"
          styles={customSelectStyles}
        />
      </div>

      {/* 젠더 선택 */}
      <div className="mb-6">
        <Select
          value={genderOptions.find((opt) => opt.value === gender) || null}
          onChange={(selected) => setGender(selected.value)}
          options={genderOptions}
          placeholder="오늘의 젠더는?"
          styles={customSelectStyles}
        />
      </div>

      <p className="text-sm text-gray-300 mt-4 text-center">미 선택시 랜덤으로 생성됩니다</p>
    </div>
  );
}
