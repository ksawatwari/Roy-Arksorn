"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Menu, X, ArrowRight, ChevronRight, ChevronDown, MoveRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { auth, provider, db } from "@/lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function Page() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(28);
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [isDesktopProfileOpen, setIsDesktopProfileOpen] = useState(false);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });

  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Real-time online users simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(prev => Math.max(15, prev + (Math.floor(Math.random() * 3) - 1)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Search Click Focus
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login Failed:", error);
      alert("การเชื่อมต่อขัดข้อง: " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsDesktopProfileOpen(false);
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Logout Failed", error);
    }
  };

  const scrollNext = () => {
    if (emblaApi) emblaApi.scrollNext();
  };

  const displayName = userData?.username || user?.displayName || "ผู้อ่าน";
  const profileImg = userData?.avatarUrl || user?.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=A31D1D&color=fff`;

  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[1001] transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Mobile Panel */}
      <div className={`fixed top-0 right-0 h-full w-[80%] max-w-[350px] z-[1002] bg-parchment transition-transform duration-500 ease-out shadow-2xl p-8 overflow-y-auto ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex justify-between items-center mb-10">
          <span className="text-zen-red font-bold text-xl font-header">เมนู</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-stone-400 flex items-center gap-1 font-header"><X className="w-5 h-5"/> ปิด</button>
        </div>

        {user ? (
          <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl mb-8">
            <img src={profileImg} className="w-16 h-16 rounded-full border-2 border-zen-red object-cover" alt="Profile" referrerPolicy="no-referrer" />
            <div className="flex flex-col">
                <span className="text-zen-red text-xs font-bold tracking-widest uppercase font-header">ผู้จารึกอักษร</span>
                <span className="text-stone-800 font-bold text-xl font-header">{displayName}</span>
            </div>
          </div>
        ) : (
          <div className="mb-8 flex flex-col gap-6 font-header">
            <button onClick={handleLogin} className="text-left text-2xl text-stone-800">ล็อกอิน</button>
            <button onClick={handleLogin} className="text-left text-2xl text-zen-red font-bold">ฝากตัว</button>
          </div>
        )}

        <div className="flex flex-col gap-6 font-header">
          <hr className="border-stone-200" />
          <div>
            <button 
              onClick={() => setIsSubmenuOpen(!isSubmenuOpen)}
              className="text-2xl text-stone-800 flex justify-between items-center w-full"
            >
              หมวดหมู่ <ChevronDown className={`w-6 h-6 transition-transform ${isSubmenuOpen ? "rotate-180" : ""}`} />
            </button>
            <div className={`flex flex-col pl-4 mt-4 gap-4 border-l-2 border-stone-200 overflow-hidden transition-all duration-300 ${isSubmenuOpen ? "max-h-[500px]" : "max-h-0"}`}>
              <Link href="#" className="text-stone-500">Originals / ออริจินัล</Link>
              <Link href="#" className="text-stone-500">Essays / บทพิจารณ์</Link>
              <Link href="#" className="text-stone-500">Journal / วิถีอักษร</Link>
              <Link href="#" className="text-stone-500">Insights / พินิจภาพ</Link>
              <Link href="#" className="text-stone-500">Books Review / แว่วอักษร</Link>
            </div>
          </div>
          <Link href="#" className="text-2xl text-stone-800 hover:text-zen-red transition-colors">งานเขียนของข้าพเจ้า</Link>
          <Link href="#" className="text-2xl text-stone-800 hover:text-zen-red transition-colors">เกี่ยวกับ</Link>
          
          {user && (
            <button onClick={handleLogout} className="w-full mt-6 py-4 border-t border-stone-200 text-left text-stone-400 text-xl uppercase tracking-widest hover:text-zen-red transition">
              ออกจากระบบ
            </button>
          )}
        </div>
      </div>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 md:py-6 sticky top-0 z-[990] bg-parchment/90 backdrop-blur-md border-b border-parchment-dark">
        {/* Left Links (Desktop) */}
        <div className="hidden md:flex items-center justify-start gap-4 lg:gap-8 flex-1 z-10 font-header">
          <div className="relative group">
            <div className="text-[16px] font-medium text-stone-600 flex items-center gap-1.5 cursor-pointer group-hover:text-zen-red transition-colors">
              หมวดหมู่ <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
            </div>
            {/* Dropdown Content */}
            <div className="absolute left-0 top-full pt-4 w-64 z-[1000] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
              <div className="bg-parchment border border-parchment-dark rounded shadow-2xl flex flex-col overflow-hidden">
                <Link href="#" className="px-6 py-4 text-ink-medium hover:text-zen-red hover:bg-zen-red/5 hover:pl-8 transition-all border-b border-stone-200">Originals / ออริจินัล</Link>
                <Link href="#" className="px-6 py-4 text-ink-medium hover:text-zen-red hover:bg-zen-red/5 hover:pl-8 transition-all border-b border-stone-200">Essays / บทพิจารณ์</Link>
                <Link href="#" className="px-6 py-4 text-ink-medium hover:text-zen-red hover:bg-zen-red/5 hover:pl-8 transition-all border-b border-stone-200">Journal / วิถีอักษร</Link>
                <Link href="#" className="px-6 py-4 text-ink-medium hover:text-zen-red hover:bg-zen-red/5 hover:pl-8 transition-all">Books Review / แว่วอักษร</Link>
              </div>
            </div>
          </div>
          <Link href="#" className="text-[16px] font-medium text-stone-600 hover:text-zen-red transition-colors whitespace-nowrap">งานเขียนของข้าพเจ้า</Link>
          <Link href="#" className="text-[16px] font-medium text-stone-600 hover:text-zen-red transition-colors whitespace-nowrap">เกี่ยวกับ</Link>
        </div>

        {/* Center Logo */}
        <div className="flex justify-center shrink-0 mx-4 z-10">
          <Link href="/" className="font-playfair font-bold italic text-[26px] md:text-[34px] tracking-wider text-zen-red pointer-events-auto">
            Roy Aksorn
          </Link>
        </div>

        {/* Right Search & Auth */}
        <div className="flex items-center justify-end gap-3 md:gap-6 flex-1 z-10">
          
          {/* Search */}
          <div className="flex items-center relative">
            <input 
              ref={searchInputRef}
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาบทความ..." 
              className={`absolute right-10 top-1/2 -translate-y-1/2 outline-none bg-transparent border-b py-1 transition-all duration-300 font-header text-sm text-stone-800 focus:border-zen-red
                ${isSearchOpen ? 'w-48 md:w-64 opacity-100 border-stone-400 pointer-events-auto' : 'w-0 opacity-0 border-transparent pointer-events-none'}`}
            />
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)} 
              className="p-2 text-stone-600 hover:text-zen-red transition-colors flex-shrink-0 z-10 bg-transparent hover:scale-110 duration-300"
            >
              {isSearchOpen ? <X className="w-[22px] h-[22px]" /> : <Search className="w-[22px] h-[22px]" />}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 lg:gap-4 font-header">
            {!user ? (
              <>
                <button onClick={handleLogin} className="text-[16px] font-semibold text-stone-500 uppercase hover:text-zen-red transition-colors hover:scale-110 duration-300 whitespace-nowrap">ล็อกอิน</button>
                <button onClick={handleLogin} className="px-5 lg:px-6 py-1.5 lg:py-2 border-2 border-zen-red text-zen-red text-[16px] font-semibold rounded-full uppercase hover:bg-zen-red hover:text-white transition-all hover:scale-105 duration-300 whitespace-nowrap">ฝากตัว</button>
              </>
            ) : (
                <div className="relative ml-2" onMouseLeave={() => setIsDesktopProfileOpen(false)}>
                  <div className="cursor-pointer transition-transform hover:scale-105" onMouseEnter={() => setIsDesktopProfileOpen(true)}>
                    <img src={profileImg} className="w-10 h-10 rounded-full border-2 border-zen-red object-cover shadow-sm" alt="User" referrerPolicy="no-referrer" />
                  </div>
                  {isDesktopProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-parchment border border-parchment-dark rounded shadow-xl overflow-hidden py-2" onMouseEnter={() => setIsDesktopProfileOpen(true)}>
                      <div className="px-4 py-3 border-b border-stone-200">
                        <p className="font-header text-zen-red text-[10px] tracking-widest uppercase mb-1">ผู้จารึกอักษร</p>
                        <p className="font-bold text-stone-800 text-sm truncate">{displayName}</p>
                      </div>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-zen-red font-bold hover:bg-zen-red/5 transition-colors text-sm font-header">
                        ออกจากระบบ
                      </button>
                    </div>
                  )}
                </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="p-1 text-zen-red md:hidden hover:scale-110 transition shrink-0" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-8 h-8" />
          </button>
        </div>
      </nav>

      {/* Newspaper Edition Bar */}
      <div className="hidden md:flex justify-between items-center px-10 py-2 text-[10px] tracking-[0.3em] uppercase font-header text-ink-light border-b border-parchment-dark bg-parchment">
        <span>วารสารอักษรศิลป์ · ฉบับออนไลน์</span>
        <span>วันพฤหัสบดีที่ ๑๕ พฤษภาคม พ.ศ. ๒๕๖๙ · ปีมะเมีย</span>
      </div>

      {/* Hero Header */}
      <header className="relative text-white pt-24 pb-48 md:pt-40 md:pb-64 px-6 text-center overflow-hidden hero-fade" style={{
        background: `radial-gradient(ellipse at 30% 20%, rgba(180,50,50,0.3) 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 80%, rgba(140,20,20,0.4) 0%, transparent 50%),
                     radial-gradient(ellipse at 50% 0%, rgba(200,60,60,0.25) 0%, transparent 40%),
                     linear-gradient(160deg, #4A1515 0%, #6B1D1D 30%, #8B2525 50%, #6B1D1D 70%, #3D0C0C 100%)`
      }}>
        <h2 className="relative z-10 font-pattaya text-[5rem] md:text-[10rem] mb-2 leading-none tracking-tighter" style={{ color: "#F5EDE0" }}>
          <span className="opacity-30">รอย</span>อักษร
        </h2>
        <p className="relative z-10 font-header text-md md:text-xl font-light tracking-[0.2em] mb-12 text-[#DCC8AA]/70">
          เมื่อตัวอักษร... เริ่มเล่าเรื่อง
        </p>
        <div className="relative z-10 inline-flex items-center gap-3 px-6 py-2.5 rounded-full border border-[#F5F0E8]/15 bg-[#F5F0E8]/5 backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full animate-pulse bg-[#81b80b] shadow-[0_0_8px_rgba(184,134,11,0.6)]"></div>
          <p className="font-header text-sm tracking-wide text-[#DCC8AA]/80">
            ขณะนี้ออนไลน์ <span className="font-bold text-lg mx-0.5 text-[#F5EDE0]">{onlineUsers}</span> คน
          </p>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute bottom-10 right-20 text-9xl font-pattaya -rotate-12 text-[#D4C4A8]">ร</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        
        {/* Section 1: บทความแนะนำ (Featured Articles) - Single Column */}
        <section className="mb-20 md:mb-28">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="font-header text-3xl font-medium text-zen-red whitespace-nowrap">บทความแนะนำ</h2>
            <div className="h-[1px] w-full bg-gradient-to-r from-ink-medium/30 to-transparent"></div>
          </div>
          <div className="flex flex-col gap-8 group cursor-pointer border-b border-stone-200 pb-12 transition-transform duration-500 hover:-translate-y-1">
            <div className="w-full h-[350px] md:h-[480px] overflow-hidden rounded-[2px] relative shadow-sm">
              <Image src="https://picsum.photos/seed/ink1/1500/800" alt="Featured" fill className="image-box object-cover" referrerPolicy="no-referrer" />
              <div className="absolute top-4 left-4 bg-white/95 px-4 py-1.5 font-header text-xs text-zen-red uppercase tracking-widest shadow-sm backdrop-blur-sm">
                Books Review
              </div>
            </div>
            <div className="flex flex-col pt-2">
              <span className="text-stone-400 font-header text-sm tracking-widest mb-3 uppercase">๑๕ พฤษภาคม ๒๕๖๙</span>
              <h3 className="font-header text-4xl md:text-5xl text-stone-800 mb-5 group-hover:text-zen-red transition-colors duration-300 leading-tight">รอยจำในแดนหิมะ</h3>
              <p className="text-stone-600 leading-relaxed font-light text-xl mb-6 italic border-l-2 border-zen-red/20 pl-4">
                &quot;สัมผัสเสียงกระซิบจากหน้าที่ขาดหาย ผ่านการเดินทางที่ทิ้งรอยไว้เพียงความเงียบ ดั่งรอยหมึกบนกระดาษเก่าที่ค่อยๆ จางลงตามกาลเวลา...&quot;
              </p>
              <div className="text-zen-red font-header text-lg flex items-center gap-2 group-hover:gap-4 transition-all duration-300 w-fit font-medium">
                อ่านต่อ <ArrowRight className="w-5 h-5"/>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: บทความใหม่ (New Articles) - Stacked Column */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="font-header text-3xl font-medium text-zen-red whitespace-nowrap">บทความใหม่</h2>
            <div className="h-[1px] w-full bg-gradient-to-r from-ink-medium/30 to-transparent"></div>
          </div>

          <div className="flex flex-col gap-14">
            {/* Post 1 */}
            <div className="flex flex-col md:flex-row gap-8 group cursor-pointer border-b border-stone-200 pb-10 transition-transform duration-500 hover:-translate-y-1">
              <div className="relative w-full md:w-[45%] aspect-[4/3] overflow-hidden rounded-[2px] shadow-sm">
                <Image src="https://picsum.photos/seed/ink2/800/600" alt="New post 1" fill className="image-box object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="w-full md:w-[55%] flex flex-col justify-center">
                <span className="text-zen-red font-header text-xs uppercase tracking-widest mb-3 font-medium flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-zen-red"></span> Essays / บทพิจารณ์
                </span>
                <h4 className="font-header text-2xl md:text-3xl text-stone-800 mb-4 group-hover:text-zen-red transition-colors leading-snug">สุนทรียภาพแห่งความขัดแย้ง</h4>
                <p className="text-stone-600 leading-loose font-light mb-6 line-clamp-3">ประการหนึ่งของวรรณกรรมตะวันออกคือการยอมรับความบิดเบี้ยวของสรรพสิ่ง ความพยายามซ่อนเร้นความไม่งามกลับสร้างบาดแผลที่ชัดเจนยิ่งกว่า...</p>
                <div className="text-stone-400 font-header flex items-center gap-2 group-hover:text-zen-red transition-colors duration-300 text-sm tracking-wide">
                  ลัดเลาะประโยคถัดไป <ChevronRight className="w-4 h-4"/>
                </div>
              </div>
            </div>

            {/* Post 2 */}
            <div className="flex flex-col md:flex-row gap-8 group cursor-pointer border-b border-stone-200 pb-10 transition-transform duration-500 hover:-translate-y-1">
              <div className="relative w-full md:w-[45%] aspect-[4/3] overflow-hidden rounded-[2px] shadow-sm">
                <Image src="https://picsum.photos/seed/ink3/800/600" alt="New post 2" fill className="image-box object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="w-full md:w-[55%] flex flex-col justify-center">
                <span className="text-zen-red font-header text-xs uppercase tracking-widest mb-3 font-medium flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-zen-red"></span> Journal / วิถีอักษร
                </span>
                <h4 className="font-header text-2xl md:text-3xl text-stone-800 mb-4 group-hover:text-zen-red transition-colors leading-snug">หยดหมึกแห่งรุ่งอรุณ</h4>
                <p className="text-stone-600 leading-loose font-light mb-6 line-clamp-3">เมื่อรุ่งอรุณแรกของวันสัมผัสปลายปากกา ความปรารถนาอันเงียบงันมักถูกถ่ายทอดออกมาก่อนที่ความคิดเชิงตรรกะจะจับจองพื้นที่ของสมอง...</p>
                <div className="text-stone-400 font-header flex items-center gap-2 group-hover:text-zen-red transition-colors duration-300 text-sm tracking-wide">
                  ลัดเลาะประโยคถัดไป <ChevronRight className="w-4 h-4"/>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: บทความทั้งหมด (All Articles Carousel) */}
        <section className="mb-24 relative">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-header text-3xl font-medium text-zen-red whitespace-nowrap">บทความทั้งหมด</h2>
            <Link href="#" className="font-header text-sm text-zen-red border-b border-zen-red whitespace-nowrap hover:opacity-70 transition-opacity">ดูทั้งหมด</Link>
            <div className="h-[1px] w-full bg-gradient-to-r from-ink-medium/30 to-transparent"></div>
            
            {/* Scroll Button */}
            <button 
              onClick={scrollNext}
              className="hidden md:flex ml-auto items-center justify-center w-10 h-10 rounded-full border border-stone-300 text-stone-600 hover:border-zen-red hover:text-zen-red transition-all shrink-0 hover:bg-zen-red/5"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6 pb-4">
              {/* Carousel Items (1 to 4 to represent up to 10 max) */}
              {[
                { title: "ความนิ่งงันในสายสมลม", tag: "Originals", img: "https://picsum.photos/seed/ink4/600/600" },
                { title: "กาแฟดำและความจริง", tag: "Journal", img: "https://picsum.photos/seed/ink5/600/600" },
                { title: "หน้าปัดนาฬิกาตาย", tag: "Essays", img: "https://picsum.photos/seed/ink6/600/600" },
                { title: "ปฐมบทของกล้องฟิล์ม", tag: "Insights", img: "https://picsum.photos/seed/ink7/600/600" },
              ].map((item, idx) => (
                <div key={idx} className="flex-[0_0_80%] md:flex-[0_0_40%] lg:flex-[0_0_30%] min-w-0 group cursor-pointer">
                  <div className="w-full aspect-square overflow-hidden rounded-[2px] mb-4 relative shadow-sm">
                    <Image src={item.img} alt={item.title} fill className="image-box object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-stone-400 font-header text-[10px] tracking-widest uppercase mb-2 block">{item.tag}</span>
                  <h5 className="font-header text-xl text-stone-800 mb-2 group-hover:text-zen-red transition-colors">{item.title}</h5>
                  <p className="text-stone-500 font-light text-sm line-clamp-2">ความรู้สึกชั่วขณะหนึ่งที่จับต้องไม่ได้ ถูกบันทึกไว้ในเศษเสี้ยวของเวลาก่อนจะเลือนหายไป...</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* คติอักษร / Zen Principles */}
      <section className="py-20 md:py-32 px-6 md:px-10 bg-white border-y border-stone-200 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 md:mb-20">
            <span className="edition-marker mb-6 inline-block font-header">ปรัชญาแห่งอักษร</span>
            <h2 className="font-header text-3xl md:text-4xl text-zen-red mb-4 uppercase tracking-widest mt-6">คติอักษร</h2>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-ink-light"></div>
              <span className="text-zen-red opacity-60">✿</span>
              <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-ink-light"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20 font-header">
            <div className="text-center group">
              <div className="text-4xl mb-6 opacity-30 font-pattaya text-zen-red">壱</div>
              <h4 className="text-xl mb-4 tracking-widest group-hover:text-zen-red transition-colors text-ink-dark">ความสงบ</h4>
              <p className="font-light leading-relaxed text-lg text-ink-medium">คัดสรรถ้อยคำในจังหวะที่เชื่องช้า เพื่อให้จิตใจได้พักผ่อนจากการเร่งรีบ</p>
            </div>
            <div className="text-center group md:border-x border-stone-200 md:px-8">
              <div className="text-4xl mb-6 opacity-30 font-pattaya text-zen-red">弐</div>
              <h4 className="text-xl mb-4 tracking-widest group-hover:text-zen-red transition-colors text-ink-dark">การพินิจ</h4>
              <p className="font-light leading-relaxed text-lg text-ink-medium">มองลึกในความหมายที่ซ่อนอยู่ระหว่างบรรทัด มากกว่าเพียงการอ่าน</p>
            </div>
            <div className="text-center group">
              <div className="text-4xl mb-6 opacity-30 font-pattaya text-zen-red">参</div>
              <h4 className="text-xl mb-4 tracking-widest group-hover:text-zen-red transition-colors text-ink-dark">รอยจารึก</h4>
              <p className="font-light leading-relaxed text-lg text-ink-medium">ทุกตัวอักษรคือการบันทึกจิตวิญญาณ ที่จะคงอยู่แม้กาลเวลาจะผ่านไป</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Sign-up */}
      <section className="py-24 md:py-32 px-6 md:px-10 bg-white relative">
        <div className="max-w-2xl mx-auto text-center">
          <span className="font-header text-zen-red tracking-widest text-sm uppercase mb-4 block font-medium">จดหมายข่าวรอยอักษร</span>
          <h2 className="font-header text-4xl md:text-5xl text-stone-800 mb-6">รับข่าวสารและบทความก่อนใคร</h2>
          <p className="font-light text-stone-600 mb-10 text-lg leading-relaxed">
            มาร่วมแลกเปลี่ยนมุมมองแห่งตัวอักษร เราจะส่งบทความ คติ ข้อคิด และอัปเดตใหม่ๆ ตรงถึงกล่องจดหมายของคุณด้วยภาษาที่งดงามตามแบบฉบับรอยอักษร
          </p>
          <form className="relative flex items-center shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="กรอกอีเมลของคุณที่นี่..." 
              className="w-full py-4 pl-6 pr-20 bg-white border border-stone-200 outline-none font-header text-stone-800 focus:border-zen-red transition-colors placeholder:text-stone-400"
              required
            />
            <button type="submit" className="absolute right-2 p-2 bg-zen-red text-white hover:bg-[#8A1818] transition-colors rounded-sm group flex items-center justify-center w-12 h-10">
              <MoveRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="ink-wash text-stone-500 py-20 text-center relative z-20">
        <div className="flex justify-center gap-3 mb-8">
          <div className="w-16 h-[1px] mt-2 bg-gradient-to-r from-transparent to-white/15"></div>
          <span className="text-white/20 text-sm">☸</span>
          <div className="w-16 h-[1px] mt-2 bg-gradient-to-l from-transparent to-white/15"></div>
        </div>
        <div className="flex justify-center gap-6 md:gap-10 mb-12">
          {["FB", "X", "IG"].map((social, idx) => (
            <Link key={idx} href="#" className="group flex flex-col items-center gap-3">
              <div className="w-12 h-12 md:w-14 md:h-14 border border-stone-700/50 rounded-full flex items-center justify-center group-hover:border-zen-red group-hover:bg-zen-red/10 group-hover:text-zen-red transition-all text-xs font-header text-stone-400">
                {social}
              </div>
            </Link>
          ))}
        </div>
        <p className="font-header text-[10px] tracking-[0.8em] uppercase opacity-40 text-stone-400">
          รอยอักษร · RoyAksorn · พ.ศ. ๒๕๖๙
        </p>
      </footer>
    </div>
  );
}
