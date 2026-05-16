"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, PenLine } from "lucide-react";

export default function LibraryPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<any[]>([]);
  const [docIdToDelete, setDocIdToDelete] = useState<number | null>(null);

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-[#fdfdfd] font-header text-stone-900 selection:bg-zen-red selection:text-white pb-20">
      
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
                onClick={() => router.push('/writer')}
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
                  <p className="text-gray-500 italic text-lg font-light">"เมื่อตัวอักษร... เริ่มเล่าเรื่อง"</p>
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
                  onClick={() => router.push('/writer')}
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
