import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { MessageSquare, Send, X, BookOpen, Building2, Briefcase, GraduationCap, ChevronDown, User, Shield, Target, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const memories = [
  "/images/1.jpg",
  "/images/2.jpg",
  "/images/3.jpg",
  "/images/4.jpg",
];

// Helper for typewriting scroll text using Framer Motion
const TypewriterText = ({ text, className = "", delay = 0 }: { text: string, className?: string, delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  // Split text into words to wrap them easily, then split into characters
  return (
    <span ref={ref} className={className}>
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.1, delay: delay + index * 0.02 }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
};

// Scroll Reveal Wrapper
const ScrollReveal = ({ children, delay = 0, className = "", onClick }: { children: React.ReactNode, delay?: number, className?: string, onClick?: () => void }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 30 }} transition={{ duration: 0.8, delay, ease: "easeOut" }} className={className} onClick={onClick}>
      {children}
    </motion.div>
  );
};

const CategoryDetailsModal = ({ isOpen, onClose, category }: { isOpen: boolean, onClose: () => void, category: 'engineering' | 'management' | 'law' | 'pharmacy' | null }) => {
  const engineeringSections = [
    {
      title: "Program Overview",
      content: "Engineering at the GN Group of Institutes is centered on a four-year B.Tech program designed to develop students into Software Engineers, Developers, and Web Developers. The program is backed by a 20-year legacy of educational excellence and is approved by the AICTE."
    },
    {
      title: "Academic Affiliations and Colleges",
      content: "The institute offers engineering degrees through two distinct affiliations:\n• Greater Noida Institute of Technology (GNIT - IPU Campus): Affiliated with Guru Gobind Singh Indraprastha University (GGSIPU), New Delhi. Recognized as a Grade 'A' College by the JAC of GGSIPU and DHE, Govt. of NCT of Delhi.\n• Greater Noida College (GNC): Affiliated with Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow."
    },
    {
      title: "Specializations",
      content: "The curriculum focuses heavily on modern technology and computer science, offering branches such as:\n• Computer Science and Engineering (CSE)\n• CSE - Artificial Intelligence (AI) / AI & Machine Learning (AI & ML)\n• CSE - Data Science\n• Information Technology (IT) and Mechanical Engineering (ME)"
    },
    {
      title: "Faculty and Infrastructure",
      content: "Students are taught by highly qualified faculty from IITs, NITs, IIITs, and IIMs. Facilities include computer labs, an iOS Lab, a Communication Lab, workshops, and a comprehensive library."
    },
    {
      title: "Innovation and Research",
      content: "Achievements: GNIT IPU students recognized at Smart India Hackathon 2025 for 'Innovation for Farmers'.\nEvents: Hosts TECHQUEST 2026 and the PTEMS-2026 International Conference on progressive trends in engineering."
    },
    {
      title: "Career and Placements",
      content: "The group has a strong track record of professional success:\n• Highest Package: 50 LPA.\n• Support: Dedicated Placement Cell, industry mentors, and regular virtual placement drives.\n• Alumni: A global network of over 23,000 leaders."
    },
    {
      title: "Admissions and Fees",
      content: "Admissions for 2026-27 are currently open (JEE Main 2026 / IPU CET 2026 support). Annual fees range from ₹1.21L (AKTU) to ₹1.43L (IPU), with lower rates for lateral entry."
    }
  ];

  const managementSections = [
    {
      title: "Program Overview",
      content: "Management education at the GN Group encompasses undergraduate and postgraduate programs designed to prepare students for the corporate world through professional grooming and industrial exposure."
    },
    {
      title: "Postgraduate Programs",
      content: "• MBA (Master of Business Administration): Available at GNIT College of Management (GNITCM), affiliated with AKTU, Lucknow.\n• PGDM (Post Graduate Diploma in Management): Offered at the Greater Noida Institute of Management (GNIM), featuring dual specialization."
    },
    {
      title: "Undergraduate Programs",
      content: "Offered through GNIM and affiliated with CCSU, Meerut:\n• BBA (Bachelor of Business Administration)\n• BCA (Bachelor of Computer Application)\n• B.Com (Bachelor of Commerce)"
    },
    {
      title: "Key Features",
      content: "• Expert Faculty: Highly qualified members from IIMs and other top universities.\n• Skill Development: Emphasis on personality enhancement, soft skills, and professional grooming."
    },
    {
      title: "Practical Exposure & Innovation",
      content: "• Practical Learning: Industrial visits (e.g., Parle) and events like 'SHARK TANK PITCH'.\n• Research: Advanced tools workshops and the PTEMS-2026 International Conference."
    },
    {
      title: "Career Outcomes",
      content: "• Highest Package: 50 LPA.\n• Support: Dedicated Placement Cell and industry mentors ensure high success rates."
    }
  ];

  const lawSections = [
    {
      title: "Program Overview",
      content: "Law programs at the GN Group of Institutes are offered through the Greater Noida College of Law (GNCL). The legal education curriculum is designed to provide comprehensive training for aspiring legal professionals and is supported by specialized infrastructure like a Moot Court."
    },
    {
      title: "Accreditations and Affiliations",
      content: "All law courses offered by the institute are:\n• Approved by the Bar Council of India (BCI).\n• Affiliated with Chaudhary Charan Singh University (CCSU), Meerut."
    },
    {
      title: "Academic Programs",
      content: "The institute offers both integrated and traditional law degrees:\n• B.A. LL.B: A five-year integrated undergraduate course.\n• B.Com. LL.B: A five-year integrated undergraduate course.\n• LL.B: A three-year traditional law degree."
    },
    {
      title: "Admissions",
      content: "Admissions are currently open for the 2026-27 academic session for both undergraduate and postgraduate diploma programs."
    }
  ];

  const pharmacySections = [
    {
      title: "Program Overview",
      content: "Pharmacy education at the GN Group of Institutes is primarily offered through the GNIT College of Pharmacy (GNITCP) and is designed to prepare students for professional practice in the pharmaceutical sector."
    },
    {
      title: "Academic Programs",
      content: "• B.Pharm (Bachelor of Pharmacy): A four-year undergraduate degree affiliated with AKTU, Lucknow and approved by the Pharmacy Council of India (PCI).\n• D.Pharm (Diploma in Pharmacy): A two-year diploma course affiliated with the Board of Technical Education (BTE) and approved by the PCI."
    },
    {
      title: "Facilities and Leadership",
      content: "Infrastructure: Students have access to specialized Pharmacy Labs to support practical and research-based learning.\nLeadership: Shikha Parmar serves as the Director and Professor for GNITCP."
    },
    {
      title: "Career and Legacy",
      content: "GN Group has a 20-year legacy in quality education. Pharmacy students benefit from a dedicated Placement Cell with a record package of 50 LPA. Admissions for 2026-27 are now open."
    }
  ];

  const getCategoryData = () => {
    switch (category) {
      case 'engineering':
        return { 
          sections: engineeringSections, 
          title: "Engineering at GN Group", 
          icon: <BookOpen size={24} /> 
        };
      case 'management':
        return { 
          sections: managementSections, 
          title: "Management at GN Group", 
          icon: <Briefcase size={24} /> 
        };
      case 'law':
        return { 
          sections: lawSections, 
          title: "Law at GN Group", 
          icon: <Shield size={24} /> 
        };
      case 'pharmacy':
        return { 
          sections: pharmacySections, 
          title: "Pharmacy at GN Group", 
          icon: <Target size={24} /> 
        };
      default:
        return { sections: [], title: "", icon: null };
    }
  };

  const { sections, title, icon } = getCategoryData();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[85vh] bg-card border shadow-2xl rounded-3xl overflow-hidden flex flex-col"
          >
            <div className="bg-primary/5 p-6 border-b flex justify-between items-center">
              <div className="flex items-center gap-3 text-primary">
                {icon}
                <h3 className="font-bold text-xl">{title}</h3>
              </div>
              <button onClick={onClose} className="hover:bg-muted p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-muted/10">
              {sections.map((sec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.15, duration: 0.5 }}
                >
                  <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {sec.title}
                  </h4>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap pl-3.5">
                    {sec.content}
                  </p>
                </motion.div>
              ))}
            </div>
            <div className="p-4 bg-card border-t flex justify-end">
              <Button onClick={onClose} className="rounded-full px-8 hover:scale-105 transition-transform shadow-lg">Close Details</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import { GoogleGenerativeAI } from "@google/generative-ai";

const GNBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([{ role: 'assistant', content: '👋 Hi! I\'m the Campus HuB AI — your guide to both GN Group of Institutes and our smart campus platform.\n\nAsk me anything:\n• 🎓 "What courses do you offer?"\n• 🤖 "What can the Campus HuB app do?"\n• 📋 "How does Face ID login work?"\n• 📍 "Where is the campus located?"' }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => scrollToBottom(), [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // System Prompt for Strictness
      const STRICT_SYSTEM_PROMPT = `ROLE: Official Assistant for GN Group & Campus HuB AI.

STRICT RULE: You ONLY answer questions about GN Group of Institutes (Greater Noida) OR the Campus HuB AI platform. 

REJECT ALL OTHER TOPICS: If a user asks about anything else (e.g., general knowledge, coding help, other colleges, personal life, news, math, recipes, or "what is AI"), you MUST politely decline. Use this response: "I am strictly focused on providing information about GN Group of Institutes and the Campus HuB AI platform. Please ask me about our courses, features, or admissions."

KNOWLEDGE BASE:
- INSTITUTION: GN Group (Greater Noida). 20yr legacy. Grade 'A' GGSIPU. Placements up to 50 LPA. 6000+ students. 
- PROGRAMS: B.Tech (CSE, AI, Data Science), MBA, PGDM, BBA, Law (BA LLB), Pharmacy (B.Pharm).
- PLATFORM (Campus HuB AI): Biometric Face Login, Voice Assistant, AI Quiz Generator, Document Vault, Attendance, Timetable, Notifications, Leaderboard.
- TECH: React, Flask, JWT, Gemini 1.5, TensorFlow (Face ID).

RESPONSE STYLE: 1-2 short sentences maximum. Be surgical and direct. No fluff.`;

      // Use the key from Vite env or common config
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `${STRICT_SYSTEM_PROMPT}\n\nUser: ${userMessage}\nAssistant:`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      setMessages((prev) => [...prev, { role: "assistant", content: text }]);
    } catch (error: any) {
      console.error("Gemini Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having trouble connecting right now. Please ask again about GN Group or Campus HuB features." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="absolute bottom-16 right-0 w-80 md:w-96 bg-card border shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[500px]">
            <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">GN Group Expert</h3>
                  <p className="text-xs opacity-80">Online & ready</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-primary-foreground hover:bg-primary-foreground/20 p-1 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/30">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border rounded-tl-sm shadow-sm'}`}>{m.content}</div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border p-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.2s'}} />
                    <span className="w-2 h-2 rounded-full bg-primary border animate-bounce" style={{ animationDelay: '0.4s'}} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-3 bg-card border-t flex gap-2 items-center">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about GN Group..." className="flex-1 bg-muted rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <button type="submit" disabled={isLoading || !input.trim()} className="bg-primary text-primary-foreground p-2 rounded-full hover:opacity-90 disabled:opacity-50 transition-all shrink-0"><Send size={18} className="translate-x-[1px]" /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col gap-3 items-end">
        <motion.button 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.1, x: -5 }} 
          whileTap={{ scale: 0.9 }} 
          onClick={() => document.getElementById('location-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="w-12 h-12 bg-background/40 backdrop-blur-xl border border-white/20 text-primary rounded-full drop-shadow-xl flex items-center justify-center relative shadow-glow overflow-hidden group"
          title="Navigate to Campus"
        >
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <MapPin size={22} className="relative z-10" />
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }} 
          onClick={() => setIsOpen(!isOpen)} 
          className="w-14 h-14 bg-primary text-primary-foreground rounded-full drop-shadow-lg flex items-center justify-center relative shadow-glow"
        >
          {isOpen ? <X size={24} /> : <><MessageSquare size={24} /><span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background animate-pulse" /></>}
        </motion.button>
      </div>
    </div>
  );
};

export default function GNGroupLanding() {
  const [modalState, setModalState] = useState<{ isOpen: boolean, category: 'engineering' | 'management' | 'law' | 'pharmacy' | null }>({
    isOpen: false,
    category: null
  });

  const handleCategoryClick = (category: 'engineering' | 'management' | 'law' | 'pharmacy') => {
    setModalState({ isOpen: true, category });
  };
  return (
    <div className="theme-campus-hub min-h-screen">
      <div className="bg-background text-foreground overflow-x-hidden pt-16">
        <nav className="fixed top-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-md border-b z-40 flex items-center justify-between px-6 md:px-12">
          <div className="flex items-center gap-3 group cursor-pointer overflow-hidden p-2 rounded-xl" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-primary/20 shadow-sm group-hover:scale-105 transition-transform duration-300">
              <img src="/images/logo.jpg" alt="GN Group Logo" className="w-full h-full object-cover" />
              {/* Interactive Shine Hover on Logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-[shine_1s_ease-in-out_forwards]" />
            </div>
            <div className="font-bold text-lg tracking-tight relative overflow-hidden group">
              GN GROUP OF INSTITUTE
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/30 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-[shine_1s_ease-in-out_forwards]" />
            </div>
          </div>
          <div>
            <Link to="/login">
              <Button className="font-semibold shadow-md rounded-full px-6 relative overflow-hidden group">
                <span className="relative z-10">Login</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-[shine_1s_ease-in-out]" />
              </Button>
            </Link>
          </div>
        </nav>

        {/* Embedded Tailwand Custom Animations purely for the Shine */}
        <style>{`
          @keyframes shine {
            100% { transform: translateX(150%) skewX(-20deg); }
          }
        `}</style>

        {/* Hero Section */}
        <section className="relative px-6 py-12 md:py-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 overflow-hidden rounded-3xl mt-6 border border-primary/10 shadow-2xl">
          <div className="absolute inset-0 -z-20">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/50 z-10" />
            <div className="absolute inset-0 bg-primary/5 mix-blend-overlay z-10" />
            <img src="/images/bg.jpg" alt="Campus Background" className="w-full h-full object-cover opacity-50 dark:opacity-30 mix-blend-luminosity scale-105 transition-transform duration-[10000ms] hover:scale-110" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>

          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="flex-1 space-y-6 z-20">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-primary/10 text-primary border-primary/20 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              Admissions Open for 2026-27
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] drop-shadow-sm">
              Shaping Futures with <span className="text-primary tracking-normal filter drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]">Excellence</span> in Education.
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl max-w-[600px] leading-relaxed drop-shadow-sm font-medium">
              <TypewriterText text="20+ Years of Legacy. Grade 'A' College by JAC of GGSIPU. Imparting quality education in multidiscipline across Greater Noida." delay={0.5} />
            </p>
            <div className="flex flex-wrap gap-4 pt-6">
              <Button 
                size="lg" 
                className="rounded-full shadow-glow gap-2 text-base px-8 h-14 hover:scale-105 transition-all"
                onClick={() => window.open('https://www.gngroup.org/', '_blank')}
              >
                <GraduationCap size={20} /> Apply Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full gap-2 text-base px-8 h-14 border-primary/30 bg-background/50 backdrop-blur-md hover:bg-primary/10 transition-all"
                onClick={() => document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Courses
              </Button>
            </div>
          </motion.div>

          {/* First cinematic image beside the hero text */}
          <div className="flex-1 w-full flex justify-center h-[400px] lg:h-[500px] z-20 relative group">
            <div className="absolute inset-0 bg-primary/10 blur-[100px] -z-10 rounded-full" />
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative h-full w-full rotate-2 group-hover:rotate-0 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]">
              <img src={memories[0]} alt="Campus Memory 1" className="w-full h-full object-cover sepia-[.2] contrast-[1.1] saturate-50 transition-all duration-[1500ms] group-hover:scale-110 group-hover:sepia-0 group-hover:saturate-110" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-1000 mix-blend-multiply" />
            </div>
          </div>
        </section>

        {/* Courses Section alongside Photo 2 */}
        <section id="courses-section" className="bg-muted/30 py-24 mt-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <ScrollReveal className="flex-1 group relative h-[500px] w-full">
                <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative h-full w-full -rotate-2 group-hover:rotate-0 transition-transform duration-700">
                  <img src={memories[1]} alt="Scholastic Experience" className="w-full h-full object-cover sepia-[.2] contrast-[1.1] saturate-50 transition-all duration-[1500ms] group-hover:scale-110 group-hover:sepia-0 group-hover:saturate-110" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-1000 mix-blend-multiply" />
                  <div className="absolute bottom-8 left-8 right-8 text-white z-20">
                    <h3 className="text-2xl font-bold mb-2 break-words leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                      <TypewriterText text="Academic Vibrance" delay={0.2} />
                    </h3>
                    <p className="text-white/80 line-clamp-2">State of the art classrooms & dedicated faculty.</p>
                  </div>
                </div>
              </ScrollReveal>
              
              <div className="flex-1 space-y-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">A World of Scholastic Choices</h2>
                  <p className="text-muted-foreground"><TypewriterText text="Discover the diverse range of disciplines we offer, designed to build industry-ready professionals." /></p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { icon: <BookOpen className="text-blue-500" />, title: "Engineering", desc: "CSE, AI & ML, Data Science under AKTU & GGSIPU with edge intern opportunities.", isSpecial: true, id: 'engineering' },
                    { icon: <Briefcase className="text-indigo-500" />, title: "Management", desc: "BBA, MBA and PGDM programs shaping entrepreneurial minds.", isSpecial: true, id: 'management' },
                    { icon: <Shield className="text-emerald-500" />, title: "Law", desc: "B.A. LL.B, B.Com LL.B approved by BCI with moot courtroom training.", isSpecial: true, id: 'law' },
                    { icon: <Target className="text-rose-500" />, title: "Pharmacy", desc: "B.Pharm & D.Pharm courses shaping skillful professionals with PCI.", isSpecial: true, id: 'pharmacy' },
                  ].map((f, i) => (
                    <ScrollReveal key={i} delay={i * 0.1} className={`bg-card p-5 rounded-2xl border shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer ${f.isSpecial ? 'bg-primary/5 border-primary/20 text-primary-dark shadow-md' : ''}`} onClick={() => f.isSpecial && handleCategoryClick(f.id as any)}>
                      <div className="w-10 h-10 rounded-xl bg-background border flex items-center justify-center mb-3">{f.icon}</div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{f.title}</h3>
                      </div>
                      <p className="text-muted-foreground text-sm">{f.desc}</p>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vision & Mission alongside Photo 3 & 4 */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row-reverse gap-16 items-center">
            
            <div className="flex-1 flex gap-6 h-[600px] w-full">
              <ScrollReveal delay={0.2} className="w-1/2 h-full pt-12">
                <div className="rounded-3xl overflow-hidden shadow-2xl border relative h-full group">
                  <img src={memories[2]} alt="Infrastructure" className="w-full h-full object-cover sepia-[.2] contrast-[1.1] saturate-50 transition-all duration-[1500ms] group-hover:scale-110 group-hover:sepia-0 group-hover:saturate-110" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent mix-blend-multiply" />
                  <div className="absolute bottom-6 left-6 right-6 text-white text-sm font-semibold"><TypewriterText text="World-Class Facilities" delay={0.5}/></div>
                </div>
              </ScrollReveal>
              <ScrollReveal className="w-1/2 h-full pb-12">
                <div className="rounded-3xl overflow-hidden shadow-2xl border relative h-full group">
                  <img src={memories[3]} alt="Placements" className="w-full h-full object-cover sepia-[.2] contrast-[1.1] saturate-50 transition-all duration-[1500ms] group-hover:scale-110 group-hover:sepia-0 group-hover:saturate-110" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent mix-blend-multiply" />
                  <div className="absolute bottom-6 left-6 right-6 text-white text-sm font-semibold"><TypewriterText text="Top Recruiters" delay={0.6}/></div>
                </div>
              </ScrollReveal>
            </div>

            <div className="flex-1 space-y-12">
              <ScrollReveal>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Vision & Mission</h2>
                <div className="space-y-6 text-muted-foreground leading-relaxed">
                  <p>
                    <strong className="text-foreground">Vision:</strong> <TypewriterText text="We strive to be a leading institution of professional education that empowers students to become trustworthy global citizens and leaders in their chosen fields." delay={0.3} />
                  </p>
                  <p>
                    <strong className="text-foreground">Mission:</strong> <TypewriterText text="Empowering Minds, Fostering Changemakers, and Breaking Boundaries: GN Group of Institutes ignites minds with intellectually riveting education." delay={0.4} />
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.2}>
                <h2 className="text-2xl font-bold mb-6">Why GN Group?</h2>
                <div className="space-y-6">
                  {[
                    { title: "23000+ Global Alumni", desc: "A strong network of alumni placed in top tier MNCs like Google, TCS, Wipro, and HCL." },
                    { title: "Exceptional Placements", desc: "Highest package of 50 LPA, connecting our 6000+ students with top recruiters globally." },
                    { title: "Modern Amenities", desc: "From highly digitalized libraries to advanced Gyms and 1000-seater Auditoriums." }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="w-3 h-3 bg-primary rounded-full"></span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{item.title}</h4>
                        <p className="text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section id="location-section" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Visit Our Campus</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Located in the heart of Knowledge Park II, Greater Noida. Experience our world-class facilities and vibrant campus life.
            </p>
          </div>
          
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-primary/10 h-[500px] w-full relative">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3507.660191310598!2d77.49312187559435!3d28.459658191909867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cc18ad7b350c9%3A0x9574dff27416cef!2sG%20N%20Group%20Of%20Institutes%20(Knowledge%20Park%20-%202%2C%20Greater%20Noida%2C%20U.P.)!5e0!3m2!1sen!2sin!4v1774283149627!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
            ></iframe>
          </div>
        </section>

        <footer className="bg-muted py-12 border-t mt-12 text-center text-muted-foreground">
          <div className="max-w-7xl mx-auto px-6">
            <p className="font-semibold text-foreground mb-2">GN Group of Institute</p>
            <p className="text-sm">Plot No. 6B & 6C, Knowledge Park - II, Greater Noida (Delhi NCR) - 201310</p>
            <p className="text-xs mt-6 opacity-60">© {new Date().getFullYear()} GN Group. All Rights Reserved.</p>
          </div>
        </footer>

        {/* Floating Chatbot Widget connecting to the strict API */}
        <GNBot />

        {/* Category Details Modal (Engineering/Management) */}
        <CategoryDetailsModal 
          isOpen={modalState.isOpen} 
          category={modalState.category}
          onClose={() => setModalState({ ...modalState, isOpen: false })} 
        />
      </div>
    </div>
  );
}
