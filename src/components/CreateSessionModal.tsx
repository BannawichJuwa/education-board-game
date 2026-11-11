import { DB_LIMITS, fit, fitPoints } from '../config/dbLimits';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, ArrowRight, ArrowLeft, AlertTriangle
} from 'lucide-react';
import { GameType, Question, Session, Team } from '../types';
import { 
  DEFAULT_TEAM_PALETTES, 
  generateBingoState, 
  generateCardMatchingState, 
  generateSnakesLaddersState 
} from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { PixelIcon } from './PixelIcon';
import { playClickSound } from '../utils/audio';
import { getRecommendedQuestionCount } from '../config/gameRules';
import { formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

const SAMPLE_QUESTIONS_EN = [
  { text: 'What does CPU stand for, and which human organ is it often compared to?', answer: 'Central Processing Unit (The Brain)', points: 10, category: 'Computer Science' },
  { text: 'Which planet in our solar system is the largest in size?', answer: 'Jupiter', points: 10, category: 'Astronomy' },
  { text: 'What is the longest river in the world?', answer: 'Nile River', points: 10, category: 'Geography' },
  { text: 'Which chemical element is represented by the atomic symbol Au?', answer: 'Gold (Aurum)', points: 15, category: 'Chemistry' },
  { text: 'Which continent has both the largest land area and the highest population?', answer: 'Asia', points: 10, category: 'Social Studies' },
  { text: 'How many sides does a regular hexagon have?', answer: '6 sides', points: 10, category: 'Mathematics' },
  { text: 'What process do green plants use to convert sunlight into energy?', answer: 'Photosynthesis', points: 10, category: 'Biology' },
  { text: 'What is the freezing point of water in Celsius?', answer: '0°C', points: 10, category: 'Science' },
  { text: 'Who wrote the play Romeo and Juliet?', answer: 'William Shakespeare', points: 10, category: 'Literature' },
  { text: 'What is the hardest known natural mineral on Earth?', answer: 'Diamond', points: 15, category: 'Earth Science' },
  { text: 'What gas do humans need to breathe in to survive?', answer: 'Oxygen (O2)', points: 10, category: 'Health' },
  { text: 'Which ocean is the deepest and largest in surface area?', answer: 'Pacific Ocean', points: 10, category: 'Geography' },
  { text: 'In what year was the World Wide Web created?', answer: '1989', points: 15, category: 'History & Tech' },
  { text: 'What is the speed of light in vacuum approx. in km/s?', answer: '300,000 km/s', points: 20, category: 'Physics' },
  { text: 'How many chromosomes does a normal human body cell have?', answer: '46 (23 pairs)', points: 15, category: 'Biology' },
  { text: 'Which scientist formulated the laws of universal gravitation?', answer: 'Sir Isaac Newton', points: 10, category: 'Physics' },
];

const SAMPLE_QUESTIONS_TH = [
  { text: 'CPU ย่อมาจากอะไร และทำหน้าที่เปรียบเหมือนอวัยวะใดของมนุษย์?', answer: 'Central Processing Unit (เปรียบเหมือนสมอง)', points: 10, category: 'คอมพิวเตอร์' },
  { text: 'ดาวเคราะห์ดวงใดในระบบสุริยะมีขนาดใหญ่ที่สุด?', answer: 'ดาวพฤหัสบดี (Jupiter)', points: 10, category: 'ดาราศาสตร์' },
  { text: 'แม่น้ำสายใดมีความยาวมากที่สุดในโลก?', answer: 'แม่น้ำไนล์ (Nile)', points: 10, category: 'ภูมิศาสตร์' },
  { text: 'ธาตุใดที่มีสัญลักษณ์ทางเคมีคือ Au?', answer: 'ทองคำ (Gold)', points: 15, category: 'เคมี' },
  { text: 'ทวีปใดมีพื้นที่ขนาดใหญ่ที่สุดและประชากรมากที่สุดในโลก?', answer: 'ทวีปเอเชีย (Asia)', points: 10, category: 'สังคมศึกษา' },
  { text: 'รูปหกเหลี่ยมปกติมีมุมภายในรวมกันทั้งหมดกี่องศา?', answer: '720 องศา (6 ด้าน)', points: 10, category: 'คณิตศาสตร์' },
  { text: 'กระบวนการที่พืชสีเขียวใช้แสงแดดสร้างอาหารเรียกว่าอะไร?', answer: 'การสังเคราะห์ด้วยแสง (Photosynthesis)', points: 10, category: 'ชีววิทยา' },
  { text: 'จุดเยือกแข็งของน้ำบริสุทธิ์อยู่ที่กี่องศาเซลเซียส?', answer: '0 องศาเซลเซียส', points: 10, category: 'วิทยาศาสตร์' },
  { text: 'สุนทรภู่ได้รับการยกย่องเป็นกวีเอกของโลกโดยองค์กรใด?', answer: 'ยูเนสโก (UNESCO)', points: 10, category: 'ภาษาไทย' },
  { text: 'แร่ธรรมชาติชนิดใดมีความแข็งมากที่สุดตามสเกลของโมห์ส?', answer: 'เพชร (Diamond)', points: 15, category: 'วิทยาศาสตร์กายภาพ' },
  { text: 'ก๊าซชนิดใดที่มีสัดส่วนมากที่สุดในชั้นบรรยากาศของโลก?', answer: 'ไนโตรเจน (ประมาณ 78%)', points: 10, category: 'วิทยาศาสตร์' },
  { text: 'มหาสมุทรใดมีขนาดพื้นที่กว้างใหญ่และลึกที่สุดในโลก?', answer: 'มหาสมุทรแปซิฟิก (Pacific)', points: 10, category: 'ภูมิศาสตร์' },
  { text: 'ประเทศไทยตั้งอยู่ในภูมิภาคใดของทวีปเอเชีย?', answer: 'เอเชียตะวันออกเฉียงใต้ (Southeast Asia)', points: 10, category: 'สังคมศึกษา' },
  { text: 'แสงเดินทางด้วยความเร็วประมาณกี่กิโลเมตรต่อวินาทีในสุญญากาศ?', answer: 'ประมาณ 300,000 กม./วินาที', points: 20, category: 'ฟิสิกส์' },
  { text: 'เซลล์ร่างกายมนุษย์ปกติมีโครโมโซมทั้งหมดกี่แท่ง?', answer: '46 แท่ง (23 คู่)', points: 15, category: 'ชีววิทยา' },
  { text: 'นักวิทยาศาสตร์ท่านใดเป็นผู้ค้นพบกฎแรงโน้มถ่วงสากล?', answer: 'เซอร์ไอแซก นิวตัน (Sir Isaac Newton)', points: 10, category: 'ฟิสิกส์' },
];

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: (session: Session, action?: 'play' | 'save_only') => void;
  initialGameType?: GameType;
  onOpenLogin?: () => void;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  isOpen,
  onClose,
  onSessionCreated,
  initialGameType,
  onOpenLogin,
}) => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Session Details
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [gameType, setGameType] = useState<GameType>(initialGameType || 'snakes_ladders');

  React.useEffect(() => {
    if (isOpen && initialGameType) {
      setGameType(initialGameType);
    }
  }, [isOpen, initialGameType]);
  const [durationPreset, setDurationPreset] = useState<'quick' | 'standard'>('quick');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(5);
  const [customMinutes, setCustomMinutes] = useState<string>('5');

  // Step 2: Teams & Students
  const [teams, setTeams] = useState<Team[]>(() => [
    {
      id: 'team-1',
      name: language === 'en' ? 'Team 1 (Red)' : 'ทีมที่ 1 (Red)',
      color: DEFAULT_TEAM_PALETTES[0].color,
      badgeColor: DEFAULT_TEAM_PALETTES[0].badgeColor,
      textColor: DEFAULT_TEAM_PALETTES[0].textColor,
      students: [],
      score: 0,
      correctAnswersCount: 0,
      wrongAnswersCount: 0,
      pawnPosition: 1,
    },
    {
      id: 'team-2',
      name: language === 'en' ? 'Team 2 (Blue)' : 'ทีมที่ 2 (Blue)',
      color: DEFAULT_TEAM_PALETTES[1].color,
      badgeColor: DEFAULT_TEAM_PALETTES[1].badgeColor,
      textColor: DEFAULT_TEAM_PALETTES[1].textColor,
      students: [],
      score: 0,
      correctAnswersCount: 0,
      wrongAnswersCount: 0,
      pawnPosition: 1,
    },
  ]);

  // Helper to create empty question boxes
  const createEmptyQuestions = (count: number, startIndex: number = 0): Question[] => {
    return Array.from({ length: Math.max(0, count) }, (_, i) => ({
      id: `q-${Date.now()}-${startIndex + i + 1}`,
      text: '',
      answer: '',
      points: 10,
      category: '',
    }));
  };

  const recommendedCount = getRecommendedQuestionCount(gameType, durationPreset, teams.length);

  // Step 3: Questions
  const [questions, setQuestions] = useState<Question[]>(() =>
    createEmptyQuestions(getRecommendedQuestionCount('snakes_ladders', 'quick', 2))
  );

  const [studentInputByTeam, setStudentInputByTeam] = useState<Record<string, string>>({});
  const [showLowQuestionsWarning, setShowLowQuestionsWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState<'play' | 'save_only' | null>(null);

  const filledCount = questions.filter((q) => q.text.trim().length > 0).length;

  // ---- Required-field validation (shown once the teacher tries to move on) ----
  const [showErrors, setShowErrors] = useState(false);
  const [errorAttempt, setErrorAttempt] = useState(0);
  const isEn = language === 'en';
  const customMinutesNum = parseInt(customMinutes, 10);
  const isTimeInvalid =
    customMinutes.trim() !== '' && (isNaN(customMinutesNum) || customMinutesNum < 1 || customMinutesNum > 120);
  const isTitleMissing = title.trim().length === 0;
  const emptyTeamNameIndexes = teams
    .map((tm, i) => (tm.name.trim().length === 0 ? i : -1))
    .filter((i) => i !== -1);
  const duplicateTeamNames = teams
    .map((tm) => tm.name.trim().toLowerCase())
    .filter((n, i, arr) => n.length > 0 && arr.indexOf(n) !== i);
  const questionMissingAnswerIndexes = questions
    .map((q, i) => (q.text.trim().length > 0 && !(q.answer || '').trim() ? i : -1))
    .filter((i) => i !== -1);
  const answerMissingQuestionIndexes = questions
    .map((q, i) => (q.text.trim().length === 0 && (q.answer || '').trim().length > 0 ? i : -1))
    .filter((i) => i !== -1);

  const getStepErrors = (s: 1 | 2 | 3): string[] => {
    const errs: string[] = [];
    if (s === 1) {
      if (isTitleMissing) {
        errs.push(isEn ? 'Please enter a session name / activity topic.' : 'กรุณาใส่ชื่อ Session หรือหัวข้อกิจกรรม');
      }
      if (isTimeInvalid) {
        errs.push(isEn ? 'Time limit must be between 1 and 120 minutes.' : 'ระยะเวลาแข่งขันต้องอยู่ระหว่าง 1 - 120 นาที');
      }
    }
    if (s === 2) {
      if (emptyTeamNameIndexes.length > 0) {
        errs.push(
          isEn
            ? `Please name every team (team ${emptyTeamNameIndexes.map((i) => i + 1).join(', ')} is empty).`
            : `กรุณาตั้งชื่อทีมให้ครบ (ทีมที่ ${emptyTeamNameIndexes.map((i) => i + 1).join(', ')} ยังไม่มีชื่อ)`
        );
      }
      if (duplicateTeamNames.length > 0) {
        errs.push(isEn ? 'Team names must be different from each other.' : 'ชื่อทีมซ้ำกัน กรุณาตั้งชื่อทีมให้ไม่ซ้ำกัน');
      }
    }
    if (s === 3) {
      // (Too few / zero questions is handled by the low-questions pop-up on submit.)
      if (questionMissingAnswerIndexes.length > 0) {
        errs.push(
          isEn
            ? `Please enter the answer key for question ${questionMissingAnswerIndexes.map((i) => i + 1).join(', ')}.`
            : `กรุณาใส่เฉลยคำตอบของคำถามข้อที่ ${questionMissingAnswerIndexes.map((i) => i + 1).join(', ')}`
        );
      }
      if (answerMissingQuestionIndexes.length > 0) {
        errs.push(
          isEn
            ? `Question ${answerMissingQuestionIndexes.map((i) => i + 1).join(', ')} has an answer but no question text.`
            : `ข้อที่ ${answerMissingQuestionIndexes.map((i) => i + 1).join(', ')} มีเฉลยแต่ยังไม่ได้ใส่คำถาม`
        );
      }
    }
    return errs;
  };

  /** Returns the first step (up to and including `upTo`) that still has errors, or null. */
  const findInvalidStep = (upTo: 1 | 2 | 3): 1 | 2 | 3 | null => {
    for (const s of [1, 2, 3] as const) {
      if (s > upTo) break;
      if (getStepErrors(s).length > 0) return s;
    }
    return null;
  };

  /** Move to another step; moving forward requires the earlier steps to be valid. */
  const goToStep = (target: 1 | 2 | 3) => {
    if (target > step) {
      const bad = findInvalidStep((target - 1) as 1 | 2 | 3);
      if (bad !== null) {
        playClickSound();
        setShowErrors(true);
        setErrorAttempt((n) => n + 1);
        setStep(bad);
        return;
      }
    }
    setStep(target);
  };

  const currentStepErrors = showErrors ? getStepErrors(step) : [];
  const bodyRef = useRef<HTMLDivElement | null>(null);
  // Bring the warning banner into view whenever a validation attempt fails
  useEffect(() => {
    if (errorAttempt > 0 && bodyRef.current) bodyRef.current.scrollTo({ top: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorAttempt]);

  useEffect(() => {
    if (isOpen) {
      setShowErrors(false);
      setStep(1);
      setTitle('');
      setSubject('');
      setStudentInputByTeam({});
      setShowLowQuestionsWarning(false);
      setPendingAction(null);
      setTeams([
        {
          id: 'team-1',
          name: language === 'en' ? 'Team 1 (Red)' : 'ทีมที่ 1 (Red)',
          color: DEFAULT_TEAM_PALETTES[0].color,
          badgeColor: DEFAULT_TEAM_PALETTES[0].badgeColor,
          textColor: DEFAULT_TEAM_PALETTES[0].textColor,
          students: [],
          score: 0,
          correctAnswersCount: 0,
          wrongAnswersCount: 0,
          pawnPosition: 1,
        },
        {
          id: 'team-2',
          name: language === 'en' ? 'Team 2 (Blue)' : 'ทีมที่ 2 (Blue)',
          color: DEFAULT_TEAM_PALETTES[1].color,
          badgeColor: DEFAULT_TEAM_PALETTES[1].badgeColor,
          textColor: DEFAULT_TEAM_PALETTES[1].textColor,
          students: [],
          score: 0,
          correctAnswersCount: 0,
          wrongAnswersCount: 0,
          pawnPosition: 1,
        },
      ]);
      const initialRec = getRecommendedQuestionCount(initialGameType || 'snakes_ladders', 'quick', 2);
      setQuestions(createEmptyQuestions(initialRec));
    }
  }, [isOpen, language]);

  // Dynamic adjustment on Step 1 / 2 change:
  // When teacher changes gameType, durationPreset, or teamCount, adapt trailing empty questions
  useEffect(() => {
    if (!isOpen) return;
    const targetCount = getRecommendedQuestionCount(gameType, durationPreset, teams.length);
    setQuestions((prev) => {
      let lastFilledIdx = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].text.trim().length > 0 || prev[i].answer.trim().length > 0) {
          lastFilledIdx = i;
          break;
        }
      }
      if (prev.length < targetCount) {
        return [...prev, ...createEmptyQuestions(targetCount - prev.length, prev.length)];
      }
      if (prev.length > targetCount) {
        const minSafeLength = Math.max(lastFilledIdx + 1, targetCount);
        if (minSafeLength < prev.length) {
          return prev.slice(0, minSafeLength);
        }
      }
      return prev;
    });
  }, [gameType, durationPreset, teams.length, isOpen]);

  if (!isOpen) return null;

  const handleAddTeam = () => {
    playClickSound();
    if (teams.length >= 6) return;
    const paletteIndex = teams.length % DEFAULT_TEAM_PALETTES.length;
    const palette = DEFAULT_TEAM_PALETTES[paletteIndex];
    const teamNum = teams.length + 1;
    const newTeam: Team = {
      id: `team-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: language === 'en' ? `Team ${teamNum}` : `ทีมที่ ${teamNum}`,
      color: palette.color,
      badgeColor: palette.badgeColor,
      textColor: palette.textColor,
      students: [],
      score: 0,
      correctAnswersCount: 0,
      wrongAnswersCount: 0,
      pawnPosition: 1,
    };
    setTeams([...teams, newTeam]);
  };

  const handleRemoveTeam = (teamId: string) => {
    playClickSound();
    if (teams.length <= 2) {
      alert(language === 'en' ? 'At least 2 teams are required for competition.' : 'จำเป็นต้องมีอย่างน้อย 2 ทีมเพื่อการแข่งขัน');
      return;
    }
    setTeams(teams.filter((tItem) => tItem.id !== teamId));
  };

  const handleAddStudentToTeam = (teamId: string) => {
    const text = studentInputByTeam[teamId]?.trim();
    if (!text) return;
    playClickSound();
    
    const names = text.split(/[,，\n]/).map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) return;

    setTeams(
      teams.map((tItem) => {
        if (tItem.id === teamId) {
          const combined = Array.from(new Set([...tItem.students, ...names]));
          return { ...tItem, students: combined };
        }
        return tItem;
      })
    );

    setStudentInputByTeam({
      ...studentInputByTeam,
      [teamId]: '',
    });
  };

  const handleRemoveStudentFromTeam = (teamId: string, studentName: string) => {
    playClickSound();
    setTeams(
      teams.map((tItem) => {
        if (tItem.id === teamId) {
          return {
            ...tItem,
            students: tItem.students.filter((s) => s !== studentName),
          };
        }
        return tItem;
      })
    );
  };

  const handleAddQuestionBox = () => {
    playClickSound();
    const newQ: Question = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      text: '',
      answer: '',
      points: 10,
      category: '',
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestion = (index: number, field: keyof Question, value: unknown) => {
    const updated = [...questions];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    playClickSound();
    if (questions.length <= 1) {
      alert(language === 'en' ? 'At least 1 question box is required.' : 'ควรมีกล่องคำถามอย่างน้อย 1 ข้อ');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleLoadSampleQuestions = () => {
    playClickSound();
    const pool = language === 'en' ? SAMPLE_QUESTIONS_EN : SAMPLE_QUESTIONS_TH;
    const countToLoad = Math.max(recommendedCount, 12);
    const sampleList: Question[] = [];
    for (let i = 0; i < countToLoad; i++) {
      const item = pool[i % pool.length];
      sampleList.push({
        id: `q-${Date.now()}-${i + 1}`,
        text: item.text,
        answer: item.answer,
        points: item.points,
        category: item.category,
      });
    }
    setQuestions(sampleList);
    setShowLowQuestionsWarning(false);
  };

  const handleFillMissingBoxes = () => {
    playClickSound();
    if (questions.length < recommendedCount) {
      const needed = recommendedCount - questions.length;
      setQuestions((prev) => [...prev, ...createEmptyQuestions(needed, prev.length)]);
    }
  };

  const getRecommendationReason = () => {
    if (gameType === 'bingo') {
      return t('recommendedBingoReason', { count: recommendedCount });
    }
    if (gameType === 'card_matching') {
      return t('recommendedCardsReason', { count: recommendedCount });
    }
    const boardSize = durationPreset === 'standard' ? 36 : 30;
    return t('recommendedSnakesReason', { teams: teams.length, tiles: boardSize, count: recommendedCount });
  };

  const handleFinalSubmit = (action: 'play' | 'save_only' = 'play', bypassWarning: boolean = false) => {
    playClickSound();

    const invalidStep = findInvalidStep(3);
    if (invalidStep !== null) {
      setShowErrors(true);
        setErrorAttempt((n) => n + 1);
      setShowLowQuestionsWarning(false);
      setStep(invalidStep);
      return;
    }

    const filled = questions.filter((q) => q.text.trim().length > 0).length;
    if (!bypassWarning && filled < recommendedCount) {
      setPendingAction(action);
      setShowLowQuestionsWarning(true);
      return;
    }

    setShowLowQuestionsWarning(false);
    doFinalSubmit(action);
  };

  const doFinalSubmit = (action: 'play' | 'save_only' = 'play') => {
    const gameName = gameType === 'bingo' 
      ? (language === 'en' ? 'Bingo' : 'บิงโก')
      : gameType === 'snakes_ladders' 
      ? (language === 'en' ? 'Snakes & Ladders' : 'บันไดงู')
      : (language === 'en' ? 'Card Matching' : 'เกมจับคู่');

    const defaultTitle = `Session ${formatDate(new Date(), language)} - ${gameName}`;
    const sessionTitle = title.trim() || defaultTitle;

    const validQuestions = questions.filter((q) => q.text.trim().length > 0);
    const finalQuestions = validQuestions.length > 0 ? validQuestions : [
      {
        id: 'q-default-1',
        text: language === 'en' 
          ? 'Question 1 (Instructor may read or type a live question on screen)'
          : 'คำถามข้อที่ 1 (อาจารย์สามารถพิมพ์คำถามบนกระดานหรือถามสดได้)',
        answer: language === 'en' ? 'Answer Key 1' : 'เฉลยคำตอบข้อ 1',
        points: 10,
        category: language === 'en' ? 'General' : 'ทั่วไป',
      }
    ];

    const finalTimeLimit = Math.max(1, timeLimitMinutes || 10);

    // Keep every value inside the database column sizes (see config/dbLimits.ts)
    const dbTeams = teams.map((tm) => ({
      ...tm,
      name: fit(tm.name, DB_LIMITS.teamName) || 'Team',
      students: tm.students.map((st) => fit(st, DB_LIMITS.studentName)).filter((st) => st.length > 0),
    }));
    const dbQuestions = finalQuestions.map((q) => ({
      ...q,
      text: q.text.trim(),
      answer: fit(q.answer, DB_LIMITS.correctAnswer),
      category: q.category ? fit(q.category, DB_LIMITS.category) : q.category,
      points: fitPoints(q.points),
    }));

    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: fit(sessionTitle, DB_LIMITS.sessionName),
      subject: fit(subject, DB_LIMITS.lessonName) || (language === 'en' ? 'General Class' : 'วิชาเรียนทั่วไป'),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'in_progress',
      gameType,
      durationPreset,
      timeLimitMinutes: finalTimeLimit,
      timeRemainingSeconds: finalTimeLimit * 60,
      isTimerRunning: action === 'play',
      teams: dbTeams,
      questions: dbQuestions,
      activeQuestionId: dbQuestions[0]?.id || null,
      usedQuestionIds: [],
      awardedQuestionIds: [],
      eventLogs: [],
      currentTurnTeamIndex: 0,
      userId: currentUser?.id || null,
      isGuest: !currentUser,
      snakesLaddersState: gameType === 'snakes_ladders' ? generateSnakesLaddersState(durationPreset) : undefined,
      bingoState: gameType === 'bingo' ? generateBingoState(durationPreset, dbQuestions, language) : undefined,
      cardMatchingState: gameType === 'card_matching' ? generateCardMatchingState(durationPreset, language) : undefined,
    };

    onSessionCreated(newSession, action);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 px-modal-overlay overflow-y-auto">
      <div className="px-window w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Titlebar */}
        <div className="px-titlebar">
          <div className="px-titlebar-title">
            <PixelIcon name="plus" size={16} />
            <span>create.exe — {t('createModalTitle')}</span>
          </div>
          <div className="px-titlebar-controls">
            <button
              type="button"
              id="modal-header-save-session"
              onClick={() => handleFinalSubmit('save_only')}
              className="px-btn px-btn-secondary px-2 py-0.5 text-xs font-bold hidden sm:inline-flex items-center gap-1"
              title={t('saveToSavedSessionsBtn')}
            >
              <PixelIcon name="folder" size={12} />
              <span>{t('saveToSavedSessionsBtn')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-titlebar-btn px-titlebar-btn-close"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Step Tabs Bar */}
        <div className="grid grid-cols-3 border-b-3 border-[var(--px-border)] bg-[var(--px-surface-sunken)] text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`py-2 px-3 flex items-center justify-center gap-2 border-b-3 transition cursor-pointer ${
              step === 1 ? 'border-[var(--px-border)] bg-[var(--color-px-yellow)] text-[#2A2350]' : 'border-transparent text-[var(--px-text-muted)] hover:bg-[var(--px-surface-2)]'
            }`}
          >
            <span className={`w-4 h-4 border flex items-center justify-center text-[13px] font-bold ${
              step === 1 ? 'bg-[#2A2350] text-[#FFE36E] border-[#2A2350]' : 'bg-[var(--px-surface-2)] text-[var(--px-text)] border-[var(--px-border)]'
            }`}>1</span>
            <span>{t('step1Title')}</span>
          </button>

          <button
            type="button"
            onClick={() => goToStep(2)}
            className={`py-2 px-3 flex items-center justify-center gap-2 border-b-3 transition cursor-pointer ${
              step === 2 ? 'border-[var(--px-border)] bg-[var(--color-px-yellow)] text-[#2A2350]' : 'border-transparent text-[var(--px-text-muted)] hover:bg-[var(--px-surface-2)]'
            }`}
          >
            <span className={`w-4 h-4 border flex items-center justify-center text-[13px] font-bold ${
              step === 2 ? 'bg-[#2A2350] text-[#FFE36E] border-[#2A2350]' : 'bg-[var(--px-surface-2)] text-[var(--px-text)] border-[var(--px-border)]'
            }`}>2</span>
            <span>{t('step2Title')}</span>
          </button>

          <button
            type="button"
            onClick={() => goToStep(3)}
            className={`py-2 px-3 flex items-center justify-center gap-2 border-b-3 transition cursor-pointer ${
              step === 3 ? 'border-[var(--px-border)] bg-[var(--color-px-yellow)] text-[#2A2350]' : 'border-transparent text-[var(--px-text-muted)] hover:bg-[var(--px-surface-2)]'
            }`}
          >
            <span className={`w-4 h-4 border flex items-center justify-center text-[13px] font-bold ${
              step === 3 ? 'bg-[#2A2350] text-[#FFE36E] border-[#2A2350]' : 'bg-[var(--px-surface-2)] text-[var(--px-text)] border-[var(--px-border)]'
            }`}>3</span>
            <span>{t('step3Title')}</span>
            <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-[#2A2350] text-[#FFE36E] num ml-1">
              {questions.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div ref={bodyRef} className="p-6 overflow-y-auto flex-1 space-y-6 bg-[var(--px-surface)] text-[var(--px-text)]">
          {/* Guest Mode Warning Banner (Auto-purge in 24h) */}
          {!currentUser && (
            <div className="p-3.5 bg-amber-500/15 border-2 border-amber-500/40 rounded flex items-start gap-3 text-xs sm:text-sm shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-amber-800 dark:text-amber-300">
                  {t('guestBannerTitle')}
                </h4>
                <p className="text-amber-900 dark:text-amber-200 mt-0.5 leading-relaxed text-xs">
                  {t('guestBannerDescCreate')}
                </p>
              </div>
              {onOpenLogin && (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded hover:bg-amber-400 flex items-center gap-1 flex-shrink-0 cursor-pointer transition shadow"
                >
                  <span>➔</span>
                  <span>{t('loginToSavePermanently')}</span>
                </button>
              )}
            </div>
          )}

          {/* Required-field warning banner */}
          {currentStepErrors.length > 0 && (
            <div
              role="alert"
              className="p-3.5 bg-[var(--color-px-error)] text-[#7A1D28] border-3 border-[#B91C47] shadow-[3px_3px_0_var(--px-hard-shadow)] flex items-start gap-3 text-xs sm:text-sm"
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold">
                  {isEn ? 'Some important information is missing' : 'ยังกรอกข้อมูลสำคัญไม่ครบ'}
                </h4>
                <ul className="mt-1 space-y-0.5 list-disc pl-4 font-bold">
                  {currentStepErrors.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* STEP 1: Basic Info & Game Mode */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--px-text)] mb-1.5">
                    {t('sessionTitleLabel')}
                  </label>
                  <input
                    type="text"
                    value={title}
                    maxLength={DB_LIMITS.sessionName}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('sessionTitlePlaceholder')}
                    aria-invalid={showErrors && isTitleMissing}
                    className={`px-input w-full px-3 py-2 text-xs sm:text-sm font-bold ${
                      showErrors && isTitleMissing ? '!border-[#E5484D] ring-2 ring-[#E5484D]/50' : ''
                    }`}
                  />
                  {showErrors && isTitleMissing && (
                    <p className="mt-1 text-xs font-bold text-[var(--px-danger-text)]">
                      ⚠ {isEn ? 'Session name is required' : 'จำเป็นต้องใส่ชื่อ Session หรือหัวข้อกิจกรรม'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--px-text)] mb-1.5">
                    {t('subjectLabel')}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    maxLength={DB_LIMITS.lessonName}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t('subjectPlaceholder')}
                    className="px-input w-full px-3 py-2 text-xs sm:text-sm font-bold"
                  />
                </div>
              </div>

              {/* Game Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-[var(--px-text)] mb-2">
                  {t('chooseGameType')} (3 {language === 'en' ? 'Modes' : 'ประเภท'})
                </label>
                <div className="grid sm:grid-cols-3 gap-3">
                  {/* Snakes & Ladders */}
                  <div
                    onClick={() => {
                      playClickSound();
                      setGameType('snakes_ladders');
                    }}
                    className={`cursor-pointer p-3.5 border-3 transition-transform ${
                      gameType === 'snakes_ladders'
                        ? 'bg-[var(--color-px-yellow)] text-[#2A2350] border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] -translate-y-0.5'
                        : 'bg-[var(--px-surface-2)] text-[var(--px-text)] border-2 border-[var(--px-border)] hover:bg-[var(--px-surface-sunken)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <PixelIcon name="dice" size={20} className={gameType === 'snakes_ladders' ? 'text-[#2A2350]' : 'text-[var(--px-text)]'} />
                      <span className={`font-bold text-sm ${gameType === 'snakes_ladders' ? 'text-[#2A2350]' : 'text-[var(--px-text)]'}`}>{t('snakesTitle')}</span>
                    </div>
                    <p className={`text-xs font-bold leading-normal ${gameType === 'snakes_ladders' ? 'text-[#2A2350]' : 'text-[var(--px-text-muted)]'}`}>
                      {t('snakesDesc')}
                    </p>
                  </div>

                  {/* Bingo */}
                  <div
                    onClick={() => {
                      playClickSound();
                      setGameType('bingo');
                    }}
                    className={`cursor-pointer p-3.5 border-3 transition-transform ${
                      gameType === 'bingo'
                        ? 'bg-[var(--color-px-sky)] text-[#2A2350] border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] -translate-y-0.5'
                        : 'bg-[var(--px-surface-2)] text-[var(--px-text)] border-2 border-[var(--px-border)] hover:bg-[var(--px-surface-sunken)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <PixelIcon name="grid" size={20} className={gameType === 'bingo' ? 'text-[#2A2350]' : 'text-[var(--px-text)]'} />
                      <span className={`font-bold text-sm ${gameType === 'bingo' ? 'text-[#2A2350]' : 'text-[var(--px-text)]'}`}>{t('bingoTitle')}</span>
                    </div>
                    <p className={`text-xs font-bold leading-normal ${gameType === 'bingo' ? 'text-[#2A2350]' : 'text-[var(--px-text-muted)]'}`}>
                      {t('bingoDesc')}
                    </p>
                  </div>

                  {/* Card Matching */}
                  <div
                    onClick={() => {
                      playClickSound();
                      setGameType('card_matching');
                    }}
                    className={`cursor-pointer p-3.5 border-3 transition-transform ${
                      gameType === 'card_matching'
                        ? 'bg-[var(--color-px-pink)] text-[#2A2350] border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] -translate-y-0.5'
                        : 'bg-[var(--px-surface-2)] text-[var(--px-text)] border-2 border-[var(--px-border)] hover:bg-[var(--px-surface-sunken)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <PixelIcon name="cards" size={20} className={gameType === 'card_matching' ? 'text-[#2A2350]' : 'text-[var(--px-text)]'} />
                      <span className={`font-bold text-sm ${gameType === 'card_matching' ? 'text-[#2A2350]' : 'text-[var(--px-text)]'}`}>{t('cardMatchingTitle')}</span>
                    </div>
                    <p className={`text-xs font-bold leading-normal ${gameType === 'card_matching' ? 'text-[#2A2350]' : 'text-[var(--px-text-muted)]'}`}>
                      {t('cardMatchingDesc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preset Duration & Time Limit */}
              <div className="px-panel-inset p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--px-text)]">
                    {t('boardSizePresetLabel')}
                  </span>
                  <span className="px-badge bg-[var(--color-px-mint)] text-[#2A2350] text-[13px]">
                    {language === 'en' ? 'Auto-scales board & pace' : 'ปรับอัตโนมัติตามสเกลกระดาน'}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 border-2 cursor-pointer transition ${
                      durationPreset === 'quick'
                        ? 'bg-[var(--color-px-mint)] text-[#2A2350] border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)]'
                        : 'bg-[var(--px-surface-2)] text-[var(--px-text)] border-[var(--px-border)] hover:bg-[var(--px-surface-sunken)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="duration"
                      checked={durationPreset === 'quick'}
                      onChange={() => {
                        setDurationPreset('quick');
                        setTimeLimitMinutes(5);
                        setCustomMinutes('5');
                      }}
                      className="mt-1"
                    />
                    <div>
                      <div className={`font-bold text-xs sm:text-sm ${durationPreset === 'quick' ? 'text-[#2A2350]' : 'text-[var(--px-text)]'}`}>{t('presetQuickTitle')}</div>
                      <p className={`text-[13px] font-bold mt-0.5 ${durationPreset === 'quick' ? 'text-[#2A2350]' : 'text-[var(--px-text-muted)]'}`}>
                        {gameType === 'snakes_ladders' 
                          ? t('presetQuickSnakesDesc')
                          : gameType === 'bingo'
                          ? t('presetQuickBingoDesc')
                          : t('presetQuickCardDesc')}
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 border-2 cursor-pointer transition ${
                      durationPreset === 'standard'
                        ? 'bg-[var(--color-px-mint)] text-[#2A2350] border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)]'
                        : 'bg-[var(--px-surface-2)] text-[var(--px-text)] border-[var(--px-border)] hover:bg-[var(--px-surface-sunken)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="duration"
                      checked={durationPreset === 'standard'}
                      onChange={() => {
                        setDurationPreset('standard');
                        setTimeLimitMinutes(10);
                        setCustomMinutes('10');
                      }}
                      className="mt-1"
                    />
                    <div>
                      <div className={`font-bold text-xs sm:text-sm ${durationPreset === 'standard' ? 'text-[#2A2350]' : 'text-[var(--px-text)]'}`}>{t('presetStandardTitle')}</div>
                      <p className={`text-[13px] font-bold mt-0.5 ${durationPreset === 'standard' ? 'text-[#2A2350]' : 'text-[var(--px-text-muted)]'}`}>
                        {gameType === 'snakes_ladders' 
                          ? t('presetStandardSnakesDesc')
                          : gameType === 'bingo'
                          ? t('presetStandardBingoDesc')
                          : t('presetStandardCardDesc')}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Time buttons */}
                <div className="pt-2 border-t border-[var(--px-border)]/40">
                  <div className="flex items-center justify-between mb-1.5 text-xs font-bold">
                    <span>{t('timeLimitLabel')}</span>
                    <span className="px-badge bg-[var(--color-px-yellow)] text-[#2A2350] text-xs font-bold">
                      {timeLimitMinutes} {t('minutesUnit')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[5, 10, 15, 20].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          setTimeLimitMinutes(mins);
                          setCustomMinutes(String(mins));
                        }}
                        className={`py-1.5 px-2 border-2 text-xs font-bold transition cursor-pointer ${
                          timeLimitMinutes === mins
                            ? 'bg-[var(--color-px-yellow)] text-[#2A2350] border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)]'
                            : 'bg-[var(--px-surface-2)] text-[var(--px-text)] border-[var(--px-border)] hover:bg-[var(--px-surface-sunken)]'
                        }`}
                      >
                        {mins} {t('minutesUnit')}
                      </button>
                    ))}

                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={customMinutes}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomMinutes(val);
                        const num = parseInt(val, 10);
                        if (!isNaN(num) && num > 0) {
                          setTimeLimitMinutes(num);
                        }
                      }}
                      placeholder={t('customMinutesPlaceholder')}
                      aria-invalid={isTimeInvalid}
                      className={`px-input py-1 text-center text-xs font-bold ${
                        isTimeInvalid ? '!border-[#E5484D] ring-2 ring-[#E5484D]/50' : ''
                      }`}
                    />
                  </div>
                  {isTimeInvalid && (
                    <p className="mt-1 text-xs font-bold text-[var(--px-danger-text)]">
                      ⚠ {isEn ? 'Enter 1 – 120 minutes' : 'กรุณาใส่เวลา 1 - 120 นาที'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Teams and Student Names */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[var(--px-text)]">{t('teamsStepTitle')}</h3>
                  <p className="text-xs text-[var(--px-text-muted)] font-bold">
                    {t('teamsStepSubtitle')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTeam}
                  disabled={teams.length >= 6}
                  className="px-btn px-btn-mint px-3 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('addTeamBtn')} ({teams.length}/6)</span>
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {teams.map((tItem, idx) => (
                  <div
                    key={tItem.id}
                    className="p-3.5 bg-[var(--px-surface-2)] border-3 border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className={`w-3.5 h-3.5 border-2 border-black ${tItem.color}`} />
                        <input
                          type="text"
                          value={tItem.name}
                          maxLength={DB_LIMITS.teamName}
                          onChange={(e) => {
                            const updated = [...teams];
                            updated[idx].name = e.target.value;
                            setTeams(updated);
                          }}
                          placeholder={isEn ? 'Team name (required)' : 'ชื่อทีม (จำเป็น)'}
                          aria-invalid={showErrors && tItem.name.trim().length === 0}
                          className={`px-input px-2 py-0.5 text-xs font-bold flex-1 ${
                            showErrors &&
                            (tItem.name.trim().length === 0 ||
                              duplicateTeamNames.includes(tItem.name.trim().toLowerCase()))
                              ? '!border-[#E5484D] ring-2 ring-[#E5484D]/50'
                              : ''
                          }`}
                        />
                      </div>
                      {teams.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTeam(tItem.id)}
                          className="px-btn px-btn-danger p-1 text-xs cursor-pointer"
                          title={t('delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Member Tags */}
                    <div>
                      <label className="text-[13px] font-bold text-[var(--px-text)] mb-1 block">
                        {t('teamMembersLabel')} ({tItem.students.length}):
                      </label>
                      <div className="flex flex-wrap gap-1 p-2 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)]/40 min-h-[32px]">
                        {tItem.students.length === 0 ? (
                          <span className="text-[13px] text-[var(--px-text-muted)] italic">{t('noStudentsYet')}</span>
                        ) : (
                          tItem.students.map((student) => (
                            <span
                              key={student}
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-[var(--px-surface)] border border-[var(--px-border)] text-[var(--px-text)] text-[13px] font-bold"
                            >
                              <span>{student}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveStudentFromTeam(tItem.id, student)}
                                className="text-red-500 hover:text-red-700 ml-0.5 cursor-pointer font-bold"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Add student input */}
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={studentInputByTeam[tItem.id] || ''}
                        onChange={(e) =>
                          setStudentInputByTeam({
                            ...studentInputByTeam,
                            [tItem.id]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddStudentToTeam(tItem.id);
                          }
                        }}
                        placeholder={t('studentInputPlaceholder')}
                        className="px-input px-2 py-1 text-xs font-bold flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddStudentToTeam(tItem.id)}
                        className="px-btn px-2.5 py-1 text-xs cursor-pointer"
                      >
                        {t('addStudentBtn')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Customize Questions */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Recommendation Banner */}
              <div className="p-3 bg-[var(--color-px-yellow)] text-[#2A2350] border-2 border-[var(--px-border)] space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#2A2350]">
                      {t('recommendedQuestionsBannerTitle', {
                        game: gameType === 'bingo' ? (language === 'en' ? 'Bingo' : 'บิงโก') : gameType === 'snakes_ladders' ? (language === 'en' ? 'Snakes & Ladders' : 'บันไดงู') : (language === 'en' ? 'Card Matching' : 'เกมจับคู่'),
                        preset: durationPreset === 'quick' ? (language === 'en' ? 'Quick' : 'โหมดเร็ว') : (language === 'en' ? 'Standard' : 'โหมดมาตรฐาน'),
                        count: recommendedCount
                      })}
                    </h4>
                    <p className="text-[13px] text-[#2A2350] font-medium">
                      {getRecommendationReason()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-badge bg-[#2A2350] text-[#FFE36E] text-xs font-bold num border border-[#2A2350]">
                      {t('recommendedQuestionsProgress', { filled: filledCount, total: recommendedCount })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#2A2350]/20">
                  {questions.length < recommendedCount && (
                    <button
                      type="button"
                      onClick={handleFillMissingBoxes}
                      className="px-btn bg-[var(--px-sky)] text-[#2A2350] px-2.5 py-1 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('fillMissingBoxesBtn', { count: recommendedCount })}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleLoadSampleQuestions}
                    className="px-btn bg-[var(--px-mint)] text-[#2A2350] px-3 py-1 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <PixelIcon name="star" size={12} />
                    <span>{t('loadSampleQuestionsBtn')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddQuestionBox}
                    className="px-btn bg-[var(--px-pink)] text-[#2A2350] px-3 py-1 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('addQuestionBoxBtn')}</span>
                  </button>
                </div>
              </div>

              {/* Questions list */}
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-badge bg-[var(--color-px-yellow)] text-[#2A2350] text-xs font-bold">
                        {t('questionIndexLabel', { index: idx + 1 })}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="text-[13px] font-bold text-[var(--px-text)]">{t('pointsLabel')}</label>
                        <input
                          type="number"
                          min="5"
                          max="100"
                          step="5"
                          value={q.points}
                          onChange={(e) =>
                            handleUpdateQuestion(idx, 'points', Math.max(0, parseInt(e.target.value) || 10))
                          }
                          className="px-input w-16 px-1.5 py-0.5 text-xs font-bold text-center"
                        />
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="px-btn px-btn-danger p-1 text-xs cursor-pointer"
                            title={t('delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => handleUpdateQuestion(idx, 'text', e.target.value)}
                      placeholder={t('questionTextPlaceholder', { index: idx + 1 })}
                      aria-invalid={showErrors && answerMissingQuestionIndexes.includes(idx)}
                      className={`px-input w-full px-2.5 py-1.5 text-xs font-bold ${
                        showErrors && answerMissingQuestionIndexes.includes(idx)
                          ? '!border-[#E5484D] ring-2 ring-[#E5484D]/50'
                          : ''
                      }`}
                    />

                    <div className="grid sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={q.answer}
                        maxLength={DB_LIMITS.correctAnswer}
                        onChange={(e) => handleUpdateQuestion(idx, 'answer', e.target.value)}
                        placeholder={t('answerTextPlaceholder')}
                        aria-invalid={showErrors && questionMissingAnswerIndexes.includes(idx)}
                        className={`px-input px-2.5 py-1 text-xs font-bold bg-[var(--px-surface-sunken)] text-[var(--px-text)] border-2 ${
                          showErrors && questionMissingAnswerIndexes.includes(idx)
                            ? '!border-[#E5484D] ring-2 ring-[#E5484D]/50'
                            : 'border-[var(--px-mint)]'
                        }`}
                      />
                      <input
                        type="text"
                        value={q.category || ''}
                        maxLength={DB_LIMITS.category}
                        onChange={(e) => handleUpdateQuestion(idx, 'category', e.target.value)}
                        placeholder={t('categoryPlaceholder')}
                        className="px-input px-2.5 py-1 text-xs font-bold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="px-6 py-3 border-t-3 border-[var(--px-border)] bg-[var(--px-surface-sunken)] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as 1 | 2)}
              className="px-btn px-btn-secondary px-4 py-1.5 text-xs font-bold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('prevStepBtn')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-btn px-btn-secondary px-4 py-1.5 text-xs font-bold"
            >
              {t('cancel')}
            </button>
          )}

          {step < 3 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleFinalSubmit('save_only')}
                className="px-btn px-btn-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1"
                title={t('saveToSavedSessionsBtn')}
              >
                <PixelIcon name="folder" size={14} />
                <span>{t('quickSaveSessionBtn')}</span>
              </button>

              <button
                type="button"
                onClick={() => goToStep((step + 1) as 2 | 3)}
                className="px-btn px-4 py-1.5 text-xs font-bold flex items-center gap-1.5"
              >
                <span>{t('nextStepBtn')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-save-to-saved-sessions"
                onClick={() => handleFinalSubmit('save_only')}
                className="px-btn px-btn-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1"
              >
                <PixelIcon name="folder" size={14} />
                <span>{t('saveToSavedSessionsBtn')}</span>
              </button>

              <button
                type="button"
                id="btn-start-session-immediately"
                onClick={() => handleFinalSubmit('play')}
                className="px-btn px-btn-mint px-4 py-1.5 text-xs font-bold flex items-center gap-1.5"
              >
                <PixelIcon name="play" size={14} />
                <span>{t('saveAndStartGameBtn')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Low Questions Warning Center-Screen Pop-up Modal */}
    {showLowQuestionsWarning && (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="low-questions-modal-title"
        onClick={() => setShowLowQuestionsWarning(false)}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="px-window w-full max-w-md overflow-hidden shadow-[8px_8px_0_var(--px-hard-shadow)] border-3 border-[var(--px-border)] animate-in zoom-in-95 duration-150"
        >
          {/* Titlebar with warning pink tone */}
          <div className="px-titlebar px-titlebar-pink">
            <div className="flex items-center gap-2 truncate text-[#2A2350]">
              <AlertTriangle className="w-4 h-4 text-[#B91C47]" />
              <span id="low-questions-modal-title" className="font-bold text-xs sm:text-sm truncate">
                {t('lowQuestionsWarningTitle')}
              </span>
            </div>
            <div className="px-titlebar-controls">
              <button
                type="button"
                onClick={() => setShowLowQuestionsWarning(false)}
                className="px-titlebar-btn px-titlebar-btn-close cursor-pointer"
                aria-label={t('close')}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-5 sm:p-6 bg-[var(--px-surface)] text-[var(--px-text)] space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--px-error)] border-3 border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] flex items-center justify-center text-[#7A1D28]">
              <AlertTriangle className="w-7 h-7 text-[#B91C47]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-base sm:text-lg text-[var(--px-text)]">
                {t('lowQuestionsWarningTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--px-text-muted)] leading-relaxed">
                {t('lowQuestionsWarningBody', { filled: filledCount, recommended: recommendedCount })}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[var(--px-surface-sunken)] border-2 border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)] text-xs font-bold num">
              <span className="text-[var(--px-text-muted)]">
                {language === 'en' ? 'Current' : 'คำถามปัจจุบัน'}: <strong className="text-[var(--px-danger-text)]">{filledCount}</strong>
              </span>
              <span className="text-[var(--px-text-muted)]">/</span>
              <span className="text-[var(--px-text-muted)]">
                {language === 'en' ? 'Recommended' : 'เกณฑ์แนะนำ'}: <strong className="text-[var(--px-text)]">{recommendedCount}</strong>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowLowQuestionsWarning(false);
                  setStep(3);
                }}
                className="w-full sm:w-auto px-btn px-btn-secondary px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addMoreQuestionsBtn')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowLowQuestionsWarning(false);
                  handleFinalSubmit(pendingAction || 'play', true);
                }}
                className="w-full sm:w-auto px-btn px-btn-mint px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PixelIcon name="play" size={14} />
                <span>{t('startAnywayBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
);
};
