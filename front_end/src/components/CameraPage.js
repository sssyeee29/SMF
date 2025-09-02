import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, ArrowLeft } from 'lucide-react';
import './CameraPage.css';
import axios from "axios";

const CameraPage = ({ setCurrentPage, detectionHistory, setDetectionHistory, username, handleLogout }) => {
  const [selectedImage, setSelectedImage] = useState([]);
  const [detectionResult, setDetectionResult] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 카메라 1, 2
  const [cameraStream1, setCameraStream1] = useState(null);
  const [cameraStream2, setCameraStream2] = useState(null);

  // 비디오 일시정지 상태
  const [isPaused1, setIsPaused1] = useState(false);
  const [isPaused2, setIsPaused2] = useState(false);

  const [devices, setDevices] = useState([]);
  const [selectedDeviceId1, setSelectedDeviceId1] = useState('');
  const [selectedDeviceId2, setSelectedDeviceId2] = useState('');

  // 카메라 연동 wifi
  const [wifiCamUrl1, setWifiCamUrl1] = useState('');
  const [wifiCamUrl2, setWifiCamUrl2] = useState('');

  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);
  const imgRef1 = useRef(null); // MJPEG <img>용
  const imgRef2 = useRef(null);
  const canvasRef = useRef(null);
  const [isConveyorOn, setIsConveyorOn] = useState(false);

  const [wifiCamActive1, setWifiCamActive1] = useState(false); // IP캠 연결 활성화 여부


  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(allDevices => {
      const videoDevices = allDevices.filter(d => d.kind === "videoinput");
      setDevices(videoDevices);
    });
  }, []);

  //아마도 카메라 연동이 안되면 해당 alert가 뜸...
  const startCamera = async (deviceId, setStream, videoRef) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true
      });
      setStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      alert("카메라를 열 수 없습니다.");
    }
  };

  // ===== 포맷 판별 & 캡처 =====
  const isMjpeg = (url) => !!url && /(?:\/video(?:\b|$)|mjpeg|mjpg|action=stream)/i.test(url);

  const captureFromElement = (el) => {
    if (!el) return null;
    const w = el.videoWidth || el.naturalWidth || el.clientWidth;
    const h = el.videoHeight || el.naturalHeight || el.clientHeight;
    if (!w || !h) return null;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(el, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.9);
  };
  const captureFlexible = (videoRef, imgRef) =>
    captureFromElement(videoRef.current || imgRef.current);

  // (기존) 비디오 전용 캡처
  const captureImage = (videoRef) => {
    if (!videoRef.current) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL("image/jpeg");
  };

  // ===== 랜덤 검사 시뮬레이터(원래 있던 것 유지) =====
  const detectDefects = useCallback((images) => {
    setIsProcessing(true);
    setTimeout(() => {
      const defectTypes = ['스크래치', '크랙', '색상 불량', '변형', '오염'];

      const results = images.map((img) => {
        const hasDefect = Math.random() > 0.6;
        const selectedDefectType = defectTypes[Math.floor(Math.random() * defectTypes.length)];
        return {
          id: Date.now() + Math.random(),
          timestamp: new Date().toLocaleString('ko-KR'),
          result: hasDefect ? '불량품' : '양품',
          type: hasDefect ? selectedDefectType : '-',
          confidence: hasDefect
            ? (85 + Math.random() * 10).toFixed(1) + '%'
            : (95 + Math.random() * 5).toFixed(1) + '%',
          image: img,
        };
      });

      setDetectionResult(results);
      setDetectionHistory(prev => [...results, ...prev].slice(0, 10));
      setIsProcessing(false);
    }, 2000);
  }, [setDetectionHistory]);

  const toggleConveyor = async () => {
    try {
      const endpoint = isConveyorOn ? "/stop" : "/start";
      const response = await axios.post(`http://localhost:8080/api/conveyor${endpoint}`);
      console.log("Conveyor response:", response.data);
      setIsConveyorOn(!isConveyorOn);
    } catch (err) {
      console.error("컨베이어 제어 실패", err);
      alert("컨베이어 제어에 실패했습니다.");
    }
  };

  return (
    <div className="camera-page">
      {/* 헤더 */}
      <div className="camera-header">
        <div className="header-left">
          {/* 뒤로가기 */}
          <button onClick={() => setCurrentPage('home')} className="back-button">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="header-title">컨테이너 검사 페이지</h1>
        </div>
        <div className="header-right">
          {username && <span className="username">{username} 님</span>}
          <button onClick={handleLogout} className="logout-button">
            로그아웃
          </button>
        </div>
      </div>{/* 헤더 건들지 말기 */}

      {/*본 화면 */}
      <div className="main-content">

        {/* 좌측: 카메라 2개 */}
        <div className="camera-section">
          {/* 카메라 1 */}
          <div className="camera-container">
            <div className="camera-title">실시간 상단 카메라</div>

            <input
              type="text"
              placeholder="Wi-Fi 카메라 URL (예: http://IP:PORT/video)"
              value={wifiCamUrl1}
              onChange={e => setWifiCamUrl1(e.target.value)}
              className="wifi-input"
            />

            <select
              value={selectedDeviceId1}
              onChange={e => setSelectedDeviceId1(e.target.value)}
              className="device-select"
            >
              <option value="">PC 카메라 선택</option>
              {devices.map(cam => <option key={cam.deviceId} value={cam.deviceId}>{cam.label}</option>)}
            </select>

            <div className="video-container">
              {(wifiCamActive1 && isMjpeg(wifiCamUrl1)) ? (
                <img
                  ref={imgRef1}
                  src={wifiCamUrl1}
                  className="video-stream"
                  alt="Wi-Fi MJPEG"
                  crossOrigin="anonymous"
                />
              ) : cameraStream1 ? (
                <video
                  ref={videoRef1}
                  autoPlay playsInline muted
                  className="video-stream"
                />
              ) : (
                <div className="camera-off-placeholder">
                  <div className="camera-off-content">
                    <Camera className="camera-icon" />
                    <div className="camera-off-text">카메라 OFF</div>
                  </div>
                </div>
              )}
            </div>

            <div className="camera-controls">
              <button
                onClick={toggleConveyor}
                className={isConveyorOn ? "btn-camera-off" : "btn-camera-on"}
              >
                {isConveyorOn ? "컨베이어 정지" : "컨베이어 작동"}
              </button>

              {/* 카메라 ON/OFF (로컬캠 제어) */}
              {wifiCamUrl1 ? (
                wifiCamActive1 ? (
                  <>
                    <button className="btn-camera-on" disabled>IP캠 ON</button>
                    <button onClick={() => setWifiCamActive1(false)} className="btn-camera-off">IP캠 OFF</button>
                  </>
                ) : (
                  <button onClick={() => setWifiCamActive1(true)} className="btn-camera-on">IP캠 ON</button>
                )
              ) : !cameraStream1 ? (
                <button
                  onClick={() => startCamera(selectedDeviceId1, setCameraStream1, videoRef1)}
                  className="btn-camera-on"
                >
                  카메라 ON
                </button>
              ) : (
                <button
                  onClick={() => {
                    cameraStream1.getTracks().forEach(t => t.stop());
                    setCameraStream1(null);
                    setIsPaused1(false);
                  }}
                  className="btn-camera-off"
                >
                  카메라 OFF
                </button>
              )}


              {/* 캡처: video/img 모두 지원 */}
              <button
                onClick={() => {
                  const img = captureFlexible(videoRef1, imgRef1);
                  if (img) { setSelectedImage([img]); detectDefects([img]); }
                }}
                className="btn-capture"
              >
                캡쳐
              </button>
            </div>
          </div>

          {/* 카메라 2 */}
          <div className="camera-container">
            <div className="camera-title">실시간 측면 카메라</div>
            <input
              type="text"
              placeholder="Wi-Fi 카메라 URL"
              value={wifiCamUrl2}
              onChange={e => setWifiCamUrl2(e.target.value)}
              className="wifi-input"
            />

            <select
              value={selectedDeviceId2}
              onChange={e => setSelectedDeviceId2(e.target.value)}
              className="device-select"
            >
              <option value="">PC 카메라 선택</option>
              {devices.map(cam => <option key={cam.deviceId} value={cam.deviceId}>{cam.label}</option>)}
            </select>

            <div className="video-container">
              {cameraStream2 || wifiCamUrl2 ? (
                <video
                  ref={videoRef2}
                  autoPlay
                  playsInline
                  muted
                  className="video-stream"
                  src={wifiCamUrl2 || undefined}
                />
              ) : (
                <div className="camera-off-placeholder">
                  <div className="camera-off-content">
                    <Camera className="camera-icon" />
                    <div className="camera-off-text">카메라 OFF</div>
                  </div>
                </div>
              )}
            </div>

            <div className="camera-controls">
              <button
                onClick={() => {
                  if (!cameraStream1) {
                    startCamera(selectedDeviceId1, setCameraStream1, videoRef1);
                  } else if (videoRef1.current) {
                    if (isPaused1) {
                      videoRef1.current.play();
                      setIsPaused1(false);
                    } else {
                      videoRef1.current.pause();
                      setIsPaused1(true);
                    }
                  }
                }}
                className={!cameraStream1 || isPaused1 ? "btn-camera-on" : "btn-camera-off"}
              >
                {!cameraStream1 || isPaused1 ? '시작' : '중지'}
              </button>

              {!cameraStream1 ? (
                <button
                  onClick={() => startCamera(selectedDeviceId1, setCameraStream1, videoRef1)}
                  className="btn-camera-on"
                >
                  카메라 ON
                </button>
              ) : (
                <button
                  onClick={() => { cameraStream1.getTracks().forEach(t => t.stop()); setCameraStream1(null); setIsPaused1(false); }}
                  className="btn-camera-off"
                >
                  카메라 OFF
                </button>
              )}

              <button
                onClick={() => { const img = captureImage(videoRef1); if (img) { setSelectedImage([img]); detectDefects([img]) } }}
                className="btn-capture"
              >
                캡쳐
              </button>
            </div>
          </div>
        </div>

        {/* 우측: AI 검사 */}
        <div className="ai-inspection-panel">
          <div className="ai-title">AI 부분 검사 상태</div>

          <button
            onClick={() => {
              const img1 = captureImage(videoRef1);
              const img2 = captureImage(videoRef2);
              if (img1 && img2) {
                setSelectedImage([img1, img2]);
                detectDefects([img1, img2])
              }
            }}
            className="btn-dual-capture"
          >
            두 카메라 동시에 촬영
          </button>

          {isProcessing ? (
            <div className="processing-container">
              <div className="loading-spinner"></div>
              <div className="processing-text">검사 중...</div>
            </div>
          ) : detectionResult.length ? (
            <div className="results-container">
              <div className="captured-images">
                {selectedImage.map((img, i) =>
                  <img
                    key={i}
                    src={img}
                    className="captured-image"
                    alt={`검사 이미지 ${i + 1}`}
                  />
                )}
              </div>
              {detectionResult.map((res, i) =>
                <div key={i} className="result-item">
                  <div className="result-row">
                    <span>결과:</span>
                    <span className={res.result === "불량품" ? "result-defect" : "result-good"}>
                      {res.result}
                    </span>
                  </div>

                  <div className="result-row">
                    <span>불량 유형:</span>
                    <span>{res.type}</span>
                  </div>

                  <div className="result-row">
                    <span>신뢰도:</span>
                    <span>{res.confidence}</span>
                  </div>

                  <div className="result-row">
                    <span>검사 시간:</span>
                    <span>{res.timestamp}</span>
                  </div>
                </div>
              )}
              <button
                onClick={() => { setDetectionResult([]); setSelectedImage([]) }}
                className="btn-new-inspection"
              >
                새로운 검사
              </button>
            </div>
          ) : (
            <div className="waiting-container">
              <div className="waiting-text">검사 대기 중</div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden-canvas" />
    </div>
  );
};

export default CameraPage;