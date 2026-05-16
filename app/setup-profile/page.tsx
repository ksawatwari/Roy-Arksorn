"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { Pencil, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const badWords = ['ควย', 'เหี้ย', 'เย็ด', 'มึง', 'กู', 'สัด', 'ระยำ', 'fuck', 'shit'];

export default function SetupProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [alias, setAlias] = useState("หนอนหนังสือผู้หิวโหย");
  const [avatarUrl, setAvatarUrl] = useState("https://api.dicebear.com/7.x/lorelei/svg?seed=RoyAksorn&backgroundColor=ffffff");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBadWord, setIsBadWord] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [showSacredOverlay, setShowSacredOverlay] = useState(false);
  const [showSacredText, setShowSacredText] = useState(false);
  const [particles, setParticles] = useState<{id: number; x: number; y: number; size: number; duration: number}[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedRef = useRef(false);

  const handleNameChange = React.useCallback((val: string) => {
    setName(val);
    const hasBadWord = badWords.some(w => val.includes(w));
    setIsBadWord(hasBadWord);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        if (user.displayName && !hasInitializedRef.current) {
          handleNameChange(user.displayName);
          hasInitializedRef.current = true;
        }
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router, handleNameChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setAvatarUrl(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getFontSize = () => {
    if (name.length > 15) return "text-xl md:text-2xl";
    if (name.length > 10) return "text-2xl md:text-3xl";
    return "text-3xl md:text-4xl";
  };

  const handleAvatarSelect = (url: string) => {
    setAvatarUrl(url);
    setIsModalOpen(false);
  };

  const executeSacredAwakening = async () => {
    if (!currentUser) {
      alert("กรุณาล็อกอินก่อนสร้างโปรไฟล์");
      return;
    }

    if (isBadWord || !name) {
      return;
    }

    setIsSaving(true);

    try {
      await setDoc(doc(db, "users", currentUser.uid), {
        username: name,
        avatarUrl: avatarUrl,
        bio: bio,
        alias: alias,
        createdAt: new Date()
      });

      // Show sacred overlay
      setShowSacredOverlay(true);
      
      // Generate radial explosion particles
      const newParticles = Array.from({ length: 60 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 400 + 100;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size: Math.random() * 8 + 4,
          duration: Math.random() * 2 + 1.5
        };
      });
      setParticles(newParticles);

      setTimeout(() => setShowSacredText(true), 800);

      setTimeout(() => {
        setShowSacredOverlay(false);
        setTimeout(() => {
          router.push("/");
        }, 1000);
      }, 4000);
    } catch (error: any) {
      console.error("Error saving profile: ", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-300 flex items-center justify-center p-6 md:p-10 font-header" suppressHydrationWarning>
      
      {/* Sacred Overlay */}
      <AnimatePresence>
        {showSacredOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 bg-stone-900/95 z-[5000] flex flex-col items-center justify-center"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/p6.png')" }}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="w-[300px] h-[300px] border-2 border-[#D4AF37] rounded-full flex items-center justify-center relative shadow-[0_0_80px_rgba(212,175,55,0.4)]"
            >
              {avatarUrl && (
                <motion.img 
                  initial={{ rotate: -10 }}
                  animate={{ rotate: 0 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-[200px] h-[200px] rounded-full object-cover shadow-[0_0_50px_#D4AF37]" 
                  referrerPolicy="no-referrer" 
                />
              )}
            </motion.div>
            
            <AnimatePresence>
              {showSacredText && (
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                  className="font-charm text-[#D4AF37] text-3xl md:text-4xl text-center mt-12 tracking-wider drop-shadow-lg"
                >
                  นามของท่านถูกจารึกไว้ชั่วนิรันดร์
                </motion.h2>
              )}
            </AnimatePresence>

            {/* Sacred Particles */}
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ 
                  opacity: 1, 
                  scale: 0,
                  x: "-50%",
                  y: "-50%" 
                }}
                animate={{ 
                  opacity: [1, 0.8, 0],
                  scale: [0, p.size / 4, p.size / 2],
                  x: `calc(-50% + ${p.x}px)`,
                  y: `calc(-50% + ${p.y}px)`
                }}
                transition={{ 
                  duration: p.duration, 
                  ease: "easeOut"
                }}
                className="absolute bg-[#D4AF37] rounded-full pointer-events-none shadow-[0_0_10px_#D4AF37]"
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  left: '50%',
                  top: '50%'
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-[1180px] min-h-[700px] bg-white rounded shadow-[0_60px_120px_rgba(0,0,0,0.3)] flex flex-col md:flex-row relative">
        
        {/* Sidebar Preview */}
        <div 
          className="w-full md:w-[420px] bg-stone-900 text-white flex flex-col items-center justify-center px-6 py-10 md:p-12 text-center md:h-[700px] md:sticky md:top-10 shrink-0"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/p6.png')" }}
        >
          <div className="relative mb-6 md:mb-8">
            <img 
              src={avatarUrl} 
              className="w-[160px] h-[160px] md:w-[230px] md:h-[230px] rounded-full bg-white border-4 border-white/10 object-cover shadow-[0_30px_60px_rgba(0,0,0,0.5)] grayscale" 
              alt="Profile" 
              referrerPolicy="no-referrer"
            />
            <button 
              className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-zen-red text-white w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center border-[3px] border-stone-900 shadow-lg hover:scale-110 hover:rotate-12 hover:bg-[#cc2626] transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <Pencil className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          <div className="w-full px-4 break-words">
            <p className="text-[10px] text-stone-500 tracking-[3.5px] font-bold uppercase mb-2">นามจารึก</p>
            <h2 className={`${getFontSize()} font-semibold mb-1 text-white leading-tight ${isBadWord ? 'text-transparent' : ''}`}>
              {isBadWord ? '---' : (name || '---')}
            </h2>
            <p className="font-charm text-xl md:text-2xl text-zen-red opacity-85 mb-6 md:mb-8">
               {isBadWord ? 'Signature' : (name || 'Signature')}
            </p>
            
            <p className="text-[10px] text-stone-500 tracking-[3.5px] font-bold uppercase mb-2">ฉายา</p>
            <div className="text-[13px] text-stone-300 py-2 px-8 border border-white/20 rounded-full inline-block font-light">
              {alias}
            </div>
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 bg-stone-50 p-6 md:p-16 flex flex-col justify-center">
          
          <h1 className="text-3xl md:text-[42px] font-bold text-stone-900 mb-1 tracking-tight">จารึกรายละเอียดตัวตน</h1>
          <div className="w-[45px] md:w-[55px] h-1.5 bg-zen-red mb-8 md:mb-10"></div>

          <div className="mb-6 md:mb-8 relative">
            <label className="text-[11px] text-stone-400 font-bold uppercase tracking-[2px] mb-2 block">นามจารึกสำหรับแสดงผล</label>
            <span className="absolute right-0 top-0 text-[10px] text-stone-500 font-bold">{name.length}/20</span>
            <input 
              type="text" 
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="ระบุชื่อ..." 
              maxLength={20}
              className={`w-full bg-transparent border-b-2 py-2 md:py-2.5 text-lg md:text-xl outline-none text-stone-900 transition-colors focus:border-zen-red ${isBadWord ? 'border-red-500 focus:border-red-500 text-red-500' : 'border-stone-200'}`}
            />
            {isBadWord && (
              <p className="text-[11px] text-red-600 mt-1 font-semibold">ขออภัย นามจารึกนี้มีคำไม่เหมาะสม</p>
            )}
          </div>

          <div className="mb-6 md:mb-8">
            <label className="text-[11px] text-stone-400 font-bold uppercase tracking-[2px] mb-2 block">คำแนะนำตัว (Bio)</label>
            <input 
              type="text" 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="บอกเล่าเรื่องราวของท่านสั้นๆ..." 
              className="w-full bg-transparent border-b-2 border-stone-200 py-2 md:py-2.5 text-lg md:text-xl outline-none text-stone-900 transition-colors focus:border-zen-red"
            />
          </div>

          <div className="mb-6 md:mb-8">
            <label className="text-[11px] text-stone-400 font-bold uppercase tracking-[2px] mb-2 block">ตัวเลือกอวาตาร์</label>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white border border-stone-300 px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:border-zen-red hover:text-zen-red flex items-center gap-2 transition-all w-fit"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              เปิดคลังภาพ (96 แบบ)
            </button>
          </div>

          <div className="mb-10">
            <label className="text-[11px] text-stone-400 font-bold uppercase tracking-[2px] mb-3 block">เลือกฉายาประจำตัว</label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                'หนอนหนังสือผู้หิวโหย', 
                'ดองจนเค็ม', 
                'จอมยุทธ์หน้ากระดาษ', 
                'ยอดนักอ่านขอบเตียง', 
                'ผู้เฝ้ากระดาษ', 
                'นิทราข้ามบท'
              ].map((opt) => (
                <button 
                  key={opt}
                  onClick={() => setAlias(opt)}
                  className={`bg-white border-[1.5px] py-4 px-2 rounded-sm text-sm text-center transition-all ${
                    alias === opt 
                      ? 'bg-zen-red border-zen-red text-white font-semibold shadow-[0_8px_20px_rgba(163,29,29,0.3)] hover:text-white' 
                      : 'border-stone-200 text-stone-600 hover:border-zen-red hover:text-zen-red hover:-translate-y-1'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <button 
            disabled={isBadWord || !name || isSaving}
            onClick={executeSacredAwakening}
            className={`mt-4 py-4 md:py-5 text-xl md:text-[22px] font-bold uppercase tracking-[3px] text-white rounded-sm transition-all ${
              isBadWord || !name || isSaving 
                ? 'bg-stone-300 cursor-not-allowed' 
                : 'bg-zen-red hover:bg-stone-900 md:hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]'
            }`}
          >
            {isSaving ? 'กำลังจารึก...' : 'สร้าง'}
          </button>
        </div>
      </div>

      {/* Avatar Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/85 z-[1000] p-6 md:p-12 flex items-center justify-center">
          <div className="bg-stone-50 w-full max-w-[900px] h-[80vh] p-6 md:p-10 rounded shadow-xl flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-2xl md:text-3xl font-bold text-stone-900">คลังอวาตาร์รอยอักษร (96 แบบ)</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-red-700 font-bold hover:underline flex items-center gap-1">
                <X className="w-5 h-5"/> ปิด
              </button>
            </div>
            
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
              {Array.from({ length: 96 }).map((_, i) => {
                const seed = `Lorelei-Final-${(i + 1) * 137}`;
                const url = `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}&backgroundColor=ffffff`;
                return (
                  <button 
                    key={i} 
                    onClick={() => handleAvatarSelect(url)}
                    className="aspect-square border-2 border-stone-200 rounded-xl bg-white flex items-center justify-center transition-all hover:border-zen-red hover:-translate-y-1 grayscale hover:grayscale-0 p-2"
                  >
                    <img src={url} alt={`Avatar ${i+1}`} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #A31D1D;
          border-radius: 10px;
        }
      `}} />
    </div>
  );
}
