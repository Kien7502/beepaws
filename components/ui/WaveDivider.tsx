"use client";

type Props = {
  from: string;
  to: string;
  /** Optional override for the FRONT (opaque, fastest-scrolling) wave layer's
   *  fill. The two background layers always fill with `to` at low opacity.
   *  Use when you want the back ripples to differ in hue from the dominant
   *  front curve — e.g. footer wave: sage ripples behind a moss front that
   *  blends into the moss footer block. Defaults to `to`. */
  frontColor?: string;
  flip?: boolean;
  simple?: boolean;
};

const PATH_A = "M0,55 C240,110 480,0 720,55 C960,110 1200,0 1440,55 C1680,110 1920,0 2160,55 C2400,110 2640,0 2880,55 L2880,110 L0,110 Z";
const PATH_B = "M0,70 C200,10 480,110 720,50 C960,0 1200,100 1440,70 C1680,10 1920,110 2160,50 C2400,0 2680,100 2880,70 L2880,110 L0,110 Z";

const CSS = `
  @keyframes waveScroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
`;

export function WaveDivider({ from, to, frontColor, flip = false, simple = false }: Props) {
  const fwd = flip ? "reverse" : "normal";
  const rev = flip ? "normal" : "reverse";
  const front = frontColor ?? to;

  const layer = (
    duration: string,
    delay: string,
    path: string,
    opacity: number,
    height: string,
    dir: string,
    fill: string,
  ) => (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "200%",
        animation: `waveScroll ${duration} linear ${delay} infinite ${dir}`,
      }}
    >
      <svg
        viewBox="0 0 2880 110"
        preserveAspectRatio="none"
        style={{ display: "block", width: "100%", height }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={path} fill={fill} fillOpacity={opacity} />
      </svg>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      {/* marginBottom:"-2px" ensures the next section physically overlaps this div,
          closing any 1px subpixel compositor gap at non-integer zoom levels */}
      <div style={{ background: from, position: "relative", height: "110px", overflow: "hidden", marginBottom: "-2px" }}>
        {!simple && layer("32s", "-14s", PATH_B, 0.3, "80px",  fwd, to)}
        {!simple && layer("22s", "-7s",  PATH_A, 0.6, "95px",  rev, to)}
        {layer("15s", "0s",   PATH_A, 1.0, "110px", fwd, front)}
      </div>
    </>
  );
}
