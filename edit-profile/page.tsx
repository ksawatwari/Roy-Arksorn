"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { Pencil, X, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const badWords = ['ควย', 'เหี้ย', 'เย็ด', 'มึง', 'กู', 'สัด', 'ระยำ', 'fuck', 'shit'];

export default function EditProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [alias, setAlias] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("https://api.dicebear.com/7.x/lorelei/svg?seed=RoyAksorn&backgroundColor=ffffff");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBadWord, setIsBadWord] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNameChange = React.useCallback((val: string) => {
    setName(val);
    const hasBadWord = badWords.some(w => val.includes(w));
    setIsBadWord(hasBadWord);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Fetch existing data
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            handleNameChange(data.username || user.displayName || "");
            setBio(data.bio || "");
            setAlias(data.alias || "หนอนหนังสือผู้หิวโหย");
            setAvatarUrl(data.avatarUrl || user.photoURL || `https://api.dicebear.com/7.x/lorelei/svg?seed=${user.displayName}&backgroundColor=ffffff`);
          } else {
            // Document doesn't exist, maybe redirect to setup
            router.push("/setup-profile");
          }
        } catch (err) {
          console.error("Failed to load profile:", err);
        } finally {
          setIsLoading(false);
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

  const executeSaveProfile = async () => {
    if (!currentUser) return;
    if (isBadWord || !name) return;

    setIsSaving(true);

    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        username: name,
        avatarUrl: avatarUrl,
        bio: bio,
        alias: alias,
        updatedAt: new Date()
      });

      alert("บันทึกข้อมูลเรียบร้อยแล้ว");
      router.push("/");
    } catch (error: any) {
      console.error("Error saving profile: ", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-300 font-header text-xl">กำลังดึงข้อมูล...</div>;
  }

  // Determine which titles to show.
  // We should definitely include "ภรรยาของผู้สร้างเว็บ" if they currently have it, 
  // otherwise it's a secret and we only show standard titles.
  const standardTitles = [
    'หนอนหนังสือผู้หิวโหย', 
    'ดองจนเค็ม', 
    'จอมยุทธ์หน้ากระดาษ', 
    'ยอดนักอ่านขอบเตียง', 
    'ผู้เฝ้ากระดาษ', 
    'นิทราข้ามบท'
  ];
  const allTitles = [...standardTitles];
  if (alias === 'ภรรยาของผู้สร้างเว็บ') {
    allTitles.unshift('ภรรยาของผู้สร้างเว็บ');
  }

  return (
    <div className="min-h-screen bg-slate-300 flex items-center justify-center p-6 md:p-10 font-header" suppressHydrationWarning>
      <div className="w-full max-w-[1180px] min-h-[700px] bg-white rounded shadow-[0_60px_120px_rgba(0,0,0,0.3)] flex flex-col md:flex-row relative">
        
        {/* Sidebar Preview */}
        <div 
          className="w-full md:w-[420px] bg-stone-900 text-white flex flex-col items-center justify-center px-6 py-10 md:p-12 text-center md:h-[700px] md:sticky md:top-10 shrink-0 relative"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/p6.png')" }}
        >
          <Link href="/" className="absolute top-6 left-6 text-stone-400 hover:text-white flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-5 h-5" /> กลับ
          </Link>
          
          <div className="relative mb-6 md:mb-8 mt-8 md:mt-0">
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
            <div className={`text-[13px] py-2 px-8 border rounded-full inline-block font-medium ${
                alias === 'ภรรยาของผู้สร้างเว็บ' 
                ? 'border-purple-500/50 text-purple-300 bg-purple-900/30' 
                : 'border-white/20 text-stone-300 font-light'
              }`}>
              {alias}
            </div>
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 bg-stone-50 p-6 md:p-16 flex flex-col justify-center">
          
          <h1 className="text-3xl md:text-[42px] font-bold text-stone-900 mb-1 tracking-tight">แก้ไขรายละเอียดตัวตน</h1>
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
              {allTitles.map((opt) => (
                <button 
                  key={opt}
                  onClick={() => setAlias(opt)}
                  className={`bg-white border-[1.5px] py-4 px-2 rounded-sm text-sm text-center transition-all ${
                    alias === opt && opt === 'ภรรยาของผู้สร้างเว็บ'
                      ? 'bg-purple-600 border-purple-600 text-white font-semibold shadow-[0_8px_20px_rgba(147,51,234,0.3)] hover:text-white'
                      : alias === opt 
                      ? 'bg-zen-red border-zen-red text-white font-semibold shadow-[0_8px_20px_rgba(163,29,29,0.3)] hover:text-white' 
                      : opt === 'ภรรยาของผู้สร้างเว็บ'
                      ? 'border-purple-200 text-purple-600 hover:border-purple-600 hover:text-purple-600 hover:-translate-y-1'
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
            onClick={executeSaveProfile}
            className={`mt-4 py-4 md:py-5 text-xl md:text-[22px] font-bold uppercase tracking-[3px] text-white rounded-sm transition-all ${
              isBadWord || !name || isSaving 
                ? 'bg-stone-300 cursor-not-allowed' 
                : 'bg-zen-red hover:bg-stone-900 md:hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]'
            }`}
          >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
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
