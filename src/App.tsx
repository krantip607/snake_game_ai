/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Trophy, RefreshCw, Music, Terminal, AlertTriangle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Point {
  x: number;
  y: number;
}

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover: string;
}

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Point = { x: 0, y: -1 };
const GAME_SPEED = 120;

const TRACKS: Track[] = [
  {
    id: 1,
    title: "PROTOCOL_01",
    artist: "VOID_ENGINE",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/glitch1/400/400?grayscale"
  },
  {
    id: 2,
    title: "SIGNAL_LOSS",
    artist: "NULL_DATA",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/glitch2/400/400?grayscale"
  },
  {
    id: 3,
    title: "STATIC_VOID",
    artist: "ROOT_ACCESS",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    cover: "https://picsum.photos/seed/glitch3/400/400?grayscale"
  }
];

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // --- Music State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = TRACKS[currentTrackIndex];

  // --- Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        setIsPaused(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => {
          const newScore = s + 10;
          if (newScore > highScore) setHighScore(newScore);
          return newScore;
        });
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isPaused, generateFood, highScore]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
        case ' ': setIsPaused(p => !p); break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction]);

  useEffect(() => {
    gameLoopRef.current = setInterval(moveSnake, GAME_SPEED);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake]);

  // --- Music Logic ---
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("ERR_AUDIO_INIT", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipTrack = (dir: 'next' | 'prev') => {
    let nextIndex = currentTrackIndex + (dir === 'next' ? 1 : -1);
    if (nextIndex >= TRACKS.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = TRACKS.length - 1;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = TRACKS[currentTrackIndex].url;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("ERR_AUDIO_STREAM", e));
      }
    }
  }, [currentTrackIndex]);

  return (
    <div className="min-h-screen bg-black text-[#ff00ff] font-mono selection:bg-[#00ffff]/30 overflow-hidden flex flex-col md:flex-row relative">
      {/* Overlays */}
      <div className="scanline" />
      <div className="noise-overlay" />
      <div className="crt-overlay" />

      <audio ref={audioRef} onEnded={() => skipTrack('next')} />

      {/* Left Sidebar: Cryptic Music Interface */}
      <aside className="w-full md:w-80 bg-black border-b md:border-b-0 md:border-r-4 border-[#00ffff] p-6 flex flex-col gap-8 z-10 relative">
        <div className="flex items-center gap-3 border-b-2 border-[#ff00ff] pb-4">
          <Terminal className="w-6 h-6 text-[#00ffff] animate-pulse" />
          <h1 className="text-2xl font-black tracking-widest uppercase glitch-text">NEURAL_LINK</h1>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-6">
          <motion.div 
            key={currentTrack.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="relative aspect-square border-4 border-[#ff00ff] shadow-[8px_8px_0px_#00ffff] overflow-hidden group"
          >
            <img 
              src={currentTrack.cover} 
              alt={currentTrack.title} 
              className="w-full h-full object-cover filter grayscale contrast-150 brightness-75 group-hover:brightness-100 transition-all"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 mix-blend-overlay" />
            <div className="absolute bottom-2 left-2 bg-black px-2 py-1 border border-[#00ffff]">
              <h2 className="text-sm font-bold text-[#00ffff] tracking-tighter">{currentTrack.title}</h2>
              <p className="text-[10px] text-[#ff00ff]">{currentTrack.artist}</p>
            </div>
          </motion.div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-4">
              <button onClick={() => skipTrack('prev')} className="hover:text-[#00ffff] transition-colors active:scale-90">
                <SkipBack className="w-8 h-8" />
              </button>
              <button 
                onClick={togglePlay}
                className="w-16 h-16 border-4 border-[#00ffff] bg-black text-[#ff00ff] flex items-center justify-center hover:bg-[#00ffff] hover:text-black transition-all shadow-[4px_4px_0px_#ff00ff]"
              >
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
              </button>
              <button onClick={() => skipTrack('next')} className="hover:text-[#00ffff] transition-colors active:scale-90">
                <SkipForward className="w-8 h-8" />
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase tracking-tighter">
                <span>SIGNAL_STRENGTH</span>
                <span>{isPlaying ? '60%' : '0%'}</span>
              </div>
              <div className="h-4 border-2 border-[#ff00ff] p-[2px]">
                <motion.div 
                  className="h-full bg-[#00ffff]" 
                  animate={{ width: isPlaying ? '60%' : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-[#00ffff] uppercase tracking-widest leading-tight">
          STATUS: {isPlaying ? 'TRANSMITTING' : 'IDLE'}<br />
          BUFFER: 0x4F2A<br />
          ENCRYPTION: AES-256
        </div>
      </aside>

      {/* Main Content: The Simulation */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-4 md:p-12">
        <div className="relative z-10 w-full max-w-2xl flex flex-col gap-8">
          <div className="flex items-end justify-between border-b-4 border-[#00ffff] pb-2">
            <div className="flex flex-col">
              <span className="text-xs text-[#00ffff] uppercase font-bold">DATA_COLLECTED</span>
              <div className="text-6xl font-black tracking-tighter text-[#ff00ff] leading-none">
                {score.toString().padStart(4, '0')}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-[#ff00ff] uppercase font-bold">MAX_CAPACITY</span>
              <div className="flex items-center gap-2 text-3xl font-bold text-[#00ffff]">
                <Zap className="w-6 h-6 text-[#00ffff]" />
                {highScore.toString().padStart(4, '0')}
              </div>
            </div>
          </div>

          {/* Simulation Grid */}
          <div 
            className="relative aspect-square w-full bg-black border-4 border-[#ff00ff] shadow-[12px_12px_0px_#00ffff] overflow-hidden"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            }}
          >
            {/* Snake Segments */}
            {snake.map((segment, i) => (
              <div
                key={`${i}-${segment.x}-${segment.y}`}
                className={`
                  border border-black
                  ${i === 0 
                    ? 'bg-[#00ffff] shadow-[0_0_10px_#00ffff]' 
                    : 'bg-[#ff00ff]'}
                `}
                style={{
                  gridColumnStart: segment.x + 1,
                  gridRowStart: segment.y + 1,
                }}
              />
            ))}

            {/* Data Fragment (Food) */}
            <motion.div
              animate={{
                opacity: [1, 0.2, 1],
                scale: [1, 0.8, 1.2, 1],
              }}
              transition={{
                duration: 0.1,
                repeat: Infinity,
              }}
              className="bg-white border-2 border-[#00ffff] z-10"
              style={{
                gridColumnStart: food.x + 1,
                gridRowStart: food.y + 1,
              }}
            />

            {/* System Overlays */}
            <AnimatePresence>
              {(gameOver || isPaused) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 bg-black/90 flex items-center justify-center p-8 text-center"
                >
                  <div className="flex flex-col items-center gap-8 border-4 border-[#ff00ff] p-12 bg-black shadow-[10px_10px_0px_#00ffff]">
                    {gameOver ? (
                      <>
                        <div className="flex items-center gap-4 text-red-500">
                          <AlertTriangle className="w-12 h-12 animate-bounce" />
                          <h2 className="text-6xl font-black uppercase tracking-tighter glitch-text">
                            FATAL_ERR
                          </h2>
                        </div>
                        <p className="text-[#00ffff] text-xl">
                          CORE_INTEGRITY_COMPROMISED<br />
                          SCORE_RETAINED: {score}
                        </p>
                        <button 
                          onClick={resetGame}
                          className="px-10 py-5 bg-[#ff00ff] text-black font-black text-2xl uppercase tracking-widest hover:bg-[#00ffff] transition-all shadow-[6px_6px_0px_white]"
                        >
                          REBOOT_SIM
                        </button>
                      </>
                    ) : (
                      <>
                        <h2 className="text-6xl font-black uppercase tracking-tighter text-[#00ffff] glitch-text">
                          HALTED
                        </h2>
                        <p className="text-[#ff00ff] text-xl">
                          WAITING_FOR_INPUT...<br />
                          [SPACE]_TO_RESUME
                        </p>
                        <button 
                          onClick={() => setIsPaused(false)}
                          className="px-10 py-5 bg-[#00ffff] text-black font-black text-2xl uppercase tracking-widest hover:bg-[#ff00ff] transition-all shadow-[6px_6px_0px_white]"
                        >
                          RESUME_LINK
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[12px] text-[#00ffff] uppercase font-bold">
            <div className="border-2 border-[#ff00ff] p-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              INPUT: ARROW_KEYS
            </div>
            <div className="border-2 border-[#ff00ff] p-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              PAUSE: SPACE_BAR
            </div>
          </div>
        </div>
      </main>

      {/* Decorative Glitch Bars */}
      <div className="fixed top-0 right-0 w-1 h-full bg-[#00ffff] opacity-30 animate-pulse" />
      <div className="fixed top-0 left-0 w-1 h-full bg-[#ff00ff] opacity-30 animate-pulse" />
    </div>
  );
}
