"use client";

import { useRef, useEffect } from "react";
import { Star, ThumbsUp, MessageCircle, Share2 } from "lucide-react";

const REVIEWS = [
  {
    name: "Sarah K.",
    time: "2 weeks ago",
    rating: 5,
    likes: "1.8k",
    comments: 42,
    text: "Finally, grooming that doesn't stress them out! My golden retriever used to shake at the sound of clippers. With BeePaws he just sits there calmly. Life changing. 🐾",
    reply: "So happy to hear that! A calm grooming experience is exactly what we designed for. Thanks Sarah! 🐶",
  },
  {
    name: "Mike T.",
    time: "1 month ago",
    rating: 5,
    likes: "1.1k",
    comments: 28,
    text: "Skipped the $80 groomer visit and did it myself in 20 minutes. Honestly looks just as good. My wallet and my dog both thank me. 😂",
    reply: null,
  },
  {
    name: "Jessica L.",
    time: "3 weeks ago",
    rating: 5,
    likes: "980",
    comments: 19,
    text: "My anxious rescue actually stayed calm the whole time. The quiet motor makes such a difference. I wish I'd found this sooner! ❤️",
    reply: "This made our day! Rescue pets deserve extra gentle care — so glad BeePaws could help. ✨",
  },
  {
    name: "David R.",
    time: "1 week ago",
    rating: 4,
    likes: "654",
    comments: 11,
    text: "Works great on my husky's thick coat. Takes a bit of practice but once you get the hang of it the results are really impressive for an at-home tool.",
    reply: null,
  },
  {
    name: "Emily C.",
    time: "5 days ago",
    rating: 5,
    likes: "872",
    comments: 16,
    text: "Bought this for my persian cat and she didn't move once during the whole session. The low noise is what sold me. My previous clipper had her running under the bed! 😸",
    reply: "Persian cats are such divas — love that she approved! 🐱",
  },
  {
    name: "James W.",
    time: "2 months ago",
    rating: 5,
    likes: "1.4k",
    comments: 33,
    text: "Got the bundle deal and it's a complete game changer. Everything you need in one box. The quality is premium and my poodle actually enjoys grooming now.",
    reply: null,
  },
  {
    name: "Lisa M.",
    time: "3 weeks ago",
    rating: 4,
    likes: "521",
    comments: 9,
    text: "The nail grinder attachment is so much better than clippers. No more split nails and my dog doesn't flinch anymore. Would give 5 stars but took a little getting used to.",
    reply: "Totally normal! Give it 2-3 sessions and it becomes second nature. You're doing great 🐾",
  },
  {
    name: "Carlos P.",
    time: "6 days ago",
    rating: 5,
    likes: "743",
    comments: 22,
    text: "First-time dog owner here. Was nervous about grooming at home but the guide that comes with it is super clear. My corgi looks like he just came out of a salon. 10/10!",
    reply: "Welcome to the BeePaws family! Corgis are the best grooming subjects 🧡",
  },
  {
    name: "Rachel T.",
    time: "1 month ago",
    rating: 5,
    likes: "1.2k",
    comments: 37,
    text: "Bought this as a gift for my sister and she messaged me three days later saying she cried because her dog (who used to HATE grooming) sat still for the first time ever.",
    reply: null,
  },
  {
    name: "Tom B.",
    time: "2 weeks ago",
    rating: 5,
    likes: "609",
    comments: 14,
    text: "I was skeptical about the price but honestly it's worth every penny. The motor is whisper quiet, charges fast, and the results rival professional grooming. Sold! 🙌",
    reply: "Quality you can feel — that's the BeePaws promise. Thanks Tom! ✨",
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          fill={i < rating ? "#f5a800" : "none"}
          stroke={i < rating ? "#f5a800" : "#a07850"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export function UGCReviews() {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const drag = useRef({ active: false, startX: 0, startPos: 0 });
  const raf = useRef<number>(0);
  const paused = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const tick = () => {
      if (!paused.current) {
        posRef.current += 0.5;
        const half = track.scrollWidth / 2;
        if (posRef.current >= half) posRef.current -= half;
        track.style.transform = `translateX(-${posRef.current}px)`;
      }
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { active: true, startX: e.clientX, startPos: posRef.current };
    paused.current = true;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const track = trackRef.current;
    if (!track) return;
    const half = track.scrollWidth / 2;
    const next = ((drag.current.startPos + (drag.current.startX - e.clientX)) % half + half) % half;
    posRef.current = next;
    track.style.transform = `translateX(-${next}px)`;
  }

  function onPointerUp() {
    drag.current.active = false;
    paused.current = false;
  }

  const doubled = [...REVIEWS, ...REVIEWS];

  return (
    <section className="bg-[#7A4A1E] py-14 md:py-20 overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 mb-10">
        <h2 className="mb-2 text-center text-3xl font-black tracking-tight text-white md:text-4xl">
          Don&apos;t just take our word for it
        </h2>
        <p className="text-center text-base text-white/50">
          Real pet parents, real results. Drag to explore →
        </p>
      </div>

      <div
        className="cursor-grab active:cursor-grabbing select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          ref={trackRef}
          className="flex gap-4 pl-6"
          style={{ width: "max-content" }}
        >
          {doubled.map((r, i) => (
            <div
              key={i}
              className="w-72 shrink-0 flex flex-col bg-[#fff5e4] text-sm shadow-lg rounded-2xl overflow-hidden"
            >
              <div className="flex items-start gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff3dc] text-sm font-extrabold text-[#8b5e2a]">
                  {r.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-[#3d2400]">{r.name}</p>
                    <span className="rounded-full bg-[#f5a800]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#8b5e2a]">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-[#8b5e2a]/60">{r.time}</p>
                  <Stars rating={r.rating} />
                </div>
              </div>

              <p className="flex-1 px-4 pb-3 leading-relaxed text-[#3d2400]/80">{r.text}</p>

              {r.reply && (
                <div className="mx-4 mb-3 border-l-2 border-[#f5a800] bg-[#fff3dc] px-3 py-2">
                  <p className="text-xs font-bold text-[#8b5e2a]">BeePaws</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#3d2400]/70">{r.reply}</p>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-[#e8d5aa] px-4 py-2.5 text-xs text-[#8b5e2a]/60">
                <span>👍 {r.likes}</span>
                <div className="flex gap-4">
                  <button className="flex items-center gap-1 hover:text-[#f5a800] transition-colors">
                    <ThumbsUp size={12} /> Like
                  </button>
                  <button className="flex items-center gap-1 hover:text-[#f5a800] transition-colors">
                    <MessageCircle size={12} /> {r.comments}
                  </button>
                  <button className="flex items-center gap-1 hover:text-[#f5a800] transition-colors">
                    <Share2 size={12} /> Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
