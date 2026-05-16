"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";

function ReadContent() {
  const searchParams = useSearchParams();
  const idValue = searchParams.get("id");
  const router = useRouter();

  const [work, setWork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [authorBio, setAuthorBio] = useState("");
  const [authorImg, setAuthorImg] = useState("");

  useEffect(() => {
    const loadWorkObj = () => {
      const docsStr = localStorage.getItem("archivist_docs");
      if (docsStr) {
        const allDocs = JSON.parse(docsStr);
        const activeDoc = allDocs.find((d: any) => d.id.toString() === idValue);
        if (activeDoc) {
          setWork(activeDoc);
        }
      }
      setLoading(false);
    };
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const ud = userSnap.data();
          setAuthorName(ud.username || user.displayName || "ผู้จารึกอักษร");
          setAuthorBio(ud.bio || "ยังไม่มีเรื่องราวแนะนำตัว...");
          setAuthorImg(ud.avatarUrl || user.photoURL || `https://ui-avatars.com/api/?name=${ud.username || "User"}&background=A31D1D&color=fff`);
        }
      }
      loadWorkObj();
    });

    return () => unsubscribe();
  }, [idValue]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-header bg-stone-50">กำลังเป่าฝุ่นขนนก...</div>;
  }

  if (!work) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-header text-stone-600 bg-stone-50 gap-4">
        <h1 className="text-2xl font-bold">ไม่พบรอยจารึกนี้</h1>
        <button onClick={() => router.back()} className="text-zen-red border-b border-zen-red font-bold">กลับ</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfd] font-header pb-20 selection:bg-zen-red selection:text-white">
      {/* Nav */}
      <nav className="flex justify-between items-center px-6 md:px-10 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200">
        <button onClick={() => router.back()} className="text-stone-500 hover:text-zen-red flex items-center gap-2 font-bold transition-colors">
          <ArrowLeft className="w-5 h-5"/> กลับ
        </button>
        <span className="text-sm font-bold tracking-widest text-[#A31D1D] uppercase">การอ่านรอยอักษร</span>
      </nav>

      {/* Header Image */}
      {work.cover && (
        <div className="w-full h-[35vh] md:h-[45vh] overflow-hidden bg-stone-200">
          <img src={work.cover} alt="Cover" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className={`max-w-3xl mx-auto px-6 md:px-10 ${work.cover ? '-mt-16' : 'mt-16'} relative z-10`}>
        <div className={`bg-white ${work.cover ? 'rounded-t-3xl md:rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.04)] border-t border-x border-stone-100' : ''} px-6 py-12 md:px-16 md:py-16`}>
          
          <div className="mb-12 text-center">
            {work.category && (
              <span className="text-xs font-bold px-3 py-1 bg-stone-50 text-stone-500 rounded-full tracking-wider uppercase inline-block mb-6 border border-stone-200">
                {work.category}
              </span>
            )}
            <h1 className="text-3xl md:text-5xl font-bold text-stone-900 leading-tight mb-6">{work.title || "Untitled"}</h1>
            {work.excerpt && (
              <p className="text-stone-500 text-lg font-light italic">&quot;{work.excerpt}&quot;</p>
            )}
          </div>

          <div className="h-px w-20 bg-zen-red mx-auto mb-16"></div>

          <div 
            className="prose prose-lg md:prose-xl prose-stone max-w-none text-stone-800 leading-[2.2] md:leading-[2.4] font-light"
            style={{ fontSize: work.fontSize ? `${work.fontSize}px` : undefined }}
            dangerouslySetInnerHTML={{ __html: work.content || "" }}
          />

          {/* Author Box */}
          <div className="mt-24 pt-12 border-t border-stone-200">
             <div className="bg-stone-50 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 border border-stone-100">
                <img src={authorImg || "https://ui-avatars.com/api/?name=Author"} alt="Author" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm shrink-0" />
                <div className="text-center md:text-left">
                   <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-2">ผู้เขียน</p>
                   <h3 className="text-2xl font-bold text-stone-900 mb-3">{authorName}</h3>
                   <p className="text-stone-600 text-base font-light leading-relaxed max-w-xl">{authorBio}</p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function ReadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-header bg-stone-50">กำลังโหลด...</div>}>
      <ReadContent />
    </Suspense>
  );
}
