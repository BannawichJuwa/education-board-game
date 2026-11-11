import React, { useState, useEffect } from 'react';
import { X, Check, Dices, HelpCircle, Trophy, Lightbulb, Sparkles, Layers } from 'lucide-react';
import { PixelIcon } from './PixelIcon';
import { useLanguage } from '../context/LanguageContext';
import { playClickSound } from '../utils/audio';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreate?: () => void;
}

type TabType = 'snakes' | 'bingo' | 'cards' | 'teacher_tips';

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
  onOpenCreate,
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('snakes');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        playClickSound();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    playClickSound();
    onClose();
  };

  const handleSwitchTab = (tab: TabType) => {
    playClickSound();
    setActiveTab(tab);
  };

  const isEn = language === 'en';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl px-window shadow-[8px_8px_0_var(--px-hard-shadow)] max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-play-title"
      >
        {/* Titlebar */}
        <div className="px-titlebar px-titlebar-yellow py-1.5 flex items-center justify-between flex-shrink-0">
          <div className="px-titlebar-title flex items-center gap-2">
            <PixelIcon name="smiley" size={16} />
            <span id="how-to-play-title" className="font-pixel text-xs sm:text-sm font-bold truncate">
              how_to_play.exe — {isEn ? 'Classroom Game Rules & How to Play' : 'วิธีการเล่นและกติกาบอร์ดเกมในห้องเรียน'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleClose}
              className="w-6 h-6 bg-[var(--px-surface)] hover:bg-[#FF6B7A] hover:text-[#2A050B] text-[var(--px-text)] border-2 border-[var(--px-border)] flex items-center justify-center cursor-pointer transition shadow-[1px_1px_0_var(--px-hard-shadow)]"
              title={isEn ? 'Close (Esc)' : 'ปิดหน้าต่าง (Esc)'}
              aria-label={isEn ? 'Close' : 'ปิด'}
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Header */}
        <div className="flex flex-wrap items-center gap-1 p-2 bg-[var(--px-surface-sunken)] border-b-2 border-[var(--px-border)] flex-shrink-0">
          <button
            type="button"
            onClick={() => handleSwitchTab('snakes')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-2 transition cursor-pointer ${
              activeTab === 'snakes'
                ? 'bg-[var(--px-yellow)] text-[#2A2350] border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)]'
                : 'bg-[var(--px-surface)] text-[var(--px-text-muted)] border-[var(--px-border-muted)] hover:text-[var(--px-text)] hover:bg-[var(--px-surface-2)]'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>{isEn ? 'Snakes & Ladders' : 'บันไดงู'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('bingo')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-2 transition cursor-pointer ${
              activeTab === 'bingo'
                ? 'bg-[var(--px-sky)] text-[#2A2350] border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)]'
                : 'bg-[var(--px-surface)] text-[var(--px-text-muted)] border-[var(--px-border-muted)] hover:text-[var(--px-text)] hover:bg-[var(--px-surface-2)]'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>{isEn ? 'Bingo' : 'บิงโก'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('cards')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-2 transition cursor-pointer ${
              activeTab === 'cards'
                ? 'bg-[var(--px-pink)] text-[#2A2350] border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)]'
                : 'bg-[var(--px-surface)] text-[var(--px-text-muted)] border-[var(--px-border-muted)] hover:text-[var(--px-text)] hover:bg-[var(--px-surface-2)]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isEn ? 'Card Matching' : 'เปิดไพ่จับคู่'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('teacher_tips')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-2 transition cursor-pointer ${
              activeTab === 'teacher_tips'
                ? 'bg-[var(--px-mint)] text-[#2A2350] border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)]'
                : 'bg-[var(--px-surface)] text-[var(--px-text-muted)] border-[var(--px-border-muted)] hover:text-[var(--px-text)] hover:bg-[var(--px-surface-2)]'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>{isEn ? 'Teacher Tips' : 'เทคนิคคุณครู'}</span>
          </button>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-[var(--px-text)] bg-[var(--px-surface)] flex-1">
          {activeTab === 'snakes' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-3 p-3 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)]">
                <div className="w-10 h-10 bg-[var(--px-yellow)] text-[#2A2350] border-2 border-[var(--px-border)] flex items-center justify-center font-bold text-lg">
                  🎲
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--px-text)]">
                    {isEn ? 'Snakes & Ladders Board Game' : 'เกมบันไดงู (Snakes & Ladders)'}
                  </h3>
                  <p className="text-[var(--px-text-muted)] text-xs">
                    {isEn ? 'Turn-based race to the Goal tile with dice rolling and interactive animations' : 'เกมแข่งเดินหมากเข้าเส้นชัย ตอบถูกได้ทอยเต๋า ไต่บันไดและระวังงูสไลด์'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] space-y-1.5">
                  <div className="font-bold text-[var(--px-text)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--px-yellow)] text-[#2A2350] flex items-center justify-center text-xs font-black">1</span>
                    <span>{isEn ? 'Answer Questions to Roll' : 'ตอบคำถามเพื่อปลดล็อกเต๋า'}</span>
                  </div>
                  <p className="text-xs text-[var(--px-text-muted)] leading-relaxed">
                    {isEn 
                      ? 'Students in each team raise their hand to answer verbally. The team marked correct by the teacher unlocks the right to roll the 3D dice.' 
                      : 'นักเรียนในแต่ละทีมแข่งกันยกมือตอบคำถามปากเปล่า ทีมที่ครูกดตัดสินว่าตอบถูกต้อง จะได้รับสิทธิ์คลิกทอยลูกเต๋า 1 ครั้ง'}
                  </p>
                </div>

                <div className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] space-y-1.5">
                  <div className="font-bold text-[var(--px-text)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--px-yellow)] text-[#2A2350] flex items-center justify-center text-xs font-black">2</span>
                    <span>{isEn ? 'Hop Pawn by Dice Value' : 'ตัวหมากกระโดดตามแต้มเต๋า'}</span>
                  </div>
                  <p className="text-xs text-[var(--px-text-muted)] leading-relaxed">
                    {isEn 
                      ? 'The mascot hops tile-by-tile according to the dice face (1-6) and earns progression points for every step forward.' 
                      : 'ตัวหมากแมวของทีมจะกระโดดไปข้างหน้าทีละช่องตามแต้มลูกเต๋า (1-6) พร้อมรับคะแนนการเดินตามช่อง'}
                  </p>
                </div>

                <div className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] space-y-1.5">
                  <div className="font-bold text-[var(--px-text)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--px-mint)] text-[#2A2350] flex items-center justify-center text-xs font-black">3</span>
                    <span>{isEn ? 'Climb Ladders & Avoid Snakes' : 'ไต่บันได และ ระวังสไลด์งู'}</span>
                  </div>
                  <p className="text-xs text-[var(--px-text-muted)] leading-relaxed">
                    {isEn 
                      ? 'Landing on a Ladder base climbs directly to a higher tile. Landing on a Snake head slides down to its tail tile.' 
                      : 'ตกช่องบันไดจะปีนข้ามไปยังช่องที่สูงกว่าทันที ตกช่องหัวงูจะสไลด์ถอยหลังลงมายังช่องปลายหางงู'}
                  </p>
                </div>

                <div className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] space-y-1.5">
                  <div className="font-bold text-[var(--px-text)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--px-pink)] text-[#2A2350] flex items-center justify-center text-xs font-black">4</span>
                    <span>{isEn ? 'Victory Condition' : 'เงื่อนไขการชนะ'}</span>
                  </div>
                  <p className="text-xs text-[var(--px-text-muted)] leading-relaxed">
                    {isEn 
                      ? 'The first team whose mascot reaches or exceeds the final GOAL tile wins Level Clear & Victory!' 
                      : 'ทีมแรกที่สามารถเดินหมากไปถึงช่อง GOAL (เส้นชัย) จะเป็นผู้ชนะเกมทันที! (Quick 30 ช่อง / Standard 50 ช่อง)'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bingo' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-3 p-3 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)]">
                <div className="w-10 h-10 bg-[var(--px-sky)] text-[#2A2350] border-2 border-[var(--px-border)] flex items-center justify-center font-bold text-lg">
                  ⭐
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--px-text)]">
                    {isEn ? 'Bingo Classroom Board Game' : 'เกมบิงโกชิงพื้นที่ (Bingo Game)'}
                  </h3>
                  <p className="text-[var(--px-text-muted)] text-xs">
                    {isEn ? 'Territory control & strategic line completion on 4x4 or 5x5 grid' : 'ตอบถูกชิงช่องตาราง วางแผนยึดพื้นที่และเรียงเส้นแถวครบเพื่อ BINGO!'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] space-y-1.5">
                  <div className="font-bold text-[var(--px-text)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--px-sky)] text-[#2A2350] flex items-center justify-center text-xs font-black">1</span>
                    <span>{isEn ? 'Claim 1 Tile Per Correct Answer' : 'ตอบถูกได้ครอบครอง 1 ช่อง'}</span>
                  </div>
                  <p className="text-xs text-[var(--px-text-muted)] leading-relaxed">
                    {isEn 
                      ? 'Teams answer teacher questions. Answering correctly awards the right to claim 1 unoccupied tile on the grid in team colors.' 
                      : 'เมื่อตอบคำถามถูกต้อง ทีมจะได้รับสิทธิ์คลิกเลือกครอบครองช่องว่างบนตาราง 1 ช่องเป็นสีประจำทีม'}
                  </p>
                </div>

                <div className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] space-y-1.5">
                  <div className="font-bold text-[var(--px-text)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--px-sky)] text-[#2A2350] flex items-center justify-center text-xs font-black">2</span>
                    <span>{isEn ? 'Complete Any 1 Line = BINGO!' : 'เรียงครบ 1 เส้น = BINGO!'}</span>
                  </div>
                  <p className="text-xs text-[var(--px-text-muted)] leading-relaxed">
                    {isEn 
                      ? 'Connect any horizontal row, vertical column, or diagonal line to trigger instant BINGO (+30 bonus pts) and victory!' 
                      : 'ทีมที่วางหมากเรียงติดต่อกันครบ 1 เส้นแถว (แนวนอน แนวตั้ง หรือแนวทแยง) จะได้สิทธิ์ BINGO! โบนัส +30 คะแนนและชนะทันที'}
                  </p>
                </div>

                <div className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] space-y-1.5">
                  <div className="font-bold text-[var(--px-text)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--px-yellow)] text-[#2A2350] flex items-center justify-center text-xs font-black">3</span>
                    <span>{isEn ? 'Territory Defense Strategy' : 'กลยุทธ์สกัดกั้นคู่แข่ง'}</span>
                  </div>
                  <p className="text-xs text-[var(--px-text-muted)] leading-relaxed">
                    {isEn 
                      ? 'Teams can strategically pick tiles that block opposing teams from completing their lines while advancing their own.' 
                      : 'ทีมสามารถเลือกช่องเพื่อดักทางไม่ให้ทีมคู่แข่งต่อเส้นแถวสำเร็จ ควบคู่กับการสร้างเส้นของตัวเอง'}
                  </p>
                </div>

                <div className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] space-y-1.5">
                  <div className="font-bold text-[var(--px-text)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--px-mint)] text-[#2A2350] flex items-center justify-center text-xs font-black">4</span>
                    <span>{isEn ? 'Territory Points Backup' : 'นับคะแนนพื้นที่เมื่อกระดานเต็ม'}</span>
                  </div>
                  <p className="text-xs text-[var(--px-text-muted)] leading-relaxed">
                    {isEn 
                      ? 'If all tiles are claimed without any team achieving a full line, the team holding the most tiles wins on territory score.' 
                      : 'หากกระดานเต็มหรือหมดเวลาโดยไม่มีใครทำบิงโกได้ ทีมที่ครอบครองจำนวนช่องมากที่สุดจะเป็นฝ่ายชนะ'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-3 p-3 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)]">
                <div className="w-10 h-10 bg-[var(--px-pink)] text-[#2A2350] border-2 border-[var(--px-border)] flex items-center justify-center font-bold text-lg">
                  🃏
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--px-text)]">
                    {isEn ? 'Card Matching Memory Game' : 'เกมเปิดไพ่จับคู่ความจำ (Card Matching)'}
                  </h3>
                  <p className="text-[var(--px-text-muted)] text-xs">
                    {isEn ? 'Classic pair matching: answer correctly to flip 2 cards and match identical symbols' : 'เกมทดสอบความจำ ตอบถูกได้เปิดการ์ด 2 ใบ จับคู่ภาพเดียวกันรับคะแนนโบนัส'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] space-y-1.5">
                  <div className="font-bold text-[var(--px-text)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--px-pink)] text-[#2A2350] flex items-center justify-center text-xs font-black">1</span>
                    <span>{isEn ? 'Flip 2 Cards' : 'ตอบถูกได้เปิดไพ่ 2 ใบ'}</span>
                  </div>
                  <p className="text-xs text-[var(--px-text-muted)] leading-relaxed">
                    {isEn 
                      ? 'Answering a teacher question correctly unlocks the right to flip 2 cards on the board sequentially.' 
                      : 'เมื่อตอบคำถามถูกต้อง ทีมจะได้รับสิทธิ์คลิกเปิดการ์ด 2 ใบบนกระดานตามลำดับ'}
                  </p>
                </div>

                <div className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] space-y-1.5">
                  <div className="font-bold text-[var(--px-text)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--px-mint)] text-[#2A2350] flex items-center justify-center text-xs font-black">2</span>
                    <span>{isEn ? 'Matching Pair = +20 Pts' : 'เปิดเจอคู่เหมือน = +20 คะแนน'}</span>
                  </div>
                  <p className="text-xs text-[var(--px-text-muted)] leading-relaxed">
                    {isEn 
                      ? 'If both cards reveal the same mascot or symbol, the pair is matched permanently, awarding +20 bonus points.' 
                      : 'หากการ์ดทั้งสองใบมีภาพหรือสัญลักษณ์เดียวกัน การ์ดคู่นั้นจะเปิดค้างไว้ถาวร พร้อมรับโบนัส +20 คะแนน'}
                  </p>
                </div>

                <div className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] space-y-1.5">
                  <div className="font-bold text-[var(--px-text)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--px-yellow)] text-[#2A2350] flex items-center justify-center text-xs font-black">3</span>
                    <span>{isEn ? 'Mismatch Auto-Flips Back' : 'ไม่ตรงกัน การ์ดจะคว่ำกลับ'}</span>
                  </div>
                  <p className="text-xs text-[var(--px-text-muted)] leading-relaxed">
                    {isEn 
                      ? 'If the cards do not match, they automatically flip back after 1.3 seconds so all teams can memorize the positions.' 
                      : 'หากการ์ดทั้งสองใบไม่ตรงกัน การ์ดจะพลิกคว่ำกลับอัตโนมัติใน 1.3 วินาที เพื่อให้ทุกทีมช่วยกันจำตำแหน่ง'}
                  </p>
                </div>

                <div className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] space-y-1.5">
                  <div className="font-bold text-[var(--px-text)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--px-sky)] text-[#2A2350] flex items-center justify-center text-xs font-black">4</span>
                    <span>{isEn ? 'Board Clear Victory' : 'เปิดครบทุกคู่ ตัดสินผู้ชนะ'}</span>
                  </div>
                  <p className="text-xs text-[var(--px-text-muted)] leading-relaxed">
                    {isEn 
                      ? 'Play continues until all pairs are discovered (Quick: 10 pairs / 20 cards, Standard: 15 pairs / 30 cards). Team with highest score wins!' 
                      : 'เล่นจนกว่าจะจับคู่การ์ดได้ครบทุกคู่ (แบบเร็ว 10 คู่ 20 ใบ / แบบมาตรฐาน 15 คู่ 30 ใบ) ทีมคะแนนรวมสูงสุดชนะ!'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'teacher_tips' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-3 p-3 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)]">
                <div className="w-10 h-10 bg-[var(--px-mint)] text-[#2A2350] border-2 border-[var(--px-border)] flex items-center justify-center font-bold text-lg">
                  💡
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--px-text)]">
                    {isEn ? 'Classroom Conductor Guide for Teachers' : 'แนวทางดำเนินกิจกรรมสำหรับคุณครูผู้สอน'}
                  </h3>
                  <p className="text-[var(--px-text-muted)] text-xs">
                    {isEn ? '100% Teacher-controlled on one projector screen with zero student device requirements' : 'ควบคุมโดยอาจารย์ 100% ผ่านจอโปรเจกเตอร์เดียว นักเรียนไม่ต้องใช้โทรศัพท์หรือแท็บเล็ต'}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] flex items-start gap-3">
                  <span className="p-1 bg-[var(--px-yellow)] text-[#2A2350] border border-[var(--px-border)] font-bold text-xs mt-0.5">
                    1 จอ
                  </span>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[var(--px-text)]">
                      {isEn ? 'One Projector Screen in Front of Class' : 'ฉายจอเดียวด้านหน้าห้องเรียน'}
                    </h4>
                    <p className="text-xs text-[var(--px-text-muted)] mt-0.5">
                      {isEn 
                        ? 'Connect your computer or laptop to the projector. All students watch the board, questions, and team scores together.' 
                        : 'ฉายภาพจากหน้าจอครูขึ้นโปรเจกเตอร์ ทุกคนมองเห็นคำถามและกระดานการแข่งขันพร้อมกันทั้งห้อง'}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] flex items-start gap-3">
                  <span className="p-1 bg-[var(--px-sky)] text-[#2A2350] border border-[var(--px-border)] font-bold text-xs mt-0.5">
                    ยกมือ
                  </span>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[var(--px-text)]">
                      {isEn ? 'Hand-Raising & Team Discussion' : 'ให้นักเรียนปรึกษาและยกมือตอบ'}
                    </h4>
                    <p className="text-xs text-[var(--px-text-muted)] mt-0.5">
                      {isEn 
                        ? 'Students discuss questions within their group and raise hands. Click the first-responding team button on screen.' 
                        : 'ส่งเสริมการมีส่วนร่วมในห้อง โดยให้นักเรียนปรึกษากันในทีมแล้วยกมือตอบ ครูคลิกเลือกทีมที่ยกมือก่อนเพื่อบันทึกคะแนน'}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] flex items-start gap-3">
                  <span className="p-1 bg-[var(--px-mint)] text-[#2A2350] border border-[var(--px-border)] font-bold text-xs mt-0.5">
                    รายงาน
                  </span>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[var(--px-text)]">
                      {isEn ? 'Automated Analytics & Print Report' : 'สรุปคะแนนอัตโนมัติและพิมพ์รายงานผล'}
                    </h4>
                    <p className="text-xs text-[var(--px-text-muted)] mt-0.5">
                      {isEn 
                        ? 'When the game finishes, a comprehensive debriefing report with student rosters, accuracy rates, and score charts is ready to export or print.' 
                        : 'หลังจบเกม ระบบสรุปผลคะแนนแบบเจาะลึก รายชื่อสมาชิกทีม กราฟคะแนน และสามารถกดพิมพ์ลงกระดาษ A4 ได้ทันที'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3 sm:px-6 sm:py-3.5 bg-[var(--px-surface-sunken)] border-t-2 border-[var(--px-border)] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-[var(--px-text-muted)] font-bold hidden sm:block">
            {isEn ? 'Press ESC or click close to return' : 'กด ESC หรือคลิกปุ่มปิดเพื่อกลับสู่หน้าจอเดิม'}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-btn px-btn-secondary px-4 py-2 text-xs sm:text-sm flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>{isEn ? 'Close Window' : 'ปิดหน้าต่าง'}</span>
            </button>

            {onOpenCreate && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onOpenCreate();
                }}
                className="px-btn px-4 py-2 text-xs sm:text-sm flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
              >
                <PixelIcon name="dice" size={16} />
                <span>{isEn ? 'Create Game Now' : 'สร้างเกมใหม่เลย'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
