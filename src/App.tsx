import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, RotateCcw, 
  Layers, Home, Plus, Maximize2 
} from 'lucide-react';
import { 
  Session, GameEventLog, SnakesLaddersLastMove, GameType 
} from './types';
import {
  createSessionOnServer, fetchServerSessions, recordServerAnswer, clearServerAnswers,
} from './api/serverSync';
import { 
  loadSessions, saveSingleSession, deleteSession, saveSessions,
  replaceTeacherSessions, removeTeacherSessions,
  generateCardMatchingState,
  getCardDisplayLabel, getCardEmoji
} from './utils/storage';
import { 
  playCorrectSound, playWrongSound, playVictorySound, 
  playCardFlipSound, playStealSound, playTerritoryAlertSound 
} from './utils/audio';
import { useLanguage } from './context/LanguageContext';
import { GAME_RULES } from './config/gameRules';
import { 
  canAnyTeamStillComplete, getTerritoryStats, rankTeamsByBingoTerritory 
} from './utils/bingoUtils';
import { PixelIcon } from './components/PixelIcon';

// Components
import { Navbar } from './components/Navbar';
import { SessionList } from './components/SessionList';
import { CreateSessionModal } from './components/CreateSessionModal';
import { QuestionModal } from './components/QuestionModal';
import { ScoreboardModal } from './components/ScoreboardModal';
import { VictoryCelebrationModal, WinReason } from './components/VictoryCelebrationModal';
import { MainMenu } from './components/MainMenu';
import { DeleteSessionModal } from './components/DeleteSessionModal';
import { ConfirmRestartModal } from './components/ConfirmRestartModal';
import { ConfirmFinishGameModal } from './components/ConfirmFinishGameModal';
import { QuestionControlPanel } from './components/QuestionControlPanel';
import { LoginView } from './components/LoginView';
import { Dashboard } from './components/Dashboard';
import { TopNavBar } from './components/TopNavBar';
import { HowToPlayModal } from './components/HowToPlayModal';
import { useAuth } from './context/AuthContext';

// Games
import { BingoGame } from './components/games/BingoGame';
import { SnakesLaddersGame } from './components/games/SnakesLaddersGame';
import { CardMatchingGame } from './components/games/CardMatchingGame';

export default function App() {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'menu' | 'dashboard' | 'game' | 'sessions' | 'login'>(() => {
    try {
      const savedUser = localStorage.getItem('eduboard.user');
      if (savedUser) return 'dashboard';
    } catch (e) {}
    return 'menu';
  });

  // Keep view in sync with auth state:
  // - When logged in: direct to dashboard if on menu
  // - When logged out: direct to menu (normal landing hero) if on dashboard
  useEffect(() => {
    if (currentUser && currentView === 'menu') {
      setCurrentView('dashboard');
    } else if (!currentUser && currentView === 'dashboard') {
      setCurrentView('menu');
    }
  }, [currentUser, currentView]);

  // Modals & Confirmation States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialGameType, setCreateModalInitialGameType] = useState<GameType>('snakes_ladders');
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isScoreboardModalOpen, setIsScoreboardModalOpen] = useState(false);
  const [isCelebrationModalOpen, setIsCelebrationModalOpen] = useState(false);
  const [completedCelebrationSession, setCompletedCelebrationSession] = useState<Session | null>(null);
  const [celebrationWinReason, setCelebrationWinReason] = useState<WinReason>('highest_score');
  const [isPostGameCompleted, setIsPostGameCompleted] = useState(false);
  const [selectedSessionForScoreboard, setSelectedSessionForScoreboard] = useState<Session | null>(null);
  const [sessionToDeleteFromGame, setSessionToDeleteFromGame] = useState<Session | null>(null);
  const [sessionToRestart, setSessionToRestart] = useState<Session | null>(null);
  const [isConfirmFinishModalOpen, setIsConfirmFinishModalOpen] = useState(false);

  // Theme State (Day / Night)
  const [theme, setTheme] = useState<'day' | 'night'>(() => {
    return (localStorage.getItem('classroom_theme') as 'day' | 'night') || 'day';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('classroom_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'day' ? 'night' : 'day'));
  };

  // Layout & Tablet/PC View States
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false);
  const [gameViewMode, setGameViewMode] = useState<'split' | 'board_only'>('split');

  // Active game interaction state
  const [selectedRespondingTeamId, setSelectedRespondingTeamId] = useState<string | null>(null);
  // Card Matching: the team that answered correctly may flip two cards (one turn only)
  const [cardTurnTeamId, setCardTurnTeamId] = useState<string | null>(null);

  // Recently saved session highlight & notification
  const [recentlySavedSessionId, setRecentlySavedSessionId] = useState<string | null>(null);
  const [sessionSaveNotification, setSessionSaveNotification] = useState<string | null>(null);

  // Anti-spam scoring lock state (prevents multiple rapid submissions when clicking)
  const [isScoringLocked, setIsScoringLocked] = useState(false);
  const lastScoreTimestampRef = React.useRef<number>(0);
  const scoringInProgressRef = React.useRef<boolean>(false);
  const cardMismatchTimeoutRef = React.useRef<number | null>(null);

  // Load saved sessions on mount
  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
  }, []);

  // Logged in: load the teacher's sessions from the database (Spring Boot API).
  // Logged out: keep only Guest Mode sessions in this browser.
  useEffect(() => {
    if (!currentUser) {
      setSessions(removeTeacherSessions());
      return;
    }
    fetchServerSessions(currentUser.id)
      .then((serverSessions) => setSessions(replaceTeacherSessions(serverSessions)))
      .catch((e) => console.error('Could not load sessions from the server', e));
  }, [currentUser?.id]);

  // Cleanup any pending mismatch timeout on unmount
  useEffect(() => {
    return () => {
      if (cardMismatchTimeoutRef.current) {
        window.clearTimeout(cardMismatchTimeoutRef.current);
      }
    };
  }, []);

  // Game countdown timer ticker (decrements every second during active game)
  useEffect(() => {
    if (currentView !== 'game' || !activeSessionId) return;

    const timerInterval = setInterval(() => {
      setSessions((prevSessions) => {
        const session = prevSessions.find((s) => s.id === activeSessionId);
        if (!session || session.status !== 'in_progress' || session.isTimerRunning === false) {
          return prevSessions;
        }

        const remaining = session.timeRemainingSeconds ?? ((session.timeLimitMinutes || 10) * 60);
        if (remaining <= 0) {
          const updated = { ...session, timeRemainingSeconds: 0, isTimerRunning: false };
          saveSingleSession(updated);
          return prevSessions.map((s) => (s.id === session.id ? updated : s));
        }

        const nextRemaining = remaining - 1;
        const updated = { ...session, timeRemainingSeconds: nextRemaining };
        if (nextRemaining % 5 === 0 || nextRemaining === 0) {
          saveSingleSession(updated);
        }
        return prevSessions.map((s) => (s.id === session.id ? updated : s));
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [currentView, activeSessionId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // A new question or another session ends the card-flipping turn
  useEffect(() => {
    setCardTurnTeamId(null);
  }, [activeSession?.activeQuestionId, activeSessionId]);

  // Save session helper
  const updateSessionState = (updatedSession: Session) => {
    const newSessions = saveSingleSession(updatedSession);
    setSessions(newSessions);
  };

  // Select responding team handler (coordinates with Card Matching phase)
  const handleSelectRespondingTeam = (teamId: string | null) => {
    setSelectedRespondingTeamId(teamId);

    if (!activeSession || activeSession.gameType !== 'card_matching' || !activeSession.cardMatchingState) {
      return;
    }

    const cm = activeSession.cardMatchingState;
    // Do not interrupt second pick or resolving phase
    if (cm.phase === 'pick_second' || cm.phase === 'resolving') {
      return;
    }

    // If teacher changes/cancels team while a fresh first pick was waiting for answer, flip it back
    let updatedBoard = cm.boardCards;
    let firstPickIndex = cm.firstPickIndex;
    let firstPickWasExposed = cm.firstPickWasExposed;

    if (cm.phase === 'await_answer' && cm.firstPickIndex !== null) {
      if (teamId !== cm.activeTeamId) {
        const prevIdx = cm.firstPickIndex;
        const prevCard = cm.boardCards[prevIdx];
        if (prevCard && !cm.firstPickWasExposed && !prevCard.isMatched) {
          updatedBoard = cm.boardCards.map((c, idx) =>
            idx === prevIdx ? { ...c, isFaceUp: false } : c
          );
        }
        firstPickIndex = null;
        firstPickWasExposed = false;
      } else {
        return;
      }
    }

    const updatedSession: Session = {
      ...activeSession,
      cardMatchingState: {
        ...cm,
        boardCards: updatedBoard,
        phase: teamId ? 'pick_first' : 'idle',
        activeTeamId: teamId,
        firstPickIndex: teamId ? firstPickIndex : null,
        secondPickIndex: null,
        firstPickWasExposed: teamId ? firstPickWasExposed : false,
      },
      updatedAt: Date.now(),
    };
    updateSessionState(updatedSession);
  };

  // Switch session
  const handleSelectSession = (session: Session) => {
    setActiveSessionId(session.id);
    setSelectedRespondingTeamId(null);
    if (session.status === 'completed') {
      setIsPostGameCompleted(false);
      setSelectedSessionForScoreboard(session);
      setIsScoreboardModalOpen(true);
    } else {
      setCurrentView('game');
    }
  };

  // Session Created (Supports both saving directly to list and starting immediately)
  const handleSessionCreated = async (createdSession: Session, action: 'play' | 'save_only' = 'play') => {
    let newSession = createdSession;
    if (currentUser) {
      try {
        // Creating: save the session, teams, students and questions in the database first
        newSession = await createSessionOnServer({ ...createdSession, userId: currentUser.id, isGuest: false });
      } catch (e) {
        console.error('Could not create the session on the server', e);
        setSessionSaveNotification(language === 'en'
          ? 'Could not save to the server. Please check the connection and try again.'
          : 'บันทึกลงเซิร์ฟเวอร์ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่');
        setIsCreateModalOpen(false);
        setCurrentView('sessions');
        return;
      }
    }
    const updated = saveSingleSession(newSession);
    setSessions(updated);
    setIsCreateModalOpen(false);

    if (action === 'save_only') {
      setRecentlySavedSessionId(newSession.id);
      const notice = language === 'en'
        ? `Session "${newSession.title}" has been saved to your saved sessions.`
        : `บันทึก Session "${newSession.title}" ลงในรายการ Session ที่บันทึกไว้เรียบร้อยแล้ว`;
      setSessionSaveNotification(notice);
      setCurrentView('sessions');
    } else {
      setActiveSessionId(newSession.id);
      setRecentlySavedSessionId(null);
      setSessionSaveNotification(null);
      setSelectedRespondingTeamId(null);
      setCurrentView('game');
    }
  };

  // Delete session
  const handleDeleteSession = (sessionId: string) => {
    const remaining = deleteSession(sessionId);
    setSessions(remaining);
    if (activeSessionId === sessionId) {
      const nextId = remaining[0]?.id || null;
      setActiveSessionId(nextId);
      if (remaining.length === 0) {
        setCurrentView('menu');
      } else {
        setCurrentView('sessions');
      }
    }
  };

  // Open Scoreboard
  const handleViewScoreboard = (session: Session) => {
    setIsPostGameCompleted(false);
    setSelectedSessionForScoreboard(session);
    setIsScoreboardModalOpen(true);
  };

  // Restart session logic: resets team scores, board tiles/pawns/cards, sets status to in_progress
  const handleRestartSession = (targetSession: Session) => {
    const resetTeams = targetSession.teams.map((tItem) => ({
      ...tItem,
      score: 0,
      correctAnswersCount: 0,
      wrongAnswersCount: 0,
      pawnPosition: 1,
      bingoTilesClaimed: [],
      matchesFound: 0,
      stealsCount: 0,
    }));

    let resetBingo = targetSession.bingoState;
    if (resetBingo) {
      resetBingo = {
        ...resetBingo,
        tiles: resetBingo.tiles.map((tItem) => ({ ...tItem, claimedByTeamId: undefined })),
        winnerTeamId: undefined,
        eligibleClaimTeamId: null,
        claimTriggerTimestamp: undefined,
        territoryMode: false,
      };
    }

    let resetSnakes = targetSession.snakesLaddersState;
    if (resetSnakes) {
      resetSnakes = {
        ...resetSnakes,
        lastDiceRoll: undefined,
        winnerTeamId: undefined,
        eligibleRollTeamId: null,
        rollTriggerTimestamp: undefined,
        lastMove: undefined,
      };
    }

    let resetCardMatching = targetSession.cardMatchingState;
    if (resetCardMatching) {
      resetCardMatching = generateCardMatchingState(targetSession.durationPreset, language);
    }

    const log: GameEventLog = {
      id: `log-restart-${Date.now()}`,
      timestamp: Date.now(),
      action: language === 'en' ? 'Restarted Session' : 'เริ่มเล่นรอบใหม่',
      details: language === 'en'
        ? 'Reset all team scores and board state for a fresh game.'
        : 'รีเซ็ตคะแนนของทุกกลุ่มและสถานะของกระดานเกมเพื่อเริ่มเล่นใหม่',
      type: 'system',
    };

    const restarted: Session = {
      ...targetSession,
      status: 'in_progress',
      winnerTeamId: undefined,
      completedAt: undefined,
      awardedQuestionIds: [],
      timeRemainingSeconds: (targetSession.timeLimitMinutes || 10) * 60,
      isTimerRunning: true,
      teams: resetTeams,
      bingoState: resetBingo,
      snakesLaddersState: resetSnakes,
      cardMatchingState: resetCardMatching,
      usedQuestionIds: [],
      activeQuestionId: targetSession.questions[0]?.id || null,
      eventLogs: [log, ...targetSession.eventLogs],
      updatedAt: Date.now(),
    };

    updateSessionState(restarted);
    clearServerAnswers(restarted.id);
    setActiveSessionId(restarted.id);
    setCurrentView('game');
    setSelectedRespondingTeamId(null);
  };

  // Finish active session
  const handleFinishActiveSession = () => {
    if (!activeSession) return;
    const sortedByScore = [...activeSession.teams].sort((a, b) => b.score - a.score);
    const now = Date.now();

    let winReason: WinReason = 'highest_score';
    let winnerTeam = sortedByScore[0];
    let finishDetails = language === 'en'
      ? `Game finished! Winner: ${winnerTeam?.name} with ${winnerTeam?.score} pts.`
      : `อาจารย์ประกาศจบเกม ทีมชนะเลิศคือ ${winnerTeam?.name} ด้วยคะแนน ${winnerTeam?.score} แต้ม`;

    if (activeSession.gameType === 'bingo' && activeSession.bingoState) {
      const hasLineWinner = Boolean(activeSession.bingoState.winnerTeamId);
      if (hasLineWinner) {
        winReason = 'bingo_line';
        winnerTeam = activeSession.teams.find((tItem) => tItem.id === activeSession.bingoState?.winnerTeamId) || sortedByScore[0];
      } else {
        // Territory Mode ranking: tilesHeld -> largestConnectedRegion -> quiz score
        winReason = 'bingo_territory';
        const territoryRanked = rankTeamsByBingoTerritory(activeSession.bingoState, activeSession.teams);
        winnerTeam = territoryRanked[0] || sortedByScore[0];
        const tStats = getTerritoryStats(activeSession.bingoState, activeSession.teams);
        const winStat = winnerTeam ? tStats[winnerTeam.id] : undefined;
        finishDetails = language === 'en'
          ? `Bingo ended with no line winner — Territory Mode! ${winnerTeam?.name} wins with ${winStat?.tilesHeld ?? 0} tiles held (largest region: ${winStat?.largestConnectedRegion ?? 0}, quiz score: ${winnerTeam?.score ?? 0}).`
          : `จบเกมบิงโกในโหมดยึดพื้นที่ (Territory Mode) — ทีมชนะเลิศคือ ${winnerTeam?.name} ยึดได้ ${winStat?.tilesHeld ?? 0} ช่อง (กลุ่มติดกันใหญ่สุด ${winStat?.largestConnectedRegion ?? 0} ช่อง, คะแนนคำถาม ${winnerTeam?.score ?? 0} แต้ม)`;
      }
    } else if (activeSession.gameType === 'snakes_ladders') {
      const hasFinishWinner = activeSession.teams.some(
        (tItem) => (tItem.pawnPosition || 1) >= (activeSession.snakesLaddersState?.boardSize || 30)
      );
      winReason = hasFinishWinner ? 'snakes_finish' : 'snakes_score';
      if (hasFinishWinner && activeSession.snakesLaddersState?.winnerTeamId) {
        winnerTeam = activeSession.teams.find((tItem) => tItem.id === activeSession.snakesLaddersState?.winnerTeamId) || sortedByScore[0];
      }
    } else if (activeSession.gameType === 'card_matching') {
      const expectedTotal = activeSession.cardMatchingState?.totalPairs || (activeSession.durationPreset === 'quick' ? 10 : 15);
      const allMatched = (activeSession.cardMatchingState?.matchedPairsCount || 0) >= expectedTotal;
      winReason = allMatched ? 'cards_all_matched' : 'cards_score';
    }

    const finishLog: GameEventLog = {
      id: `log-finish-${now}`,
      timestamp: now,
      teamId: winnerTeam?.id,
      teamName: winnerTeam?.name,
      action: language === 'en' ? 'Session Completed' : 'จบการแข่งขันประจำ Session',
      details: finishDetails,
      type: 'system',
    };

    const completedSession: Session = {
      ...activeSession,
      status: 'completed',
      winnerTeamId: winnerTeam?.id,
      endReason: winReason || activeSession.endReason || 'highest_score',
      completedAt: now,
      isTimerRunning: false,
      eventLogs: [finishLog, ...activeSession.eventLogs],
      updatedAt: now,
    };

    updateSessionState(completedSession);
    setCompletedCelebrationSession(completedSession);
    setCelebrationWinReason(winReason);
    setIsCelebrationModalOpen(true);

    setCurrentView('sessions');
    setActiveSessionId(null);
    setSelectedRespondingTeamId(null);
  };

  // TEACHER EVALUATION: Correct Answer
  const handleCorrectAnswer = (teamId: string) => {
    setCardTurnTeamId(teamId);
    if (!activeSession) return;

    const currentQuestion = activeSession.questions.find(
      (q) => q.id === activeSession.activeQuestionId
    );
    if (!currentQuestion) return;

    // STRICT CHECK: Prevent awarding points more than once for the same question
    if (
      activeSession.usedQuestionIds.includes(currentQuestion.id) ||
      activeSession.awardedQuestionIds?.includes(currentQuestion.id)
    ) {
      console.warn('Question already scored. Prevent duplicate points award.');
      return;
    }

    // STRICT ANTI-SPAM LOCK (Synchronous ref check + state lock)
    if (scoringInProgressRef.current || isScoringLocked || Date.now() - lastScoreTimestampRef.current < GAME_RULES.ANTI_SPAM_CORRECT_LOCK_MS) {
      return;
    }
    scoringInProgressRef.current = true;
    lastScoreTimestampRef.current = Date.now();
    setIsScoringLocked(true);
    setTimeout(() => {
      setIsScoringLocked(false);
      scoringInProgressRef.current = false;
    }, GAME_RULES.ANTI_SPAM_CORRECT_LOCK_MS);

    const pointsAwarded = currentQuestion ? currentQuestion.points : 10;
    const respondingTeam = activeSession.teams.find((tItem) => tItem.id === teamId);

    playCorrectSound();

    const log: GameEventLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      teamId,
      teamName: respondingTeam?.name,
      questionId: currentQuestion?.id,
      action: language === 'en' ? 'Correct Answer' : 'ตอบคำถามถูกต้อง',
      details: language === 'en'
        ? `Answered "${currentQuestion?.text || 'current question'}" correctly (+${pointsAwarded} pts)`
        : `ยกมือตอบคำถาม "${currentQuestion?.text || 'ข้อปัจจุบัน'}" ถูกต้อง ได้รับคะแนน (+${pointsAwarded} แต้ม)`,
      pointsChange: pointsAwarded,
      type: 'correct',
    };

    const updatedTeams = activeSession.teams.map((tItem) => {
      if (tItem.id === teamId) {
        return {
          ...tItem,
          score: tItem.score + pointsAwarded,
          correctAnswersCount: tItem.correctAnswersCount + 1,
        };
      }
      return tItem;
    });

    const usedQuestions = Array.from(new Set([...activeSession.usedQuestionIds, currentQuestion.id]));
    const awardedQuestions = Array.from(new Set([...(activeSession.awardedQuestionIds || []), currentQuestion.id]));

    const updatedSnakesState = activeSession.snakesLaddersState
      ? {
          ...activeSession.snakesLaddersState,
          eligibleRollTeamId: teamId,
          rollTriggerTimestamp: Date.now(),
        }
      : undefined;

    const updatedBingoState = activeSession.bingoState
      ? {
          ...activeSession.bingoState,
          eligibleClaimTeamId: teamId,
          claimTriggerTimestamp: Date.now(),
        }
      : undefined;

    const updatedSession: Session = {
      ...activeSession,
      teams: updatedTeams,
      usedQuestionIds: usedQuestions,
      awardedQuestionIds: awardedQuestions,
      snakesLaddersState: updatedSnakesState || activeSession.snakesLaddersState,
      bingoState: updatedBingoState || activeSession.bingoState,
      cardMatchingState: activeSession.cardMatchingState,
      eventLogs: [log, ...activeSession.eventLogs],
      updatedAt: Date.now(),
    };

    updateSessionState(updatedSession);
    recordServerAnswer(activeSession.id, teamId, currentQuestion.id, true);
    setSelectedRespondingTeamId(teamId);
  };

  // TEACHER EVALUATION: Wrong Answer
  const handleWrongAnswer = (teamId: string) => {
    if (!activeSession) return;
    if (scoringInProgressRef.current || isScoringLocked || Date.now() - lastScoreTimestampRef.current < 800) {
      return;
    }
    scoringInProgressRef.current = true;
    lastScoreTimestampRef.current = Date.now();
    setIsScoringLocked(true);
    setTimeout(() => {
      setIsScoringLocked(false);
      scoringInProgressRef.current = false;
    }, 800);

    const currentQuestion = activeSession.questions.find(
      (q) => q.id === activeSession.activeQuestionId
    );
    const respondingTeam = activeSession.teams.find((tItem) => tItem.id === teamId);

    playWrongSound();

    const wrongLog: GameEventLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      teamId,
      teamName: respondingTeam?.name,
      questionId: currentQuestion?.id,
      action: language === 'en' ? 'Wrong Answer' : 'ตอบคำถามไม่ถูกต้อง',
      details: language === 'en'
        ? `Answered "${currentQuestion?.text || 'current question'}" incorrectly (0 pts) — Question stays open for other teams.`
        : `ยกมือตอบคำถาม "${currentQuestion?.text || 'ข้อปัจจุบัน'}" ไม่ถูกต้อง อาจารย์เปิดสิทธิ์ให้ทีมอื่นยกมือตอบต่อ`,
      type: 'wrong',
    };

    const extraLogs: GameEventLog[] = [];

    const updatedTeams = activeSession.teams.map((tItem) => {
      if (tItem.id === teamId) {
        return {
          ...tItem,
          wrongAnswersCount: tItem.wrongAnswersCount + 1,
        };
      }
      return tItem;
    });

    const updatedSnakesState = activeSession.snakesLaddersState
      ? {
          ...activeSession.snakesLaddersState,
          eligibleRollTeamId: null,
          rollTriggerTimestamp: undefined,
        }
      : undefined;

    const updatedBingoState = activeSession.bingoState
      ? {
          ...activeSession.bingoState,
          eligibleClaimTeamId: null,
          claimTriggerTimestamp: undefined,
        }
      : undefined;

    let updatedCardMatchingState = activeSession.cardMatchingState;
    if (updatedCardMatchingState) {
      const cm = updatedCardMatchingState;
      const updatedBoard = [...cm.boardCards];
      const firstIdx = cm.firstPickIndex;
      const nextTurn = (cm.turnCounter || 0) + 1;

      if (firstIdx !== null && updatedBoard[firstIdx] && !updatedBoard[firstIdx].isMatched) {
        const pickedCard = updatedBoard[firstIdx];
        const exposingTeamId = pickedCard.exposedByTeamId || teamId;
        const exposingTurn = pickedCard.exposedAtTurn ?? nextTurn;

        updatedBoard[firstIdx] = {
          ...pickedCard,
          isFaceUp: true,
          exposedByTeamId: exposingTeamId,
          exposedAtTurn: exposingTurn,
        };

        const cardName = `${getCardEmoji(pickedCard.pairKey)} ${getCardDisplayLabel(pickedCard, language)}`;
        extraLogs.push({
          id: `log-expose-${Date.now()}-1`,
          timestamp: Date.now(),
          teamId,
          teamName: respondingTeam?.name,
          action: language === 'en' ? 'Card Left Exposed (OPEN!)' : 'ไพ่ถูกเปิดค้างไว้ (OPEN!)',
          details: language === 'en'
            ? `Card #${firstIdx + 1} (${cardName}) stays face-up and OPEN for any team to steal!`
            : `ไพ่ใบที่ #${firstIdx + 1} (${cardName}) หงายค้างไว้บนกระดาน (OPEN!) ให้ทีมอื่นขโมยคู่ได้`,
          type: 'game_move',
        });

        // Enforce MAX_EXPOSED_CARDS (default 4)
        const exposedIndices = updatedBoard
          .map((c, idx) => (!c.isMatched && c.isFaceUp && c.exposedByTeamId ? idx : -1))
          .filter((idx) => idx !== -1);

        if (exposedIndices.length > GAME_RULES.MAX_EXPOSED_CARDS) {
          // Sort by exposedAtTurn ascending (oldest first), keeping the newly exposed card
          const candidates = exposedIndices
            .filter((idx) => idx !== firstIdx)
            .sort((a, b) => (updatedBoard[a].exposedAtTurn ?? 0) - (updatedBoard[b].exposedAtTurn ?? 0));

          const numToFlipBack = exposedIndices.length - GAME_RULES.MAX_EXPOSED_CARDS;
          for (let i = 0; i < numToFlipBack && i < candidates.length; i++) {
            const oldIdx = candidates[i];
            const oldCard = updatedBoard[oldIdx];
            const oldCardName = `${getCardEmoji(oldCard.pairKey)} ${getCardDisplayLabel(oldCard, language)}`;
            updatedBoard[oldIdx] = {
              ...oldCard,
              isFaceUp: false,
              exposedByTeamId: undefined,
              exposedAtTurn: undefined,
            };
            extraLogs.push({
              id: `log-cap-${Date.now()}-${oldIdx}`,
              timestamp: Date.now(),
              action: language === 'en' ? 'Oldest Exposed Card Flipped Back' : 'คว่ำไพ่ที่เปิดค้างเก่าที่สุดกลับคืน',
              details: language === 'en'
                ? `Card #${oldIdx + 1} (${oldCardName}) flipped back face-down (max ${GAME_RULES.MAX_EXPOSED_CARDS} exposed cards).`
                : `ไพ่ใบที่ #${oldIdx + 1} (${oldCardName}) ถูกคว่ำกลับคืนเนื่องจากเปิดค้างเกิน ${GAME_RULES.MAX_EXPOSED_CARDS} ใบ`,
              type: 'system',
            });
          }
        }
      }

      updatedCardMatchingState = {
        ...cm,
        boardCards: updatedBoard,
        phase: 'idle',
        activeTeamId: null,
        firstPickIndex: null,
        secondPickIndex: null,
        firstPickWasExposed: false,
        turnCounter: nextTurn,
      };
    }

    const updatedSession: Session = {
      ...activeSession,
      teams: updatedTeams,
      snakesLaddersState: updatedSnakesState || activeSession.snakesLaddersState,
      bingoState: updatedBingoState || activeSession.bingoState,
      cardMatchingState: updatedCardMatchingState || activeSession.cardMatchingState,
      eventLogs: [...extraLogs, wrongLog, ...activeSession.eventLogs],
      updatedAt: Date.now(),
    };

    updateSessionState(updatedSession);
    recordServerAnswer(activeSession.id, teamId, currentQuestion?.id, false);
    setSelectedRespondingTeamId(null);
  };

  // Projector mode: jump to the next question that has not been scored yet (wraps around).
  // Returns false when every question has already been scored.
  const handleNextOpenQuestion = (): boolean => {
    if (!activeSession) return false;
    const questions = activeSession.questions;
    if (questions.length === 0) return false;
    const done = new Set([...(activeSession.usedQuestionIds || []), ...(activeSession.awardedQuestionIds || [])]);
    const currentIndex = questions.findIndex((q) => q.id === activeSession.activeQuestionId);
    for (let step = 1; step <= questions.length; step++) {
      const candidate = questions[(currentIndex + step + questions.length) % questions.length];
      if (!done.has(candidate.id)) {
        if (candidate.id !== activeSession.activeQuestionId) {
          updateSessionState({ ...activeSession, activeQuestionId: candidate.id, updatedAt: Date.now() });
        }
        setSelectedRespondingTeamId(null);
        return true;
      }
    }
    setSelectedRespondingTeamId(null);
    return false;
  };

  const openProjectorMode = () => {
    setIsQuestionModalOpen(true);
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        /* Browser refused (e.g. iframe) — the overlay still fills the window */
      });
    }
  };

  const closeProjectorMode = () => {
    setIsQuestionModalOpen(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Game ended / session closed while projecting → leave projector mode
  useEffect(() => {
    if (isQuestionModalOpen && (!activeSession || activeSession.status === 'completed')) {
      closeProjectorMode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id, activeSession?.status, isQuestionModalOpen]);

  // Is a team still waiting to do its board action (roll dice / claim tile / flip cards)?
  const isBoardActionPending = activeSession
    ? activeSession.gameType === 'snakes_ladders'
      ? Boolean(activeSession.snakesLaddersState?.eligibleRollTeamId)
      : activeSession.gameType === 'bingo'
      ? Boolean(activeSession.bingoState?.eligibleClaimTeamId)
      : Boolean(cardTurnTeamId)
    : false;

  // The game board — rendered either on the page or inside projector mode (never both,
  // so auto-rolling dice etc. only happen once)
  const renderGameBoard = (viewMode: 'split' | 'board_only') => {
    if (!activeSession) return null;
    return (
      <>
        {activeSession.gameType === 'bingo' && activeSession.bingoState && (
          <BingoGame
            session={activeSession}
            bingoState={activeSession.bingoState}
            onClaimTile={handleClaimBingoTile}
            selectedRespondingTeamId={selectedRespondingTeamId}
            viewMode={viewMode}
          />
        )}

        {activeSession.gameType === 'snakes_ladders' && activeSession.snakesLaddersState && (
          <SnakesLaddersGame
            session={activeSession}
            snakesLaddersState={activeSession.snakesLaddersState}
            onPawnMove={handlePawnMove}
            selectedRespondingTeamId={selectedRespondingTeamId}
            viewMode={viewMode}
          />
        )}

        {activeSession.gameType === 'card_matching' && activeSession.cardMatchingState && (
          <CardMatchingGame
            session={activeSession}
            cardMatchingState={activeSession.cardMatchingState}
            onEvaluateMatch={handleEvaluateCardMatch}
            selectedRespondingTeamId={cardTurnTeamId}
            viewMode={viewMode}
          />
        )}
      </>
    );
  };

  // Next Question
  const handleNextQuestion = () => {
    if (!activeSession) return;
    const questions = activeSession.questions;
    if (questions.length === 0) return;

    const currentIndex = questions.findIndex((q) => q.id === activeSession.activeQuestionId);
    const nextIndex = (currentIndex + 1) % questions.length;
    const nextQuestion = questions[nextIndex];

    const updatedSession: Session = {
      ...activeSession,
      activeQuestionId: nextQuestion.id,
      updatedAt: Date.now(),
    };

    updateSessionState(updatedSession);
    setSelectedRespondingTeamId(null);
  };

  // Previous Question
  const handlePrevQuestion = () => {
    if (!activeSession) return;
    const questions = activeSession.questions;
    if (questions.length === 0) return;

    const currentIndex = questions.findIndex((q) => q.id === activeSession.activeQuestionId);
    const prevIndex = (currentIndex - 1 + questions.length) % questions.length;
    const prevQuestion = questions[prevIndex];

    const updatedSession: Session = {
      ...activeSession,
      activeQuestionId: prevQuestion.id,
      updatedAt: Date.now(),
    };

    updateSessionState(updatedSession);
    setSelectedRespondingTeamId(null);
  };

  // Timer Control Handlers
  const handleToggleTimer = () => {
    if (!activeSession) return;
    const isRunning = activeSession.isTimerRunning !== false;
    updateSessionState({
      ...activeSession,
      isTimerRunning: !isRunning,
      updatedAt: Date.now(),
    });
  };

  const handleResetTimer = () => {
    if (!activeSession) return;
    const limit = activeSession.timeLimitMinutes || 10;
    updateSessionState({
      ...activeSession,
      timeRemainingSeconds: limit * 60,
      isTimerRunning: true,
      updatedAt: Date.now(),
    });
  };

  const handleAddMinuteTimer = () => {
    if (!activeSession) return;
    const current = activeSession.timeRemainingSeconds ?? ((activeSession.timeLimitMinutes || 10) * 60);
    updateSessionState({
      ...activeSession,
      timeRemainingSeconds: current + 60,
      isTimerRunning: true,
      updatedAt: Date.now(),
    });
  };

  // GAME 1: BINGO - Claim Tile (with Territory Scoring & Line Block Detection)
  const handleClaimBingoTile = (tileIndex: number, teamId: string) => {
    if (!activeSession || !activeSession.bingoState) return;

    const currentBingo = activeSession.bingoState;
    if (!currentBingo.eligibleClaimTeamId || currentBingo.eligibleClaimTeamId !== teamId) {
      return;
    }

    const tile = currentBingo.tiles[tileIndex];
    if (!tile || tile.claimedByTeamId) return;

    const team = activeSession.teams.find((tItem) => tItem.id === teamId);

    const updatedTiles = [...currentBingo.tiles];
    updatedTiles[tileIndex] = {
      ...tile,
      claimedByTeamId: teamId,
    };

    // Calculate lines completed by this team
    const claimedIndices = new Set(
      updatedTiles
        .map((tItem, idx) => (tItem.claimedByTeamId === teamId ? idx : -1))
        .filter((idx) => idx !== -1)
    );

    let completedLines = 0;
    const gSize = currentBingo.gridSize;

    // Check rows
    for (let r = 0; r < gSize; r++) {
      let full = true;
      for (let c = 0; c < gSize; c++) {
        if (!claimedIndices.has(r * gSize + c)) full = false;
      }
      if (full) completedLines++;
    }

    // Check cols
    for (let c = 0; c < gSize; c++) {
      let full = true;
      for (let r = 0; r < gSize; r++) {
        if (!claimedIndices.has(r * gSize + c)) full = false;
      }
      if (full) completedLines++;
    }

    // Check diagonals
    let diag1 = true;
    let diag2 = true;
    for (let i = 0; i < gSize; i++) {
      if (!claimedIndices.has(i * gSize + i)) diag1 = false;
      if (!claimedIndices.has(i * gSize + (gSize - 1 - i))) diag2 = false;
    }
    if (diag1) completedLines++;
    if (diag2) completedLines++;

    const isBingoWinner = completedLines >= currentBingo.winningLinesNeeded;

    const updatedTeams = activeSession.teams.map((tItem) => {
      if (tItem.id === teamId) {
        return {
          ...tItem,
          score: isBingoWinner ? tItem.score + GAME_RULES.BINGO_LINE_WIN_BONUS : tItem.score,
        };
      }
      return tItem;
    });

    const newLogs: GameEventLog[] = [];

    const claimLog: GameEventLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      teamId,
      teamName: team?.name,
      action: isBingoWinner
        ? (language === 'en' ? '🎉 BINGO Line Completed!' : '🎉 พิชิต BINGO สำเร็จ!')
        : (language === 'en' ? 'Claimed Bingo Tile' : 'ยึดช่องบิงโก'),
      details: isBingoWinner
        ? (language === 'en'
            ? `Claimed tile #${tile.id} (${tile.label}) and completed a BINGO line! (+${GAME_RULES.BINGO_LINE_WIN_BONUS} bonus pts)`
            : `ยึดช่อง #${tile.id} (${tile.label}) และเรียงเส้นสำเร็จเป็น BINGO! (+${GAME_RULES.BINGO_LINE_WIN_BONUS} แต้มพิเศษ)`)
        : (language === 'en'
            ? `Claimed tile #${tile.id} (${tile.label}) on the Bingo board.`
            : `ยึดช่อง #${tile.id} (${tile.label}) บนกระดานบิงโก`),
      pointsChange: isBingoWinner ? GAME_RULES.BINGO_LINE_WIN_BONUS : undefined,
      type: isBingoWinner ? 'bonus' : 'game_move',
    };
    newLogs.push(claimLog);

    let nextTerritoryMode = Boolean(currentBingo.territoryMode);
    const provisionalBingoState = {
      ...currentBingo,
      tiles: updatedTiles,
    };

    if (!isBingoWinner) {
      const anyTeamAlive = canAnyTeamStillComplete(provisionalBingoState, updatedTeams);
      if (!anyTeamAlive && !nextTerritoryMode) {
        nextTerritoryMode = true;
        playTerritoryAlertSound();
        newLogs.unshift({
          id: `log-territory-${Date.now()}`,
          timestamp: Date.now(),
          action: language === 'en' ? 'Territory Mode Activated!' : 'เข้าสู่โหมดยึดพื้นที่ (Territory Mode)!',
          details: language === 'en'
            ? 'No Bingo possible - Territory Mode! Most tiles wins (tie-breaker: largest connected region, then quiz score).'
            : 'ไม่มีทีมใดเรียงเส้น Bingo ได้แล้ว — เข้าสู่โหมดยึดพื้นที่ (Territory Mode)! ทีมที่ยึดช่องได้มากที่สุดชนะ',
          type: 'system',
        });
      }
    }

    const isBoardFull = !isBingoWinner && updatedTiles.every((tItem) => Boolean(tItem.claimedByTeamId));
    let finalWinnerTeamId = isBingoWinner ? teamId : currentBingo.winnerTeamId;

    if (isBingoWinner) {
      playVictorySound();
    } else if (isBoardFull) {
      playVictorySound();
      const ranked = rankTeamsByBingoTerritory(
        { ...provisionalBingoState, territoryMode: true },
        updatedTeams
      );
      const territoryWinner = ranked[0];
      finalWinnerTeamId = territoryWinner?.id;
      const stats = getTerritoryStats(provisionalBingoState, updatedTeams);
      const winStat = territoryWinner ? stats[territoryWinner.id] : undefined;
      newLogs.unshift({
        id: `log-territory-finish-${Date.now()}`,
        timestamp: Date.now(),
        teamId: territoryWinner?.id,
        teamName: territoryWinner?.name,
        action: language === 'en' ? 'Board Full — Territory Victory!' : 'กระดานเต็ม — ชนะด้วยโหมดยึดพื้นที่!',
        details: language === 'en'
          ? `All tiles claimed! ${territoryWinner?.name} wins Territory Mode with ${winStat?.tilesHeld ?? 0} tiles (largest region: ${winStat?.largestConnectedRegion ?? 0}).`
          : `ยึดครบทุกช่องแล้ว! ทีม ${territoryWinner?.name} ชนะด้วยพื้นที่สูงสุด ${winStat?.tilesHeld ?? 0} ช่อง (กลุ่มติดกันใหญ่สุด ${winStat?.largestConnectedRegion ?? 0} ช่อง)`,
        type: 'system',
      });
    }

    const isGameCompleted = isBingoWinner || isBoardFull;

    const updatedSession: Session = {
      ...activeSession,
      teams: updatedTeams,
       winnerTeamId: isGameCompleted ? finalWinnerTeamId : activeSession.winnerTeamId,
      bingoState: {
        ...currentBingo,
        tiles: updatedTiles,
        winnerTeamId: isBingoWinner ? teamId : currentBingo.winnerTeamId,
        eligibleClaimTeamId: null,
        claimTriggerTimestamp: undefined,
        territoryMode: nextTerritoryMode,
      },
      status: isGameCompleted ? 'completed' : activeSession.status,
      completedAt: isGameCompleted ? Date.now() : activeSession.completedAt,
      isTimerRunning: isGameCompleted ? false : activeSession.isTimerRunning,
      eventLogs: [...newLogs, ...activeSession.eventLogs],
      updatedAt: Date.now(),
    };

    updateSessionState(updatedSession);
    setSelectedRespondingTeamId(null);

    if (isGameCompleted) {
      const reason: WinReason = isBingoWinner ? 'bingo_line' : 'bingo_territory';
      setTimeout(() => {
        setCompletedCelebrationSession(updatedSession);
        setCelebrationWinReason(reason);
        setIsCelebrationModalOpen(true);
        setCurrentView('sessions');
        setActiveSessionId(null);
        setSelectedRespondingTeamId(null);
      }, 1000);
    }
  };

  // GAME 2: SNAKES & LADDERS - Move Pawn (Instant state update + lastMove descriptor for PawnLayer)
  const handlePawnMove = (teamId: string, steps: number) => {
    if (!activeSession || !activeSession.snakesLaddersState) return;

    const currentSnakes = activeSession.snakesLaddersState;
    const team = activeSession.teams.find((tItem) => tItem.id === teamId);
    if (!team) return;

    const currentPos = team.pawnPosition || 1;
    const landedPos = Math.min(currentSnakes.boardSize, currentPos + steps);
    let targetPos = landedPos;

    // Check ladder or snake at landed tile
    const event = currentSnakes.laddersAndSnakes.find((e) => e.from === landedPos);
    let eventDetails = '';
    let moveKind: SnakesLaddersLastMove['kind'] = 'normal';

    if (event) {
      if (event.type === 'ladder') {
        targetPos = event.to;
        moveKind = 'ladder';
        eventDetails = language === 'en'
          ? ` and climbed a ladder to tile #${event.to}!`
          : ` และได้ขึ้นบันไดสู่ช่อง ${event.to}!`;
      } else if (event.type === 'snake') {
        targetPos = event.to;
        moveKind = 'snake';
        eventDetails = language === 'en'
          ? ` and slid down a snake to tile #${event.to}!`
          : ` และถูกงูกัดหล่นไปช่อง ${event.to}`;
      }
    }

    const isWinner = targetPos >= currentSnakes.boardSize;
    if (isWinner) {
      moveKind = 'finish';
      playVictorySound();
    }

    const lastMove: SnakesLaddersLastMove = {
      id: `move-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      teamId,
      from: currentPos,
      landed: landedPos,
      to: targetPos,
      steps,
      kind: moveKind,
    };

    const log: GameEventLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      teamId,
      teamName: team.name,
      action: isWinner
        ? (language === 'en' ? 'Reached Finish Line!' : 'เข้าเส้นชัยบันไดงูสำเร็จ!')
        : (language === 'en' ? 'Rolled Dice & Moved Pawn' : 'ทอยลูกเต๋าเดินหมาก'),
      details: language === 'en'
        ? `Rolled ${steps}, moved from tile #${currentPos} to #${targetPos}${eventDetails}`
        : `ทอยได้ ${steps} ก้าว เดินจากช่อง ${currentPos} ไปยังช่อง ${targetPos}${eventDetails}`,
      pointsChange: isWinner ? GAME_RULES.SNAKES_FINISH_BONUS : 0,
      type: isWinner ? 'bonus' : 'game_move',
    };

    const updatedTeams = activeSession.teams.map((tItem) => {
      if (tItem.id === teamId) {
        return {
          ...tItem,
          pawnPosition: targetPos,
          score: isWinner ? tItem.score + GAME_RULES.SNAKES_FINISH_BONUS : tItem.score,
        };
      }
      return tItem;
    });

    const updatedSession: Session = {
      ...activeSession,
      teams: updatedTeams,
      winnerTeamId: isWinner ? teamId : activeSession.winnerTeamId,
      snakesLaddersState: {
        ...currentSnakes,
        lastDiceRoll: steps,
        winnerTeamId: isWinner ? teamId : currentSnakes.winnerTeamId,
        eligibleRollTeamId: null,
        rollTriggerTimestamp: undefined,
        lastMove,
      },
      status: isWinner ? 'completed' : activeSession.status,
      completedAt: isWinner ? Date.now() : activeSession.completedAt,
      isTimerRunning: isWinner ? false : activeSession.isTimerRunning,
      eventLogs: [log, ...activeSession.eventLogs],
      updatedAt: Date.now(),
    };

    updateSessionState(updatedSession);
    setSelectedRespondingTeamId(null);

    if (isWinner) {
      setTimeout(() => {
        setCompletedCelebrationSession(updatedSession);
        setCelebrationWinReason('snakes_finish');
        setIsCelebrationModalOpen(true);
        setCurrentView('sessions');
        setActiveSessionId(null);
        setSelectedRespondingTeamId(null);
      }, GAME_RULES.PAWN_FINISH_DANCE_MS);
    }
  };

  // GAME 3: CARD MATCHING — Evaluate Match (Classic Pair Match from prototype)
  const handleEvaluateCardMatch = (
    teamId: string,
    cardIndex1: number,
    cardIndex2: number,
    isMatch: boolean
  ) => {
    setCardTurnTeamId(null);
    if (!activeSession || !activeSession.cardMatchingState) return;

    const currentMatching = activeSession.cardMatchingState;
    const team = activeSession.teams.find((tItem) => tItem.id === teamId);
    const card1 = currentMatching.boardCards[cardIndex1];
    const card2 = currentMatching.boardCards[cardIndex2];

    if (!team || !card1 || !card2) return;

    const updatedBoard = [...currentMatching.boardCards];
    let newMatchedCount = currentMatching.matchedPairsCount;

    if (isMatch) {
      // Both cards matched!
      updatedBoard[cardIndex1] = {
        ...card1,
        isMatched: true,
        matchedByTeamId: teamId,
        isFaceUp: true,
      };
      updatedBoard[cardIndex2] = {
        ...card2,
        isMatched: true,
        matchedByTeamId: teamId,
        isFaceUp: true,
      };
      newMatchedCount += 1;

      const matchBonus = GAME_RULES.PAIR_MATCH_POINTS || 20;
      const isAllMatched = newMatchedCount >= currentMatching.totalPairs;

      const cardName = `${getCardEmoji(card1.pairKey)} ${getCardDisplayLabel(card1, language)}`;
      const log: GameEventLog = {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        teamId,
        teamName: team.name,
        action: language === 'en' ? 'Matched Card Pair!' : 'จับคู่การ์ดถูกต้อง!',
        details: language === 'en'
          ? `Revealed Card #${cardIndex1 + 1} and #${cardIndex2 + 1} (${cardName}) - Match found! (+${matchBonus} pts)`
          : `เปิดไพ่ใบที่ #${cardIndex1 + 1} และ #${cardIndex2 + 1} (${cardName}) ภาพตรงกัน จับคู่สำเร็จ! (+${matchBonus} แต้ม)`,
        pointsChange: matchBonus,
        type: 'bonus',
      };

      const updatedTeams = activeSession.teams.map((tItem) => {
        if (tItem.id === teamId) {
          return {
            ...tItem,
            score: tItem.score + matchBonus,
            matchesFound: (tItem.matchesFound || 0) + 1,
          };
        }
        return tItem;
      });

      const sortedTeams = [...updatedTeams].sort((a, b) => b.score - a.score);

      const updatedSession: Session = {
        ...activeSession,
        teams: updatedTeams,
        winnerTeamId: isAllMatched ? sortedTeams[0]?.id : activeSession.winnerTeamId,
        endReason: isAllMatched ? 'cards_all_matched' : activeSession.endReason,
        cardMatchingState: {
          ...currentMatching,
          boardCards: updatedBoard,
          matchedPairsCount: newMatchedCount,
        },
        status: isAllMatched ? 'completed' : activeSession.status,
        completedAt: isAllMatched ? Date.now() : activeSession.completedAt,
        isTimerRunning: isAllMatched ? false : activeSession.isTimerRunning,
        eventLogs: [log, ...activeSession.eventLogs],
        updatedAt: Date.now(),
      };

      updateSessionState(updatedSession);
      setSelectedRespondingTeamId(null);

      if (isAllMatched) {
        playVictorySound();
        setTimeout(() => {
          setCompletedCelebrationSession(updatedSession);
          setCelebrationWinReason('cards_all_matched');
          setIsCelebrationModalOpen(true);
          setCurrentView('sessions');
          setActiveSessionId(null);
          setSelectedRespondingTeamId(null);
        }, 1200);
      }
    } else {
      // Mismatch: log event and clear responding team
      const card1Name = `${getCardEmoji(card1.pairKey)} ${getCardDisplayLabel(card1, language)}`;
      const card2Name = `${getCardEmoji(card2.pairKey)} ${getCardDisplayLabel(card2, language)}`;

      const log: GameEventLog = {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        teamId,
        teamName: team.name,
        action: language === 'en' ? 'Card Mismatch' : 'จับคู่ไม่ตรงกัน',
        details: language === 'en'
          ? `Revealed Card #${cardIndex1 + 1} (${card1Name}) and Card #${cardIndex2 + 1} (${card2Name}) - Mismatch, cards flip back face-down`
          : `เปิดไพ่ใบที่ #${cardIndex1 + 1} (${card1Name}) และใบที่ #${cardIndex2 + 1} (${card2Name}) ไม่ตรงกัน ไพ่หมอบลงตามเดิม`,
        type: 'wrong',
      };

      const updatedSession: Session = {
        ...activeSession,
        eventLogs: [log, ...activeSession.eventLogs],
        updatedAt: Date.now(),
      };

      updateSessionState(updatedSession);
      setSelectedRespondingTeamId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-[var(--color-px-ink-dark)]">
      {/* Main Content Area */}
      {currentView === 'login' ? (
        <main className="flex-1 pb-16">
          <LoginView onClose={() => setCurrentView(currentUser ? 'dashboard' : 'menu')} />
        </main>
      ) : currentUser && currentView === 'dashboard' ? (
        <div className="flex-1 flex flex-col justify-between">
          <TopNavBar
            currentView="dashboard"
            sessionsCount={sessions.length}
            onOpenCreate={() => {
              setCreateModalInitialGameType('snakes_ladders');
              setIsCreateModalOpen(true);
            }}
            onOpenSessions={() => setCurrentView('sessions')}
            onOpenDashboard={() => setCurrentView('dashboard')}
            onOpenMenu={() => setCurrentView('menu')}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            onOpenLogin={() => setCurrentView('login')}
            onToggleTheme={handleToggleTheme}
            theme={theme}
          />
          <main className="flex-1 pb-16">
            <Dashboard
              sessions={sessions}
              onOpenCreate={() => {
                setCreateModalInitialGameType('snakes_ladders');
                setIsCreateModalOpen(true);
              }}
              onOpenSessions={() => setCurrentView('sessions')}
              onSelectSession={handleSelectSession}
              onViewScoreboard={handleViewScoreboard}
              onOpenLogin={() => setCurrentView('login')}
              onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
              onLogout={() => setCurrentView('menu')}
            />
          </main>
        </div>
      ) : currentView === 'sessions' ? (
        <div className="flex-1 flex flex-col justify-between">
          <TopNavBar
            currentView="sessions"
            sessionsCount={sessions.length}
            onOpenCreate={() => setIsCreateModalOpen(true)}
            onOpenSessions={() => setCurrentView('sessions')}
            onOpenDashboard={currentUser ? () => setCurrentView('dashboard') : undefined}
            onOpenMenu={() => setCurrentView('menu')}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            onOpenLogin={() => setCurrentView('login')}
            onToggleTheme={handleToggleTheme}
            theme={theme}
          />
          <main className="flex-1 pb-16">
            <SessionList
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              onRestartSession={handleRestartSession}
              onViewScoreboard={handleViewScoreboard}
              onDeleteSession={handleDeleteSession}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onBackToMenu={() => setCurrentView(currentUser ? 'dashboard' : 'menu')}
              recentlySavedSessionId={recentlySavedSessionId}
              initialNotificationMessage={sessionSaveNotification}
              onClearNotification={() => {
                setRecentlySavedSessionId(null);
                setSessionSaveNotification(null);
              }}
              onImportSessions={async (imported) => {
                if (currentUser) {
                  // Logged in: imported sessions are created in the database
                  const saved: Session[] = [];
                  const existingIds = new Set(sessions.map((x) => x.id));
                  for (const s of imported.filter((x) => !existingIds.has(x.id))) {
                    try {
                      saved.push(await createSessionOnServer({ ...s, userId: currentUser.id, isGuest: false }));
                    } catch (e) {
                      console.error('Could not import session', e);
                    }
                  }
                  setSessions(replaceTeacherSessions(await fetchServerSessions(currentUser.id)));
                  if (saved.length > 0) setActiveSessionId(saved[0].id);
                  return;
                }
                saveSessions(imported);
                setSessions(imported);
                if (imported.length > 0) setActiveSessionId(imported[0].id);
              }}
              onOpenLogin={() => setCurrentView('login')}
            />
          </main>
        </div>
      ) : currentView === 'menu' || (!currentUser && currentView !== 'game') ? (
        <main className="flex-1 pb-0">
          <MainMenu
            sessionsCount={sessions.length}
            activeSession={activeSession}
            onOpenSessions={() => setCurrentView('sessions')}
            onOpenCreate={(initType) => {
              setCreateModalInitialGameType(initType || 'snakes_ladders');
              setIsCreateModalOpen(true);
            }}
            onResumeGame={
              activeSession && activeSession.status !== 'completed'
                ? () => setCurrentView('game')
                : undefined
            }
            onOpenLogin={() => setCurrentView('login')}
            onOpenDashboard={() => setCurrentView('dashboard')}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        </main>
      ) : (
        <main className="flex-1 pb-16">
          {activeSession ? (
          activeSession.status === 'completed' ? (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
              <div className="px-window">
                <div className="px-titlebar">
                  <div className="px-titlebar-title">
                    <PixelIcon name="trophy" size={16} />
                    <span>session_complete.exe</span>
                  </div>
                </div>
                <div className="p-8 sm:p-10 space-y-6 bg-[#FDFBFF]">
                  <div className="w-16 h-16 bg-[var(--color-px-yellow)] border-3 border-[var(--color-px-ink-dark)] shadow-[4px_4px_0_#4A3D8F] flex items-center justify-center mx-auto">
                    <PixelIcon name="trophy" size={32} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-px-ink-dark)]">
                      {language === 'en'
                        ? `Session "${activeSession.title}" saved and completed`
                        : `Session "${activeSession.title}" บันทึกผลและจบเกมแล้ว`}
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--color-px-ink)] font-bold max-w-md mx-auto">
                      {language === 'en'
                        ? 'This game session has finished and data is saved. Please select your next action:'
                        : 'กิจกรรมการแข่งขันนี้จบลงแล้วและบันทึกข้อมูลเรียบร้อย กรุณาเลือกขั้นตอนต่อไป:'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSessionId(null);
                        setCurrentView('menu');
                      }}
                      className="w-full sm:w-auto px-btn px-btn-secondary px-6 py-3 text-sm flex items-center justify-center gap-2"
                    >
                      <Home className="w-4 h-4" />
                      <span>{t('backToMenu')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSessionId(null);
                        setCurrentView('sessions');
                      }}
                      className="w-full sm:w-auto px-btn px-6 py-3 text-sm flex items-center justify-center gap-2"
                    >
                      <PixelIcon name="folder" size={16} />
                      <span>{t('viewSessions')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`w-full ${gameViewMode === 'split' ? 'max-w-[1720px]' : 'max-w-7xl'} mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-5 space-y-4`}>
              {/* Top Game Window Control Bar */}
              <div className="px-window">
                <div className="px-titlebar">
                  <div className="px-titlebar-title">
                    <PixelIcon
                      name={
                        activeSession.gameType === 'bingo'
                          ? 'grid'
                          : activeSession.gameType === 'snakes_ladders'
                          ? 'dice'
                          : 'cards'
                      }
                      size={16}
                    />
                    <span className="truncate">
                      {activeSession.gameType === 'bingo'
                        ? 'bingo_stage.exe'
                        : activeSession.gameType === 'snakes_ladders'
                        ? 'snakes_ladders.exe'
                        : 'card_match.exe'}{' '}
                      — {activeSession.title}
                    </span>
                  </div>
                  <div className="px-titlebar-controls">
                    <button
                      type="button"
                      onClick={() => setGameViewMode(gameViewMode === 'split' ? 'board_only' : 'split')}
                      className="px-titlebar-btn"
                      title="Toggle Full Stage"
                    >
                      □
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentView('menu')}
                      className="px-titlebar-btn px-titlebar-btn-close"
                      title={t('back')}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 bg-[var(--color-px-window)]">
                  {/* Back to menu & Session Title */}
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <button
                      id="game-back-to-menu-button"
                      type="button"
                      onClick={() => setCurrentView('menu')}
                      className="px-btn px-btn-secondary px-3 py-1.5 text-xs sm:text-sm flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{t('back')}</span>
                    </button>

                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <span className="font-bold text-[var(--px-text)] truncate max-w-[160px] sm:max-w-xs md:max-w-sm">
                        {activeSession.title}
                      </span>
                      {activeSession.subject && (
                        <span className="px-badge bg-[var(--color-px-yellow)] text-[#2A2350] border border-[var(--px-border)] hidden sm:inline-block font-bold">
                          {activeSession.subject}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Game Countdown Timer Widget */}
                  {(() => {
                    const remaining = activeSession.timeRemainingSeconds ?? ((activeSession.timeLimitMinutes || 10) * 60);
                    const mins = Math.floor(remaining / 60);
                    const secs = remaining % 60;
                    const isRunning = activeSession.isTimerRunning !== false;
                    const isUrgent = remaining <= 60 && remaining > 0;
                    const isTimeUp = remaining <= 0;

                    return (
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 border-3 border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)] ${
                          isTimeUp
                            ? 'bg-[var(--px-error)] text-[#7A1D28]'
                            : isUrgent
                            ? 'bg-[var(--px-yellow)] text-[#2A2350] animate-pulse'
                            : 'bg-[var(--px-surface-sunken)] text-[var(--px-text)]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-sm" style={{ fontFamily: 'var(--font-display)', color: isTimeUp ? '#7A1D28' : isUrgent ? '#2A2350' : 'var(--px-text)' }}>
                          <PixelIcon name="clock" size={16} />
                          <span>
                            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 border-l-2 border-[var(--px-border)] pl-2">
                          <button
                            type="button"
                            onClick={handleToggleTimer}
                            className="px-timer-btn p-1.5"
                            title={isRunning ? (language === 'en' ? 'Pause countdown' : 'หยุดเวลานับถอยหลังชั่วคราว') : (language === 'en' ? 'Resume timer' : 'เริ่มนับเวลาต่อ')}
                          >
                            {isRunning ? <PixelIcon name="pause" size={12} /> : <PixelIcon name="play" size={12} />}
                          </button>
                          <button
                            type="button"
                            onClick={handleAddMinuteTimer}
                            className="px-timer-btn px-timer-btn-add px-2.5 py-0.5 text-xs font-bold flex items-center gap-1"
                            title={language === 'en' ? '+1 min' : 'เพิ่มเวลา 1 นาที'}
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                            <span>+1{t('minutesUnit')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleResetTimer}
                            className="px-timer-btn p-1.5"
                            title={language === 'en' ? 'Reset timer' : 'รีเซ็ตเวลาใหม่เต็มรอบ'}
                          >
                            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* View Mode Toggle: Split vs Board Only */}
                  <div className="flex items-center bg-[var(--px-surface-sunken)] p-1 border-2 border-[var(--px-border)] text-xs gap-1">
                    <button
                      id="btn-view-mode-split"
                      type="button"
                      onClick={() => setGameViewMode('split')}
                      className={`px-3 py-1 font-bold transition flex items-center gap-1.5 border-2 cursor-pointer ${
                        gameViewMode === 'split'
                          ? 'bg-[var(--color-px-yellow)] border-[var(--px-border)] text-[#2A2350] shadow-[2px_2px_0_var(--px-hard-shadow)]'
                          : 'bg-[var(--px-surface)] border-transparent text-[var(--px-text)] hover:border-[var(--px-border)]'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{t('splitView')}</span>
                    </button>

                    <button
                      id="btn-view-mode-board-only"
                      type="button"
                      onClick={() => setGameViewMode('board_only')}
                      className={`px-3 py-1 font-bold transition flex items-center gap-1.5 border-2 cursor-pointer ${
                        gameViewMode === 'board_only'
                          ? 'bg-[var(--color-px-yellow)] border-[var(--px-border)] text-[#2A2350] shadow-[2px_2px_0_var(--px-hard-shadow)]'
                          : 'bg-[var(--px-surface)] border-transparent text-[var(--px-text)] hover:border-[var(--px-border)]'
                      }`}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>{t('boardOnly')}</span>
                    </button>
                  </div>

                  {/* Action Buttons: Restart / Finish / Delete */}
                  <div className="flex items-center gap-2">
                    <button
                      id="game-restart-session-button"
                      type="button"
                      onClick={() => setSessionToRestart(activeSession)}
                      className="px-btn px-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t('restartGame')}</span>
                    </button>

                    <button
                      id="game-finish-session-button"
                      type="button"
                      onClick={() => setIsConfirmFinishModalOpen(true)}
                      className="px-btn px-3 py-1.5 text-xs flex items-center gap-1.5"
                    >
                      <PixelIcon name="trophy" size={14} />
                      <span className="hidden sm:inline">{t('finishGame')}</span>
                    </button>

                    <button
                      id="game-delete-current-session-button"
                      type="button"
                      onClick={() => setSessionToDeleteFromGame(activeSession)}
                      className="px-btn px-btn-danger px-2.5 py-1.5 text-xs flex items-center gap-1"
                    >
                      <PixelIcon name="trash" size={14} />
                      <span className="hidden sm:inline">{t('delete')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Time's Up Alert Banner */}
              {activeSession.timeRemainingSeconds !== undefined && activeSession.timeRemainingSeconds <= 0 && (
                <div className="px-window bg-[var(--color-px-error)] text-[#7A1D28] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-[var(--px-surface)] text-[var(--px-text)] border-3 border-[var(--px-border)] flex items-center justify-center flex-shrink-0">
                      <PixelIcon name="clock" size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-[#7A1D28] flex items-center gap-2">
                        <span>{t('timeUpTitle')}</span>
                        <span className="px-badge bg-[var(--px-surface)] text-[var(--px-text)] border border-[var(--px-border)]">
                          {language === 'en' ? `${activeSession.timeLimitMinutes || 10} min completed` : `ครบเวลา ${activeSession.timeLimitMinutes || 10} นาที`}
                        </span>
                      </h4>
                      <p className="text-xs text-[#7A1D28] font-bold mt-0.5">
                        {t('timeUpDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-shrink-0">
                    <button
                      type="button"
                      onClick={handleAddMinuteTimer}
                      className="flex-1 md:flex-initial px-btn px-btn-secondary px-4 py-2 text-xs sm:text-sm flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t('addMinute')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmFinishModalOpen(true)}
                      className="flex-1 md:flex-initial px-btn px-5 py-2 text-xs sm:text-sm flex items-center justify-center gap-2"
                    >
                      <PixelIcon name="trophy" size={16} />
                      <span>{t('finishGame')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Split Layout: Game Board Stage & Question Control Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 items-start">
                {(gameViewMode === 'split' || gameViewMode === 'board_only') && (
                  <div className={`${gameViewMode === 'split' ? 'lg:col-span-7 xl:col-span-7 2xl:col-span-7' : 'lg:col-span-12'} space-y-3 min-w-0`}>
                    {!isQuestionModalOpen && renderGameBoard(gameViewMode)}
                  </div>
                )}

                {gameViewMode === 'split' && (
                  <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-5 space-y-3 lg:sticky lg:top-4 lg:self-start min-w-0">
                    <QuestionControlPanel
                      session={activeSession}
                      selectedRespondingTeamId={selectedRespondingTeamId}
                      onSelectRespondingTeam={handleSelectRespondingTeam}
                      onCorrectAnswer={handleCorrectAnswer}
                      onWrongAnswer={handleWrongAnswer}
                      onNextQuestion={handleNextQuestion}
                      onPrevQuestion={handlePrevQuestion}
                      onSelectQuestion={(qId) => {
                        const updated = { ...activeSession, activeQuestionId: qId };
                        updateSessionState(updated);
                      }}
                      onOpenFullscreenModal={openProjectorMode}
                      onRequestFinishGame={() => setIsConfirmFinishModalOpen(true)}
                      isScoringLocked={isScoringLocked}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="max-w-xl mx-auto px-4 py-20 text-center">
            <div className="px-window p-8 space-y-4">
              <h2 className="text-xl font-bold text-[var(--color-px-ink-dark)]">
                {language === 'en' ? 'No Active Game Session' : 'ยังไม่มี Session การเล่นที่เปิดอยู่'}
              </h2>
              <p className="text-sm text-[var(--color-px-ink)] font-bold">
                {language === 'en'
                  ? 'Create a new session to begin classroom gameplay, or choose from saved sessions.'
                  : 'สร้าง Session ใหม่เพื่อเริ่มจัดกิจกรรม หรือเลือกจากรายการ Session ที่บันทึกไว้'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentView('menu')}
                  className="px-btn px-btn-secondary px-4 py-2.5 text-sm flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('backToMenu')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-btn px-5 py-2.5 text-sm"
                >
                  + {t('createSession')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    )}

      {/* Bottom Desktop Taskbar (Navbar) - Always shown for logged-in users; for guests shown on non-menu screens */}
      {(currentUser !== null || currentView !== 'menu') && (
        <Navbar
          currentView={currentView}
          activeSession={activeSession}
          onOpenMenu={() => setCurrentView('menu')}
          onOpenDashboard={() => setCurrentView('dashboard')}
          onOpenCreate={() => {
            setCreateModalInitialGameType('snakes_ladders');
            setIsCreateModalOpen(true);
          }}
          onOpenSessions={() => setCurrentView('sessions')}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          isCollapsed={isNavbarCollapsed}
          onToggleCollapse={() => setIsNavbarCollapsed(!isNavbarCollapsed)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      )}

      {/* How to Play Popup Modal */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
        onOpenCreate={() => {
          setIsHowToPlayOpen(false);
          setCreateModalInitialGameType('snakes_ladders');
          setIsCreateModalOpen(true);
        }}
      />

      {/* Question Projector Modal */}
      {activeSession && activeSession.status !== 'completed' && (
        <QuestionModal
          isOpen={isQuestionModalOpen}
          onClose={closeProjectorMode}
          session={activeSession}
          activeQuestion={
            activeSession.questions.find((q) => q.id === activeSession.activeQuestionId) ||
            activeSession.questions[0] ||
            null
          }
          onSelectQuestion={(qId) => {
            const updated = { ...activeSession, activeQuestionId: qId };
            updateSessionState(updated);
          }}
          onCorrectAnswer={handleCorrectAnswer}
          onWrongAnswer={(tId) => {
            handleWrongAnswer(tId);
          }}
          selectedRespondingTeamId={selectedRespondingTeamId}
          onSelectRespondingTeam={handleSelectRespondingTeam}
          isScoringLocked={isScoringLocked}
          gameBoard={isQuestionModalOpen ? renderGameBoard('board_only') : null}
          isActionPending={isBoardActionPending}
          onNextOpenQuestion={handleNextOpenQuestion}
          onRequestFinishGame={() => setIsConfirmFinishModalOpen(true)}
        />
      )}

      {/* Create Session Modal */}
      <CreateSessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSessionCreated={handleSessionCreated}
        initialGameType={createModalInitialGameType}
        onOpenLogin={() => {
          setIsCreateModalOpen(false);
          setCurrentView('login');
        }}
      />

      {/* Victory Celebration Modal */}
      <VictoryCelebrationModal
        isOpen={isCelebrationModalOpen}
        session={completedCelebrationSession}
        winReason={celebrationWinReason}
        onGoToScoreboard={() => {
          setSelectedSessionForScoreboard(completedCelebrationSession);
          setIsPostGameCompleted(true);
          setIsScoreboardModalOpen(true);
          setIsCelebrationModalOpen(false);
        }}
        onGoToSessions={() => {
          setIsCelebrationModalOpen(false);
          setCurrentView('sessions');
        }}
        onGoToMenu={() => {
          setIsCelebrationModalOpen(false);
          setCurrentView('menu');
        }}
        onRestart={() => {
          if (completedCelebrationSession) {
            setIsCelebrationModalOpen(false);
            handleRestartSession(completedCelebrationSession);
          }
        }}
      />

      {/* Scoreboard & Historical Audit Modal */}
      {selectedSessionForScoreboard && (
        <ScoreboardModal
          session={selectedSessionForScoreboard}
          isOpen={isScoreboardModalOpen}
          isPostGameCompleted={isPostGameCompleted}
          onClose={() => {
            setIsScoreboardModalOpen(false);
            setSelectedSessionForScoreboard(null);
            setIsPostGameCompleted(false);
            if (currentView === 'game') {
              setCurrentView('sessions');
            }
          }}
          onGoToMenu={() => {
            setIsScoreboardModalOpen(false);
            setSelectedSessionForScoreboard(null);
            setIsPostGameCompleted(false);
            setActiveSessionId(null);
            setCurrentView('menu');
          }}
          onGoToSessions={() => {
            setIsScoreboardModalOpen(false);
            setSelectedSessionForScoreboard(null);
            setIsPostGameCompleted(false);
            setActiveSessionId(null);
            setCurrentView('sessions');
          }}
          onReopenGame={
            !isPostGameCompleted && selectedSessionForScoreboard.status !== 'completed'
              ? () => {
                  setActiveSessionId(selectedSessionForScoreboard.id);
                  setCurrentView('game');
                }
              : undefined
          }
          onDeleteSession={
            !isPostGameCompleted
              ? (id) => {
                  handleDeleteSession(id);
                  setIsScoreboardModalOpen(false);
                  setSelectedSessionForScoreboard(null);
                  setIsPostGameCompleted(false);
                }
              : undefined
          }
        />
      )}

      {/* Delete Confirmation Modal from Active Game */}
      <DeleteSessionModal
        session={sessionToDeleteFromGame}
        isOpen={sessionToDeleteFromGame !== null}
        onClose={() => setSessionToDeleteFromGame(null)}
        onConfirmDelete={(id) => {
          handleDeleteSession(id);
          setSessionToDeleteFromGame(null);
        }}
      />

      {/* Restart Game Confirmation Modal */}
      <ConfirmRestartModal
        session={sessionToRestart}
        isOpen={sessionToRestart !== null}
        onClose={() => setSessionToRestart(null)}
        onConfirmRestart={(sess) => {
          handleRestartSession(sess);
          setSessionToRestart(null);
        }}
      />

      {/* Finish Game Confirmation Modal */}
      <ConfirmFinishGameModal
        session={activeSession}
        isOpen={isConfirmFinishModalOpen}
        onClose={() => setIsConfirmFinishModalOpen(false)}
        onConfirmFinish={() => {
          handleFinishActiveSession();
          setIsConfirmFinishModalOpen(false);
        }}
      />
    </div>
  );
}
