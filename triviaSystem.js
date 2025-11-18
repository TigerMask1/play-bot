const { saveData, saveDataImmediate } = require('./dataManager.js');

function initializeTriviaData(data) {
  if (!data.trivia) {
    data.trivia = {
      questions: [],
      activeSessions: {},
      cooldowns: {}
    };
  }
  return data.trivia;
}

function addTriviaQuestion(question, answer, data) {
  const triviaData = initializeTriviaData(data);
  
  const triviaId = `trivia_${Date.now()}`;
  const newQuestion = {
    id: triviaId,
    question: question,
    answer: answer.toLowerCase().trim(),
    addedAt: Date.now()
  };
  
  triviaData.questions.push(newQuestion);
  
  return {
    success: true,
    message: `✅ Trivia question added successfully!\nID: \`${triviaId}\`\n\nTotal questions: ${triviaData.questions.length}`,
    questionId: triviaId
  };
}

function removeTriviaQuestion(questionId, data) {
  const triviaData = initializeTriviaData(data);
  
  const questionIndex = triviaData.questions.findIndex(q => q.id === questionId);
  
  if (questionIndex === -1) {
    return {
      success: false,
      message: '❌ Question not found!'
    };
  }
  
  const removedQuestion = triviaData.questions[questionIndex];
  triviaData.questions.splice(questionIndex, 1);
  
  return {
    success: true,
    message: `✅ Removed trivia question:\n"${removedQuestion.question}"`
  };
}

function getRandomQuestion(data) {
  const triviaData = initializeTriviaData(data);
  
  if (triviaData.questions.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * triviaData.questions.length);
  return triviaData.questions[randomIndex];
}

function startTriviaSession(userId, data) {
  const triviaData = initializeTriviaData(data);
  
  const now = Date.now();
  const cooldownTime = 30000;
  
  if (triviaData.cooldowns[userId]) {
    const timeLeft = triviaData.cooldowns[userId] - now;
    if (timeLeft > 0) {
      return {
        success: false,
        message: `⏰ Please wait ${Math.ceil(timeLeft / 1000)} seconds before starting another trivia!`
      };
    }
  }
  
  if (triviaData.activeSessions[userId]) {
    return {
      success: false,
      message: '❌ You already have an active trivia session! Answer the current question first.'
    };
  }
  
  const question = getRandomQuestion(data);
  
  if (!question) {
    return {
      success: false,
      message: '❌ No trivia questions available yet! Ask a bot admin to add some.'
    };
  }
  
  const sessionDuration = 60000;
  
  triviaData.activeSessions[userId] = {
    question: question,
    startTime: now,
    expiresAt: now + sessionDuration,
    guessesLeft: 3,
    guesses: []
  };
  
  return {
    success: true,
    question: question.question,
    guessesLeft: 3,
    timeLimit: 60
  };
}

function answerTrivia(userId, answer, data) {
  const triviaData = initializeTriviaData(data);
  
  const session = triviaData.activeSessions[userId];
  
  if (!session) {
    return {
      success: false,
      message: '❌ You don\'t have an active trivia session! Use `!trivia` to start one.'
    };
  }
  
  const now = Date.now();
  
  if (now > session.expiresAt) {
    delete triviaData.activeSessions[userId];
    triviaData.cooldowns[userId] = now + 30000;
    
    return {
      success: false,
      message: `⏰ Time\'s up! The correct answer was: **${session.question.answer}**\n\nBetter luck next time!`,
      timedOut: true
    };
  }
  
  const normalizedAnswer = answer.toLowerCase().trim();
  session.guesses.push(normalizedAnswer);
  
  if (normalizedAnswer === session.question.answer) {
    delete triviaData.activeSessions[userId];
    triviaData.cooldowns[userId] = now + 30000;
    
    if (!data.users[userId]) {
      return {
        success: false,
        message: '❌ User data not found!'
      };
    }
    
    data.users[userId].coins = (data.users[userId].coins || 0) + 100;
    
    return {
      success: true,
      message: `🎉 Correct! You won **100 coins**! 💰\n\nYour answer: **${answer}**`,
      correct: true,
      reward: 100
    };
  }
  
  session.guessesLeft--;
  
  if (session.guessesLeft <= 0) {
    delete triviaData.activeSessions[userId];
    triviaData.cooldowns[userId] = now + 30000;
    
    return {
      success: false,
      message: `❌ Wrong guess! You're out of guesses.\n\nThe correct answer was: **${session.question.answer}**`,
      outOfGuesses: true
    };
  }
  
  return {
    success: false,
    message: `❌ Wrong guess! You have **${session.guessesLeft}** guess(es) left.`,
    guessesLeft: session.guessesLeft
  };
}

function getActiveSession(userId, data) {
  const triviaData = initializeTriviaData(data);
  return triviaData.activeSessions[userId] || null;
}

function clearExpiredSessions(data) {
  const triviaData = initializeTriviaData(data);
  const now = Date.now();
  
  for (const userId in triviaData.activeSessions) {
    if (triviaData.activeSessions[userId].expiresAt < now) {
      delete triviaData.activeSessions[userId];
      triviaData.cooldowns[userId] = now + 30000;
    }
  }
}

function listAllQuestions(data) {
  const triviaData = initializeTriviaData(data);
  return triviaData.questions;
}

function getTriviaStats(data) {
  const triviaData = initializeTriviaData(data);
  
  return {
    totalQuestions: triviaData.questions.length,
    activeSessions: Object.keys(triviaData.activeSessions).length
  };
}

module.exports = {
  initializeTriviaData,
  addTriviaQuestion,
  removeTriviaQuestion,
  getRandomQuestion,
  startTriviaSession,
  answerTrivia,
  getActiveSession,
  clearExpiredSessions,
  listAllQuestions,
  getTriviaStats
};
