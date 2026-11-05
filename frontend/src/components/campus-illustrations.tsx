"use client";

import { motion, useReducedMotion } from "framer-motion";

export type CampusScene = "report" | "repair" | "dashboard" | "resolved";

type Props = { scene?: CampusScene; className?: string; label?: string };

export function CampusIllustration({ scene = "report", className = "", label }: Props) {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 2.8;

  return (
    <div className={`campus-illustration campus-illustration--${scene} ${className}`} role="img" aria-label={label ?? ({
      report: "A student character submitting a campus issue report",
      repair: "A campus technician character repairing a broken bench",
      dashboard: "A campus administrator reviewing issue statistics",
      resolved: "A completed campus repair with a confirmation mark",
    }[scene])}>
      <svg viewBox="0 0 560 330" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <filter id="paper-shadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#1C2820" floodOpacity=".08" />
          </filter>
        </defs>
        <path className="sketch-line" d="M35 274 C145 269 205 280 281 274 S430 269 523 276" stroke="#222820" strokeWidth="1.5" strokeLinecap="round" />
        <path className="sketch-line sketch-line--light" d="M47 282 C170 278 215 287 303 281 S440 279 509 284" stroke="#222820" strokeWidth=".8" strokeLinecap="round" />

        {scene === "report" && <>
          <g className="float-one" filter="url(#paper-shadow)">
            <rect x="90" y="65" width="164" height="181" rx="5" fill="white" stroke="#242820" strokeWidth="2" transform="rotate(-4 90 65)" />
            <path d="M120 105 L209 99 M119 124 L195 119 M117 143 L174 139" stroke="#9CA39A" strokeWidth="2" strokeLinecap="round" />
            <rect x="117" y="161" width="92" height="47" rx="3" fill="#F7F7F4" stroke="#242820" strokeWidth="1.4" />
            <path d="M129 193 L148 174 L164 187 L181 169 L197 191" stroke="#CC6846" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M218 82 l9 -8" stroke="#CC6846" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          <g className="character-bob">
            <ellipse cx="365" cy="125" rx="23" ry="28" fill="#171A17" />
            <circle cx="357" cy="121" r="3" fill="white" /><circle cx="373" cy="121" r="3" fill="white" />
            <path d="M365 153 Q359 190 366 225" stroke="#171A17" strokeWidth="11" strokeLinecap="round" />
            <path d="M363 174 L327 192 L297 177 M365 174 L398 157 L420 168" stroke="#171A17" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M366 225 L344 265 M366 225 L391 263" stroke="#171A17" strokeWidth="7" strokeLinecap="round" />
          </g>
          <path d="M427 81 q12 -13 24 0 q-12 14 -24 0Z" stroke="#4E7691" strokeWidth="2" />
          <path d="M439 69 v-8 M455 81 h9" stroke="#4E7691" strokeWidth="2" strokeLinecap="round" />
          <text x="276" y="57" fill="#CC6846" fontSize="12" fontFamily="monospace">REPORT IT</text>
          <path d="M299 63 L285 78" stroke="#CC6846" strokeWidth="1.5" strokeDasharray="3 4" />
          <circle className="orbit-dot" cx="469" cy="211" r="5" fill="#D69B43" />
        </>}

        {scene === "repair" && <>
          <g className="float-one">
            <path d="M92 194 L222 194 M102 194 L110 234 M212 194 L204 234 M103 207 L212 207" stroke="#242820" strokeWidth="5" strokeLinecap="round" />
            <path d="M102 183 L102 169 M212 183 L212 169 M102 169 L212 169" stroke="#242820" strokeWidth="5" strokeLinecap="round" />
            <path d="M159 169 l15 -15" stroke="#CC6846" strokeWidth="3" strokeLinecap="round" />
            <path d="M151 151 l18 18 M169 151 l-18 18" stroke="#CC6846" strokeWidth="2" />
          </g>
          <g className="character-bob">
            <ellipse cx="347" cy="111" rx="22" ry="27" fill="#171A17" />
            <circle cx="340" cy="107" r="3" fill="white" /><circle cx="354" cy="107" r="3" fill="white" />
            <path d="M347 139 L351 216" stroke="#171A17" strokeWidth="11" strokeLinecap="round" />
            <path d="M349 163 L312 143 L293 119 M350 163 L387 140 L410 119" stroke="#171A17" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M351 216 L330 260 M351 216 L377 260" stroke="#171A17" strokeWidth="7" strokeLinecap="round" />
          </g>
          <path d="M410 95 l13 -15 l8 8 l-13 15Z" fill="#D69B43" stroke="#242820" strokeWidth="1.5" />
          <path d="M443 123 q10 -12 20 0 M448 133 q5 -5 10 0" stroke="#4E7691" strokeWidth="2" strokeLinecap="round" />
          <text x="76" y="83" fill="#4E7691" fontSize="12" fontFamily="monospace">ON THE JOB</text>
          <path d="M142 88 L155 116" stroke="#4E7691" strokeWidth="1.5" strokeDasharray="3 4" />
          <circle className="orbit-dot" cx="455" cy="205" r="5" fill="#CC6846" />
        </>}

        {scene === "dashboard" && <>
          <g className="float-one" filter="url(#paper-shadow)">
            <rect x="104" y="56" width="272" height="174" rx="5" fill="white" stroke="#242820" strokeWidth="2" />
            <path d="M128 88 H347" stroke="#D8DCD6" strokeWidth="2" />
            <path d="M137 191 V161 L164 147 L191 165 L218 124 L246 140 L273 107 L300 118 L328 94" stroke="#4E7691" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M137 199 H345" stroke="#D8DCD6" strokeWidth="1.5" />
            <circle cx="164" cy="147" r="4" fill="#CC6846" /><circle cx="273" cy="107" r="4" fill="#CC6846" />
            <rect x="128" y="68" width="42" height="8" rx="2" fill="#D69B43" />
            <rect x="180" y="68" width="26" height="8" rx="2" fill="#DDE4D8" />
          </g>
          <g className="character-bob">
            <ellipse cx="423" cy="150" rx="22" ry="27" fill="#171A17" />
            <circle cx="416" cy="146" r="3" fill="white" /><circle cx="430" cy="146" r="3" fill="white" />
            <path d="M423 177 L419 224" stroke="#171A17" strokeWidth="10" strokeLinecap="round" />
            <path d="M422 190 L393 174 L375 181 M421 190 L452 173" stroke="#171A17" strokeWidth="7" strokeLinecap="round" />
            <path d="M419 224 L402 263 M419 224 L440 263" stroke="#171A17" strokeWidth="7" strokeLinecap="round" />
          </g>
          <text x="390" y="76" fill="#CC6846" fontSize="12" fontFamily="monospace">SEE THE PATTERN</text>
          <path d="M405 81 L377 99" stroke="#CC6846" strokeWidth="1.5" strokeDasharray="3 4" />
          <circle className="orbit-dot" cx="83" cy="119" r="5" fill="#D69B43" />
        </>}

        {scene === "resolved" && <>
          <g className="float-one" filter="url(#paper-shadow)">
            <rect x="115" y="73" width="192" height="151" rx="5" fill="white" stroke="#242820" strokeWidth="2" />
            <circle cx="210" cy="131" r="34" fill="#EEF3E9" stroke="#536747" strokeWidth="1.5" />
            <path d="M192 131 l13 13 l25 -28" stroke="#536747" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M151 183 H268 M167 198 H251" stroke="#C9CEC7" strokeWidth="2" strokeLinecap="round" />
          </g>
          <g className="character-bob">
            <ellipse cx="390" cy="130" rx="22" ry="27" fill="#171A17" />
            <circle cx="383" cy="126" r="3" fill="white" /><circle cx="397" cy="126" r="3" fill="white" />
            <path d="M390 157 L389 224" stroke="#171A17" strokeWidth="10" strokeLinecap="round" />
            <path d="M389 176 L354 151 L338 130 M390 176 L422 145 L436 118" stroke="#171A17" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M389 224 L369 263 M389 224 L410 263" stroke="#171A17" strokeWidth="7" strokeLinecap="round" />
          </g>
          <path d="M448 84 l7 -12 M464 98 l13 -4 M447 111 l-8 -9" stroke="#D69B43" strokeWidth="2.5" strokeLinecap="round" />
          <text x="92" y="54" fill="#536747" fontSize="12" fontFamily="monospace">CLOSED LOOP</text>
          <path d="M151 59 L170 75" stroke="#536747" strokeWidth="1.5" strokeDasharray="3 4" />
          <circle className="orbit-dot" cx="480" cy="222" r="5" fill="#4E7691" />
        </>}
      </svg>
      <span className="illustration-caption">{scene === "report" ? "A small report starts the fix." : scene === "repair" ? "The right team takes action." : scene === "dashboard" ? "Every issue leaves a signal." : "A fix is not finished until it is verified."}</span>
    </div>
  );
}
