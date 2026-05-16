"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { Camera, Edit2, Plus, Image as ImageIcon, X, Trash2, ArrowLeft } from "lucide-react";

interface Post {
  id: string;
  uid: string;
  text: string;
  imageUrl?: string;
  createdAt: number;
}

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
  const [coverUrl, setCoverUrl] = useState("https://picsum.photos/seed/cover/1200/400"); // default cover

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
  // File Handlers
  // ------------------------------------
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
    setPenNames(penNames.filter(name => name !== nameToRemove));
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
  const displayAlias = userData?.alias || "หนอนหนังสือผู้หิวโหย";
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
              className="bg-white/90 text-stone-900 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-white"
            >
              <Camera className="w-4 h-4"/> เปลี่ยนรูปปก
            </button>
            <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setCoverUrl)} />
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
              <button 
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-2 right-2 bg-stone-100 text-stone-700 p-2 rounded-full border border-stone-300 shadow hover:bg-stone-200 transition-colors"
                title="แก้ไขรูปโปรไฟล์"
              >
                <Camera className="w-5 h-5"/>
              </button>
              <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setAvatarUrl)} />
            </div>

            <div className="mt-4 md:mt-0 flex gap-3">
              <button 
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="bg-stone-100 text-stone-800 px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold hover:bg-stone-200 transition-colors text-sm"
              >
                <Edit2 className="w-4 h-4"/> {isEditingProfile ? "ยกเลิกแก้ไข" : "แก้ไขโปรไฟล์"}
              </button>
            </div>
          </div>

          {!isEditingProfile ? (
            <div className="mt-4">
              <h1 className="text-3xl font-bold text-stone-800">{displayName}</h1>
              <p className="text-zen-red font-semibold mb-3">{displayAlias}</p>
              
              {penNames.length > 0 && (
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="text-sm text-stone-500 font-semibold">นามปากกา:</span>
                  {penNames.map(name => (
                    <span key={name} className="px-3 py-1 bg-parchment text-stone-700 text-xs rounded-full border border-parchment-dark">
                      {name}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-stone-600 font-light whitespace-pre-wrap">{displayBio}</p>
            </div>
          ) : (
            <div className="mt-4 bg-stone-50 p-6 rounded-xl border border-stone-200">
              <h3 className="font-bold text-lg mb-4 text-stone-800">แก้ไขข้อมูลส่วนตัว</h3>
              
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
                <label className="block text-sm text-stone-500 mb-1 font-semibold">นามปากกา</label>
                <div className="flex gap-2 mb-2">
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
                <div className="flex flex-wrap gap-2">
                  {penNames.map(name => (
                    <span key={name} className="px-3 py-1 bg-white border border-stone-300 text-stone-700 text-sm rounded-full flex items-center gap-2">
                      {name}
                      <button onClick={() => handleRemovePenName(name)} className="text-stone-400 hover:text-red-500"><X className="w-3 h-3"/></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setIsEditingProfile(false)} className="px-5 py-2 text-stone-600 font-semibold hover:bg-stone-200 rounded-lg">ยกเลิก</button>
                <button onClick={handleSaveProfile} className="px-5 py-2 bg-zen-red text-white font-semibold rounded-lg shadow hover:bg-[#8f1717]">บันทึกการแก้ไข</button>
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
    </div>
  );
}
