"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, PenLine, ChevronLeft, ChevronRight, ArrowUp, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";

const CATEGORIES = [
  {
    name: "Original / ออริจินัล",
    description: "งานเขียนสร้างสรรค์ที่เป็นเอกลักษณ์เฉพาะตัว",
    details: "พื้นที่รังสรรค์วรรณกรรม เรื่องสั้น และงานเขียนเชิงสร้างสรรค์ที่กลั่นกรองจากจินตนาการและประสบการณ์ดิบของผู้เขียนโดยเฉพาะ"
  },
  {
    name: "Essays / บทพิจารณ์",
    description: "บทความแสดงทัศนคติ การวิเคราะห์ หรือการถกเถียงในประเด็นต่างๆ",
    details: "การถ่ายทอดความคิดเห็นอย่างเป็นระบบผ่านบทความเชิงวิเคราะห์ ตั้งคำถาม และชวนสำรวจมุมมองใหม่ๆในสังคมและวัฒนธรรม"
  },
  {
    name: "Journal / วิถีอักษร",
    description: "บันทึกประจำวัน ประสบการณ์ และการเดินทาง",
    details: "บันทึกร่องรอยแห่งการใช้ชีวิต ถ้อยคำจากห้วงเวลา และประสบการณ์ส่วนตัวที่บอกเล่าผ่านตัวอักษรอย่างเรียบง่ายแต่เปี่ยมความหมาย"
  },
  {
    name: "Insights / พินิจภาพ",
    description: "ความรู้เฉพาะทาง วิชาการ หรือข้อมูลเชิงลึก",
    details: "เจาะลึกข้อมูลความรู้ บทความวิชาการ และการพินิจพิเคราะห์ประเด็นต่างๆอย่างละเอียดเพื่อความเข้าใจที่ถ่องแท้และเป็นประโยชน์"
  },
  {
    name: "Book Review / แว่วอักษร",
    description: "การรีวิว วิจารณ์ หรือแนะนำหนังสือ",
    details: "พื้นที่แบ่งปันความรู้สึกจากการอ่าน วิจารณ์ตัวอักษร และถอดรหัสความคิดจากหนังสือที่น่าสนใจทั้งในและต่างประเทศ"
  },
  {
    name: "How-to / อักษรวิธี",
    description: "วิธีการ ขั้นตอน Guidebook หรือการแชร์ทักษะ",
    details: "คู่มือและเคล็ดลับการพัฒนาทักษะ บอกเล่าวิธีการทำสิ่งต่างๆให้ประสบความสำเร็จผ่านขั้นตอนที่เข้าใจง่ายและนำไปใช้ได้จริง"
  },
  {
    name: "Curations / ป้ายยาของดี",
    description: "การคัดสรรสิ่งดีๆมาบอกต่อ (หนัง เพลง พอดแคสต์ ฯลฯ)",
    details: "คัดสรรสิ่งละอันพันละน้อยที่มีคุณค่า ตั้งแต่หนังดี เพลงเพราะ ไปจนถึงเครื่องมือที่ช่วยให้ชีวิตง่ายขึ้น เพื่อส่งต่อความประทับใจให้คุณ"
  },
  {
    name: "Quotes / ถ้อยจารึก",
    description: "คำคม ข้อความสั้นๆ หรือแรงบันดาลใจ",
    details: "รวบรวมถ้อยคำทรงพลัง แรงบันดาลใจสั้นๆและข้อความที่ประทับใจจากทั่วทุกมุมโลก เพื่อเติมพลังไฟในวันที่คุณต้องการ"
  }
];

export default function LibraryPage() {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  const [isDesktopProfileOpen, setIsDesktopProfileOpen] = useState(false);
  const [isProfileMenuPinned, setIsProfileMenuPinned] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [docs, setDocs] = useState<any[]>([]);
  const [docIdToDelete, setDocIdToDelete] = useState<number | null>(null);
  
  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentCatIndex, setCurrentCatIndex] = useState(0);

  // Upload to profile state
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [selectedDocsForUpload, setSelectedDocsForUpload] = useState<number[]>([]);
  const [uploadProgress, setUploadProgress] = useState(-1);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
        
        const storageKey = `archivist_docs_${currentUser.uid}`;
        const savedDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
        setDocs(savedDocs.sort((a: any, b: any) => b.updated - a.updated));
        
      } else {
        setUser(null);
        setUserData(null);
        
        const savedDocs = JSON.parse(localStorage.getItem('archivist_docs') || '[]');
        setDocs(savedDocs.sort((a: any, b: any) => b.updated - a.updated));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuPinned(false);
        setIsDesktopProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const openDeleteModal = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDocIdToDelete(id);
  };

  const closeDeleteModal = () => {
    setDocIdToDelete(null);
  };

  const confirmDelete = () => {
    if (docIdToDelete !== null) {
      const storageKey = user ? `archivist_docs_${user.uid}` : 'archivist_docs';
      let currentDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      currentDocs = currentDocs.filter((d: any) => d.id !== docIdToDelete);
      localStorage.setItem(storageKey, JSON.stringify(currentDocs));
      setDocs(currentDocs.sort((a: any, b: any) => b.updated - a.updated));
      closeDeleteModal();
    }
  };

  const nextCategory = () => {
    setCurrentCatIndex((prev) => (prev + 1) % CATEGORIES.length);
  };

  const prevCategory = () => {
    setCurrentCatIndex((prev) => (prev - 1 + CATEGORIES.length) % CATEGORIES.length);
  };

  const handleSelectCategory = () => {
    const cat = CATEGORIES[currentCatIndex];
    router.push(`/writer?cat=${encodeURIComponent(cat.name)}`);
  };

  const toggleUploadMode = () => {
    setIsUploadMode(!isUploadMode);
    setSelectedDocsForUpload([]);
    setUploadProgress(-1);
  };

  const handleDocClick = (docId: number) => {
    if (isUploadMode) {
       setSelectedDocsForUpload(prev => 
         prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
       );
    } else {
       router.push(`/writer?id=${docId}`);
    }
  };

  const handleUploadSelected = async () => {
    if (!user || selectedDocsForUpload.length === 0) {
      if (!user) alert("กรุณาล็อกอินก่อนทำการอัปโหลด");
      return;
    }
    
    try {
      setUploadProgress(0);
      const total = selectedDocsForUpload.length;
      let count = 0;
      
      for (const id of selectedDocsForUpload) {
        const docObj = docs.find(d => d.id === id);
        if (!docObj) continue;
        
        const newPost = {
          uid: user.uid,
          text: `ได้เพิ่มผลงานใหม่เข้าคลัง: ${docObj.title || 'Untitled'}`,
          createdAt: Date.now(),
          workId: docObj.id.toString(), // ensure string
          workTitle: docObj.title || 'Untitled',
          workExcerpt: docObj.excerpt || '',
          workCategory: docObj.category || 'Original / ออริจินัล',
          workCover: docObj.cover || '',
        };
        await addDoc(collection(db, "posts"), newPost);
        count++;
        setUploadProgress(Math.round((count / total) * 100));
      }
      
      setTimeout(() => {
        setIsUploadMode(false);
        setSelectedDocsForUpload([]);
        setUploadProgress(-1);
        alert("อัปโหลดสำเร็จแล้ว เข้าไปดูได้ที่หน้าโปรไฟล์ของคุณ");
      }, 500);
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการอัปโหลด");
      setUploadProgress(-1);
    }
  };

  const displayName = userData?.username || user?.displayName || "ผู้จารึกอักษร";
  const profileImg = userData?.avatarUrl || user?.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=A31D1D&color=fff`;

  // Filter categories that have documents
  const activeCategories = CATEGORIES.filter(cat => docs.some(d => (d.category || "Original / ออริจินัล") === cat.name));
  
  // If there's a document with a category not in CATEGORIES, we fall back to "Original / ออริจินัล". 
  // It's handled gracefully since d.category || ... defaults to original.

  return (
    <div className="min-h-screen bg-[#fdfdfd] font-header text-stone-900 selection:bg-zen-red selection:text-white pb-20 relative overflow-x-hidden">
      
      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/60 backdrop-blur-md z-[10000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
              className="bg-white rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.08)] max-w-[600px] w-full p-8 md:p-12 relative flex flex-col items-center text-center overflow-hidden"
            >
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="absolute top-6 right-6 text-stone-400 hover:text-[#A31D1D] transition-colors p-2"
              >
                <X size={24} />
              </button>

              <p className="text-sm font-bold tracking-widest text-[#A31D1D] uppercase mb-8">เลือกหมวดหมู่รอยอักษร</p>
              
              <div className="flex items-center justify-between w-full mb-8">
                <button onClick={prevCategory} className="p-3 bg-stone-50 rounded-full text-stone-400 hover:text-[#A31D1D] hover:bg-stone-100 transition-all active:scale-95 shrink-0">
                  <ChevronLeft size={24} />
                </button>
                
                <div className="flex-1 px-4 relative h-[180px] w-full flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={currentCatIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                      >
                         <h2 className="text-3xl md:text-4xl font-bold text-[#A31D1D] mb-4">{CATEGORIES[currentCatIndex].name}</h2>
                         <p className="text-stone-800 font-semibold mb-3 text-lg">{CATEGORIES[currentCatIndex].description}</p>
                         <p className="text-stone-500 font-light text-sm md:text-base leading-relaxed max-w-sm mx-auto">{CATEGORIES[currentCatIndex].details}</p>
                      </motion.div>
                    </AnimatePresence>
                </div>
                
                <button onClick={nextCategory} className="p-3 bg-stone-50 rounded-full text-stone-400 hover:text-[#A31D1D] hover:bg-stone-100 transition-all active:scale-95 shrink-0">
                  <ChevronRight size={24} />
                </button>
              </div>

              <button 
                onClick={handleSelectCategory}
                className="bg-[#A31D1D] text-white px-10 py-4 rounded-full font-bold text-[15px] tracking-wide shadow-lg hover:shadow-[0_15px_30px_rgba(163,29,29,0.3)] hover:-translate-y-1 active:translate-y-0 active:shadow-md transition-all duration-300 w-[200px]"
              >
                เลือกหมวดหมู่นี้
              </button>
              
              <div className="flex gap-2 mt-6">
                {CATEGORIES.map((_, idx) => (
                  <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentCatIndex ? 'w-6 bg-[#A31D1D]' : 'w-1.5 bg-stone-200'}`} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <div 
        onClick={closeDeleteModal}
        className={`fixed inset-0 bg-black/10 backdrop-blur-sm z-[1000] flex items-center justify-center transition-all duration-300 ${docIdToDelete !== null ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`bg-white p-10 rounded-[32px] w-[90%] max-w-[420px] text-center shadow-[0_20px_40px_rgba(0,0,0,0.05)] transition-all duration-300 ${docIdToDelete !== null ? 'scale-100' : 'scale-90'}`}
        >
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full">
                <svg width="24" height="24" fill="#A31D1D" viewBox="0 0 24 24">
                    <path
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        stroke="#A31D1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">ลบลบล้างรอยอักษร?</h2>
            <p className="text-gray-400 mb-8 font-light">เมื่อลบแล้ว รอยจารึกนี้จะสูญหายไปตลอดกาล คุณแน่ใจหรือไม่?</p>
            <div className="flex gap-4 justify-center">
                <button 
                  onClick={closeDeleteModal} 
                  className="px-6 py-3 rounded-full font-semibold bg-[#f5f5f5] text-[#666] hover:bg-[#A31D1D] hover:text-white transition-all duration-300 text-sm hover:shadow-[0_8px_20px_rgba(163,29,29,0.3)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  เก็บไว้ก่อน
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="px-6 py-3 rounded-full font-semibold bg-white border border-[#f0f0f0] text-[#A31D1D] hover:bg-[#A31D1D] hover:text-white transition-all duration-300 text-sm hover:shadow-[0_8px_20px_rgba(163,29,29,0.3)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  ยืนยันการลบ
                </button>
            </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex justify-between items-center px-6 md:px-10 py-5 md:py-6 border-b bg-white/90 backdrop-blur-md sticky top-0 z-50">
          <Link href="/" className="text-xl md:text-2xl font-bold text-[#A31D1D] tracking-tighter">ROY AKSORN</Link>
          <div className="flex gap-4 md:gap-8 items-center text-sm font-medium text-gray-600">
              <Link href="/" className="hover:text-[#A31D1D] hidden md:block">หน้าแรก</Link>
              <Link href="/library" className="text-[#A31D1D] font-bold hidden md:block">ARCHIVE</Link>
              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="border border-[#A31D1D] text-[#A31D1D] px-5 py-2 md:px-6 md:py-2 rounded-full hover:bg-[#A31D1D] hover:text-white transition-colors tracking-wide flex items-center gap-2 text-xs md:text-sm"
              >
                <PenLine size={16} /> เขียนเรื่องใหม่
              </button>

              {user && (
                <div 
                  className="relative ml-2" 
                  ref={profileMenuRef}
                  onMouseLeave={() => { if (!isProfileMenuPinned) setIsDesktopProfileOpen(false); }}
                >
                  <div 
                    className="cursor-pointer transition-transform hover:scale-105" 
                    onMouseEnter={() => setIsDesktopProfileOpen(true)}
                    onClick={() => {
                        setIsProfileMenuPinned(!isProfileMenuPinned);
                        setIsDesktopProfileOpen(true);
                    }}
                  >
                    <img src={profileImg} className="w-10 h-10 rounded-full border-2 border-zen-red object-cover shadow-sm bg-white" alt="User" referrerPolicy="no-referrer" />
                  </div>
                  {(isDesktopProfileOpen || isProfileMenuPinned) && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden py-2 z-[60]">
                      <div className="px-4 py-3 border-b border-stone-100">
                        <p className="text-zen-red text-[10px] tracking-widest uppercase mb-1 font-bold">ผู้จารึกอักษร</p>
                        <p className="font-bold text-stone-800 text-sm truncate">{displayName}</p>
                      </div>
                      <Link href="/profile" className="block w-full text-left px-4 py-2.5 text-stone-700 hover:text-zen-red hover:bg-zen-red/5 transition-colors text-sm">
                        โปรไฟล์ของฉัน
                      </Link>
                      <Link href="/inbox" className="block w-full text-left px-4 py-2.5 text-stone-700 hover:text-zen-red hover:bg-zen-red/5 transition-colors text-sm">
                        กล่องจดหมาย
                      </Link>
                      <Link href="/achievements" className="block w-full text-left px-4 py-2.5 text-stone-700 hover:text-zen-red hover:bg-zen-red/5 transition-colors text-sm border-b border-stone-100">
                        ความสำเร็จ
                      </Link>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-zen-red font-bold hover:bg-zen-red/5 transition-colors text-sm">
                        ออกจากระบบ
                      </button>
                    </div>
                  )}
                </div>
              )}
          </div>
      </nav>

      <div className="max-w-6xl mx-auto py-12 md:py-16 px-6">
          <div className="flex justify-between items-end mb-16">
              <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">คลังรอยอักษร</h1>
                  <p className="text-gray-500 italic text-lg font-light">&quot;เมื่อตัวอักษร... เริ่มเล่าเรื่อง&quot;</p>
              </div>
              <div className="text-right shrink-0">
                  <span className="text-3xl md:text-4xl font-light text-[#A31D1D]">{docs.length}</span>
                  <p className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 font-bold mt-1">ผลงานทั้งหมด</p>
              </div>
          </div>

          {docs.length === 0 ? (
            <div className="py-24 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-[32px] bg-gray-50 flex flex-col items-center justify-center">
              <PenLine className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-light">ยังไม่มีผลงานที่ถูกจารึกไว้ในคลังของท่าน</p>
              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="mt-6 text-[#A31D1D] border-b border-[#A31D1D] pb-0.5 hover:opacity-70 transition-opacity font-bold"
              >
                เริ่มจารึกรอยอักษรแรก
              </button>
            </div>
          ) : (
            <div>
              {activeCategories.map(cat => {
                const catDocs = docs.filter(d => (d.category || "Original / ออริจินัล") === cat.name);
                if (catDocs.length === 0) return null;
                
                return (
                  <div key={cat.name} className="mb-14">
                    <h2 className="text-2xl font-bold text-stone-800 mb-8 flex items-center gap-3 border-b border-stone-200 pb-3">
                      <span className="w-4 h-4 rounded-full bg-[#A31D1D] shadow-[0_2px_10px_rgba(163,29,29,0.4)]"></span>
                      {cat.name}
                      <span className="text-sm font-light text-stone-400 ml-2">({catDocs.length})</span>
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {catDocs.map((doc: any) => {
                        const isSelected = selectedDocsForUpload.includes(doc.id);
                        
                        return (
                          <div 
                            key={doc.id}
                            onClick={() => handleDocClick(doc.id)}
                            className={`bg-white border p-6 rounded-[32px] transition-all duration-300 cursor-pointer flex flex-col group relative ${
                              isUploadMode 
                                ? isSelected 
                                  ? 'border-zen-red ring-2 ring-zen-red opacity-100 shadow-[0_15px_30px_rgba(163,29,29,0.15)] scale-[1.02]' 
                                  : 'border-gray-100 opacity-50 hover:opacity-100 scale-95' 
                                : 'border-gray-100 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)]'
                            }`}
                          >
                            {isUploadMode && isSelected && (
                              <div className="absolute -top-3 -right-3 bg-zen-red text-white w-8 h-8 flex justify-center items-center rounded-full shadow z-[20] border-2 border-white">
                                <CheckCircle2 size={18} strokeWidth={3} />
                              </div>
                            )}
                            {isUploadMode && !isSelected && (
                              <div className="absolute -top-3 -right-3 w-8 h-8 border-[3px] border-stone-200 rounded-full z-[20] bg-white transition-colors group-hover:border-zen-red/50"></div>
                            )}
                            
                            <div className="h-[160px] bg-stone-50 rounded-2xl mb-5 overflow-hidden flex items-center justify-center w-full relative">
                                {doc.cover ? (
                                  <img src={doc.cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Cover" />
                                ) : (
                                  <div className="bg-gradient-to-br from-[#f5f5f5] to-[#ececec] w-full h-full flex flex-col items-center justify-center text-[#ccc] border border-stone-100">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                    <span className="text-[9px] uppercase tracking-[0.2em] font-bold">ปราศจากรอยจารึก</span>
                                  </div>
                                )}
                            </div>
                            
                            {!isUploadMode ? (
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-1 border-t-4 border-[#A31D1D]"></div>
                                    <button 
                                      onClick={(e) => openDeleteModal(e, doc.id)} 
                                      className="text-gray-300 hover:text-red-500 transition-colors p-1 z-10"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-1 border-t-4 border-[#A31D1D]"></div>
                                </div>
                            )}
                            
                            <h3 className="text-2xl font-bold text-gray-800 mb-3 line-clamp-1 group-hover:text-[#A31D1D] transition-colors">{doc.title || 'Untitled'}</h3>
                            <p className="text-gray-500 text-sm line-clamp-2 mb-6 font-light leading-relaxed">{doc.excerpt || 'รอยจารึกที่ยังไม่มีคำโปรย...'}</p>
                            
                            <div className="mt-auto pt-4 border-t border-gray-100 text-[10px] text-gray-400 flex justify-between uppercase tracking-wider font-bold">
                                <span>Last Update</span>
                                <span>{new Date(doc.updated).toLocaleDateString('th-TH')}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </div>

      {docs.length > 0 && user && (
        <>
          {/* Upload Widget Trigger */}
          <button
            onClick={toggleUploadMode}
            className={`fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-lg flex justify-center items-center hover:scale-105 active:scale-95 transition-all z-[80] ${
              isUploadMode ? 'bg-stone-800 text-white' : 'bg-[#A31D1D] text-white'
            }`}
          >
            <ArrowUp size={24} className={isUploadMode ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>

          {/* Upload Widget Popup */}
          <AnimatePresence>
            {isUploadMode && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="fixed bottom-24 right-8 w-[280px] bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-stone-100 p-5 z-[80]"
              >
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-lg font-bold text-stone-800">อัปโหลดผลงาน</h3>
                   <button onClick={toggleUploadMode} className="text-stone-400 hover:text-stone-700 bg-stone-100 rounded-full p-1"><X size={14}/></button>
                </div>
                <p className="text-xs text-stone-500 font-light mb-4 leading-relaxed">
                  เลือกผลงานจากคลังเพื่ออัปโหลดไปยังหน้าโปรไฟล์ของคุณ
                </p>
                
                <div className="mb-4">
                  <span className="text-sm font-bold text-stone-800">
                    เลือกแล้ว: <span className="text-[#A31D1D]">{selectedDocsForUpload.length}</span> งาน
                  </span>
                </div>

                {uploadProgress >= 0 ? (
                  <div className="mb-2">
                     <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#A31D1D] transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                     </div>
                     <p className="text-xs text-center text-stone-500 mt-2 font-bold">กำลังอัปโหลด... {uploadProgress}%</p>
                  </div>
                ) : (
                  <button
                    disabled={selectedDocsForUpload.length === 0 || !user}
                    onClick={handleUploadSelected}
                    className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all ${
                      selectedDocsForUpload.length > 0 && user
                        ? 'bg-[#A31D1D] text-white shadow-md hover:bg-[#8f1717] active:scale-95' 
                        : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    {!user ? "กรุณาล็อกอินก่อน" : selectedDocsForUpload.length > 0 ? "อัปโหลดงานที่เลือก" : "กรุณาเลือกงาน"}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
