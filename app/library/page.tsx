"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, PenLine, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  const [docs, setDocs] = useState<any[]>([]);
  const [docIdToDelete, setDocIdToDelete] = useState<number | null>(null);
  
  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentCatIndex, setCurrentCatIndex] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const savedDocs = JSON.parse(localStorage.getItem('archivist_docs') || '[]');
    setDocs(savedDocs.sort((a: any, b: any) => b.updated - a.updated));
  }, []);

  const openDeleteModal = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDocIdToDelete(id);
  };

  const closeDeleteModal = () => {
    setDocIdToDelete(null);
  };

  const confirmDelete = () => {
    if (docIdToDelete !== null) {
      let currentDocs = JSON.parse(localStorage.getItem('archivist_docs') || '[]');
      currentDocs = currentDocs.filter((d: any) => d.id !== docIdToDelete);
      localStorage.setItem('archivist_docs', JSON.stringify(currentDocs));
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

  return (
    <div className="min-h-screen bg-[#fdfdfd] font-header text-stone-900 selection:bg-zen-red selection:text-white pb-20">
      
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
          </div>
      </nav>

      <div className="max-w-6xl mx-auto py-12 md:py-16 px-6">
          <div className="flex justify-between items-end mb-10 md:mb-12">
              <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">คลังรอยอักษร</h1>
                  <p className="text-gray-500 italic text-lg font-light">&quot;เมื่อตัวอักษร... เริ่มเล่าเรื่อง&quot;</p>
              </div>
              <div className="text-right shrink-0">
                  <span className="text-3xl md:text-4xl font-light text-[#A31D1D]">{docs.length}</span>
                  <p className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 font-bold mt-1">ผลงานทั้งหมด</p>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {docs.length === 0 ? (
              <div className="col-span-full py-24 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-[32px] bg-gray-50 flex flex-col items-center justify-center">
                <PenLine className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-lg font-light">ยังไม่มีผลงานที่ถูกจารึกไว้ในคลังของท่าน</p>
                <button 
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="mt-6 text-[#A31D1D] border-b border-[#A31D1D] pb-0.5 hover:opacity-70 transition-opacity"
                >
                  เริ่มจารึกรอยอักษรแรก
                </button>
              </div>
            ) : (
              docs.map((doc: any) => (
                <div 
                  key={doc.id}
                  onClick={() => router.push(`/writer?id=${doc.id}`)}
                  className="bg-white border border-gray-100 p-6 rounded-[32px] hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(163,29,29,0.1)] transition-all duration-300 cursor-pointer flex flex-col group"
                >
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
                  <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-1 border-t-4 border-[#A31D1D]"></div>
                      <button 
                        onClick={(e) => openDeleteModal(e, doc.id)} 
                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                      >
                          <X size={18} />
                      </button>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3 line-clamp-1 group-hover:text-[#A31D1D] transition-colors">{doc.title || 'Untitled'}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-6 font-light leading-relaxed">{doc.excerpt || 'รอยจารึกที่ยังไม่มีคำโปรย...'}</p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 text-[10px] text-gray-400 flex justify-between uppercase tracking-wider font-bold">
                      <span>Last Update</span>
                      <span>{new Date(doc.updated).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
      </div>
    </div>
  );
}
