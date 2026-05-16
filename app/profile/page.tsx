"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { Camera, Edit2, Plus, Image as ImageIcon, X, Trash2, ArrowLeft, Crop as CropIcon, Check, ChevronRight, UserCircle, Settings } from "lucide-react";
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop';

interface Post {
  id: string;
  uid: string;
  text: string;
  imageUrl?: string;
  createdAt: number;
}

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return canvas.toDataURL('image/jpeg');
};

const ADDITIONAL_ALIASES = [
  'ผู้ท่องในพงศาวดาร', 'ผู้พิทักษ์ศาสตร์', 'อัศวินหมึกดำ', 'ราชันย์ปลายปากกา', 'นักอ่านผู้โดดเดี่ยว',
  'บุปผาแห่งอักษร', 'เจ้าชายกระดาษ', 'ผู้วิเศษแห่งวรรณกรรม', 'ดาราแห่งหนังสือ', 'เพลิงแห่งนักเขียน',
  'ผู้กลืนกินตัวอักษร', 'นักปราชญ์ในเงามืด', 'ผู้ไขปริศนากระดาษ', 'ลมหายใจแห่งนิทาน', 'เสียงกระซิบจากตำรา',
  'ผู้ลืมตาในหนังสือ', 'นักผจญภัยแห่งอักษร', 'ผู้วาดฝันจากน้ำหมึก', 'เงาแห่งหน้ากระดาษ', 'นักแปลจากต่างภพ',
  'จิตวิญญาณนักเขียน', 'ผู้ท่องกาลเวลา', 'นักสะสมความทรงจำ', 'ผู้สร้างจักรวาล', 'ผู้คุมกฎแห่งนิยาย',
  'เสียงสะท้อนจากบทกวี', 'ผู้เพาะเมล็ดพันธุ์', 'นักเดินเรือในทะเลอักษร', 'แสงแรกแห่งเรื่องราว', 'ผู้เปิดประตูมิติ',
  'ปีกแห่งจินตนาการ', 'ผู้ดับสูญในตอนจบ', 'นักอ่านผู้ไม่เคยหลับ', 'เงาสะท้อนบทความ'
];
const ALL_ALIASES = [
  'หนอนหนังสือผู้หิวโหย', 'ดองจนเค็ม', 'จอมยุทธ์หน้ากระดาษ', 'ยอดนักอ่านขอบเตียง', 'ผู้เฝ้ากระดาษ', 'นิทราข้ามบท',
  ...ADDITIONAL_ALIASES
].slice(0, 40);

const ALL_BADGES = [
  { id: 'novice', label: 'นักอ่านฝึกหัด' },
  { id: 'enthusiast', label: 'ผู้หลงใหล' },
  { id: 'creator', label: 'นักเขียนหน้าใหม่' },
  { id: 'master', label: 'ปรมาจารย์' }
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [penNames, setPenNames] = useState<string[]>([]);
  const [newPenName, setNewPenName] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("https://picsum.photos/seed/cover/1200/400");

  const [alias, setAlias] = useState("หนอนหนังสือผู้หิวโหย");
  const [unlockedAliases, setUnlockedAliases] = useState<string[]>([]);
  const [showAlias, setShowAlias] = useState(true);

  const [badge, setBadge] = useState("");
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>(['novice']);

  // Modals
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isAliasModalOpen, setIsAliasModalOpen] = useState(false);
  const [isAllAliasGridOpen, setIsAllAliasGridOpen] = useState(false);
  
  // Crop states
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropAspect, setCropAspect] = useState(1);
  const [cropTarget, setCropTarget] = useState<'avatar' | 'cover' | null>(null);

  // Post states
  const [posts, setPosts] = useState<Post[]>([]);
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState<string>("");
  const [isPosting, setIsPosting] = useState(false);

  // Refs for file uploads
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const postImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData(currentUser.uid);
        await fetchPosts(currentUser.uid);
      } else {
        router.push("/");
      }
      setLoading(false);
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function fetchUserData(uid: string) {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      setUserData(data);
      setEditName(data.username || user?.displayName || "");
      setEditBio(data.bio || "");
      setAvatarUrl(data.avatarUrl || "");
      if (data.coverUrl) setCoverUrl(data.coverUrl);
      if (data.penNames) setPenNames(data.penNames || []);
      
      const currentAlias = data.alias || "หนอนหนังสือผู้หิวโหย";
      setAlias(currentAlias);
      
      // Init unlocked aliases (ensure current alias is always unlocked)
      const uAliases = data.unlockedAliases || [currentAlias];
      if (!uAliases.includes(currentAlias)) uAliases.push(currentAlias);
      setUnlockedAliases(uAliases);
      
      setShowAlias(data.showAlias !== false);
      
      setBadge(data.badge || "");
      setUnlockedBadges(data.unlockedBadges || ['novice']);
    }
  }

  async function fetchPosts(uid: string) {
    try {
      const q = query(collection(db, "posts"), where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      const fetchedPosts: Post[] = [];
      querySnapshot.forEach((doc) => {
        fetchedPosts.push({ id: doc.id, ...doc.data() } as Post);
      });
      // Sort in JS to avoid relying on Firebase indexes
      fetchedPosts.sort((a, b) => b.createdAt - a.createdAt);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }

  // ------------------------------------
  // File Handlers & Cropping
  // ------------------------------------
  const handleFileChangeForCrop = (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'cover', aspect: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCropImageSrc(ev.target.result as string);
          setCropAspect(aspect);
          setCropTarget(target);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setIsCropModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
    // reset input
    if (e.target) e.target.value = '';
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApplyCrop = async () => {
    if (cropImageSrc && croppedAreaPixels && cropTarget) {
      try {
        const croppedImage = await getCroppedImg(cropImageSrc, croppedAreaPixels);
        if (cropTarget === 'avatar') {
          setAvatarUrl(croppedImage);
        } else if (cropTarget === 'cover') {
          setCoverUrl(croppedImage);
        }
      } catch (e) {
        console.error(e);
      }
    }
    setIsCropModalOpen(false);
    setCropImageSrc(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setter(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ------------------------------------
  // Profile Update
  // ------------------------------------
  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        username: editName,
        bio: editBio,
        penNames: penNames,
        avatarUrl: avatarUrl,
        coverUrl: coverUrl,
        alias: alias,
        unlockedAliases: unlockedAliases,
        showAlias: showAlias,
        badge: badge,
        unlockedBadges: unlockedBadges
      });
      setIsEditingProfile(false);
      fetchUserData(user.uid);
      alert("บันทึกการแก้ไขสำเร็จ");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("ไม่สามารถบันทึกได้");
    }
  };

  const handleAddPenName = () => {
    if (newPenName.trim() && !penNames.includes(newPenName.trim())) {
      setPenNames([...penNames, newPenName.trim()]);
      setNewPenName("");
    }
  };

  const handleRemovePenName = (nameToRemove: string) => {
    setPenNames(penNames.filter(n => n !== nameToRemove));
  };
  
  const handleAvatarSelect = (url: string) => {
    setAvatarUrl(url);
    setIsAvatarModalOpen(false);
  };

  // ------------------------------------
  // Post Handlers
  // ------------------------------------
  const handleCreatePost = async () => {
    if (!user || (!postText.trim() && !postImage)) return;
    setIsPosting(true);
    try {
      const newPost = {
        uid: user.uid,
        text: postText.trim(),
        imageUrl: postImage,
        createdAt: Date.now(),
      };
      const docRef = await addDoc(collection(db, "posts"), newPost);
      setPosts([{ id: docRef.id, ...newPost }, ...posts]);
      setPostText("");
      setPostImage("");
    } catch (error) {
      console.error("Error creating post:", error);
      alert("ไม่สามารถโพสต์ได้");
    }
    setIsPosting(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("ลบโพสต์นี้หรือไม่?")) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-stone-100 flex items-center justify-center font-header">กำลังโหลด...</div>;
  }

  const displayName = userData?.username || user?.displayName || "ผู้จารึกอักษร";
  const displayBio = userData?.bio || "ยังไม่มีเรื่องราว...";

  return (
    <div className="min-h-screen bg-stone-100 font-header pb-20">
      {/* Top Navbar */}
      <nav className="flex justify-between items-center px-6 md:px-10 py-4 bg-white shadow-sm sticky top-0 z-50">
          <Link href="/" className="text-xl font-bold text-zen-red tracking-tighter flex items-center gap-2">
            <ArrowLeft className="w-5 h-5"/> ROY AKSORN
          </Link>
      </nav>

      <div className="max-w-4xl mx-auto bg-white shadow-sm min-h-screen relative">
        {/* Cover Photo */}
        <div className="relative h-64 md:h-80 w-full group overflow-hidden bg-stone-200">
          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              onClick={() => coverInputRef.current?.click()}
              className="bg-white/90 text-stone-900 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-white transition-all transform hover:scale-105"
            >
              <CropIcon className="w-4 h-4"/> เลือกรูปและครอป
            </button>
            <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChangeForCrop(e, 'cover', 3)} />
          </div>
        </div>

        {/* Profile Info Section */}
        <div className="px-6 md:px-10 pb-8 relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end -mt-16 md:-mt-20 mb-6 relative z-10">
            {/* Avatar */}
            <div className="relative group">
              <img 
                src={avatarUrl || `https://ui-avatars.com/api/?name=${displayName}&background=A31D1D&color=fff`} 
                alt="Avatar" 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white object-cover shadow-md bg-white" 
                referrerPolicy="no-referrer"
              />
              {isEditingProfile && (
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer border-4 border-transparent" onClick={() => avatarInputRef.current?.click()}>
                      <Camera className="w-8 h-8 text-white" />
                  </div>
              )}
              <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChangeForCrop(e, 'avatar', 1)} />
            </div>

            <div className="mt-4 md:mt-0 flex gap-3">
              <button 
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="bg-stone-100 text-stone-800 px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold hover:bg-stone-200 transition-colors text-sm"
              >
                <Edit2 className="w-4 h-4"/> {isEditingProfile ? "ดูโปรไฟล์ปกติ" : "แก้ไขโปรไฟล์"}
              </button>
            </div>
          </div>

          {!isEditingProfile ? (
            <div className="mt-4">
              <div className="flex items-center gap-3">
                 <h1 className="text-3xl font-bold text-stone-800">{displayName}</h1>
                 {badge && (
                    <span className="px-2 py-0.5 border-2 border-stone-800 text-stone-800 font-bold text-[10px] tracking-wider uppercase rounded-sm flex items-center gap-1 shadow-[2px_2px_0px_#292524]">
                      {ALL_BADGES.find(b => b.id === badge)?.label || badge}
                    </span>
                 )}
              </div>
              
              {showAlias && alias && (
                <p className="text-zen-red font-semibold mb-3">{alias}</p>
              )}
              
              {penNames.length > 0 && (
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="text-sm text-stone-500 font-semibold">นามปากกา:</span>
                  {penNames.map(n => (
                    <span key={n} className="px-3 py-1 bg-parchment text-stone-700 text-xs rounded-full border border-parchment-dark">
                      {n}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-stone-600 font-light whitespace-pre-wrap">{displayBio}</p>
            </div>
          ) : (
            <div className="mt-4 bg-stone-50 p-6 rounded-xl border border-stone-200">
              <h3 className="font-bold text-lg mb-4 text-stone-800 flex items-center gap-2">
                 <Settings className="w-5 h-5"/> การตั้งค่าโปรไฟล์
              </h3>

              {/* Avatar 96 Models Picker */}
              <div className="mb-6 pb-6 border-b border-stone-200">
                <label className="block text-sm text-stone-500 mb-2 font-semibold">อวาตาร์รอยอักษร (96 แบบ)</label>
                <button 
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="bg-white border border-stone-300 px-5 py-2.5 rounded-lg text-sm font-semibold hover:border-zen-red hover:text-zen-red flex items-center gap-2 transition-all w-fit text-stone-700"
                >
                  <UserCircle className="w-5 h-5"/> เลือกอวาตาร์สำเร็จรูป
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-stone-500 mb-1 font-semibold">ชื่อที่ใช้แสดง</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg p-2.5 outline-none focus:border-zen-red"
                  maxLength={50}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm text-stone-500 mb-1 font-semibold">คำแนะนำตัว (Bio)</label>
                <textarea 
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg p-2.5 outline-none focus:border-zen-red min-h-[80px]"
                  maxLength={160}
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm text-stone-500 mb-2 font-semibold">เข็มกลัด (Badge)</label>
                <div className="flex flex-wrap gap-2">
                    <button 
                       onClick={() => setBadge('')}
                       className={`px-3 py-1.5 rounded-sm border-2 text-sm font-bold transition-all ${!badge ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-400 border-stone-200 hover:border-stone-400'}`}
                    > 
                      ไม่แสดง 
                    </button>
                    {ALL_BADGES.map(b => (
                        <button 
                          key={b.id}
                          disabled={!unlockedBadges.includes(b.id)}
                          onClick={() => setBadge(b.id)}
                          className={`px-3 py-1.5 flex items-center gap-2 rounded-sm border-2 text-sm font-bold transition-all ${unlockedBadges.includes(b.id) ? (badge === b.id ? 'bg-stone-800 text-white border-stone-800 shadow-[2px_2px_0px_#292524]' : 'bg-white text-stone-700 border-stone-800 hover:bg-stone-100') : 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'}`}
                        >
                           {b.label}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-stone-400 mt-2">เข็มกลัดจะปลดล็อกตามความสำเร็จในการใช้งานระบบ</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-stone-500 mb-1 font-semibold">นามปากกา (Pen Name)</label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text" 
                    value={newPenName}
                    onChange={(e) => setNewPenName(e.target.value)}
                    placeholder="เพิ่มนามปากกาใหม่..."
                    className="flex-1 border border-stone-300 rounded-lg p-2.5 outline-none focus:border-zen-red"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPenName()}
                  />
                  <button onClick={handleAddPenName} className="bg-stone-200 px-4 rounded-lg hover:bg-stone-300 text-stone-700 font-semibold">
                    เพิ่ม
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {penNames.map(n => (
                    <span key={n} className="px-3 py-1 bg-white border border-stone-300 text-stone-700 text-sm rounded-full flex items-center gap-2 shadow-sm">
                      {n}
                      <button onClick={() => handleRemovePenName(n)} className="text-stone-400 hover:text-red-500"><X className="w-3 h-3"/></button>
                    </span>
                  ))}
                </div>

                <div className="pt-4 border-t border-stone-200">
                    <label className="block text-sm text-stone-500 mb-2 font-semibold">ฉายาปัจจุบัน (Alias)</label>
                    <div className="flex items-center gap-4">
                      {alias ? (
                          <span className="text-zen-red font-bold">{alias}</span>
                      ) : (
                          <span className="text-stone-400 italic">ไม่ได้เลือกฉายา</span>
                      )}
                      
                      <button 
                        onClick={() => setIsAliasModalOpen(true)}
                        className="bg-white border text-zen-red border-zen-red px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-zen-red hover:text-white transition-all shadow-sm"
                      >
                        เปลี่ยนฉายา
                      </button>
                    </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button onClick={() => setIsEditingProfile(false)} className="px-5 py-2 text-stone-600 font-semibold hover:bg-stone-200 rounded-lg">ยกเลิก</button>
                <button onClick={handleSaveProfile} className="px-5 py-2 bg-zen-red text-white font-semibold rounded-lg shadow-md hover:bg-[#8f1717]">บันทึกการตั้งค่า</button>
              </div>
            </div>
          )}
        </div>

        <div className="h-[1px] bg-stone-200 mx-6 md:mx-10 mb-8"></div>

        {/* Two Column Layout for Desktop */}
         <div className="px-6 md:px-10 flex flex-col md:flex-row gap-6 pb-10">
          
          {/* Left Sidebar (Intro) */}
          <div className="w-full md:w-1/3 shrink-0">
            <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 sticky top-24">
              <h3 className="font-bold text-stone-800 text-lg mb-4">แนะนำตัว</h3>
              <p className="text-stone-600 text-sm font-light mb-4 text-center">
                &quot;ศิลปะแห่งตัวอักษรคือการสะท้อนตัวตน&quot;
              </p>
              <Link href="/library" className="block w-full bg-stone-200 text-stone-800 text-center py-2.5 rounded-lg font-semibold hover:bg-stone-300 transition-colors">
                ไปยังคลังงานเขียน
              </Link>
            </div>
          </div>

          {/* Right Main Content (Timeline) */}
          <div className="flex-1 w-full">
            
            {/* Create Post Box */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm mb-6">
              <div className="flex gap-3 mb-3">
                <img src={avatarUrl || `https://ui-avatars.com/api/?name=${displayName}&background=A31D1D&color=fff`} className="w-10 h-10 rounded-full object-cover bg-stone-100" alt="Avatar"/>
                <textarea 
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder={`คุณกำลังคิดอะไรอยู่ ${displayName}?`}
                  className="flex-1 bg-stone-50 rounded-xl p-3 resize-none outline-none focus:ring-1 focus:ring-zen-red/50 text-stone-800 text-lg"
                  rows={postImage ? 2 : 3}
                ></textarea>
              </div>
              
              {postImage && (
                <div className="relative mb-3 ml-13 mr-2 bg-stone-100 rounded-xl overflow-hidden border border-stone-200">
                  <img src={postImage} alt="Post preview" className="w-full max-h-[400px] object-contain" />
                  <button 
                    onClick={() => setPostImage("")}
                    className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-stone-700 hover:bg-white shadow"
                  >
                    <X className="w-4 h-4"/>
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-stone-100 ml-13">
                <div className="flex gap-2">
                  <button 
                    onClick={() => postImageInputRef.current?.click()}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors flex items-center gap-2"
                  >
                    <ImageIcon className="w-5 h-5"/>
                    <span className="font-semibold text-sm hidden sm:block">รูปภาพ</span>
                  </button>
                  <input type="file" ref={postImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setPostImage)} />
                </div>
                <button 
                  disabled={isPosting || (!postText.trim() && !postImage)}
                  onClick={handleCreatePost}
                  className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${
                    !postText.trim() && !postImage ? "bg-stone-200 text-stone-400" : "bg-zen-red text-white shadow hover:bg-[#8f1717]"
                  }`}
                >
                  {isPosting ? 'กำลังโพสต์...' : 'โพสต์'}
                </button>
              </div>
            </div>

            {/* Posts List */}
            <div className="flex flex-col gap-6">
              {posts.map(post => (
                <div key={post.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <img src={avatarUrl || `https://ui-avatars.com/api/?name=${displayName}&background=A31D1D&color=fff`} className="w-10 h-10 rounded-full object-cover" alt="Author"/>
                      <div>
                        <h4 className="font-bold text-stone-800 text-md leading-none mb-1">{displayName}</h4>
                        <span className="text-xs text-stone-500 font-light">{new Date(post.createdAt).toLocaleString('th-TH')}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="text-stone-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                  
                  {post.text && (
                    <p className="text-stone-800 text-md whitespace-pre-wrap mb-4 font-light leading-relaxed">
                      {post.text}
                    </p>
                  )}
                  
                  {post.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-stone-200 mt-2 bg-stone-50">
                       <img src={post.imageUrl} alt="Post image" className="w-full max-h-[500px] object-contain" />
                    </div>
                  )}
                </div>
              ))}
              
              {posts.length === 0 && (
                <div className="text-center py-20 bg-stone-50 rounded-xl border border-dashed border-stone-300">
                  <p className="text-stone-500 font-light text-lg">ยังไม่มีโพสต์ในไทม์ไลน์ของคุณ</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {isCropModalOpen && cropImageSrc && (
          <div className="fixed inset-0 bg-stone-900/90 z-[6000] p-4 flex flex-col justify-center items-center backdrop-blur-sm">
              <div className="relative w-full max-w-2xl h-[60vh] bg-stone-100 rounded-xl overflow-hidden shadow-2xl mb-4">
                  <Cropper
                    image={cropImageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={cropAspect}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
              </div>
              <div className="flex gap-4">
                  <button onClick={() => setIsCropModalOpen(false)} className="px-6 py-3 bg-stone-700 text-white font-bold rounded-lg hover:bg-stone-600 transition-colors">
                      ยกเลิก
                  </button>
                  <button onClick={handleApplyCrop} className="px-6 py-3 bg-zen-red text-white font-bold rounded-lg shadow-lg hover:bg-[#8f1717] transition-colors flex items-center gap-2">
                      <Check className="w-5 h-5"/> ยืนยันการตัด
                  </button>
              </div>
          </div>
      )}

      {/* Avatar Modal (96 Items) */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 bg-black/85 z-[6000] p-6 md:p-12 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-stone-50 w-full max-w-[900px] h-[80vh] p-6 md:p-10 rounded-xl shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-2xl md:text-3xl font-bold text-stone-900">คลังอวาตาร์รอยอักษร (96 แบบ)</h3>
              <button onClick={() => setIsAvatarModalOpen(false)} className="text-red-700 font-bold hover:underline flex items-center gap-1">
                <X className="w-5 h-5"/> ปิด
              </button>
            </div>
            
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 overflow-y-auto pr-2 flex-1 pb-4">
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

      {/* Alias Modal */}
      {isAliasModalOpen && !isAllAliasGridOpen && (
        <div className="fixed inset-0 bg-stone-900/60 z-[6000] p-4 flex flex-col justify-center items-center backdrop-blur-md">
            <div className="bg-gradient-to-br from-white/95 to-white/80 w-full max-w-2xl p-8 rounded-3xl shadow-2xl border border-white relative overflow-hidden backdrop-blur-xl">
                 <div className="absolute -top-32 -right-32 w-64 h-64 bg-zen-red/10 rounded-full blur-3xl"></div>
                 <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-zen-red/10 rounded-full blur-3xl"></div>
                 
                 <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-3xl font-bold text-stone-900 tracking-tight">เลือกฉายาประจำตัว</h3>
                        <button onClick={() => setIsAliasModalOpen(false)} className="text-stone-400 hover:text-zen-red transition-colors p-2 bg-stone-100 rounded-full">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>

                    <div className="flex items-center gap-3 mb-6 bg-white/50 p-4 rounded-xl border border-stone-200/50">
                        <input 
                            type="checkbox" 
                            id="show-alias" 
                            checked={showAlias} 
                            onChange={(e) => setShowAlias(e.target.checked)}
                            className="w-5 h-5 accent-zen-red"
                        />
                        <label htmlFor="show-alias" className="text-stone-700 font-semibold cursor-pointer">แสดงฉายาบนหน้าโปรไฟล์</label>
                    </div>

                    <p className="text-stone-500 mb-4 font-semibold text-sm">คอลเลกชันหกวิญญาณแห่งตัวอักษร (เริ่มต้น)</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                        {ALL_ALIASES.slice(0, 6).map((opt) => {
                            const isUnlocked = unlockedAliases.includes(opt);
                            return (
                                <button 
                                  key={opt}
                                  disabled={!isUnlocked}
                                  onClick={() => setAlias(opt)}
                                  className={`relative overflow-hidden py-4 px-3 rounded-xl text-sm text-center transition-all font-bold ${
                                    alias === opt 
                                      ? 'bg-zen-red border-zen-red text-white shadow-[0_8px_20px_rgba(163,29,29,0.3)] scale-105 z-10' 
                                      : isUnlocked
                                        ? 'bg-white border-stone-200 border text-stone-600 hover:border-zen-red hover:text-zen-red hover:-translate-y-1'
                                        : 'bg-stone-50 border-stone-200 border text-stone-400 cursor-not-allowed opacity-60 grayscale'
                                  }`}
                                >
                                  {opt}
                                  {!isUnlocked && (
                                    <span className="absolute top-1 right-2 text-[10px] text-stone-400 font-normal tracking-wide">Locked</span>
                                  )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-center">
                        <button 
                            onClick={() => setIsAllAliasGridOpen(true)}
                            className="text-zen-red font-bold hover:underline flex items-center gap-1 group"
                        >
                            ดูคลังฉายาทั้งหมด 40 ฉายา <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                        </button>
                    </div>
                 </div>
            </div>
        </div>
      )}

      {/* All Alias Grid Modal */}
      {isAllAliasGridOpen && (
        <div className="fixed inset-0 bg-stone-900/80 z-[6500] p-4 flex flex-col justify-center items-center backdrop-blur-md">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col relative overflow-hidden ring-1 ring-stone-200/50">
                 
                 <div className="p-6 md:p-8 border-b border-stone-200 flex justify-between items-center shrink-0 bg-stone-50">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
                            <button onClick={() => setIsAllAliasGridOpen(false)} className="p-2 hover:bg-stone-200 rounded-full transition-colors"><ArrowLeft className="w-6 h-6"/></button>
                            คลังฉายาทั้งหมด 
                        </h3>
                        <p className="text-stone-500 mt-1 ml-11 font-medium text-sm">คุณปลดล็อกไปแล้ว {unlockedAliases.length} / {ALL_ALIASES.length} ฉายา</p>
                    </div>
                    <button onClick={() => { setIsAllAliasGridOpen(false); setIsAliasModalOpen(false); }} className="text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors p-3 bg-white border border-stone-200 rounded-full">
                        <X className="w-6 h-6"/>
                    </button>
                 </div>

                 <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-stone-100">
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                        {ALL_ALIASES.map((opt) => {
                            const isUnlocked = unlockedAliases.includes(opt);
                            return (
                                <button 
                                  key={opt}
                                  disabled={!isUnlocked}
                                  onClick={() => { setAlias(opt); setIsAllAliasGridOpen(false); }}
                                  className={`py-4 px-2 md:px-4 rounded-xl text-xs md:text-sm text-center transition-all font-bold flex flex-col items-center justify-center gap-1 ${
                                    alias === opt 
                                      ? 'bg-zen-red border-[1.5px] border-zen-red text-white shadow-lg scale-105 z-10' 
                                      : isUnlocked
                                        ? 'bg-white border-stone-200 border hover:border-zen-red hover:shadow-md text-stone-700'
                                        : 'bg-stone-200 border-stone-300 border text-stone-400 cursor-not-allowed opacity-70 grayscale'
                                  }`}
                                >
                                  {opt}
                                  {!isUnlocked && (
                                     <span className="text-[10px] bg-stone-300 text-stone-500 px-2 rounded-full font-medium mt-1">Locked</span>
                                  )}
                                </button>
                            );
                        })}
                    </div>
                 </div>
            </div>
        </div>
      )}

    </div>
  );
}
