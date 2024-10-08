import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { getAiResponseStream } from '../services/aiService';
import { submitResponse } from '../services/apiService';
import { prompts } from '../lib/prompts';

const questions = [
  "Will British Airways Flight from Heathrow Airport (LHR) to Munich International Airport (MUC) departing at 4.55pm arrive on Friday 18th October, 2024, at its expected time, or no longer than 30 mins after the expected arrival time?",
  "Will the price of the S&P 500 be higher on 31st October, 2024 than its price on the 30th September, 2024?",
  "What is the probability that a new, significant military confrontation involving naval forces from China and another claimant country will occur in the South China Sea by December 31, 2024? Significant can be defined as an incident resulting in at least one naval vessel being damaged or casualties reported.",
  "Will Fulham beat Aston Villa on 19th October, 2024 in the English Premier League (EPL)?",
  "Will the number of refugees and migrants that arrive in Europe via the Mediterranean sea be greater than 18,000 in the month of October, 2024?",
];

const PredictionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const group = location.state?.group || 'control';
  const userId = location.state?.userId;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [prediction] = useState('');
  const [confidence] = useState(50);
  const [baseRates, setBaseRates] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [aiResponseTime, setAiResponseTime] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [finalBaseRate, setFinalBaseRate] = useState(null); // For saving final base rate for study group

// Load conversation history specific to the current question
useEffect(() => {
  setStartTime(Date.now());
  setChatHistory([]); // Always reset chat history when opening a new question
  setBaseRates(prevBaseRates => ({
    ...prevBaseRates,
    [currentQuestionIndex]: ''
  }));
  setAiResponseTime(0); // reset AiResponseTime for new Q
}, [currentQuestionIndex]);

  // Save conversation history specific to the current question
  const saveConversationHistory = () => {
    const fullChatHistory = [...chatHistory];
    sessionStorage.setItem(`chatHistory_${currentQuestionIndex}`, JSON.stringify(fullChatHistory));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isAiResponding) {
      alert("Please wait for the AI to finish responding before submitting.");
      return;
    }
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000; // Convert to seconds

    // Convert chatHistory to a string format
    const fullConversation = chatHistory
    .map(message => `${message.role.charAt(0).toUpperCase() + message.role.slice(1)}: ${message.content}`)
    .join('\n\n');

    try {
      await submitResponse({
        userId,
        group,
        question: questions[currentQuestionIndex],
        prediction,
        confidence: parseInt(confidence),
        timeTaken,
        baseRate: fullConversation, // Full conversation recorded
        aiResponseTime,
        questionCount // Add the number of questions asked by the user
      });

      setQuestionCount(0)

      if (currentQuestionIndex < questions.length - 1) {
        saveConversationHistory();
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      } else {
        navigate('/thank-you');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      // Handle error (show message to user, etc.)
    }
  };

  const handleChatSubmit = async (input) => {
    if (!input) return;

    if (questionCount >= 10) {
      alert("You've reached the maximum number of questions for this prediction. Please make your prediction.");
      return;
    }

    const model = 'gpt-4-turbo';

    const currentQuestion = questions[currentQuestionIndex];
    const fullInput = `Question: ${currentQuestion}\nUser: ${input}`;

    const newUserMessage = { role: 'user', content: input };
    setChatHistory(prev => [...prev, newUserMessage]);
    setUserInput('');
    setQuestionCount(prev => prev + 1);

    setIsLoading(true);
    setIsAiResponding(true);
    try {
      let aiResponse = '';
      await getAiResponseStream(
        group === 'study' ? prompts.studyGroupChat :
        group === 'control' ? prompts.controlGroupChat :
        group === 'prediction' ? prompts.predictionGroupChat :
        prompts.studyGroupChat,
        fullInput,
        model,
        (chunk) => {
          aiResponse += chunk;
          setChatHistory(prev => {
            const newHistory = [...prev];
            if (newHistory[newHistory.length - 1].role === 'assistant') {
              newHistory[newHistory.length - 1].content = aiResponse;
            } else {
              newHistory.push({ role: 'assistant', content: aiResponse });
            }
            setBaseRates(prevBaseRates => ({
              ...prevBaseRates,
              [currentQuestionIndex]: fullInput + '\n\nAI: ' + aiResponse
            }));
            return newHistory;
          });
        },
        (time) => {
          setAiResponseTime(prevTime => prevTime + time);
          console.log(`AI response time: ${time} seconds`);
          console.log(`Cumulative AI response time: ${aiResponseTime + time} seconds`);
          setIsLoading(false);
          setIsAiResponding(false);

          // If study group and base rate is provided, save it as the final base rate
          if (group === 'study' && baseRates[currentQuestionIndex] && !finalBaseRate) {
            setFinalBaseRate(baseRates[currentQuestionIndex]);
          }
        }
      );
    } catch (error) {
      console.error('Error in chat:', error);
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
      setIsLoading(false);
      setIsAiResponding(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit(userInput.trim());
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Forecasting Study: Question {currentQuestionIndex + 1}/{questions.length}</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{questions[currentQuestionIndex]}</h2>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Chat with AI Assistant</h3>
          <div className="border-2 p-4 mb-4 h-[50vh] w-[70vw] overflow-y-scroll">
            {chatHistory.map((message, index) => (
              <div key={index} className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block p-2 rounded ${message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {message.role === 'assistant' ? (
                    <div dangerouslySetInnerHTML={{ __html: marked(message.content) }} />
                  ) : (
                    message.content
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <div className="flex">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-grow border rounded-l px-4 py-2"
              placeholder="Ask a question..."
            />
            <button
              type="button"
              onClick={() => handleChatSubmit(userInput.trim())}
              disabled={isLoading || questionCount >= 10 || isAiResponding}
              className="bg-blue-500 text-white px-4 py-2 rounded-r"
            >
              Send
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Questions remaining: {10 - questionCount}
          </p>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            className="bg-gray-500 text-white px-4 py-2 rounded"
            onClick={() => {
              saveConversationHistory();
              navigate(-1);
            }}
          >
            Previous Page
          </button>

          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded"
            disabled={isAiResponding}
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Study'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PredictionPage;
