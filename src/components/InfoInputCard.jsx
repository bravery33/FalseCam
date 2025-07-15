export default function InfoInputCard({ style, setStyle, age, setAge, gender, setGender }) {
    // img 속성이 완전히 제거된 배열입니다.
    const styles = [
      { value: 'realistic', label: '실사' },
      { value: '2d', label: '2D 애니메이션' },
      { value: '3d', label: '3D 애니메이션' },
      { value: 'cyberpunk', label: '사이버펑크' },
      { value: 'dot', label: '도트그래픽' },
    ];
  
    return (
      <div className="bg-[#08091d]/60 backdrop-blur-md rounded-2xl p-6 shadow border border-[#30363d] flex flex-col justify-center">
        <h2 className="text-lg font-semibold mb-6">정보 입력</h2>
  
        {/* 1. 화풍 선택 - 이미지 미리보기 관련 코드가 모두 삭제되었습니다. */}
        <div className="mb-4">
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full p-3 bg-[#08091d] border border-[#30363d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled hidden>오늘 하루를 그려볼까요?</option>
            <option value="random">선택안함 (랜덤)</option>
            {styles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
  
        {/* 2. 나이 선택 */}
        <select
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="mb-4 p-3 w-full bg-[#08091d] border border-[#30363d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled hidden>몇 살이길 원해요?</option>
          <option value="random">선택안함 (랜덤)</option>
          <option value="9">9세 이하</option>
          <option value="10">10대</option>
          <option value="20">20대</option>
          <option value="30">30대</option>
          <option value="40">40대</option>
          <option value="50">50대</option>
          <option value="60">60대 이상</option>
        </select>
  
        {/* 3. 성별 선택 */}
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="mb-4 p-3 bg-[#08091d] border border-[#30363d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled hidden>오늘의 젠더는?</option>
          <option value="random">선택안함 (랜덤)</option>
          <option value="male">나는 멋진 형이야 💪</option>
          <option value="female">오늘은 예쁜 누나야 💃</option>
          <option value="other">정체성은 내가 만든다 🧩</option>
        </select>
        <p className="text-sm text-gray-400 mt-2">미 선택시 랜덤으로 생성됩니다</p>
      </div>
    );
  }