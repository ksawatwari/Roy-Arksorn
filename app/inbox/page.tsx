"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MailOpen, Mail, X } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface Letter {
  id: string;
  title: string;
  date: string;
  sender: string;
  content: string;
  read: boolean;
}

const INITIAL_LETTERS: Letter[] = [
  {
    id: "welcome-1",
    title: "สารต้อนรับจากรอยอักษร",
    date: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
    sender: "ผู้ดูแลคลังอักษร",
    content: `ถึง ผู้เดินทางในเส้นทางแห่งตัวอักษร,

เรามีความยินดีเป็นอย่างยิ่งที่ท่านได้มอบความไว้วางใจ เลือก "รอยอักษร" เป็นสถานที่พักพิงทางความคิด และพื้นที่จารึกร่องรอยแห่งชีวิตของท่าน

ในยุคสมัยที่ทุกสิ่งหมุนไปอย่างรวดเร็ว เราหวังว่าพื้นที่หน้ากระดาษเสมือนแห่งนี้ จะเป็นดั่งศาลาพักใจให้ท่านได้ทบทวนตัวเอง คัดกรองความคิด และเปล่งเสียงที่แท้จริงออกมาผ่านตัวอักษร 

ไม่ว่าท่านจะมาเพื่อเก็บบันทึกเรื่องราวส่วนตัว แบ่งปันมุมมอง หรือสร้างสรรค์สิ่งใหม่ ขอให้รู้ว่าทุกรอยหมึกของท่านมีค่า และจะถูกเก็บรักษาไว้อย่างดีที่สุด

ขอให้การเดินทางบนหน้ากระดาษของท่าน เปี่ยมไปด้วยความสงบและแรงบันดาลใจ

ด้วยความเคารพ,
ผู้ดูแลคลังอักษร`,
    read: false,
  }
];

export default function InboxPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
  const [isMobilePopupOpen, setIsMobilePopupOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Load letters from localStorage or initialize with welcome letter
        const stored = localStorage.getItem(`ROY_AKSORN_INBOX_${currentUser.uid}`);
        if (stored) {
          setLetters(JSON.parse(stored));
        } else {
          setLetters(INITIAL_LETTERS);
          localStorage.setItem(`ROY_AKSORN_INBOX_${currentUser.uid}`, JSON.stringify(INITIAL_LETTERS));
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleReadLetter = (id: string) => {
    const updatedLetters = letters.map(l => l.id === id ? { ...l, read: true } : l);
    setLetters(updatedLetters);
    setSelectedLetterId(id);
    setIsMobilePopupOpen(true);
    if (user) {
      localStorage.setItem(`ROY_AKSORN_INBOX_${user.uid}`, JSON.stringify(updatedLetters));
    }
  };

  const closeLetter = () => {
    setSelectedLetterId(null);
    setIsMobilePopupOpen(false);
  };

  if (loading) {
     return <div className="min-h-screen bg-stone-100 flex items-center justify-center font-header">กำลังโหลด...</div>;
  }

  const selectedLetter = letters.find(l => l.id === selectedLetterId);

  return (
    <div className="min-h-screen bg-[#fdfdfd] font-header pb-20">
      <nav className="flex justify-between items-center px-6 md:px-10 py-4 bg-white/80 backdrop-blur border-b border-stone-200 sticky top-0 z-50">
          <Link href="/" className="text-xl font-bold text-zen-red tracking-tighter flex items-center gap-2 transition-transform hover:-translate-x-1">
            <ArrowLeft className="w-5 h-5"/> กลับหน้าหลัก
          </Link>
          <span className="font-bold text-stone-800 text-lg">กล่องจดหมาย</span>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8">
         <div className="flex flex-col md:flex-row gap-6 md:h-[80vh]">
            
            {/* Left side: Letter List */}
            <div className={`w-full ${selectedLetterId ? 'hidden md:block md:w-1/3' : 'md:w-1/3'} bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full`}>
               <div className="p-4 border-b border-stone-200 bg-stone-50">
                  <h2 className="font-bold text-stone-800 text-lg flex items-center gap-2">
                     <Mail className="w-5 h-5 text-zen-red"/> จดหมายทั้งหมด ({letters.length})
                  </h2>
               </div>
               
               <div className="overflow-y-auto flex-1 p-2">
                  {letters.map((letter) => (
                    <div 
                      key={letter.id} 
                      onClick={() => handleReadLetter(letter.id)}
                      className={`p-4 mb-2 rounded-lg cursor-pointer transition-all border ${
                        selectedLetterId === letter.id 
                           ? 'bg-zen-red/5 border-zen-red shadow-sm' 
                           : 'bg-white border-transparent hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                         <h3 className={`text-[15px] ${!letter.read ? 'font-bold text-stone-900' : 'font-medium text-stone-600'} line-clamp-1`}>
                            {letter.title}
                         </h3>
                         {!letter.read && <span className="w-2 h-2 rounded-full bg-zen-red shrink-0 mt-1"></span>}
                      </div>
                      <p className={`text-xs ${!letter.read ? 'text-stone-700 font-semibold' : 'text-stone-500 font-light'}`}>
                        จาก: {letter.sender}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-2 tracking-wider uppercase">
                        {letter.date}
                      </p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Right side: Letter Content (Desktop) */}
            <div className={`hidden md:flex w-2/3 bg-[#FAFAFA] border border-stone-200 rounded-xl overflow-hidden shadow-sm flex-col relative h-full ${!selectedLetterId ? 'items-center justify-center' : ''}`}>
               {!selectedLetter ? (
                  <div className="text-center opacity-50">
                     <MailOpen className="w-16 h-16 mx-auto mb-4 text-stone-400"/>
                     <p className="text-stone-500 font-light text-lg">เลือกจดหมายเพื่ออ่านข้อความ</p>
                  </div>
               ) : (
                  <>
                    <div className="absolute top-4 right-4 z-10">
                       <button onClick={closeLetter} className="p-2 bg-white/50 hover:bg-white rounded-full text-stone-500 hover:text-red-500 transition-colors shadow">
                          <X className="w-5 h-5"/>
                       </button>
                    </div>
                    <div className="p-8 md:p-12 border-b border-stone-200 bg-white relative overflow-hidden shrink-0">
                       <div className="absolute -top-10 -right-10 text-9xl text-stone-50 opacity-50 font-pattaya rotate-12 pointer-events-none">ร</div>
                       <h1 className="text-2xl md:text-3xl font-bold text-stone-800 mb-2 relative z-10">{selectedLetter.title}</h1>
                       <div className="flex gap-4 text-sm text-stone-500 relative z-10">
                          <span className="font-semibold text-zen-red">จาก: {selectedLetter.sender}</span>
                          <span>•</span>
                          <span>{selectedLetter.date}</span>
                       </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-parchment relative">
                       <div className="max-w-2xl text-stone-800 text-lg leading-[2.2] font-light whitespace-pre-wrap">
                          {selectedLetter.content}
                       </div>
                    </div>
                  </>
               )}
            </div>

         </div>
      </div>

      {/* Mobile Popup for Letter */}
      {isMobilePopupOpen && selectedLetter && (
         <div className="fixed inset-0 bg-stone-900/40 z-[6000] flex flex-col justify-end md:hidden">
            <div className="bg-[#FAFAFA] w-full h-[90vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300">
               
               <div className="p-6 border-b border-stone-200 bg-white flex justify-between items-start shrink-0">
                  <div>
                     <h1 className="text-xl font-bold text-stone-800 mb-1 leading-snug">{selectedLetter.title}</h1>
                     <div className="text-xs text-stone-500 flex flex-col gap-0.5">
                        <span className="font-semibold text-zen-red">จาก: {selectedLetter.sender}</span>
                        <span>{selectedLetter.date}</span>
                     </div>
                  </div>
                  <button onClick={closeLetter} className="p-2 bg-stone-100 rounded-full text-stone-500 active:bg-stone-200 shrink-0">
                     <X className="w-5 h-5"/>
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 bg-parchment">
                  <div className="text-stone-800 text-[17px] leading-[2] font-light whitespace-pre-wrap">
                     {selectedLetter.content}
                  </div>
               </div>
               
            </div>
         </div>
      )}
    </div>
  );
}
