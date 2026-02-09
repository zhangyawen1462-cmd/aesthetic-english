"use client";

import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Search, BookOpen, ArrowUpRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const VINTAGE_GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`;

const ALL_ARCHIVES = [
  { id: "d-1", category: "daily", ep: "05", title: "Morning Rituals", tags: ["#Vlog", "#Ritual"], date: "FEB 24", baseColor: "bg-[#F2EFE5]", textColor: "text-[#2b0b0b]", overlayColor: "bg-[#F2EFE5]/70", desc: "The quiet aesthetics of waking up." },
  { id: "d-2", category: "daily", ep: "04", title: "Coffee Culture", tags: ["#Life", "#Savor"], date: "FEB 24", baseColor: "bg-[#F2EFE5]", textColor: "text-[#2b0b0b]", overlayColor: "bg-[#F2EFE5]/70", desc: "Sip, savor, silence." },
  { id: "c-1", category: "cognitive", ep: "02", title: "Deep Focus State", tags: ["#Flow", "#Mind"], date: "JAN 24", baseColor: "bg-[#2C333F]", textColor: "text-[#E6E0D4]", overlayColor: "bg-[#2C333F]/50", desc: "Entering the zone of pure thought." },
  { id: "c-2", category: "cognitive", ep: "01", title: "The Ego Trap", tags: ["#Self", "#Philosophy"], date: "JAN 24", baseColor: "bg-[#2C333F]", textColor: "text-[#E6E0D4]", overlayColor: "bg-[#2C333F]/50", desc: "Philosophy of the self." },
  { id: "b-1", category: "business", ep: "02", title: "The Negotiation", tags: ["#Win", "#Strategy"], date: "DEC 23", baseColor: "bg-[#2b0b0b]", textColor: "text-[#E6E0D4]", overlayColor: "bg-[#2b0b0b]/40", desc: "Win without war." },
  { id: "b-2", category: "business", ep: "01", title: "Leadership Core", tags: ["#Power"], date: "DEC 23", baseColor: "bg-[#2b0b0b]", textColor: "text-[#E6E0D4]", overlayColor: "bg-[#2b0b0b]/40", desc: "Influence and power dynamics." },
];

// 核心修复：将逻辑移入这个被 Suspense 包裹的子组件中
function ArchiveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState(searchParams.get("filter") || "all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = ALL_ARCHIVES.filter(item => {
    const matchesFilter = activeFilter === "all" || item.category === activeFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <motion.div initial={{ height: "100vh" }} animate={{ height: 0 }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }} className="absolute top-0 left-0 w-full z-[100] bg-[#1a0505] pointer-events-none" />
      <div className="fixed top-0 right-10 z-[60] group cursor-pointer" onClick={() => router.push('/dashboard/notebook')}>
        <motion.div initial={{ y: -10 }} whileHover={{ y: 0 }} className="relative w-10 h-32 bg-[#4A0404] shadow-2xl rounded-b-sm flex flex-col items-center justify-end pb-4 transition-all duration-500 ease-out hover:h-40">
          <div className="absolute inset-0 bg-noise opacity-20 mix-blend-multiply" />
          <div className="relative z-10 flex flex-col items-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
             <span style={{ writingMode: 'vertical-rl' }} className="text-[9px] uppercase tracking-[0.2em] text-[#E6E0D4] font-serif">Notebook</span>
             <BookOpen size={14} className="text-[#E6E0D4]" />
          </div>
        </motion.div>
      </div>
      <header className="sticky top-0 z-50 flex w-full items-center justify-between px-8 py-8 backdrop-blur-sm border-b border-[#2b0b0b]/5 bg-[#E6E0D4]/80 text-[#2b0b0b]">
        <Link href="/dashboard" className="group flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] opacity-60 hover:opacity-100 transition-opacity">
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
          <span>Lobby</span>
        </Link>
        <span className="text-[10px] uppercase tracking-widest opacity-30 font-serif">Archived Collection</span>
      </header>
      <main className="relative z-10 mx-auto max-w-7xl px-8 py-16">
        <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-[#2b0b0b]/10 pb-12">
          <div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-serif text-6xl md:text-7xl italic text-[#2b0b0b] mb-8 tracking-tight opacity-90">The Archive.</motion.h1>
            <div className="flex items-center gap-4 border-b-2 border-[#2b0b0b]/10 pb-3 w-full md:w-96 transition-colors focus-within:border-[#2b0b0b]">
              <Search size={18} className="text-[#2b0b0b]/40" />
              <input type="text" placeholder="Search..." className="bg-transparent text-sm outline-none text-[#2b0b0b] w-full font-serif italic" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {['all', 'daily', 'cognitive', 'business'].map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)} className={`px-6 py-2 rounded-[2px] text-[10px] uppercase tracking-[0.2em] border transition-all ${activeFilter === f ? "bg-[#2b0b0b] text-[#E6E0D4]" : "text-[#2b0b0b]/50 border-[#2b0b0b]/10"}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-16">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <PaperCard key={item.id} item={item} index={index} />
            ))}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}

// 主导出组件
export default function VintageArchive() {
  return (
    <div className="min-h-screen w-full bg-[#E6E0D4] relative overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60 mix-blend-multiply" style={{ backgroundImage: VINTAGE_GRAIN }} />
      <Suspense fallback={<div className="flex h-screen items-center justify-center font-serif italic opacity-50">Loading Archives...</div>}>
        <ArchiveContent />
      </Suspense>
      <footer className="py-10 text-center opacity-20">
         <span className="font-serif italic text-[10px] text-[#2b0b0b]">Curated by Scarlett Zhang</span>
      </footer>
    </div>
  );
}

function PaperCard({ item, index }: { item: any, index: number }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.8, delay: index * 0.05, ease: [0.2, 0.65, 0.3, 0.9] }}>
      <Link href={`/course/${item.category}/${item.id}`} className="group block h-full">
        <div className={`relative h-[450px] p-8 flex flex-col justify-between border border-black/5 group-hover:-translate-y-2 transition-all duration-700 ${item.baseColor} ${item.textColor}`}>
          <div className={`absolute inset-0 z-10 backdrop-blur-[2px] group-hover:opacity-0 transition-all duration-1000 ${item.overlayColor}`} style={{ opacity: 0.8 }} />
          <div className="flex justify-between items-center opacity-40 z-0 relative group-hover:opacity-100">
             <div className="h-[1px] w-8 bg-current" />
             <span className="text-[9px] uppercase tracking-[0.2em] font-bold">{item.date}</span>
          </div>
          <div className="relative z-20">
             <h3 className="font-serif text-4xl leading-[0.9] mb-4">{item.title}</h3>
             <p className="text-xs opacity-60 mb-8 font-serif italic">{item.desc}</p>
             <div className="flex justify-between items-end border-t border-current/10 pt-5">
                <div className="flex gap-2">
                  {item.tags.map((tag: string) => <span key={tag} className="text-[9px] uppercase border border-current/10 px-2 py-1">{tag}</span>)}
                </div>
                <ArrowUpRight size={20} className="opacity-0 group-hover:opacity-100 transition-all" />
             </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}