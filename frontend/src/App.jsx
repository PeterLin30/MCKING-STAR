import React, { useState, useEffect } from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react'; 
import Swal from 'sweetalert2';
import { supabase } from './supabase'; 
import { Html5QrcodeScanner } from 'html5-qrcode';

const getLocalTodayDateString = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split('T')[0];
};

// Komponen Kamera QR Scanner
const QrReader = ({ onScanSuccess }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      supportedScanTypes: [0] // 0 = QR_CODE
    }, false);
    
    scanner.render(
      (decodedText) => {
        scanner.clear(); // Matikan kamera setelah berhasil scan
        onScanSuccess(decodedText);
      },
      (error) => { /* Abaikan error berulang saat mencari QR */ }
    );

    return () => {
      scanner.clear().catch(e => console.error("Gagal menutup kamera", e));
    };
  }, [onScanSuccess]);

  return <div id="reader" className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200"></div>;
};

function App() {
  const [courts, setCourts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isServerActive, setIsServerActive] = useState(true); 
  
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  
  const todayDateStr = getLocalTodayDateString();
  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [bookedSlots, setBookedSlots] = useState([]);

  const [currentView, setCurrentView] = useState("home"); 
  const [publicMatches, setPublicMatches] = useState([]);

  // Modals & Inputs
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [inputName, setInputName] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [inputPhone, setInputPhone] = useState(""); 

  const [showMyTickets, setShowMyTickets] = useState(false);
  const [myTickets, setMyTickets] = useState([]);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [revenueData, setRevenueData] = useState({ totalRevenue: 0, totalTransactions: 0, allTransactions: [], recentTransactions: [] });
  const [loyalCustomers, setLoyalCustomers] = useState([]); 

  const [bookingModal, setBookingModal] = useState({ show: false, time: "" });
  const [bookingFriends, setBookingFriends] = useState("");
  const [racketCount, setRacketCount] = useState(0);
  const [kokCount, setKokCount] = useState(0);
  
  const [isPublicMatch, setIsPublicMatch] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [joinPrice, setJoinPrice] = useState(""); 

  const [reviewModal, setReviewModal] = useState({ show: false, courtId: null });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const [tournaments, setTournaments] = useState([]);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [tInputName, setTInputName] = useState("");
  const [tInputDate, setTInputDate] = useState("");
  const [tInputFee, setTInputFee] = useState("");

  const [newCourtName, setNewCourtName] = useState("");
  const [newCourtPrice, setNewCourtPrice] = useState("");
  
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [myDebts, setMyDebts] = useState({ dihutangi: [], ngutang: [] });
  const [debtInput, setDebtInput] = useState({ debtor: "", amount: "" });

  const [chartFilter, setChartFilter] = useState("harian"); 
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [promoCode, setPromoCode] = useState(""); 
  
  const [scanInput, setScanInput] = useState("");
  const [showCamera, setShowCamera] = useState(false);

  const operationalHours = Array.from({ length: 15 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

  // ==========================================
  // 1. DATA FETCHING (SUPABASE)
  // ==========================================

  const fetchCourts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('courts').select('*');
    if (!error) setCourts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  useEffect(() => {
    if (selectedCourt) {
      const getBooked = async () => {
        const { data } = await supabase
          .from('bookings')
          .select('start_time')
          .eq('court_id', selectedCourt.id)
          .eq('booking_date', selectedDate);
        if (data) setBookedSlots(data.map(b => b.start_time.substring(0, 5)));
      };
      getBooked();
    }
  }, [selectedCourt, selectedDate]);

  useEffect(() => {
    if (currentView === "mabar") {
      const fetchMabar = async () => {
        const { data } = await supabase.from('bookings').select('*').eq('is_public', true);
        if (data) {
          const now = new Date();
          const activeMatches = data.filter(match => {
            const matchTime = new Date(`${match.booking_date}T${match.start_time}`);
            return matchTime > now;
          });
          setPublicMatches(activeMatches);
        }
      };
      fetchMabar();
    } else if (currentView === "tournament") {
      loadTournaments();
    }
  }, [currentView]);

  const loadTournaments = async () => {
    const { data } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
    if (data) setTournaments(data);
  };

  // ==========================================
  // 1B. REALTIME LISTENER (NOTIFIKASI TIKET SCAN)
  // ==========================================
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings' },
        (payload) => {
          if (payload.new.player_name === currentUser.name && payload.new.status === 'checked-in') {
            const court = courts.find(c => c.id === payload.new.court_id);
            Swal.fire({
              title: 'Selamat Bermain! 🏸',
              text: `Tiket terverifikasi. Silakan masuk ke ${court?.name || 'Lapangan'} untuk jam ${payload.new.start_time.substring(0,5)}`,
              icon: 'success',
              timer: 5000
            });
            loadMyTickets(); 
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, courts]);

  // ==========================================
  // 2. AUTH & USER ACTIONS (DENGAN AUTO-REGISTER & BONUS 100RB)
  // ==========================================

  const submitLogin = async (e) => {
    e.preventDefault(); 
    if (!inputName.trim() || !inputPassword.trim()) return Swal.fire("Oops!", "Lengkapi data!", "warning");

    // Cari apakah user sudah terdaftar
    const { data: users, error: searchError } = await supabase
      .from('users')
      .select('*')
      .eq('name', inputName);

    const existingUser = users && users.length > 0 ? users[0] : null;

    if (existingUser) {
      // User sudah ada, lakukan pencocokan password
      if (existingUser.password !== inputPassword) {
        return Swal.fire("Gagal Login!", "Password salah.", "error");
      }
      Swal.fire("Berhasil Masuk!", `Selamat datang kembali, ${existingUser.name} 👋`, "success");
      setCurrentUser(existingUser);
    } else {
      // User belum ada, lakukan AUTO-REGISTER
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ 
          name: inputName, 
          password: inputPassword, 
          role: 'user', 
          balance: 100000, // <--- BONUS AWAL RP 100.000
          xp: 0, 
          level: 'Bronze 🥉' 
        }])
        .select()
        .single();

      if (insertError) return Swal.fire("Gagal Daftar!", insertError.message, "error");

      Swal.fire("Akun Baru Dibuat! 🎉", `Selamat! Kamu dapat bonus saldo awal Rp 100.000. Selamat datang di MCKING-STAR, ${newUser.name}!`, "success");
      setCurrentUser(newUser);
    }

    setShowLoginForm(false); 
    setInputName(""); setInputPassword("");
  };

  const submitTopUp = async (e) => {
    e.preventDefault();
    const amount = Number(topUpAmount);
    if (!amount || amount <= 0) return Swal.fire("Oops!", "Nominal tidak valid!", "warning");

    let bonus = 0;
    // FITUR: Eksekusi Kode Promo
    if (promoCode.toUpperCase() === "MCKINGPRO") {
      bonus = 50000;
      Swal.fire("Voucher Berhasil! 🎉", "Kamu mendapat bonus saldo Rp 50.000!", "success");
    }

    const newBalance = (currentUser.balance || 0) + amount + bonus;
    const { error } = await supabase.from('users').update({ balance: newBalance }).eq('id', currentUser.id);

    if (!error) {
      if (bonus === 0) Swal.fire("Berhasil! 💸", "Saldo ditambahkan.", "success");
      setCurrentUser({ ...currentUser, balance: newBalance });
      setShowTopUpModal(false);
      setTopUpAmount(""); setPromoCode("");
    }
  };

  const sendWhatsAppReminder = (bookingData) => {
    const userPhone = currentUser.phone || "62"; 
    const message = `Halo ${currentUser.name}! 🏸%0A%0ABooking kamu di *MCKING-STAR* berhasil!%0A📅 Tanggal: ${bookingData.date}%0A⏰ Jam: ${bookingData.startTime}%0A🏟️ Lapangan: ${selectedCourt?.name || "Lapangan"}%0A%0A_Jangan telat ya, sampai jumpa di lapangan!_`;
    window.open(`https://wa.me/${userPhone}?text=${message}`, '_blank');
  };

  // ==========================================
  // 3. BOOKING LOGIC & MABAR
  // ==========================================

  const openBookingModal = (time) => {
    if (!currentUser) return setShowLoginForm(true);
    setBookingModal({ show: true, time });
    setBookingFriends(""); setRacketCount(0); setKokCount(0);
    setIsPublicMatch(false); setMaxPlayers(4); setJoinPrice(""); 
  };

  const submitBooking = async () => {
    let friendsArray = [];
    if (bookingFriends.trim() !== "") {
      const rawFriends = bookingFriends.split(',').map(n => n.trim()).filter(n => n !== "" && n.toLowerCase() !== currentUser.name.toLowerCase());
      friendsArray = [...new Set(rawFriends)]; 
      
      // Verifikasi nama teman dari database (Anti-Cheat)
      if (friendsArray.length > 0) {
        const { data: validUsers } = await supabase.from('users').select('name').in('name', friendsArray);
        if (!validUsers || validUsers.length !== friendsArray.length) {
          return Swal.fire("Teman Tidak Valid!", "Pastikan semua nama teman sudah terdaftar di sistem.", "error");
        }
      }
    }
    const splitMembers = [currentUser.name, ...friendsArray];
    
    const alatCost = (racketCount * 20000) + (kokCount * 5000);
    let courtPrice = selectedCourt.base_price;
    const jam = parseInt(bookingModal.time.split(':')[0]);
    if (jam >= 18 && jam <= 22) courtPrice += 20000; 

    const totalSemua = courtPrice + alatCost;
    const perOrang = totalSemua / splitMembers.length;
    const customJoinPrice = isPublicMatch && joinPrice !== "" ? Number(joinPrice) : perOrang;

    if (currentUser.balance < perOrang) return Swal.fire("Saldo Kurang!", "Silakan top up.", "error");

    const confirmResult = await Swal.fire({
      title: 'Lanjutkan Pembayaran?',
      html: `Total Biaya: <b>Rp ${totalSemua.toLocaleString('id-ID')}</b><br/>Patungan ${splitMembers.length} Orang: <b class="text-green-500">Rp ${perOrang.toLocaleString('id-ID')}/orang</b>`,
      icon: 'info', showCancelButton: true, confirmButtonText: 'Ya, Bayar Sekarang! 🏸', cancelButtonText: 'Batal'
    });

    if (!confirmResult.isConfirmed) return;

    const { error } = await supabase.from('bookings').insert([{
      court_id: selectedCourt.id,
      player_name: currentUser.name,
      booking_date: selectedDate,
      start_time: bookingModal.time,
      price: totalSemua,
      is_public: isPublicMatch,
      max_players: maxPlayers,
      split_members: splitMembers,
      join_price: customJoinPrice,
      status: 'booked',
      additional_items: { racket: racketCount, kok: kokCount }
    }]);

    if (!error) {
      const newBalance = currentUser.balance - perOrang;
      const newXP = (currentUser.xp || 0) + 10;
      await supabase.from('users').update({ balance: newBalance, xp: newXP }).eq('id', currentUser.id);

      if (friendsArray.length > 0) {
        const debtRecords = friendsArray.map(friend => ({
          debtor_name: friend, creditor_name: currentUser.name, amount: perOrang, is_paid: false
        }));
        await supabase.from('debts').insert(debtRecords);
      }

      Swal.fire("Booking Berhasil! 🎉", `Saldo terpotong Rp ${perOrang.toLocaleString('id-ID')}`, "success");
      sendWhatsAppReminder({ date: selectedDate, startTime: bookingModal.time });
      setCurrentUser({ ...currentUser, balance: newBalance, xp: newXP });
      setBookedSlots([...bookedSlots, bookingModal.time]);
      setBookingModal({ show: false, time: "" });
    } else {
      Swal.fire("Gagal Menyimpan Database!", error.message, "error");
      console.error(error);
    }
  };

  const joinMatch = async (matchId, patungan, ownerName) => {
    if (!currentUser) return setShowLoginForm(true);
    if (currentUser.balance < patungan) return Swal.fire("Saldo Kurang!", "", "error");

    const confirmResult = await Swal.fire({
      title: 'Konfirmasi Gabung Lobi',
      html: `Saldomu akan dipotong <b class="text-rose-500">Rp ${patungan.toLocaleString('id-ID')}</b>.<br/>Lanjut?`,
      icon: 'question', showCancelButton: true, confirmButtonText: 'Ya, Gabung Main 🔥'
    });

    if (confirmResult.isConfirmed) {
      const { data: match } = await supabase.from('bookings').select('*').eq('id', matchId).single();
      const updatedJoiners = [...(match.joined_players || []), currentUser.name];

      await supabase.from('bookings').update({ joined_players: updatedJoiners }).eq('id', matchId);
      const { data: owner } = await supabase.from('users').select('balance').eq('name', ownerName).single();
      await supabase.from('users').update({ balance: owner.balance + patungan }).eq('name', ownerName);
      
      const newBalance = currentUser.balance - patungan;
      await supabase.from('users').update({ balance: newBalance }).eq('id', currentUser.id);

      Swal.fire("Berhasil Gabung! 🤝", "Sampai jumpa di lapangan!", "success");
      setCurrentUser({ ...currentUser, balance: newBalance });
      setCurrentView("home");
    }
  };

  // ==========================================
  // 4. DEBT, TOURNAMENT, TICKETS, REVIEWS
  // ==========================================

  const loadMyTickets = async () => {
    if (!currentUser) return setShowLoginForm(true);
    const { data } = await supabase.from('bookings').select('*').or(`player_name.eq.${currentUser.name},joined_players.cs.{${currentUser.name}}`);
    if (data) {
      setMyTickets(data);
      setShowMyTickets(true);
    }
  };

  const openDebtModal = async () => {
    if (!currentUser) return setShowLoginForm(true);
    const { data: dihutangi } = await supabase.from('debts').select('*').eq('creditor_name', currentUser.name).eq('is_paid', false);
    const { data: ngutang } = await supabase.from('debts').select('*').eq('debtor_name', currentUser.name).eq('is_paid', false);
    setMyDebts({ dihutangi: dihutangi || [], ngutang: ngutang || [] });
    setShowDebtModal(true);
  };

  const payDebt = async (debtId, amount) => {
    if (currentUser.balance < amount) return Swal.fire("Saldo Kurang!", "", "warning");
    const { data: debt } = await supabase.from('debts').update({ is_paid: true }).eq('id', debtId).select().single();
    const { data: creditor } = await supabase.from('users').select('balance').eq('name', debt.creditor_name).single();
    await supabase.from('users').update({ balance: creditor.balance + amount }).eq('name', debt.creditor_name);
    const newBalance = currentUser.balance - amount;
    await supabase.from('users').update({ balance: newBalance }).eq('id', currentUser.id);
    setCurrentUser({ ...currentUser, balance: newBalance });
    openDebtModal();
    Swal.fire("Lunas! ✅", "Hutang dibayar via saldo.", "success");
  };

  const addManualDebt = async (e) => {
     e.preventDefault();
     if(!debtInput.debtor || !debtInput.amount) return;
     const { data: friend } = await supabase.from('users').select('*').eq('name', debtInput.debtor).single();
     if (!friend) return Swal.fire("Tidak Valid!", "Nama teman tidak terdaftar.", "error");
     const { error } = await supabase.from('debts').insert([{ creditor_name: currentUser.name, debtor_name: debtInput.debtor, amount: Number(debtInput.amount) }]);
     if (!error) {
        Swal.fire("Berhasil", "Hutang dicatat di buku!", "success");
        setDebtInput({ debtor: "", amount: "" });
        openDebtModal();
     }
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    if (!tInputName || !tInputDate || !tInputFee) return Swal.fire("Perhatian!", "Lengkapi data turnamen!", "warning");
    
    const { error } = await supabase.from('tournaments').insert([{ 
      title: tInputName, 
      date: tInputDate, 
      fee: Number(tInputFee), 
      participants: [] 
    }]);

    if (!error) {
      Swal.fire("Sahkan Turnamen! 🚀", "Turnamen resmi dibuka.", "success");
      setShowTournamentModal(false); setTInputName(""); setTInputDate(""); setTInputFee("");
      loadTournaments();
    } else {
      Swal.fire("Gagal Dibuat!", `Error: ${error.message}. Pastikan tabel tournaments memiliki kolom 'date' dan 'fee'`, "error");
      console.error(error);
    }
  };

  const handleJoinTournament = async (tId, fee) => {
    if (!currentUser) return setShowLoginForm(true);
    if (currentUser.balance < fee) return Swal.fire("Saldo Kurang!", "", "error");
    const { data: t } = await supabase.from('tournaments').select('*').eq('id', tId).single();
    const newParticipants = [...(t.participants || []), currentUser.name];
    await supabase.from('tournaments').update({ participants: newParticipants }).eq('id', tId);
    const newBalance = currentUser.balance - fee;
    await supabase.from('users').update({ balance: newBalance }).eq('id', currentUser.id);
    setCurrentUser({ ...currentUser, balance: newBalance });
    loadTournaments();
    Swal.fire("Berhasil Daftar!", "Siapkan raketmu!", "success");
  };

  const submitReview = () => {
    Swal.fire("Terima Kasih! 🌟", "Ulasan kamu telah kami simpan.", "success");
    setReviewModal({ show: false, courtId: null });
    setReviewComment("");
  };

  // ==========================================
  // 5. ADMIN ANALYTICS & COURT MANAGEMENT
  // ==========================================

  const loadAdminData = async () => {
    const { data: txs } = await supabase.from('bookings').select('*').order('booking_date', { ascending: false });
    const { data: users } = await supabase.from('users').select('*').order('balance', { ascending: false }).limit(5);

    const totalRev = txs.reduce((acc, curr) => acc + curr.price, 0);
    
    setRevenueData({
      totalRevenue: totalRev,
      totalTransactions: txs.length,
      allTransactions: txs, 
      recentTransactions: txs.slice(0, 10) // Hanya tampilkan 10 di tabel
    });
    setLoyalCustomers(users.map(u => ({ name: u.name, totalContribution: u.balance })));
    setShowAdminDashboard(true);
  };

  const handleAddCourt = async (e) => {
    e.preventDefault();
    await supabase.from('courts').insert([{ name: newCourtName, base_price: Number(newCourtPrice) }]);
    Swal.fire("Berhasil!", "Lapangan baru ditambahkan.", "success");
    setNewCourtName(""); setNewCourtPrice("");
    fetchCourts();
  };

  const handleDeleteCourt = async (id) => {
    const confirmResult = await Swal.fire({
      title: 'Hapus Lapangan?', text: "Data hilang permanen!", icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Hapus!'
    });
    if(confirmResult.isConfirmed) {
      await supabase.from('courts').delete().eq('id', id);
      Swal.fire("Terhapus!", "", "success");
      fetchCourts();
    }
  };

  const handleCheckIn = async (bookingId) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'checked-in' })
      .eq('id', bookingId);

    if (!error) {
      Swal.fire("Berhasil!", "Pemain telah diverifikasi masuk.", "success");
      loadAdminData(); 
    }
  };

  const handleCameraScan = async (decodedText) => {
    setShowCamera(false); 
    const { data: ticket, error } = await supabase.from('bookings').select('*').eq('id', decodedText.trim()).single();

    if (error || !ticket) return Swal.fire("Tiket Tidak Valid!", "QR Code tidak dikenali oleh sistem.", "error");
    if (ticket.status === 'checked-in') return Swal.fire("Sudah Digunakan!", "Tiket ini sudah pernah di-scan sebelumnya.", "warning");
    
    await handleCheckIn(ticket.id);
  };

  const calculateXPWidth = () => {
    const xp = currentUser?.xp || 0;
    return `${Math.min((xp % 100), 100)}%`; 
  };

  // LOGIKA CHART DINAMIS (Memproses transaksi Supabase sesuai filter dropdown)
  const processChartData = () => {
    if (!revenueData || !revenueData.allTransactions || !revenueData.allTransactions.length) return [];
    
    const isDaily = chartFilter === 'harian' || chartFilter === '1_bulan';
    const grouped = {};
    
    revenueData.allTransactions.forEach(tx => {
        if(!tx.booking_date) return;
        const key = isDaily ? tx.booking_date : tx.booking_date.substring(0, 7); // yyyy-mm
        const price = tx.price || 0;
        
        if (!grouped[key]) grouped[key] = 0;
        grouped[key] += price;
    });

    const sortedKeys = Object.keys(grouped).sort();
    let displayKeys = [];
    
    // Filter berdasarkan Dropdown
    if (chartFilter === 'harian') displayKeys = sortedKeys.slice(-7);
    else if (chartFilter === '1_bulan') displayKeys = sortedKeys.slice(-30);
    else if (chartFilter === '3_bulan') displayKeys = sortedKeys.slice(-3); // 3 Bulan terakhir
    else if (chartFilter === '6_bulan') displayKeys = sortedKeys.slice(-6); // 6 Bulan terakhir

    const maxRev = Math.max(...displayKeys.map(k => grouped[k]), 1);

    return displayKeys.map(key => {
        let label = key;
        if (isDaily) {
            label = key.substring(8); 
            if (chartFilter === 'harian') label = key.substring(5); 
        } else {
            const [yyyy, mm] = key.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
            label = `${monthNames[parseInt(mm)-1]} ${yyyy.substring(2)}`; 
        }

        return {
            label,
            revenue: grouped[key],
            profit: grouped[key] * 0.7, // Laba 70% dari harga
            height: `${(grouped[key] / maxRev) * 100}%`
        };
    });
  };

  // ==========================================
  // 6. UI RENDER 
  // ==========================================

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200 text-slate-800 font-sans pb-10 relative selection:bg-blue-300 selection:text-blue-900">
      
      {/* HEADER */}
      <header className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 text-white p-3 sm:p-4 shadow-xl sticky top-0 z-40 backdrop-blur-md bg-opacity-90 border-b border-white/10">
        <div className="w-full max-w-[98%] 2xl:max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer hover:scale-105 transition-transform shrink-0 group" onClick={() => { setSelectedCourt(null); setCurrentView("home"); }}>
             <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:rotate-12 transition-transform duration-300">
                <span className="text-xl sm:text-2xl drop-shadow-md">🏸</span>
             </div>
             <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter drop-shadow-md text-white">
                MCKING<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">-STAR</span>
             </h1>
          </div>
          
          {isServerActive && !isLoading && (
            <nav className="flex items-center flex-wrap justify-center gap-1.5 sm:gap-2 w-full lg:w-auto">
              <button onClick={() => { setSelectedCourt(null); setCurrentView("home"); }} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-black shadow-sm transition-all duration-300 cursor-pointer hover:-translate-y-0.5 ${currentView === 'home' ? 'bg-white text-blue-700 shadow-blue-500/50' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'}`}>🏟️ Lapangan</button>
              <button onClick={() => { setSelectedCourt(null); setCurrentView("mabar"); }} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-black shadow-sm transition-all duration-300 cursor-pointer hover:-translate-y-0.5 ${currentView === 'mabar' ? 'bg-white text-indigo-700 shadow-indigo-500/50' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'}`}>🤝 Mabar</button>
              <button onClick={() => { setSelectedCourt(null); setCurrentView("tournament"); }} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all duration-300 cursor-pointer hover:-translate-y-0.5 ${currentView === 'tournament' ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-orange-500/50 border-0' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'}`}>🏆 Turnamen</button>

              {currentUser ? (
                <>
                  <div className="text-center sm:text-right border-x sm:border-r-0 sm:border-l border-white/20 px-2 sm:px-4 mx-0.5 sm:mx-2 w-full sm:w-auto my-1.5 sm:my-0 pb-1.5 sm:pb-0 shrink-0">
                    <p className="text-[11px] sm:text-xs font-black text-white drop-shadow-sm mb-0.5 sm:mb-1">Halo, {currentUser.name} 👋</p>
                    <div className="flex justify-center sm:justify-end items-center gap-1.5 sm:gap-2 mb-0.5">
                       <p className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-white/80"><span className="text-yellow-300 drop-shadow-sm">{currentUser.level || "Bronze 🥉"}</span></p>
                       <div className="w-12 sm:w-16 h-1 sm:h-1.5 bg-black/20 rounded-full overflow-hidden shadow-inner border border-white/10">
                          <div className="bg-gradient-to-r from-yellow-300 to-yellow-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(253,224,71,0.8)]" style={{ width: calculateXPWidth() }}></div>
                       </div>
                    </div>
                    <p className="font-black text-green-300 drop-shadow-md tracking-tight text-xs sm:text-sm">Rp {currentUser.balance.toLocaleString('id-ID')}</p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center shrink-0">
                    <button onClick={openDebtModal} className="bg-pink-600 hover:bg-pink-500 text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:-translate-y-0.5 cursor-pointer">📓 Hutang</button>
                    <button onClick={loadMyTickets} className="bg-gradient-to-r from-yellow-400 to-amber-400 text-amber-900 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-black shadow-md hover:-translate-y-0.5 cursor-pointer">🎫 Tiket</button>
                    {currentUser?.role === "admin" && (
                      <button onClick={loadAdminData} className="bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:-translate-y-0.5 cursor-pointer">📊 Admin</button>
                    )}
                    <button onClick={() => setShowTopUpModal(true)} className="bg-emerald-500 hover:bg-emerald-400 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:-translate-y-0.5 cursor-pointer">Top Up</button>
                    <button onClick={() => setCurrentUser(null)} className="bg-red-500/80 hover:bg-red-500 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:-translate-y-0.5 cursor-pointer backdrop-blur-sm border border-red-400">Keluar</button>
                  </div>
                </>
              ) : (
                <button onClick={() => setShowLoginForm(true)} className="bg-white text-blue-700 px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer ml-1 sm:ml-2 text-xs sm:text-sm">Sign In</button>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 mt-4">
        
        {/* VIEW: HOME (LAPANGAN) */}
        {currentView === "home" && (
          isLoading ? (
             <div className="flex flex-col items-center justify-center py-32 opacity-70">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <div className="font-bold text-slate-500 tracking-widest animate-pulse">MEMUAT STADIUM...</div>
             </div>
          ) : !selectedCourt ? (
            <>
              <div className="text-center mb-16 relative">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-bold text-xs uppercase tracking-widest mb-6 shadow-sm">
                    <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span></span>
                    Tersedia Hari Ini
                 </div>
                 <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 mb-4 drop-shadow-sm pb-2 leading-tight">
                    Pilih Lapangan <br className="hidden md:block" />
                    <span className="relative inline-block mt-2 md:mt-0 text-slate-800">Favoritmu 🏸
                       <svg className="absolute w-full h-3 sm:h-4 -bottom-1 sm:-bottom-2 left-0 text-amber-400 drop-shadow-sm" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" strokeLinecap="round"/></svg>
                    </span>
                 </h2>
                 <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto mt-6">Fasilitas premium standar BWF dan pencahayaan optimal. Booking sekarang sebelum keduluan tim lain!</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {courts.map((court) => (
                  <div key={court.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-black text-slate-800 group-hover:text-blue-700 transition-colors">{court.name}</h3>
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl shadow-sm">
                        <span className="text-amber-500 text-sm drop-shadow-sm">⭐</span><span className="text-sm font-black text-amber-700">5.0</span>
                      </div>
                    </div>
                    <div className="mb-6">
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Harga Mulai</p>
                       <p className="text-3xl font-black text-blue-600">Rp {court.base_price?.toLocaleString('id-ID')}<span className="text-sm text-slate-400 font-normal">/jam</span></p>
                    </div>
                    <button onClick={() => setSelectedCourt(court)} className="w-full bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-200 py-3 rounded-xl font-bold text-lg transition-all duration-300 cursor-pointer group-hover:shadow-lg group-hover:shadow-blue-500/30">Cek Jadwal →</button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
              
              <button onClick={() => setSelectedCourt(null)} className="text-slate-400 hover:text-blue-600 font-bold mb-6 flex items-center gap-2 cursor-pointer transition-colors bg-slate-50 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm">
                <span>←</span> Kembali ke Daftar
              </button>
              
              <div className="flex flex-col md:flex-row justify-between md:items-end mb-10 border-b border-slate-100 pb-6">
                <div>
                   <p className="text-sm font-bold text-blue-500 tracking-widest uppercase mb-1">Pemesanan Jadwal</p>
                   <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">{selectedCourt.name}</h2>
                </div>
                <div className="mt-4 md:mt-0 bg-slate-50 p-2 rounded-2xl border border-slate-200 flex items-center shadow-inner">
                   <span className="px-3 text-slate-400">📅</span>
                   <input type="date" value={selectedDate} min={todayDateStr} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer"/>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
                {operationalHours.map((time) => {
                  const isBooked = bookedSlots.includes(time);
                  const slotDateTime = new Date(`${selectedDate}T${time}:00`);
                  if (slotDateTime < new Date()) return null; 

                  return (
                    <button 
                       key={time} 
                       disabled={isBooked} 
                       onClick={() => openBookingModal(time)} 
                       className={`py-5 rounded-2xl font-black text-xl border-2 transition-all duration-300 relative overflow-hidden ${isBooked ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed' : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 cursor-pointer focus:ring-4 focus:ring-blue-200 focus:outline-none'}`}
                    >
                      {time}
                      <div className={`text-xs font-bold mt-1 uppercase tracking-widest ${isBooked ? 'text-slate-400' : 'text-blue-400'}`}>{isBooked ? 'Terisi' : 'Tersedia'}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* VIEW: MABAR */}
        {currentView === "mabar" && (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100">
            <div className="text-center mb-16 relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl -z-10 pointer-events-none"></div>
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-6 shadow-sm">
                  <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span></span>
                  Terbuka untuk Umum
               </div>
               <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-4 drop-shadow-sm pb-2 leading-tight">
                  Lobi Mabar <br className="hidden md:block" />
                  <span className="relative inline-block mt-2 md:mt-0 text-slate-800">Komunitas 🤝<svg className="absolute w-full h-3 sm:h-4 -bottom-1 sm:-bottom-2 left-0 text-purple-400 drop-shadow-sm" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" strokeLinecap="round"/></svg></span>
               </h2>
               <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto mt-6">Cari teman main, patungan, dan tambah relasi di lapangan.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {publicMatches.length > 0 ? publicMatches.map((match) => {
                const courtName = courts.find(c => c.id === match.court_id)?.name || "Lapangan";
                const totalCurrent = (match.split_members ? match.split_members.length : 1) + (match.joined_players ? match.joined_players.length : 0);
                const isFull = totalCurrent >= match.max_players;
                const hargaJoin = match.join_price || 0;
                const isJoined = currentUser && (match.player_name === currentUser.name || (match.split_members && match.split_members.includes(currentUser.name)) || (match.joined_players && match.joined_players.includes(currentUser.name)));

                return (
                  <div key={match.id} className="bg-gradient-to-br from-white to-indigo-50/50 border border-indigo-100 rounded-3xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-bl-2xl font-black text-sm shadow-md">
                      {totalCurrent} / {match.max_players} Pemain
                    </div>
                    <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2 bg-indigo-100 inline-block px-3 py-1 rounded-lg">{courtName}</p>
                    <h3 className="text-3xl font-black text-slate-800 mb-1">{match.start_time?.substring(0,5)}</h3>
                    <p className="text-sm font-bold text-slate-500 mb-6">📅 {match.booking_date}</p>
                    
                    <div className="mb-6 bg-white/60 p-4 rounded-2xl border border-indigo-50">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Lineup Pemain</p>
                      <div className="flex flex-wrap gap-2">
                        {match.split_members?.map(m => <span key={m} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold shadow-sm">{m} 👑</span>)}
                        {match.joined_players?.map(m => <span key={m} className="bg-white border border-indigo-200 text-indigo-700 text-xs px-3 py-1.5 rounded-xl font-bold shadow-sm">{m}</span>)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Biaya Patungan</p>
                        <p className="text-2xl font-black text-green-500">Rp {hargaJoin.toLocaleString('id-ID')}</p>
                      </div>
                      {isJoined ? <button disabled className="bg-slate-200 text-slate-500 px-6 py-3 rounded-xl font-black cursor-not-allowed">Terdaftar</button> : isFull ? <button disabled className="bg-red-100 text-red-500 px-6 py-3 rounded-xl font-black cursor-not-allowed">Penuh</button> : <button onClick={() => joinMatch(match.id, hargaJoin, match.player_name)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black shadow-lg hover:shadow-indigo-500/40 transition-all duration-300 transform active:scale-95 cursor-pointer">Gabung Main 🔥</button>}
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center py-24 bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-3xl">
                  <span className="text-6xl mb-4 opacity-50">😴</span>
                  <p className="text-indigo-900 font-black text-xl mb-2">Belum ada Lobi Mabar</p>
                  <p className="text-sm text-indigo-600/70 font-medium">Jadilah inisiator! Booking lapangan dan centang "Buka Lobi Mabar".</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: TOURNAMENT */}
        {currentView === "tournament" && (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100">
             <div className="flex flex-col items-center text-center mb-16 border-b border-orange-100 pb-10 relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-400/20 rounded-full blur-3xl -z-10 pointer-events-none"></div>
               <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 font-bold text-xs uppercase tracking-widest mb-6 shadow-sm">
                    <span className="text-lg leading-none">🔥</span> Kompetisi Memanas
                 </div>
                 <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 mb-4 drop-shadow-sm pb-2 leading-tight">
                    Turnamen <br className="hidden md:block" />
                    <span className="relative inline-block mt-2 md:mt-0 text-slate-800">Lokal 🏆<svg className="absolute w-full h-3 sm:h-4 -bottom-1 sm:-bottom-2 left-0 text-amber-400 drop-shadow-sm" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" strokeLinecap="round"/></svg></span>
                 </h2>
                 <p className="text-slate-500 font-medium text-lg mt-4 mb-8">Uji kemampuanmu, menangkan hadiah, dan buktikan siapa penguasa lapangan sebenarnya!</p>
                 
                 {(currentUser?.role === "admin" || tournaments.length < 2) && (
                   <button onClick={() => { if(!currentUser) return setShowLoginForm(true); setShowTournamentModal(true); }} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_10px_25px_rgba(245,158,11,0.5)] shadow-md cursor-pointer flex items-center gap-2 justify-center">
                      <span className="text-2xl">+</span> Buat Turnamen
                   </button>
                 )}
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {(currentUser?.role === "admin" ? tournaments : [
                  ...tournaments.filter(t => new Date(`${t.date}T23:59:59`) >= new Date()),
                  ...tournaments.filter(t => new Date(`${t.date}T23:59:59`) < new Date()).slice(0, 2)
                ]).map(t => {
                  const isPast = new Date(`${t.date}T23:59:59`) < new Date();
                  const isJoined = currentUser && t.participants?.includes(currentUser.name);
                  const isFull = t.participants?.length >= (t.max_slots || 8);
                  return (
                    <div key={t.id} className={`bg-gradient-to-b from-white ${isPast ? 'to-slate-50/50 border-slate-200 opacity-80' : 'to-orange-50/30 border-orange-100'} p-6 md:p-8 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 group border`}>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white shadow-sm mb-3 inline-block ${isPast ? 'bg-slate-400' : 'bg-orange-500'}`}>{t.participants?.length || 0}/8 Terdaftar</span>
                          <h3 className="text-3xl font-black text-slate-800 leading-tight group-hover:text-orange-600 transition-colors">{t.title}</h3>
                          <p className={`${isPast ? 'text-slate-400' : 'text-orange-600'} font-bold text-sm mt-2 flex items-center gap-1`}>📅 {t.date}</p>
                        </div>
                      </div>
                      
                      <div className={`bg-white border rounded-2xl p-5 mb-6 shadow-inner ${isPast ? 'border-slate-100' : 'border-orange-100'}`}>
                        <p className={`text-[10px] font-black uppercase mb-4 tracking-widest text-center border-b pb-2 ${isPast ? 'text-slate-400 border-slate-50' : 'text-orange-400 border-orange-50'}`}>Bagan Perempat Final</p>
                        <div className="flex justify-between items-center gap-3">
                           <div className="flex flex-col gap-3 w-full">
                              <div className="bg-slate-50 border border-slate-100 text-xs p-2 rounded-xl flex justify-between font-bold"><span>{t.participants[0] || 'TBA'}</span> <span className={`${isPast ? 'text-slate-300' : 'text-orange-400'} opacity-50`}>vs</span> <span>{t.participants[1] || 'TBA'}</span></div>
                              <div className="bg-slate-50 border border-slate-100 text-xs p-2 rounded-xl flex justify-between font-bold"><span>{t.participants[2] || 'TBA'}</span> <span className={`${isPast ? 'text-slate-300' : 'text-orange-400'} opacity-50`}>vs</span> <span>{t.participants[3] || 'TBA'}</span></div>
                           </div>
                           <div className={`${isPast ? 'text-slate-200' : 'text-orange-200'} font-black text-2xl drop-shadow-sm`}>⚔️</div>
                           <div className="flex flex-col gap-3 w-full">
                              <div className="bg-slate-50 border border-slate-100 text-xs p-2 rounded-xl flex justify-between font-bold"><span>{t.participants[4] || 'TBA'}</span> <span className={`${isPast ? 'text-slate-300' : 'text-orange-400'} opacity-50`}>vs</span> <span>{t.participants[5] || 'TBA'}</span></div>
                              <div className="bg-slate-50 border border-slate-100 text-xs p-2 rounded-xl flex justify-between font-bold"><span>{t.participants[6] || 'TBA'}</span> <span className={`${isPast ? 'text-slate-300' : 'text-orange-400'} opacity-50`}>vs</span> <span>{t.participants[7] || 'TBA'}</span></div>
                           </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-end pt-2">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Biaya Pendaftaran</p>
                          <p className={`font-black text-3xl drop-shadow-sm ${isPast ? 'text-slate-400' : 'text-green-500'}`}>Rp {(t.fee || 0).toLocaleString('id-ID')}</p>
                        </div>
                        {isPast ? <button disabled className="bg-slate-200 text-slate-400 px-6 py-3 rounded-xl font-black">Selesai</button> : isJoined ? <button disabled className="bg-green-100 text-green-600 border border-green-200 px-6 py-3 rounded-xl font-black">Terdaftar</button> : isFull ? <button disabled className="bg-slate-800 text-white px-6 py-3 rounded-xl font-black">Penuh</button> : <button onClick={() => handleJoinTournament(t.id, t.fee)} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-black shadow-lg hover:shadow-orange-500/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer">Daftar Sekarang</button>}
                      </div>
                    </div>
                  );
                })}
                
                {(currentUser?.role === "admin" ? tournaments : [
                  ...tournaments.filter(t => new Date(`${t.date}T23:59:59`) >= new Date()),
                  ...tournaments.filter(t => new Date(`${t.date}T23:59:59`) < new Date()).slice(0, 2)
                ]).length === 0 && (
                   <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center py-24 bg-orange-50/50 border-2 border-dashed border-orange-200 rounded-3xl">
                     <span className="text-6xl mb-4 opacity-50">🏟️</span>
                     <p className="text-orange-900 font-black text-xl mb-2">Panggung Masih Kosong</p>
                     <p className="text-sm text-orange-600/70 font-medium">Buat turnamen pertamamu dan undang pemain lokal!</p>
                   </div>
                )}
             </div>
          </div>
        )}
      </main>

      {/* MODAL TOP UP CUSTOM DENGAN KODE PROMO */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Top Up Saldo 💸</h2>
              <button onClick={() => setShowTopUpModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer text-xl">✕</button>
            </div>
            
            <p className="text-sm text-slate-500 font-medium mb-6">Masukkan nominal untuk mengisi dompet digitalmu.</p>
            
            <form onSubmit={submitTopUp} className="space-y-4">
              <div>
                 <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Nominal (Rp)</label>
                 <input type="number" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} placeholder="Misal: 50000" className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-200 transition-all placeholder-slate-300" required autoFocus/>
              </div>
              <div>
                 <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Kode Promo / Voucher</label>
                 <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Opsional" className="w-full bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl font-bold text-emerald-700 outline-none focus:ring-4 focus:ring-emerald-200 transition-all placeholder-emerald-300 uppercase"/>
              </div>
              <div className="pt-4 space-y-3">
                 <button type="submit" className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl cursor-pointer shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all text-lg">Isi Saldo Sekarang</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* MODAL BUKU HUTANG */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100 transform transition-all">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-500 pb-2 leading-tight">📓 Buku Hutang</h2>
              <button onClick={() => setShowDebtModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full w-10 h-10 flex items-center justify-center font-bold cursor-pointer transition-colors">✕</button>
            </div>

            <div className="mb-8 bg-gradient-to-r from-pink-50 to-rose-50 p-6 rounded-2xl border border-pink-100 shadow-inner">
               <h3 className="font-black text-pink-800 mb-3 text-sm uppercase tracking-widest">Catat Hutang Manual</h3>
               <form onSubmit={addManualDebt} className="flex flex-col sm:flex-row gap-3">
                  <input type="text" value={debtInput.debtor} onChange={e => setDebtInput({...debtInput, debtor: e.target.value})} placeholder="Nama Teman" className="bg-white border-none rounded-xl p-3 flex-1 font-bold text-slate-700 shadow-sm outline-none focus:ring-4 focus:ring-pink-200" required/>
                  <input type="number" value={debtInput.amount} onChange={e => setDebtInput({...debtInput, amount: e.target.value})} placeholder="Nominal (Rp)" className="bg-white border-none rounded-xl p-3 w-full sm:w-36 font-bold text-slate-700 shadow-sm outline-none focus:ring-4 focus:ring-pink-200" required/>
                  <button type="submit" className="bg-pink-600 hover:bg-pink-500 text-white px-6 py-3 rounded-xl font-black shadow-md cursor-pointer transition-all hover:-translate-y-0.5">Catat!</button>
               </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h3 className="font-black text-emerald-600 mb-4 uppercase tracking-widest text-xs flex items-center gap-2"><span className="bg-emerald-100 p-1.5 rounded-lg">🤑</span> Uangmu di Luar</h3>
                  <div className="space-y-3">
                    {myDebts.dihutangi.length > 0 ? myDebts.dihutangi.map(d => (
                       <div key={d.id} className="bg-white p-4 rounded-xl border border-emerald-50 shadow-sm flex justify-between items-center">
                          <div>
                            <p className="font-black text-slate-800">{d.debtor_name}</p>
                          </div>
                          <p className="text-emerald-500 font-black">Rp {d.amount.toLocaleString('id-ID')}</p>
                       </div>
                    )) : <div className="text-center py-8"><p className="text-sm text-slate-400 font-bold bg-slate-100 inline-block px-4 py-2 rounded-xl">Semua teman sudah bayar 👍</p></div>}
                  </div>
               </div>
               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h3 className="font-black text-rose-600 mb-4 uppercase tracking-widest text-xs flex items-center gap-2"><span className="bg-rose-100 p-1.5 rounded-lg">💸</span> Hutangmu</h3>
                  <div className="space-y-3">
                    {myDebts.ngutang.length > 0 ? myDebts.ngutang.map(d => (
                       <div key={d.id} className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <p className="font-black text-slate-800 text-sm">Ke: {d.creditor_name}</p>
                            <p className="text-rose-500 font-black bg-rose-50 px-2 py-1 rounded-lg text-xs">Rp {d.amount.toLocaleString('id-ID')}</p>
                          </div>
                          <button onClick={() => payDebt(d.id, d.amount)} className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-all cursor-pointer">Bayar via Saldo</button>
                       </div>
                    )) : <div className="text-center py-8"><p className="text-sm text-slate-400 font-bold bg-slate-100 inline-block px-4 py-2 rounded-xl">Kamu bebas hutang! 🎉</p></div>}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BIKIN TURNAMEN */}
      {showTournamentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-orange-100">
            <h2 className="text-3xl font-black mb-6 text-orange-500 text-center">Buat Turnamen</h2>
            <form onSubmit={handleCreateTournament} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Nama Kompetisi</label>
                <input type="text" value={tInputName} onChange={(e) => setTInputName(e.target.value)} placeholder="MCKING CUP 2026" className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-orange-200" required/>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Tanggal</label>
                <input type="date" value={tInputDate} min={todayDateStr} onChange={(e) => setTInputDate(e.target.value)} className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-orange-200" required/>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Tiket Masuk (Rp)</label>
                <input type="number" value={tInputFee} onChange={(e) => setTInputFee(e.target.value)} placeholder="50000" className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-orange-200" required/>
              </div>
              <div className="pt-4">
                 <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black py-4 rounded-2xl mb-3 cursor-pointer shadow-lg hover:shadow-orange-500/40 hover:-translate-y-1 transition-all">Sahkan Turnamen 🚀</button>
                 <button type="button" onClick={() => setShowTournamentModal(false)} className="w-full bg-white border-2 border-slate-100 text-slate-500 hover:bg-slate-50 font-bold py-4 rounded-2xl cursor-pointer transition-colors">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BOOKING CUSTOM */}
      {bookingModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-blue-100 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="flex justify-between items-end mb-8 border-b border-slate-100 pb-6">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tiket Masuk</p>
                 <h2 className="text-3xl font-black text-slate-800">Selesaikan Pesanan</h2>
              </div>
              <span className="bg-blue-100 text-blue-700 font-black px-4 py-2 rounded-xl text-lg shadow-sm border border-blue-200">⏳ {bookingModal.time}</span>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Bawa Pasukan? (Split Bill)</label>
              <input type="text" value={bookingFriends} onChange={(e) => setBookingFriends(e.target.value)} placeholder="Tulis nama teman dipisah koma (Misal: Budi, Andi)" className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-200" />
              <p className="text-[10px] font-bold text-blue-400 mt-2 ml-2 flex items-center gap-1">ℹ️ Biaya akan dibagi rata. Hutang dicatat otomatis di Buku Hutang.</p>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 p-6 rounded-3xl mb-6 shadow-sm">
              <h3 className="font-black text-sm mb-4 uppercase tracking-widest text-slate-800">🛒 Kantin & Sewa Alat</h3>
              <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-2xl border border-slate-50 shadow-sm">
                <div><p className="font-black text-slate-700">Raket Pro</p><p className="text-[10px] font-bold text-slate-400">Rp 20.000 / pcs</p></div>
                <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-xl">
                  <button onClick={() => setRacketCount(Math.max(0, racketCount - 1))} className="w-8 h-8 bg-white rounded-lg font-black text-slate-400 hover:text-slate-700 shadow-sm transition-colors">-</button>
                  <span className="font-black w-4 text-center text-lg">{racketCount}</span>
                  <button onClick={() => setRacketCount(racketCount + 1)} className="w-8 h-8 bg-white rounded-lg font-black text-blue-600 shadow-sm transition-colors">+</button>
                </div>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-50 shadow-sm">
                <div><p className="font-black text-slate-700">Shuttlecock</p><p className="text-[10px] font-bold text-slate-400">Rp 5.000 / slop</p></div>
                <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-xl">
                  <button onClick={() => setKokCount(Math.max(0, kokCount - 1))} className="w-8 h-8 bg-white rounded-lg font-black text-slate-400 hover:text-slate-700 shadow-sm transition-colors">-</button>
                  <span className="font-black w-4 text-center text-lg">{kokCount}</span>
                  <button onClick={() => setKokCount(kokCount + 1)} className="w-8 h-8 bg-white rounded-lg font-black text-blue-600 shadow-sm transition-colors">+</button>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-3xl mb-8 border transition-all duration-500 ${isPublicMatch ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400 shadow-lg shadow-indigo-500/30' : 'bg-slate-50 border-slate-200'}`}>
              <label className="flex items-center gap-4 cursor-pointer mb-2">
                <div className="relative">
                   <input type="checkbox" checked={isPublicMatch} onChange={(e) => setIsPublicMatch(e.target.checked)} className="sr-only" />
                   <div className={`block w-14 h-8 rounded-full transition-colors ${isPublicMatch ? 'bg-white/30' : 'bg-slate-300'}`}></div>
                   <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isPublicMatch ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <div>
                   <p className={`font-black text-lg ${isPublicMatch ? 'text-white' : 'text-slate-700'}`}>Buka Lobi Mabar</p>
                   <p className={`text-[10px] font-bold leading-tight mt-0.5 ${isPublicMatch ? 'text-indigo-100' : 'text-slate-400'}`}>Undang pemain asing gabung ke jadwalmu.</p>
                </div>
              </label>
              
              {isPublicMatch && (
                <div className="mt-5 space-y-3 animate-in slide-in-from-top-2">
                  <div className="flex justify-between items-center bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-50">Maks. Pemain:</span>
                    <select value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))} className="bg-white text-indigo-900 rounded-xl px-4 py-2 text-sm font-black outline-none cursor-pointer shadow-inner border-none">
                      <option value="4">4 Orang</option>
                      <option value="6">6 Orang</option>
                      <option value="8">8 Orang</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-50">Harga Join (Rp):</span>
                    <input type="number" value={joinPrice} onChange={(e) => setJoinPrice(e.target.value)} placeholder="Auto Hitung" className="bg-white text-indigo-900 rounded-xl px-4 py-2 text-sm font-black outline-none w-32 text-right shadow-inner border-none placeholder-indigo-300" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
               <button onClick={() => setBookingModal({ show: false, time: "" })} className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black py-4 rounded-2xl transition-colors cursor-pointer">Batal</button>
               <button onClick={submitBooking} className="w-2/3 bg-green-500 text-white font-black py-4 rounded-2xl cursor-pointer transition-all hover:bg-green-400 hover:shadow-lg hover:shadow-green-500/40 hover:-translate-y-1 text-lg">Bayar & Main 🏸</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOGIN */}
      {showLoginForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
            
            <h2 className="text-4xl font-black mb-2 text-slate-800 tracking-tight">Selamat<br/>Datang! 👋</h2>
            <p className="text-sm text-slate-400 font-medium mb-8">Masuk untuk mulai mendominasi lapangan.</p>
            
            <form onSubmit={submitLogin} className="space-y-4">
              <div>
                 <input type="text" value={inputName} onChange={(e) => setInputName(e.target.value)} placeholder="Nama Panggungmu" className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-200 transition-all placeholder-slate-300" required/>
              </div>
              <div>
                 <input type="password" value={inputPassword} onChange={(e) => setInputPassword(e.target.value)} placeholder="Kata Sandi Rahasia" className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-200 transition-all placeholder-slate-300" required/>
              </div>
              <div className="pt-4 space-y-3">
                 <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl cursor-pointer shadow-lg hover:shadow-blue-500/40 hover:-translate-y-1 transition-all text-lg">Masuk Arena</button>
                 <button type="button" onClick={() => setShowLoginForm(false)} className="w-full bg-transparent text-slate-400 hover:text-slate-600 font-bold py-3 rounded-2xl cursor-pointer transition-colors">Nanti Saja</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TIKET SAYA */}
      {showMyTickets && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-slate-100 rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6 flex justify-between items-center text-white shadow-md z-10 relative">
              <h2 className="text-3xl font-black drop-shadow-sm">🎫 Koper Tiketku</h2>
              <button onClick={() => setShowMyTickets(false)} className="bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center font-black cursor-pointer transition-colors backdrop-blur-sm">✕</button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto text-center bg-slate-100">
              {myTickets.length === 0 ? (
                 <div className="py-20 flex flex-col items-center">
                    <span className="text-6xl mb-4 opacity-50 grayscale">🎫</span>
                    <p className="text-slate-500 font-black text-xl">Kopermu Masih Kosong</p>
                    <p className="text-sm text-slate-400 mt-2">Ayo booking lapangan pertamamu!</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myTickets.map(ticket => (
                    <div key={ticket.id} className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-shadow flex flex-col items-center relative overflow-hidden group">
                      <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-100 rounded-full shadow-inner border-r border-slate-200"></div>
                      <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-100 rounded-full shadow-inner border-l border-slate-200"></div>
                      
                      <div className="absolute top-0 w-full h-2 bg-amber-400"></div>

                      <div className="p-6 w-full flex flex-col items-center">
                         <div className="absolute top-4 left-4">
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-3 py-1 rounded-lg font-black uppercase shadow-sm border border-amber-200">{currentUser.level || "Bronze"}</span>
                         </div>

                         {/* PERUBAHAN STATUS SCAN QR CODE */}
                         <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-5 mt-6 shadow-inner transition-transform group-hover:scale-105 flex justify-center items-center h-36 w-36 mx-auto">
                            {ticket.status === 'checked-in' ? (
                               <div className="text-center">
                                  <div className="text-4xl mb-2">✅</div>
                                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Terverifikasi</p>
                               </div>
                            ) : (
                               ticket.id && <QRCode value={String(ticket.id)} size={110} fgColor="#0f172a" />
                            )}
                         </div>
                         
                         <div className="w-full border-t-2 border-dashed border-slate-200 my-2"></div>
                         
                         <div className="w-full text-center mt-4">
                            <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest mb-1">{ticket.booking_date}</h3>
                            <p className="text-slate-800 font-black text-4xl mb-4">{ticket.start_time?.substring(0,5)}</p>
                            
                            {ticket.additional_items && (ticket.additional_items.racket > 0 || ticket.additional_items.kok > 0) && (
                               <div className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-100 inline-block mb-4 shadow-sm">
                                 🎒 {ticket.additional_items.racket} Raket & {ticket.additional_items.kok} Kok
                               </div>
                            )}

                            <button onClick={() => { setShowMyTickets(false); setReviewModal({ show: true, courtId: ticket.court_id }); }} className="w-full bg-slate-800 text-white text-xs px-4 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-slate-700 hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">Beri Ulasan ⭐</button>
                         </div>
                      </div>
                      <div className="bg-slate-50 w-full p-2 text-center border-t border-slate-100">
                         <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">TICKET-ID: {String(ticket.id).slice(0,8)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ULASAN / RATING */}
      {reviewModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in-95">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm text-center border border-slate-100">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-3xl font-black mb-2 text-slate-800">Beri Nilai</h2>
            <p className="text-sm font-bold text-slate-400 mb-8">Bantu kami meningkatkan kualitas lapangan.</p>
            
            <div className="flex justify-center gap-3 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 inline-flex mx-auto">
              {[1, 2, 3, 4, 5].map((star) => (
                 <button 
                   key={star} 
                   onClick={() => setReviewRating(star)} 
                   className={`text-4xl transition-all cursor-pointer hover:scale-125 hover:rotate-12 ${reviewRating >= star ? 'text-amber-400 drop-shadow-md' : 'text-slate-200 grayscale'}`}
                 >★</button>
              ))}
            </div>
            
            <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Tulis masukan, kritik, atau pujian di sini..." className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-200 mb-6 h-32 resize-none placeholder-slate-300" />
            
            <div className="space-y-3">
               <button onClick={submitReview} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-blue-500/40 hover:-translate-y-1 transition-all cursor-pointer text-lg">Kirim Ulasan 🚀</button>
               <button onClick={() => setReviewModal({ show: false, courtId: null })} className="w-full bg-transparent text-slate-400 hover:text-slate-600 font-bold py-3 rounded-2xl cursor-pointer transition-colors">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADMIN DASHBOARD */}
      {showAdminDashboard && revenueData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-slate-50 rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 flex justify-between items-center text-white shadow-lg z-10">
              <div>
                 <h2 className="text-3xl font-black tracking-tight">💼 Ruang Komando</h2>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Sistem Laporan & Manajemen</p>
              </div>
              <button onClick={() => setShowAdminDashboard(false)} className="bg-white/10 hover:bg-red-500 rounded-full w-10 h-10 flex items-center justify-center font-bold cursor-pointer transition-colors border border-white/20 text-xl">✕</button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto">
              
              {/* FITUR MANAJEMEN LAPANGAN */}
              <div className="mb-10 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                 <div className="flex items-center gap-3 mb-6">
                    <span className="p-3 bg-purple-100 text-purple-600 rounded-xl text-xl">🏟️</span>
                    <h3 className="font-black text-2xl text-slate-800 tracking-tight">Manajemen Lapangan</h3>
                 </div>
                 
                 <form onSubmit={handleAddCourt} className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <input type="text" value={newCourtName} onChange={(e)=>setNewCourtName(e.target.value)} placeholder="Nama Lapangan Baru (Cth: VIP 1)" className="bg-white border-none rounded-xl p-3.5 flex-1 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-200 shadow-sm" required/>
                    <input type="number" value={newCourtPrice} onChange={(e)=>setNewCourtPrice(e.target.value)} placeholder="Harga (Rp)" className="bg-white border-none rounded-xl p-3.5 w-full sm:w-40 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-200 shadow-sm" required/>
                    <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-8 rounded-xl font-black shadow-md cursor-pointer transition-all hover:-translate-y-0.5 uppercase tracking-widest text-xs py-4 sm:py-0">Tambah</button>
                 </form>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courts.map(c => (
                       <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-purple-200 transition-colors">
                          <div>
                             <p className="font-black text-slate-800">{c.name}</p>
                             <p className="text-xs font-bold text-purple-600 bg-purple-50 inline-block px-2 py-0.5 rounded-md mt-1">Rp {c.base_price?.toLocaleString('id-ID')}/jam</p>
                          </div>
                          <button onClick={() => handleDeleteCourt(c.id)} className="text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 w-10 h-10 flex items-center justify-center rounded-xl transition-colors cursor-pointer border border-slate-100 hover:border-red-200" title="Hapus Lapangan">🗑️</button>
                       </div>
                    ))}
                 </div>
              </div>

              {/* FITUR GRAFIK PENDAPATAN OTOMATIS */}
              <div className="mb-10 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <span className="p-3 bg-blue-100 text-blue-600 rounded-xl text-xl">📈</span>
                        <div>
                           <h3 className="font-black text-2xl text-slate-800 tracking-tight">Grafik Pendapatan</h3>
                           <p className="text-xs text-slate-400 font-bold mt-1">Laba Bersih dihitung 70% dari Omzet</p>
                        </div>
                    </div>
                    <select value={chartFilter} onChange={(e) => setChartFilter(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer">
                        <option value="harian">7 Hari Terakhir</option>
                        <option value="1_bulan">1 Bulan Terakhir</option>
                        <option value="3_bulan">3 Bulan Terakhir</option>
                        <option value="6_bulan">6 Bulan Terakhir</option>
                    </select>
                </div>
                
                <div className="h-64 flex items-end gap-2 md:gap-4 pt-4 border-b border-slate-100">
                    {processChartData().map((data, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            <div className="absolute -top-16 bg-slate-800 text-white text-xs p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                                <p className="font-bold text-blue-300 mb-1">Omzet: Rp {data.revenue.toLocaleString('id-ID')}</p>
                                <p className="font-bold text-emerald-400">Laba: Rp {data.profit.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="w-full max-w-[60px] bg-blue-50 rounded-t-xl relative overflow-hidden flex items-end shadow-inner h-full border border-blue-100/50">
                                <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl transition-all duration-1000 group-hover:from-blue-500 group-hover:to-blue-300" style={{ height: data.height }}></div>
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 mt-3">{data.label}</p>
                        </div>
                    ))}
                    {processChartData().length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">Belum ada data transaksi.</div>
                    )}
                </div>
                
                <div className="flex justify-center gap-6 mt-6">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div><span className="text-xs font-bold text-slate-600">Omzet Kotor</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div><span className="text-xs font-bold text-slate-600">Laba Bersih (70%)</span></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-lg relative overflow-hidden text-white">
                  <div className="absolute -right-6 -top-6 text-8xl opacity-10">💰</div>
                  <p className="text-blue-200 text-xs font-black uppercase tracking-widest mb-2">Total Omzet Keseluruhan</p>
                  <p className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-md">Rp {(revenueData.totalRevenue || 0).toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-3xl shadow-lg relative overflow-hidden text-white">
                  <div className="absolute -right-6 -top-6 text-8xl opacity-10">⏱️</div>
                  <p className="text-emerald-100 text-xs font-black uppercase tracking-widest mb-2">Total Transaksi</p>
                  <p className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-md">{(revenueData.totalTransactions || 0)} <span className="text-2xl font-bold opacity-70">Sesi</span></p>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm mb-10">
                 <div className="flex items-center gap-3 mb-6">
                    <span className="p-3 bg-amber-100 text-amber-600 rounded-xl text-xl">🏆</span>
                    <h3 className="font-black text-2xl text-slate-800 tracking-tight">Hall of Fame (Top 5)</h3>
                 </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loyalCustomers.length > 0 ? loyalCustomers.map((c, i) => (
                    <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between relative overflow-hidden">
                      {i === 0 && <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>}
                      <div>
                         <p className="font-black text-slate-800 text-lg flex items-center gap-2">
                           {c.name} {i === 0 && <span className="text-amber-500 text-sm">👑</span>}
                         </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] px-3 py-1 rounded-lg font-black uppercase tracking-widest ${i === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-200 text-slate-500'}`}>Rank #{i+1}</span>
                        <p className="text-sm font-black text-emerald-600 mt-2">Rp {(c.totalContribution || 0).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  )) : <div className="col-span-full text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 font-bold">Belum ada pelanggan yang tercatat.</div>}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                   <div className="flex items-center gap-3">
                      <span className="p-3 bg-slate-100 text-slate-600 rounded-xl text-xl">📜</span>
                      <h3 className="font-black text-2xl text-slate-800 tracking-tight">Riwayat Transaksi</h3>
                   </div>
                   
                   {/* KOTAK SCANNER QR CODE (MOBILE RESPONSIVE) */}
                   <div className="w-full sm:w-auto bg-slate-800 p-4 rounded-2xl shadow-inner text-white flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-center sm:text-left">
                         <h4 className="text-xs font-black uppercase tracking-widest text-blue-400">📷 Scan Tiket Pemain</h4>
                      </div>
                      <button 
                         onClick={() => setShowCamera(!showCamera)} 
                         className={`w-full sm:w-auto px-4 py-2 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer ${showCamera ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                      >
                         {showCamera ? 'Tutup Kamera ✖' : 'Buka Kamera 📷'}
                      </button>
                   </div>
                </div>

                {/* Area Kamera */}
                {showCamera && (
                  <div className="p-6 bg-slate-100 border-b border-slate-200">
                     <div className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-4 border-slate-800 bg-black animate-in zoom-in-95 relative">
                        <div className="absolute top-2 right-2 z-10">
                           <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-md animate-pulse">REC</span>
                        </div>
                        <QrReader onScanSuccess={handleCameraScan} />
                     </div>
                  </div>
                )}

                <div className="p-4 bg-red-50 text-right border-b border-slate-100">
                  <button onClick={async () => { 
                    const confirmResult = await Swal.fire({
                      title: 'Kosongkan Data?',
                      text: "Semua riwayat booking akan dihapus permanen!",
                      icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Bersihkan!'
                    });
                    if(confirmResult.isConfirmed) { 
                      await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
                      Swal.fire("Dibersihkan!", "Riwayat transaksi telah dikosongkan.", "success");
                      setRevenueData({ totalRevenue: 0, totalTransactions: 0, allTransactions: [], recentTransactions: [] }); 
                    } 
                  }} className="inline-flex items-center gap-2 bg-white text-red-500 border border-red-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors cursor-pointer shadow-sm">
                    <span>🗑️</span> Kosongkan Data Transaksi
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Pemesan & Detail</th>
                        <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Alat Disewa</th>
                        <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Jadwal Main</th>
                        <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Aksi & Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {revenueData.recentTransactions && revenueData.recentTransactions.length > 0 ? (
                        revenueData.recentTransactions.map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-5">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-black text-slate-800 text-sm">{tx.player_name}</span>
                                {tx.is_public && <span className="bg-indigo-100 text-indigo-700 text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest border border-indigo-200">Mabar</span>}
                              </div>
                              <div className="text-[10px] text-slate-500 font-bold leading-tight space-y-1">
                                 {tx.split_members && tx.split_members.length > 1 && <div><span className="text-slate-400">Patungan:</span> {tx.split_members.filter(m => m !== tx.player_name).join(', ')}</div>}
                                 {tx.joined_players && tx.joined_players.length > 0 && <div className="text-indigo-500"><span className="text-indigo-300">Joiner:</span> {tx.joined_players.join(', ')}</div>}
                              </div>
                            </td>
                            <td className="p-5 text-xs font-bold text-amber-600">
                               {tx.additional_items ? <span className="bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">Raket: {tx.additional_items.racket || 0}, Kok: {tx.additional_items.kok || 0}</span> : <span className="text-slate-300">-</span>}
                            </td>
                            <td className="p-5">
                               <p className="text-xs font-bold text-slate-500">{tx.booking_date}</p>
                               <span className="font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-sm mt-1 inline-block border border-blue-100">{tx.start_time?.substring(0,5)}</span>
                            </td>
                            
                            {/* TOMBOL VERIFIKASI ADMIN */}
                            <td className="p-5 text-right w-40">
                               {tx.status !== 'checked-in' ? (
                                 <button onClick={() => handleCheckIn(tx.id)} className="bg-blue-600 text-white w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-colors mb-2 shadow-sm cursor-pointer">
                                   Verifikasi Manual
                                 </button>
                               ) : (
                                 <span className="bg-green-100 text-green-700 w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest block mb-2 border border-green-200 text-center">
                                   Masuk ✅
                                 </span>
                               )}
                               <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm border border-emerald-100 whitespace-nowrap block text-center">Rp {(tx.price || 0).toLocaleString('id-ID')}</span>
                            </td>
                          </tr>
                        ))
                      ) : <tr><td colSpan="4" className="p-16 text-center text-slate-400 font-bold bg-slate-50 border-t border-slate-100">Belum ada rekam jejak transaksi.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;