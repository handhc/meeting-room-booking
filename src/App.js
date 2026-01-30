import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, User, Mail, CheckCircle, Trash2, Plus, Users, Settings, LogOut, LayoutDashboard, ChevronLeft, ArrowRight, Loader2, RefreshCcw } from 'lucide-react';

// --- 設定與常數 ---
// 使用您提供的網址
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwpIIbXc6Xwws6rt4gMcZsDLG8rpPtMSr49l6ZLJfCpZrXOzQdYU9ff_fyHKGyJadE-/exec"; 
const START_HOUR = 9;
const END_HOUR = 18;

const INITIAL_ROOMS = [
  { id: 1, name: '大會議室 A (10人)', capacity: 10 },
  { id: 2, name: '小會議室 B (4人)', capacity: 4 },
  { id: 3, name: '專案討論室 C (6人)', capacity: 6 },
];

// --- 輔助函式 ---
const generateTimeSlots = () => {
  const slots = [];
  for (let i = START_HOUR; i < END_HOUR; i++) {
    slots.push(`${i.toString().padStart(2, '0')}:00`);
    slots.push(`${i.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

const formatTimeRange = (times) => {
  if (!times || times.length === 0) return '';
  const sorted = [...times].sort();
  const start = sorted[0];
  const endSlot = sorted[sorted.length - 1];
  const [h, m] = endSlot.split(':').map(Number);
  const endDate = new Date();
  endDate.setHours(h, m + 30);
  const endString = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  return `${start} - ${endString}`;
};

// --- 子元件 ---

const RoomSelection = ({ rooms, onSelect }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="text-center mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">預約會議空間</h2>
      <p className="text-gray-500">選擇適合的會議室開始預約</p>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {rooms.map((room) => (
        <div 
          key={room.id} 
          onClick={() => onSelect(room)}
          className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 cursor-pointer overflow-hidden group active:scale-95 duration-200"
        >
          <div className="h-28 md:h-32 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <Users className="w-10 h-10 md:w-12 md:h-12 text-white opacity-90 group-hover:scale-110 transition-transform" />
          </div>
          <div className="p-5">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">{room.name}</h3>
            <div className="flex items-center text-gray-500 text-sm mb-4">
              <User className="w-4 h-4 mr-1" />
              <span>容納 {room.capacity} 人</span>
            </div>
            <button className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center">
              立即預約 <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const BookingForm = ({ room, date, bookings, onBack, onSubmit }) => {
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  // 檢查時段是否被佔用 (包含本機暫存與雲端資料)
  const isBooked = (time) => {
    return bookings.some(b => {
      // 確保roomId比較是正確的 (轉為字串或數字統一比較)
      const isSameRoom = String(b.roomId) === String(room.id);
      const isSameDate = b.date === date;
      const isTimeIncluded = b.times && b.times.includes(time);
      return isSameRoom && isSameDate && isTimeIncluded;
    });
  };

  const handleTimeClick = (time) => {
    if (isBooked(time)) return;

    if (selectedTimes.length === 0) {
      setSelectedTimes([time]);
      return;
    }

    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
      return;
    }

    const allTimes = [...selectedTimes, time].sort();
    const startIndex = timeSlots.indexOf(allTimes[0]);
    const endIndex = timeSlots.indexOf(allTimes[allTimes.length - 1]);
    
    const newSelection = [];
    let isValidRange = true;

    for (let i = startIndex; i <= endIndex; i++) {
      const currentSlot = timeSlots[i];
      if (isBooked(currentSlot)) {
        isValidRange = false; 
        break;
      }
      newSelection.push(currentSlot);
    }

    if (isValidRange) {
      setSelectedTimes(newSelection);
    } else {
      setSelectedTimes([time]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedTimes.length === 0) return;
    setIsSubmitting(true);
    await onSubmit({ ...formData, times: selectedTimes });
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in slide-in-from-right-8 duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:w-1/3 h-fit sticky top-4">
        <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-800 mb-6 font-medium transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> 重選會議室
        </button>
        
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">會議室</h4>
            <div className="text-lg font-bold text-gray-800">{room.name}</div>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">日期</h4>
            <input 
              type="date" 
              value={date}
              disabled
              className="bg-transparent font-bold text-gray-800 w-full outline-none"
            />
          </div>

          <div className={`p-4 rounded-xl border transition-colors ${selectedTimes.length > 0 ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${selectedTimes.length > 0 ? 'text-blue-500' : 'text-gray-400'}`}>已選時段</h4>
            <div className={`text-lg font-bold ${selectedTimes.length > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
              {selectedTimes.length > 0 ? formatTimeRange(selectedTimes) : '尚未選擇'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" /> 選擇時間
          </h3>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-3">
            {timeSlots.map((time) => {
              const booked = isBooked(time);
              const selected = selectedTimes.includes(time);
              return (
                <button
                  key={time}
                  disabled={booked}
                  onClick={() => handleTimeClick(time)}
                  className={`
                    py-3 px-2 rounded-lg text-sm font-medium transition-all relative overflow-hidden
                    ${booked 
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                      : selected
                        ? 'bg-blue-600 text-white shadow-md scale-105 z-10'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                    }
                  `}
                >
                  {time}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex gap-4 text-xs md:text-sm text-gray-500 justify-end">
            <div className="flex items-center"><div className="w-3 h-3 bg-white border border-gray-300 rounded mr-1"></div> 空閒</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-blue-600 rounded mr-1"></div> 已選</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-gray-100 rounded mr-1"></div> 已佔用</div>
          </div>
        </div>

        {selectedTimes.length > 0 && (
          <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-300 pt-6 border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600" /> 聯絡資料
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input 
                    required
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="輸入姓名"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input 
                    required
                    type="email"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="接收確認信"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-wait"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
              {isSubmitting ? '處理中...' : '確認預約'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const SuccessScreen = ({ booking, onHome, generateCalendarLink }) => (
  <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden text-center p-8 animate-in zoom-in duration-300">
    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
      <CheckCircle className="w-10 h-10 text-green-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-800 mb-2">預約成功！</h2>
    <p className="text-gray-500 mb-8">預約確認信將寄送至 {booking?.user.email}</p>
    
    <div className="bg-slate-50 rounded-xl p-5 mb-8 text-left border border-slate-100">
      <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-3">
        <span className="text-sm text-gray-500">日期</span>
        <span className="font-bold text-gray-800">{booking?.date}</span>
      </div>
      <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-3">
        <span className="text-sm text-gray-500">時間</span>
        <span className="font-bold text-blue-600">{formatTimeRange(booking?.times)}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">地點</span>
        <span className="font-bold text-gray-800">{booking?.roomName}</span>
      </div>
    </div>

    <div className="space-y-3">
      <a 
        href={generateCalendarLink(booking)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-full py-3.5 bg-white border-2 border-gray-100 text-gray-700 rounded-xl hover:border-blue-500 hover:text-blue-600 font-bold transition-all"
      >
        <Calendar className="w-5 h-5 mr-2" />
        加入 Google 行事曆
      </a>
      <button 
        onClick={onHome}
        className="w-full py-3.5 bg-gray-800 text-white rounded-xl hover:bg-gray-900 font-bold transition-colors"
      >
        返回首頁
      </button>
    </div>
  </div>
);

const AdminDashboard = ({ bookings, rooms, onDeleteBooking, onAddRoom, onDeleteRoom, onLogout, refreshData, isLoading }) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-800 text-white p-6 rounded-2xl shadow-lg">
      <div className="mb-4 md:mb-0">
        <h2 className="text-2xl font-bold flex items-center">
          <LayoutDashboard className="w-6 h-6 mr-3" /> 管理後台
        </h2>
        <p className="text-gray-400 mt-1">Google Sheet 同步模式</p>
      </div>
      <div className="flex gap-3">
        <button 
          onClick={refreshData}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
          {isLoading ? '同步中' : '刷新資料'}
        </button>
        <button 
          onClick={onLogout}
          className="flex items-center px-4 py-2 bg-red-600/20 text-red-200 rounded-lg hover:bg-red-600/40 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4 mr-2" /> 登出
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 flex items-center text-lg">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" /> 所有預約 ({bookings.length})
          </h3>
        </div>
        <div className="overflow-y-auto p-4 flex-1 space-y-3">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
               <Loader2 className="w-8 h-8 animate-spin mb-2" />
               <p>正在從 Google Sheet 讀取資料...</p>
             </div>
          ) : bookings.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Calendar className="w-12 h-12 mb-3 opacity-20" />
              <p>目前尚無任何預約</p>
            </div>
          ) : (
            bookings.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(booking => (
              <div key={booking.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white hover:bg-blue-50 rounded-xl border border-gray-100 transition-colors group">
                <div className="mb-3 md:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800 text-lg">{booking.date}</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-sm font-bold">{formatTimeRange(booking.times)}</span>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="font-medium text-gray-900">{booking.roomName}</span>
                    <span className="text-gray-300">|</span>
                    <span>{booking.user.name}</span>
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteBooking(booking.id)}
                  className="w-full md:w-auto px-4 py-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center text-sm font-medium opacity-100 md:opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4 mr-2 md:mr-0" />
                  <span className="md:hidden">刪除預約</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center text-lg">
          <Settings className="w-5 h-5 mr-2 text-blue-600" /> 會議室設定
        </h3>
        
        <div className="space-y-3 mb-8">
          {rooms.map(room => (
            <div key={room.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <div className="font-bold text-gray-800">{room.name}</div>
                <div className="text-xs text-gray-500 mt-1 flex items-center">
                  <Users className="w-3 h-3 mr-1" /> 容量: {room.capacity} 人
                </div>
              </div>
              <button onClick={() => onDeleteRoom(room.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        
        <form onSubmit={onAddRoom} className="pt-6 border-t border-gray-100">
          <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">新增會議室</h4>
          <input name="roomName" placeholder="會議室名稱 (例如: A01)" required className="w-full mb-3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          <div className="flex gap-3">
            <input name="capacity" type="number" placeholder="人數" required className="w-1/3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            <button type="submit" className="flex-1 bg-gray-800 text-white rounded-lg text-sm hover:bg-black flex items-center justify-center font-medium transition-colors">
              <Plus className="w-4 h-4 mr-1" /> 新增
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);

// --- 主程式 ---

export default function App() {
  const [view, setView] = useState('home'); 
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true); // 新增載入狀態
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastBooking, setLastBooking] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. 抓取資料的功能
  const fetchBookings = () => {
    setLoading(true);
    fetch(GOOGLE_SCRIPT_URL)
      .then(res => res.json())
      .then(data => {
        // 成功抓取後，更新 React 狀態
        setBookings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("讀取失敗:", err);
        setLoading(false);
        // 如果抓取失敗 (例如還沒部署好)，先給空陣列
        setBookings([]);
      });
  };

  // 2. 網頁載入時自動執行一次
  useEffect(() => {
    fetchBookings();
  }, []);

  // --- 邏輯處理 ---

  const generateGoogleCalendarLink = (booking) => {
    if (!booking) return '#';
    const sortedTimes = [...booking.times].sort();
    const startTime = sortedTimes[0];
    const endTimeSlot = sortedTimes[sortedTimes.length - 1];
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTimeSlot.split(':').map(Number);
    
    const sDate = new Date(booking.date);
    sDate.setHours(startH, startM, 0);
    
    const eDate = new Date(booking.date);
    eDate.setHours(endH, endM + 30, 0);

    const formatGCalDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const text = encodeURIComponent(`會議室預約: ${booking.roomName}`);
    const dates = `${formatGCalDate(sDate)}/${formatGCalDate(eDate)}`;
    const details = encodeURIComponent(`預約人: ${booking.user.name}\nEmail: ${booking.user.email}`);
    const location = encodeURIComponent(booking.roomName);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
  };

  const submitToGoogleSheet = (newBooking) => {
    const payload = new FormData();
    payload.append('action', 'create');
    payload.append('data', JSON.stringify(newBooking));

    // 使用 no-cors 避免跨域錯誤，雖然無法讀取回傳，但會成功寫入
    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: payload,
      mode: 'no-cors' 
    })
    .then(() => {
        console.log("Sent to sheet");
        // 送出後，稍微等一下再重新抓取最新資料
        setTimeout(fetchBookings, 2000); 
    })
    .catch(err => console.error("Sheet error", err));
  };

  const handleBookingSubmit = (data) => {
    const newBooking = {
      id: Date.now(),
      roomId: selectedRoom.id, // 重要：保留 ID
      roomName: selectedRoom.name,
      date: selectedDate,
      times: data.times,
      user: { name: data.name, email: data.email },
      createdAt: new Date().toLocaleString(),
    };

    // 先在本地更新 UI (讓使用者覺得很快)
    setBookings(prev => [...prev, newBooking]);
    setLastBooking(newBooking);
    
    // 背景送出資料
    submitToGoogleSheet(newBooking);
    
    setView('success');
  };

  const handleAdminLogin = () => {
    const pwd = prompt('請輸入管理員密碼 (預設: admin123)');
    if (pwd === 'admin123') {
      setIsAdmin(true);
      setView('admin');
      // 登入後自動刷新一次資料
      fetchBookings();
    } else if (pwd) {
      alert('密碼錯誤');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 pb-10">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600 cursor-pointer select-none" onClick={() => setView('home')}>
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <span>BookEasy</span>
          </div>
          <div>
            {!isAdmin ? (
              <button onClick={handleAdminLogin} className="text-sm text-gray-500 hover:text-gray-900 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                管理員登入
              </button>
            ) : (
              <button onClick={() => setView('admin')} className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-full font-medium shadow-md hover:bg-black transition-all">
                進入後台
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {view === 'home' && (
          <RoomSelection 
            rooms={rooms} 
            onSelect={(room) => { 
              setSelectedRoom(room); 
              setSelectedDate(new Date().toISOString().split('T')[0]);
              setView('booking'); 
            }} 
          />
        )}
        
        {view === 'booking' && selectedRoom && (
          <BookingForm 
            room={selectedRoom}
            date={selectedDate}
            bookings={bookings} // 這裡傳入的 bookings 現在包含從 Sheet 抓回來的資料
            onBack={() => setView('home')}
            onSubmit={handleBookingSubmit}
          />
        )}

        {view === 'success' && (
          <SuccessScreen 
            booking={lastBooking}
            onHome={() => setView('home')}
            generateCalendarLink={generateGoogleCalendarLink}
          />
        )}

        {view === 'admin' && (
          <AdminDashboard 
            bookings={bookings}
            rooms={rooms}
            isLoading={loading}
            refreshData={fetchBookings}
            onDeleteBooking={(id) => {
              if (confirm('注意：目前僅能刪除顯示，Google Sheet 資料需手動刪除。確定嗎？')) {
                setBookings(prev => prev.filter(b => b.id !== id));
              }
            }}
            onAddRoom={(e) => {
              e.preventDefault();
              const name = e.target.roomName.value;
              const capacity = e.target.capacity.value;
              if (name) {
                setRooms([...rooms, { id: Date.now(), name, capacity }]);
                e.target.reset();
              }
            }}
            onDeleteRoom={(id) => {
              if (confirm('確定刪除？')) setRooms(prev => prev.filter(r => r.id !== id));
            }}
            onLogout={() => { setIsAdmin(false); setView('home'); }}
          />
        )}
      </main>
    </div>
  );
}