"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useAnimation, animate } from "framer-motion";
import confetti from "canvas-confetti";

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Rayon de la terre en mètres
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

export default function RouletteGame() {
  const [hasSpun, setHasSpun] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [userInfo, setUserInfo] = useState({ firstName: "", lastName: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<string | null>(null);
  const [isLostResult, setIsLostResult] = useState(false);
  const [dbError, setDbError] = useState("");
  
  // Geolocation states
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  const rotation = useMotionValue(0);
  const pointerControls = useAnimation();
  type Prize = { text: string; probability: number; color?: string; isLost?: boolean };

  const DEFAULT_COLORS = ["#FFFFFF", "#D6EAF8"];
  const ODD_COLOR = "#EBF5FB";

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    async function fetchPrizes() {
      try {
        const res = await fetch('/api/promotions');
        const data = await res.json();
        if (data.promotions && data.promotions.length > 0) {
          setPrizes(data.promotions.map((p: any, idx: number) => ({
            text: p.text_content,
            probability: p.probability !== undefined && p.probability !== null
              ? Number(p.probability)
              : Number((100 / data.promotions.length).toFixed(2)),
            color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
            isLost: !!p.isLost
          })));
        } else {
          setPrizes(Array.from({ length: 6 }).map((_, i) => ({
            text: `Promotion ${i + 1}`,
            probability: Number((100 / 6).toFixed(2)),
            color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
            isLost: false
          })));
        }
      } catch (error) {
        console.error("Erreur de chargement des promotions", error);
      }
      setIsLoading(false);
    }
    fetchPrizes();
  }, []);

  const playTickSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      if (!(window as any).tickAudioCtx) {
        (window as any).tickAudioCtx = new AudioContext();
      }
      const ctx = (window as any).tickAudioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Son sec de type "clack" (plus aigu)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.02);

      // Volume faible (pas trop fort)
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.02);
    } catch (e) {
      // Silently ignore if audio is blocked
    }
  };

  useEffect(() => {
    if (prizes.length === 0) return;

    const unsubscribe = rotation.on("change", (latest) => {
      const equalSlice = 360 / prizes.length;
      const normalizedRot = ((latest % 360) + 360) % 360;
      let pointerAngle = (360 - normalizedRot) % 360;

      pointerAngle = (pointerAngle + equalSlice / 2) % 360;

      let cumulative = 0;
      let activeIndex = 0;
      for (let i = 0; i < prizes.length; i++) {
        cumulative += equalSlice;
        if (pointerAngle <= cumulative) {
          activeIndex = i;
          break;
        }
      }

      if (activeIndex !== lastTickRef.current) {
        lastTickRef.current = activeIndex;
        playTickSound();
        pointerControls.start({
          rotate: [0, -25, 0],
          transition: { duration: 0.15, ease: "easeOut" }
        });
      }
    });
    return () => unsubscribe();
  }, [rotation, pointerControls, prizes]);

  const handleLocationCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (!checked) {
      setIsLocationVerified(false);
      setLocationError("");
      return;
    }

    setIsCheckingLocation(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée par votre navigateur.");
      setIsCheckingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        // Coordonnées du centre de lavage
        const distance = getDistanceFromLatLonInM(userLat, userLng, 49.011021, 2.030300);

        if (distance <= 200) {
          setIsLocationVerified(true);
        } else {
          setIsLocationVerified(false);
          setLocationError(`Vous êtes trop loin du centre (${Math.round(distance)}m). Vous devez être sur place !`);
        }
        setIsCheckingLocation(false);
      },
      (error) => {
        setIsLocationVerified(false);
        setIsCheckingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Vous devez autoriser l'accès à votre position pour valider.");
        } else {
          setLocationError("Impossible de récupérer votre position.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLocationVerified) {
      setDbError("Veuillez valider votre position GPS avant d'envoyer.");
      return;
    }
    if (userInfo.firstName && userInfo.lastName && userInfo.email && wonPrize) {
      setIsSubmitting(true);
      setDbError("");

      try {
        const resCheck = await fetch('/api/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userInfo.email })
        });

        const dataCheck = await resCheck.json();

        if (resCheck.ok && dataCheck.canPlay) {
          const resSave = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...userInfo, wonPrize: wonPrize })
          });

          const dataSave = await resSave.json();
          if (resSave.ok) {
            setHasRegistered(true);
          } else {
            setDbError(dataSave.error || "Une erreur est survenue.");
          }
        } else {
          setDbError("Vous avez déjà une promotion en cours ! Utilisez-la au comptoir avant de pouvoir rejouer.");
        }
      } catch (err) {
        setDbError("Erreur de connexion.");
      }
      setIsSubmitting(false);
    }
  };

  const spinRoulette = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonPrize(null);
    setDbError("");

    const rand = Math.random() * 100;
    let cumulativeProb = 0;
    let prizeIndex = prizes.length - 1;

    for (let i = 0; i < prizes.length; i++) {
      cumulativeProb += prizes[i].probability;
      if (rand <= cumulativeProb) {
        prizeIndex = i;
        break;
      }
    }

    const equalSlice = 360 / prizes.length;
    const centerAngle = prizeIndex * equalSlice;

    const currentRot = rotation.get();
    const currentMod = ((currentRot % 360) + 360) % 360;
    const targetMod = (360 - (centerAngle % 360)) % 360;

    let addAngle = targetMod - currentMod;
    if (addAngle < 0) addAngle += 360;

    const exactCenterRotation = currentRot + 2160 + addAngle;

    const randomOffset = (Math.random() * (equalSlice * 0.6)) - (equalSlice * 0.3);
    const initialStopRotation = exactCenterRotation + randomOffset;

    await animate(rotation, initialStopRotation, {
      duration: 5.5,
      ease: [0.15, 0.85, 0.2, 1]
    });

    await animate(rotation, exactCenterRotation, {
      duration: 0.8,
      ease: "easeInOut"
    });

    const prizeText = prizes[prizeIndex].text;
    const isLost = prizes[prizeIndex].isLost || false;

    setIsSpinning(false);
    setWonPrize(prizeText);
    setIsLostResult(isLost);
    setHasSpun(true);

    if (!isLost) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFFFFF', '#E8ECF0', '#C0C7D0']
      });
    }
  };

  const renderSVGWheel = () => {
    const equalSlice = 360 / prizes.length;
    let currentAngleOffset = -90 - equalSlice / 2;
    const WHEEL_R = 44;
    const OUTER_R = 49;
    const INNER_RING_R = 45;
    const CENTER_R = 8;
    const NUM_DOTS = 30;

    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* === ANNEAU EXTÉRIEUR === */}
        {/* Cercle extérieur — OPTION 5 : gris aluminium brossé */}
        <circle cx="50" cy="50" r={OUTER_R} fill="#8E99A4" />
        <circle cx="50" cy="50" r={OUTER_R} fill="none" stroke="#A3ADB8" strokeWidth="0.4" opacity="0.6" />

        {/* Petits points lumineux incrustés dans l'anneau */}
        {Array.from({ length: NUM_DOTS }).map((_, i) => {
          const angle = (i * (360 / NUM_DOTS)) * (Math.PI / 180);
          const dotR = (OUTER_R + INNER_RING_R) / 2;
          return (
            <circle
              key={`dot-${i}`}
              cx={50 + dotR * Math.cos(angle)}
              cy={50 + dotR * Math.sin(angle)}
              r="0.9"
              fill={i % 2 === 0 ? "#FFFFFF" : "#C8CED6"}
              opacity={i % 2 === 0 ? "1" : "0.85"}
            />
          );
        })}

        {/* Bordure intérieure de l'anneau (sépare l'anneau des parts) */}
        <circle cx="50" cy="50" r={INNER_RING_R} fill="#F0F2F5" />

        {/* === PARTS DE LA ROUE === */}
        {prizes.map((prizeObj, i) => {
          const prize = prizeObj.text;
          const sliceAngle = equalSlice;

          const startAngle = currentAngleOffset;
          const endAngle = currentAngleOffset + sliceAngle;
          currentAngleOffset += sliceAngle;

          let fillColor = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
          if (i === prizes.length - 1 && prizes.length % 2 !== 0) {
            fillColor = ODD_COLOR;
          }

          const hex = fillColor.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16) || 0;
          const g = parseInt(hex.substring(2, 4), 16) || 0;
          const b = parseInt(hex.substring(4, 6), 16) || 0;
          const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
          const textColor = (yiq >= 128) ? '#0A0E27' : '#FFFFFF';

          const midAngle = startAngle + (sliceAngle / 2);
          const radiusText = 27;
          const tx = 50 + radiusText * Math.cos((Math.PI * midAngle) / 180);
          const ty = 50 + radiusText * Math.sin((Math.PI * midAngle) / 180);

          let svgShape = null;

          if (sliceAngle > 359.9) {
            svgShape = <circle cx="50" cy="50" r={WHEEL_R} fill={fillColor} />;
          } else {
            const x1 = 50 + WHEEL_R * Math.cos((Math.PI * startAngle) / 180);
            const y1 = 50 + WHEEL_R * Math.sin((Math.PI * startAngle) / 180);
            const x2 = 50 + WHEEL_R * Math.cos((Math.PI * endAngle) / 180);
            const y2 = 50 + WHEEL_R * Math.sin((Math.PI * endAngle) / 180);
            const largeArc = sliceAngle > 180 ? 1 : 0;
            const pathData = `M 50 50 L ${x1} ${y1} A ${WHEEL_R} ${WHEEL_R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            svgShape = <path d={pathData} fill={fillColor} stroke="#C8CED6" strokeWidth="0.3" />;
          }

          const textStr = prize.toUpperCase();
          const words = textStr.split(' ');

          const sliceAngleRad = (sliceAngle * Math.PI) / 180;
          let bestFontSize = 1;
          let bestLines: string[] = [];

          for (let fs = 4.5; fs >= 1.5; fs -= 0.1) {
            const charWidth = fs * 0.85;
            const lineHeight = fs * 1.15;
            const maxCharsPerLine = Math.floor(34 / charWidth);

            const lines: string[] = [];
            let currentLine = '';

            for (const word of words) {
              if (word.length > maxCharsPerLine) {
                if (currentLine) lines.push(currentLine.trim());
                lines.push(word);
                currentLine = '';
              } else if ((currentLine + ' ' + word).trim().length > maxCharsPerLine) {
                if (currentLine) lines.push(currentLine.trim());
                currentLine = word;
              } else {
                currentLine = currentLine ? currentLine + ' ' + word : word;
              }
            }
            if (currentLine) lines.push(currentLine.trim());

            const totalHeight = lines.length * lineHeight;
            const maxWidth = Math.max(...lines.map(l => l.length * charWidth));

            if (maxWidth > 34) continue;

            const H_half = totalHeight / 2;
            const W_half = maxWidth / 2;

            const R_outer = Math.sqrt(Math.pow(radiusText + W_half, 2) + Math.pow(H_half, 2));
            if (R_outer > WHEEL_R - 2) continue;

            const r_inner = radiusText - W_half;
            if (r_inner <= CENTER_R + 2) continue;

            let fitsWedge = true;
            if (sliceAngle < 180) {
              const maxAllowedHalfHeight = r_inner * Math.tan(sliceAngleRad / 2) * 0.75;
              if (H_half > maxAllowedHalfHeight) {
                fitsWedge = false;
              }
            }

            if (fitsWedge) {
              bestFontSize = fs;
              bestLines = lines;
              break;
            }
          }

          if (bestLines.length === 0) {
            bestFontSize = 1;
            bestLines = [textStr.substring(0, 30)];
          }

          const lineSpacing = bestFontSize * 1.1;
          const initialDy = -((bestLines.length - 1) * lineSpacing) / 2;

          return (
            <g key={i}>
              {svgShape}
              <text
                x={tx}
                y={ty}
                fill={textColor}
                fontSize={bestFontSize}
                fontWeight="900"
                fontFamily="var(--font-montserrat), 'Montserrat', sans-serif"
                textAnchor="middle"
                alignmentBaseline="middle"
                transform={`rotate(${midAngle} ${tx} ${ty})`}
                className="uppercase tracking-wider"
                style={{ filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.4))" }}
              >
                {bestLines.map((line, lineIdx) => (
                  <tspan key={lineIdx} x={tx} dy={lineIdx === 0 ? initialDy : lineSpacing}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}

        {/* === CENTRE === */}
        <circle cx="50" cy="50" r={CENTER_R} fill="#FFFFFF" stroke="#C0C7D0" strokeWidth="0.6" />
        <image 
          href="/logo.webp" 
          x={50 - CENTER_R + 0.5} 
          y={50 - CENTER_R + 0.5} 
          width={(CENTER_R - 0.5) * 2} 
          height={(CENTER_R - 0.5) * 2}
        />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/60 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-white/70 font-bold animate-pulse">Chargement de la roue...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center py-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center w-full"
      >
        {/* LA ROULETTE EST TOUJOURS VISIBLE JUSQU'A LA FIN */}
        {!hasRegistered && (
          <div className="relative w-full max-w-[320px] md:max-w-[450px] aspect-square mb-8 mx-auto flex items-center justify-center">
            <motion.div
              animate={pointerControls}
              className="absolute -top-3 left-1/2 z-40 origin-top"
              style={{ x: "-50%" }}
            >
              <svg width="40" height="52" viewBox="0 0 40 52">
                <defs>
                  <filter id="pointer-shadow" x="-20%" y="-10%" width="140%" height="130%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.15" />
                  </filter>
                </defs>
                <path
                  d="M 20 48 L 10 26 A 14 14 0 1 1 30 26 Z"
                  fill="#FFFFFF"
                  stroke="#B0B8C4"
                  strokeWidth="1.2"
                  filter="url(#pointer-shadow)"
                />
                <circle cx="20" cy="16" r="6" fill="#E8EDF2" stroke="#B0B8C4" strokeWidth="0.8" />
                <circle cx="20" cy="16" r="3" fill="#D6EAF8" />
              </svg>
            </motion.div>

            <motion.div className="w-full h-full relative z-20" style={{ rotate: rotation }}>
              {renderSVGWheel()}
            </motion.div>

            <div className="absolute inset-0 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.4)] pointer-events-none z-10" />
          </div>
        )}

        {/* ÉTAPE 1: BOUTON POUR TOURNER */}
        {!hasSpun && !hasRegistered && (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={spinRoulette}
              disabled={isSpinning}
              className={`px-12 py-5 rounded-full font-black text-xl md:text-2xl tracking-widest uppercase transition-all transform border-2
                ${isSpinning ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed scale-95' : 'bg-white text-gray-800 border-white/80 hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95'}`}
            >
              {isSpinning ? 'EN COURS...' : 'TOURNER LA ROUE !'}
            </button>
          </div>
        )}

        {/* RÉSULTAT PERDU */}
        {hasSpun && isLostResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl w-full max-w-md mx-auto shadow-2xl border border-white/20 text-center"
          >
            <h3 className="text-3xl font-black text-[#FF006E] mb-4 uppercase">Dommage !</h3>
            <p className="text-lg text-white font-medium">Vous n'avez pas gagné cette fois.</p>
            <p className="text-gray-300 mt-2">Retentez votre chance la prochaine fois !</p>
          </motion.div>
        )}

        {/* ÉTAPE 2: FORMULAIRE APRÈS AVOIR TOURNÉ (GAGNANT) */}
        {hasSpun && !hasRegistered && !isLostResult && (
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl w-full max-w-md mx-auto shadow-2xl border border-white/20"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-white mb-2">Vous avez gagné :</h3>
              <div className="text-xl font-bold text-[#0A0E27] bg-[#00F0FF] py-2 px-4 rounded-xl inline-block shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                {wonPrize}
              </div>
            </div>
            
            <p className="text-sm text-gray-300 mb-4 text-center">Entrez vos coordonnées pour recevoir votre QR Code de réduction :</p>

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Prénom</label>
                <input required type="text" value={userInfo.firstName} onChange={(e) => setUserInfo({ ...userInfo, firstName: e.target.value })} className="w-full bg-[#050814] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all" placeholder="Ex: Lucas" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Nom</label>
                <input required type="text" value={userInfo.lastName} onChange={(e) => setUserInfo({ ...userInfo, lastName: e.target.value })} className="w-full bg-[#050814] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all" placeholder="Ex: Martin" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Email</label>
                <input required type="email" value={userInfo.email} onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })} className="w-full bg-[#050814] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all" placeholder="Votre adresse email" />
              </div>
              <div className="mt-2 p-4 bg-white/5 border border-white/10 rounded-xl">
                <label className={`flex items-start gap-3 ${isLocationVerified ? 'cursor-default' : 'cursor-pointer'}`}>
                  <input 
                    type="checkbox" 
                    checked={isLocationVerified}
                    onChange={handleLocationCheck}
                    disabled={isCheckingLocation || isLocationVerified}
                    className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-[#00F0FF] focus:ring-[#00F0FF] focus:ring-offset-0 disabled:opacity-50 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-300 leading-snug">
                    Je confirme être <b>actuellement au centre de lavage</b> pour réclamer mon gain. <span className="text-gray-500">(Vérification GPS)</span>
                  </span>
                </label>
                {isCheckingLocation && <p className="text-sm text-[#00F0FF] mt-3 ml-8 animate-pulse">Vérification de la position en cours...</p>}
                {locationError && <p className="text-sm text-red-400 mt-3 ml-8 font-medium">{locationError}</p>}
                {isLocationVerified && <p className="text-sm text-green-400 mt-3 ml-8 font-bold flex items-center gap-1">✓ Position validée !</p>}
              </div>

              {dbError && <p className="text-red-400 text-sm text-center bg-red-400/10 p-2 rounded-lg">{dbError}</p>}
              <button disabled={isSubmitting || !isLocationVerified} type="submit" className="mt-2 w-full py-4 rounded-xl font-black text-lg text-[#0A0E27] bg-gradient-to-r from-[#00F0FF] to-[#FF006E] hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,0,110,0.4)] disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100">
                {isSubmitting ? "Envoi en cours..." : "RÉCUPÉRER MON LOT"}
              </button>
            </form>
          </motion.div>
        )}

        {/* ÉTAPE 3: SUCCÈS */}
        {hasRegistered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FF006E]/20 to-[#00F0FF]/20" />

            <div className="relative z-10">
              <h3 className="text-3xl font-black text-white mb-2">Bravo {userInfo.firstName} !</h3>
              <p className="text-lg text-gray-300 mb-6">Vous avez remporté :</p>

              <div className="text-2xl font-bold text-[#0A0E27] bg-[#00F0FF] py-4 px-4 rounded-xl mb-6 shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                {wonPrize}
              </div>

              <p className="text-sm text-green-300 font-medium">
                ✅ Votre demande a bien été enregistrée. Votre QR Code vous sera envoyé par email sur <b>{userInfo.email}</b> après validation !
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
