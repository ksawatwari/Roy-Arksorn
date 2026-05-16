"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignJustify, X, Plus, GripVertical } from "lucide-react";

export default function WriterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f4f4f2] font-header">โหลด...</div>}>
      <WriterContent />
    </Suspense>
  );
}

function WriterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idValue = searchParams.get('id');
  
  const [currentId, setCurrentId] = useState<string>("");
  
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverStr, setCoverStr] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  // toolbar state
  const [isFolded, setIsFolded] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ x: -1, y: 25, isVertical: false }); // x=-1 means centered initially
  const toolbarRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const id = idValue || Date.now().toString();
    setCurrentId(id);

    const savedData = JSON.parse(localStorage.getItem('archivist_docs') || '[]');
    const activeDoc = savedData.find((d: any) => d.id == id);

    if (activeDoc) {
      setTitle(activeDoc.title || "");
      setExcerpt(activeDoc.excerpt || "");
      if (editorRef.current) {
        editorRef.current.innerHTML = activeDoc.content || "";
      }
      if (activeDoc.cover) {
         setCoverStr(activeDoc.cover);
      }
    }
  }, [idValue]);

  // Handle Dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingRef.current || !toolbarRef.current) return;
    let targetX = e.clientX - startPosRef.current.x;
    let targetY = e.clientY - startPosRef.current.y;

    let isVertical = false;
    if (targetX < 120 || targetX > window.innerWidth - 180) {
      isVertical = true;
    }

    targetX = Math.max(0, Math.min(targetX, window.innerWidth - toolbarRef.current.offsetWidth));
    targetY = Math.max(0, Math.min(targetY, window.innerHeight - toolbarRef.current.offsetHeight));

    setToolbarPos({ x: targetX, y: targetY, isVertical });
  }, []);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.toolbar-handle')) {
      draggingRef.current = true;
      const rect = toolbarRef.current?.getBoundingClientRect();
      if (rect) {
        startPosRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    }
  };

  const execCmd = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const saveStory = () => {
    const titleInput = title || "Untitled Story";
    const contentBody = editorRef.current?.innerHTML || "";

    let allDocs = JSON.parse(localStorage.getItem('archivist_docs') || '[]');
    const targetIndex = allDocs.findIndex((d: any) => d.id == currentId);

    const storyObject = {
        id: parseInt(currentId),
        title: titleInput,
        excerpt: excerpt,
        content: contentBody,
        cover: coverStr,
        updated: Date.now()
    };

    if (targetIndex > -1) {
        allDocs[targetIndex] = storyObject;
    } else {
        allDocs.push(storyObject);
    }

    try {
        localStorage.setItem('archivist_docs', JSON.stringify(allDocs));
        alert('จารึกรอยอักษรสำเร็จแล้ว!');
        router.push('/library');
    } catch (e) {
        alert('หน่วยความจำเต็ม! ไม่สามารถเซฟรูปขนาดใหญ่เกินไปได้');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCoverStr(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const masterFonts = [
    "Sarabun", "Anuphan", "Prompt", "Kanit", "Pridi", "Taviraj", "Trirong", 
    "Thasadith", "Niramit", "Mitr", "Charm", "Itim", "Mali", "Sriracha", "Pattaya",
    "Krub", "Sarala", "Suton", "Jura", "K2D", "Laila", "Maitree",
    "Siamreap", "Battambang", "Fahkwang", "KoHo", "Kodchasan",
    "Athiti", "Bai Jamjuree", "Chakra Petch", "Srisakdi", "IBM Plex Sans Thai", "Noto Sans Thai"
  ];

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-stone-900 font-header relative overflow-x-hidden" suppressHydrationWarning>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Anuphan:wght@300;400;600&family=Sarabun:wght@400;500&family=Pridi:wght@400;600&family=Mitr:wght@300;400&family=Kanit:wght@300;400&family=Chakra+Petch:wght@300;400&family=Bai+Jamjuree:wght@300;400&family=Charm:wght@400;700&family=Itim&family=Mali&family=Srisakdi&family=Taviraj&family=Trirong&family=Athiti&family=Krub&family=KoHo&family=Kodchasan&family=Fahkwang&family=Sriracha&family=Prompt:wght@300;400&family=Niramit&family=K2D&family=Jura&family=Sarala&family=Suton&family=Pattaya&family=IBM+Plex+Sans+Thai:wght@300;400&family=Noto+Sans+Thai:wght@300;400&family=Thasadith&family=Chonburi&family=Laila&family=Maitree&family=Siamreap&family=Battambang&family=Krutidev+010&display=swap');
        
        #editor-content {
            outline: none;
            font-family: 'Sarabun';
            font-size: 20px;
            line-height: 2.4;
            color: #2c2c2c;
            text-align: justify;
        }

        #editor-content:empty:before {
            content: "จารึกถ้อยคำของคุณลงที่นี่...";
            color: #d1d1d1;
        }
      `}} />

      {/* Toolbar */}
      <div 
        ref={toolbarRef}
        onMouseDown={handleMouseDown}
        onClick={() => { if (isFolded) setIsFolded(false); }}
        className={`fixed z-[9999] bg-[rgba(255,255,255,0.95)] border border-[#e2e2e2] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center backdrop-blur-md transition-[border-radius,width,height,padding,background,box-shadow,flex-direction] duration-400 ease-[cubic-bezier(0.19,1,0.22,1)] select-none
          ${isFolded ? 'w-[52px] h-[52px] rounded-[15px] p-0 bg-[#A31D1D] justify-center cursor-pointer shadow-[0_10px_25px_rgba(163,29,29,0.4)] border-none' : 'rounded-[22px] p-[10px_14px] gap-3'}
          ${toolbarPos.isVertical && !isFolded ? 'flex-col w-[68px] h-auto p-[24px_10px]' : 'flex-row'}
        `}
        style={{
          left: toolbarPos.x === -1 ? '50%' : `${Math.round(toolbarPos.x + (toolbarRef.current?.offsetWidth || 0)/2)}px`,
          top: `${Math.round(toolbarPos.y)}px`,
          transform: toolbarPos.x === -1 ? 'translateX(-50%)' : 'none'
        }}
      >
        {!isFolded && (
          <>
            <div className={`toolbar-handle cursor-grab p-2 text-[#bbb] flex items-center justify-center hover:text-[#A31D1D] ${toolbarPos.isVertical ? 'border-b border-[#f0f0f0] mb-1' : 'border-r border-[#f0f0f0] mr-1'}`}>
              <GripVertical size={20} />
            </div>

            <div className={`flex items-center gap-1.5 ${toolbarPos.isVertical ? 'flex-col w-full' : ''}`}>
              <button onClick={() => execCmd('bold')} className="w-[38px] h-[38px] flex items-center justify-center rounded-xl text-[#444] transition-all duration-250 hover:bg-[#f1f1f1] hover:text-[#A31D1D] hover:scale-105"><Bold size={18} /></button>
              <button onClick={() => execCmd('italic')} className="w-[38px] h-[38px] flex items-center justify-center rounded-xl text-[#444] transition-all duration-250 hover:bg-[#f1f1f1] hover:text-[#A31D1D] hover:scale-105"><Italic size={18} /></button>
              <button onClick={() => execCmd('underline')} className="w-[38px] h-[38px] flex items-center justify-center rounded-xl text-[#444] transition-all duration-250 hover:bg-[#f1f1f1] hover:text-[#A31D1D] hover:scale-105"><Underline size={18} /></button>

              <div className="relative w-[30px] h-[30px] rounded-[10px] overflow-hidden border-2 border-white shadow-[0_0_0_1px_#ddd] mx-1 shrink-0">
                <input type="color" className="absolute -top-2.5 -left-2.5 w-[55px] h-[55px] cursor-pointer" onInput={(e) => execCmd('foreColor', (e.target as HTMLInputElement).value)} />
              </div>

              <div className={`bg-[#ececec] ${toolbarPos.isVertical ? 'w-10 h-[1px] my-3' : 'w-[1px] h-7 mx-1.5'}`}></div>

              <button onClick={() => execCmd('justifyLeft')} className="w-[38px] h-[38px] flex items-center justify-center rounded-xl text-[#444] transition-all duration-250 hover:bg-[#f1f1f1] hover:text-[#A31D1D] hover:scale-105" title="ชิดซ้าย"><AlignLeft size={18} /></button>
              <button onClick={() => execCmd('justifyCenter')} className="w-[38px] h-[38px] flex items-center justify-center rounded-xl text-[#444] transition-all duration-250 hover:bg-[#f1f1f1] hover:text-[#A31D1D] hover:scale-105" title="กึ่งกลาง"><AlignCenter size={18} /></button>
              <button onClick={() => execCmd('justifyFull')} className="w-[38px] h-[38px] flex items-center justify-center rounded-xl text-[#444] transition-all duration-250 hover:bg-[#f1f1f1] hover:text-[#A31D1D] hover:scale-105" title="กระจายตัว"><AlignJustify size={18} /></button>

              <div className={`bg-[#ececec] ${toolbarPos.isVertical ? 'w-10 h-[1px] my-3' : 'w-[1px] h-7 mx-1.5'}`}></div>

              <select 
                onChange={(e) => execCmd('fontName', e.target.value)}
                className={`text-[12px] font-semibold outline-none bg-transparent cursor-pointer ${toolbarPos.isVertical ? 'w-[50px] text-[10px]' : 'max-w-[120px]'}`}
              >
                <optgroup label="ยอดนิยม">
                    <option value="Sarabun">Sarabun</option>
                    <option value="Anuphan">Anuphan</option>
                    <option value="Prompt">Prompt</option>
                    <option value="Kanit">Kanit</option>
                </optgroup>
                <optgroup label="ทางการ / เรียบหรู">
                    <option value="Pridi">Pridi</option>
                    <option value="Taviraj">Taviraj</option>
                    <option value="Trirong">Trirong</option>
                    <option value="Thasadith">Thasadith</option>
                    <option value="Niramit">Niramit</option>
                    <option value="Mitr">Mitr</option>
                </optgroup>
                <optgroup label="นิยาย / ลายมือ">
                    <option value="Charm">Charm</option>
                    <option value="Itim">Itim</option>
                    <option value="Mali">Mali</option>
                    <option value="Sriracha">Sriracha</option>
                    <option value="Pattaya">Pattaya</option>
                </optgroup>
                <optgroup label="ทั้งหมด">
                  {masterFonts.sort().map(f => <option key={f} value={f}>{f}</option>)}
                </optgroup>
              </select>

              <button 
                onClick={saveStory} 
                className={`bg-[#A31D1D] text-white rounded-xl text-[11px] font-bold hover:bg-black transition-all shadow-lg active:scale-95 ${toolbarPos.isVertical ? 'mt-3 px-3 py-2 w-full' : 'ml-4 px-5 py-2.5'}`}
              >
                SAVE
              </button>
            </div>

            <button onClick={(e) => { e.stopPropagation(); setIsFolded(true); }} className={`text-stone-300 hover:text-red-500 ${toolbarPos.isVertical ? 'mt-2' : 'ml-2'}`}>
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="3" strokeLinecap="round" d="M18 12H6" />
              </svg>
            </button>
          </>
        )}
        
        {isFolded && (
          <div className="flex text-white font-['Pridi'] font-bold text-2xl">A</div>
        )}
      </div>

      <div className="max-w-[880px] mx-auto pt-[140px] pb-[100px] px-4 md:px-0 relative">
        <button onClick={() => router.push('/library')} className="mb-6 text-sm text-stone-500 hover:text-[#A31D1D] flex items-center gap-2">
          ← กลับสู่คลัง
        </button>

        <div className="bg-white rounded-[28px] p-6 md:p-[35px] mb-[30px] border border-[#efefef] shadow-[0_5px_25px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-6 md:gap-[30px] items-center">
            <div className="relative w-[120px] h-[160px] shrink-0 bg-[#fafafa] rounded-[18px]">
                {coverStr && (
                  <button 
                    onClick={() => setCoverStr("")} 
                    className="absolute -top-3 -right-3 bg-[#A31D1D] text-white w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] cursor-pointer z-30 shadow-[0_5px_15px_rgba(163,29,29,0.4)] border-2 border-white"
                  >
                    <X size={14}/>
                  </button>
                )}
                
                <label className="w-full h-full border-2 border-dashed border-stone-200 rounded-[18px] flex items-center justify-center cursor-pointer overflow-hidden hover:border-red-300 transition-all bg-white group relative">
                    {coverStr ? (
                      <img src={coverStr} className="w-full h-full object-cover" alt="Cover" />
                    ) : (
                      <div className="text-center group-hover:text-red-300 transition-colors">
                          <span className="block text-[24px] text-stone-300 group-hover:text-red-300"><Plus className="mx-auto" /></span>
                          <span className="text-[9px] text-stone-400 group-hover:text-red-300 font-bold uppercase tracking-widest mt-1 block">เพิ่มรูปปก</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
            </div>

            <div className="flex-1 w-full">
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ตั้งชื่อรอยอักษรของคุณ..."
                  className="w-full text-3xl md:text-4xl font-bold outline-none mb-3 text-stone-800 placeholder-stone-200 bg-transparent"
                />
                <textarea 
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="เขียนคำโปรยสั้นๆ เพื่อดึงดูดผู้อ่าน..."
                  className="w-full text-base md:text-lg text-stone-500 outline-none h-20 resize-none leading-relaxed bg-transparent font-light"
                ></textarea>
            </div>
        </div>

        <div className="bg-white min-h-[800px] md:min-h-[1100px] p-8 md:p-[90px_110px] shadow-[0_15px_60px_rgba(0,0,0,0.05)] rounded-[5px]">
            <div 
              id="editor-content" 
              ref={editorRef}
              contentEditable="true" 
              spellCheck="false"
            ></div>
        </div>
      </div>
    </div>
  );
}
