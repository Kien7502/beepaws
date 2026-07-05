"use client";

import { useRef, useEffect } from "react";
import { Star } from "lucide-react";
import type { Review } from "@/types/metafields";

const DEFAULT_REVIEWS: Review[] = [
  {
    name: "Sarah K.",
    time: "2 weeks ago",
    rating: 5,
    likes: 1800,
    comments: 42,
    text: "My golden's teeth were covered in brown tartar for years. Vets quoted me $1,400 for an anesthesia cleaning. After 3 sessions with BeePaws — completely transformed. I'm in shock. 🐾",
    reply: "Before/after stories like this are exactly why we built BeePaws. Thanks Sarah! 🐶",
  },
  {
    name: "Mike T.",
    time: "1 month ago",
    rating: 5,
    likes: 1100,
    comments: 28,
    text: "Skipped the vet cleaning and did it myself in 20 minutes. My corgi's breath went from absolutely awful to actually fine. The dental gel makes the whole thing easy. 😂",
    reply: null,
  },
  {
    name: "Jessica L.",
    time: "3 weeks ago",
    rating: 5,
    likes: 980,
    comments: 19,
    text: "My anxious rescue freaks out at the vet but sat completely still for the whole session. The near-silent operation is a game changer. I wish I'd found this sooner! ❤️",
    reply: "Rescue pets deserve the gentlest care — so glad BeePaws could help. ✨",
  },
  {
    name: "David R.",
    time: "1 week ago",
    rating: 4,
    likes: 654,
    comments: 11,
    text: "Works great on my lab's heavy tartar buildup. Takes a bit of patience on the first session but the results after session 2 were really impressive. Solid at-home alternative to the vet.",
    reply: null,
  },
  {
    name: "Emily C.",
    time: "5 days ago",
    rating: 5,
    likes: 872,
    comments: 16,
    text: "Bought this for my 9-year-old dachshund. The vet said she needed a $900 dental procedure. Two BeePaws sessions later and her teeth look years younger. Incredible for the price. 😸",
    reply: "Senior dogs see some of the biggest results — love hearing this! 🐱",
  },
  {
    name: "James W.",
    time: "2 months ago",
    rating: 5,
    likes: 1400,
    comments: 33,
    text: "Got the bundle deal for both my dogs. One session each and the plaque buildup I'd been worried about for months was visibly reduced. The dental gel smells great too — they actually enjoy it.",
    reply: null,
  },
  {
    name: "Lisa M.",
    time: "3 weeks ago",
    rating: 4,
    likes: 521,
    comments: 9,
    text: "My vet confirmed the tartar reduction at the last checkup and was genuinely surprised. She asked what I'd been doing differently. Would give 5 stars but takes a few sessions to see full results.",
    reply: "Give it 2-3 sessions and you'll see the full transformation. You're doing great! 🐾",
  },
  {
    name: "Carlos P.",
    time: "6 days ago",
    rating: 5,
    likes: 743,
    comments: 22,
    text: "First-time dog owner here. Was nervous about doing this at home but the guide is super clear. My beagle's breath is so much better after just one session. 10/10 would recommend!",
    reply: "Welcome to the BeePaws family! Beagles are the best 🧡",
  },
  {
    name: "Rachel T.",
    time: "1 month ago",
    rating: 5,
    likes: 1200,
    comments: 37,
    text: "Bought this for my sister after her vet gave her a scary dental quote. She messaged me three days later saying her dog's teeth look completely different. Best gift I've ever given.",
    reply: null,
  },
  {
    name: "Tom B.",
    time: "2 weeks ago",
    rating: 5,
    likes: 609,
    comments: 14,
    text: "Was skeptical but $1,400 vet quotes will make you try anything. After 2 sessions the difference is visible and my vet actually complimented his teeth at his last checkup. Sold! 🙌",
    reply: "That vet compliment is the ultimate review. Thanks Tom! ✨",
  },
];

function Stars({ rating }: { rating: number }) {
  // Warm Honey: gold stars filled, soft brown outlines for unfilled.
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          fill={i < rating ? "#E7A92F" : "none"}
          stroke={i < rating ? "#E7A92F" : "#a99e83"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

interface Props {
  reviews?: Review[] | null;
  eyebrow?: string;
  heading?: string;
  lead?: string;
}

export function UGCReviews({
  reviews,
  eyebrow = "Lorem ipsum",
  heading = "Lorem ipsum dolor sit amet?",
  lead = "Lorem ipsum dolor sit amet, consectetur →",
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const drag = useRef({ active: false, startX: 0, startPos: 0 });
  const raf = useRef<number>(0);
  const paused = useRef(false);

  const data = reviews && reviews.length > 0 ? reviews : DEFAULT_REVIEWS;
  const doubled = [...data, ...data];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const tick = () => {
      if (!paused.current) {
        posRef.current += 0.3;
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

  // Warm Honey: paper bg (per reference — testimonials live on the same
  // paper as Mechanism/PainPoints, not in a dark moment). Cards have a
  // subtle line border and warm-brown shadow so they lift off the page.
  return (
    <section className="ds-reveal-in bg-sand py-14 md:py-20 overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 mb-10">
        <span className="block text-center text-xs font-bold uppercase tracking-[0.14em] text-gold-deep mb-2.5">
          {eyebrow}
        </span>
        <h2 className="font-display mb-2 text-center text-3xl font-semibold tracking-tight text-cocoa md:text-[33px]">
          {heading}
        </h2>
        <p className="text-center text-base text-brown">
          {lead}
        </p>
      </div>

      <div
        className="cursor-grab active:cursor-grabbing select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={() => { paused.current = true; }}
        onPointerLeave={() => { if (!drag.current.active) paused.current = false; }}
      >
        <div
          ref={trackRef}
          className="flex gap-4 pl-6"
          style={{ width: "max-content" }}
        >
          {doubled.map((r, i) => (
            <div
              key={i}
              className="w-72 shrink-0 flex flex-col bg-card text-sm shadow-[0_4px_20px_-10px_rgba(74,46,22,0.12)] rounded-2xl overflow-hidden border border-line"
            >
              {/* Reviewer identity + stars */}
              <div className="flex items-start gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-honey-tint text-sm font-extrabold text-clay">
                  {r.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-extrabold text-cocoa">{r.name}</p>
                    <span className="rounded-full bg-honey-tint px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-clay">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-brown">{r.time}</p>
                  <Stars rating={r.rating} />
                </div>
              </div>

              {/* Review text */}
              <p className="flex-1 px-4 pb-3 leading-relaxed text-ink">{r.text}</p>

              {/* BeePaws reply */}
              {r.reply && (
                <div className="mx-4 mb-4 border-l-[3px] border-gold bg-cream px-3 py-2 rounded-r-md">
                  <p className="text-xs font-bold text-clay">BeePaws</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-brown">{r.reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
