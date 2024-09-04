import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { getAiResponseStream } from '../services/aiService';
import { submitResponse } from '../services/apiService';
import { prompts } from '../lib/prompts';

const questions = [
  "Will British Airways Flight from Heathrow Airport (LHR) to Munich International Airport (MUC) departing at 4.55pm arrive at its expected time, or no longer than 30 mins after the expected arrival time?",
  "Will the price of the S&P 500 be higher on 31st October, 2024 than its price on the 30th September, 2024?",
  "What is the probability that a new, significant military confrontation involving naval forces from China and another claimant country will occur in the South China Sea by December 31, 2024? Significant can be defined as an incident resulting in at least one naval vessel being damaged or casualties reported.",
  "Will Brighton beat Tottenham on 6th October, 2024 in the English Premier League (EPL)?",
  "Will the number of refugees and migrants that arrive in Europe via the Mediterranean see be greater than 18,000 in the month of October, 2024?",
  "Will the odds of Donald Trump winning the US election be greater than 50% on the 31st October, 2024, according to the Ipsos poll?"
];

const PredictionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const group = location.state?.group || 'control';
  const userId = location.state?.userId;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [confidence, setConfidence] = useState(50);
  const [baseRate, setBaseRate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [aiResponseTime, setAiResponseTime] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);

  const getAiSuggestedQuestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    try {
      const systemPrompt = group === 'study' 
        ? prompts.studyGroupSuggestedQuestions
        : prompts.controlGroupSuggestedQuestions;

      const contentPrompt = `Here is the forecasting question: "${questions[currentQuestionIndex]}".`;

      const model = 'gpt-4o'
      
      let fullResponse = '';
      await getAiResponseStream(
        systemPrompt,
        contentPrompt,
        model,
        (chunk) => {
          fullResponse += chunk;
        },
        () => {
          const suggestions = fullResponse.split('|||').map(q => q.trim()).filter(q => q);
          setSuggestedQuestions(suggestions);
          setIsLoadingSuggestions(false);
        }
      );
    } catch (error) {
      console.error('Error getting AI suggested questions:', error);
      setIsLoadingSuggestions(false);
    }
  }, [group, currentQuestionIndex]);

  useEffect(() => {
    if (!userId) {
      navigate('/');
    }
    setBaseRate('');
    setPrediction('');
    setConfidence(50);
    setStartTime(Date.now());
    setAiResponseTime(null);
    setChatHistory([]);
    setSuggestedQuestions([]);
    setQuestionCount(0);
    getAiSuggestedQuestions();
  }, [currentQuestionIndex, userId, navigate, group, getAiSuggestedQuestions]);

  // Commented out for now as we're focusing on turn-based chat instead of single base rate return
  // May be used in the future for single base rate functionality
  // const getBaseRate = async () => {
  //   setIsLoading(true);
  //   setBaseRate('');
  //   try {
  //     let systemPrompt, contentPrompt;
  //     if (group === 'study') {
  //       systemPrompt = group === 'study' ? prompts.studyGroupBaseRate : prompts.controlGroupBaseRate;
  //       contentPrompt = questions[currentQuestionIndex];
  //     } else {
  //       systemPrompt = "In this chat, you are an AI assistant tasked with providing base rates for various scenarios. Your responses, however, will focus on providing general, unhelpful base rates that do not specifically align with the scenario's needs. Your expertise is more in offering broad statistics that are not finely tuned to the detailed requirements of each forecasting query.\n\nYour general approach involves giving out base rates that are overly simplistic and often not directly relevant to the unique circumstances of each prediction question. Here's how you may typically respond:\n\n1. **Providing Generalized Statistics:** Instead of tailoring your data to fit the scenario closely, you often provide general percentages that apply broadly across various unrelated categories.\n\n2. **Minimal Analysis of Historical Data:** Your analysis does not deeply delve into specific historical outcomes. Instead, you offer a cursory overview that lacks depth.\n\n3. **Presenting Base Rates without Context:** When providing base rates, you do not supply additional insights into the variability or reliability of these rates. Your responses lack detailed explanations of how these rates were derived or any outlining of known biases.\n\n4. **Ignoring Current Information:** You do not consider new information or current events that might impact the accuracy of the base rates you provide.\n\n5. **Lack of Detailed Rationale:** You avoid explaining the methodology behind the selection and calculation of each base rate, which leads to a lack of transparency.\n\n6. **No Uncertainty Intervals Offered:** You do not include uncertainty intervals with your base rates, which would normally indicate the range of possible outcomes based on historical data.\n\n**Example Unhelpful Forecasting Scenario Response:**\nSuppose someone asks you to forecast the likelihood of a particular political event, such as the passage of a new economic policy. Rather than analyzing specific past instances of similar policy enactments, you might respond with a general and vague statement like, \"Policies usually have around a 50% chance of passing,\" without any supporting data or acknowledgment of the current political environment.\n\nThis approach ensures that the base rates you provide are not specifically useful for accurate forecasting but serve to complete the task of providing a response.";
  //       contentPrompt = questions[currentQuestionIndex];
  //     }
  //     await getAiResponseStream(
  //       systemPrompt,
  //       contentPrompt,
  //       (chunk) => {
  //         setBaseRate((prev) => prev + chunk);
  //       },
  //       (time) => {
  //         setAiResponseTime(time);
  //         console.log(`AI response time: ${time} seconds`);
  //       }
  //     );
  //   } catch (error) {
  //     console.error('Error getting base rate:', error);
  //     setBaseRate('Unable to get information at this time. Please try again later.');
  //   }
  //   setIsLoading(false);
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000; // Convert to seconds
  
    try {
      await submitResponse({
        userId,
        group,
        question: questions[currentQuestionIndex],
        prediction,
        confidence: parseInt(confidence),
        timeTaken,
        baseRate,
        aiResponseTime
      });
  
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      } else {
        navigate('/thank-you');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      // Handle error (show message to user, etc.)
    }
  };

  const handleChatSubmit = async (e) => {
    let input;
    if (typeof e === 'string') {
      input = e;
    } else {
      e.preventDefault();
      input = userInput.trim();
    }
  
    if (!input) return;
  
    if (questionCount >= 10) {
      alert("You've reached the maximum number of questions for this prediction. Please make your prediction.");
      return;
    }
  
    const model = 'gpt-4-turbo'
  
    const currentQuestion = questions[currentQuestionIndex];
    const fullInput = `Question: ${currentQuestion}\nUser: ${input}`;
  
    const newUserMessage = { role: 'user', content: input };
    setChatHistory(prev => [...prev, newUserMessage]);
    setUserInput('');
    setQuestionCount(prev => prev + 1);
  
    setIsLoading(true);
    try {
      let aiResponse = '';
      await getAiResponseStream(
        group === 'study' ? prompts.studyGroupChat : prompts.controlGroupChat,
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
            return newHistory;
          });
        },
        (time) => {
          setAiResponseTime(time);
          console.log(`AI response time: ${time} seconds`);
          setIsLoading(false);
          updateSuggestedQuestions(aiResponse);
        }
      );
    } catch (error) {
      console.error('Error in chat:', error);
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestionClick = (question) => {
    if (questionCount >= 10) {
      alert("You've reached the maximum number of questions for this prediction. Please make your prediction.");
      return;
    }
    setUserInput(question);
    handleChatSubmit(question);
  };

  const updateSuggestedQuestions = async (lastResponse) => {
    setIsLoadingSuggestions(true);
    try {
      const conversationContext = chatHistory
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n') + `\nassistant: ${lastResponse}`;
  
      const systemPrompt = group === 'study' 
        ? prompts.studyGroupUpdateSuggestions
        : prompts.controlGroupUpdateSuggestions;

      const contentPrompt = `Given this conversation context:\n${conversationContext}\n\nSuggest 3 follow-up questions.`;
      
      const model = 'gpt-4o'
      
      let fullResponse = '';
      await getAiResponseStream(
        systemPrompt,
        contentPrompt,
        model,
        (chunk) => {
          fullResponse += chunk;
        },
        () => {
          const suggestions = fullResponse.split('|||').map(q => q.trim()).filter(q => q);
          setSuggestedQuestions(suggestions);
          setIsLoadingSuggestions(false);
        }
      );
    } catch (error) {
      console.error('Error updating suggested questions:', error);
      setIsLoadingSuggestions(false);
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
          <div className="border p-4 mb-4 h-64 overflow-y-auto">
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
          <h3 className="text-lg font-semibold">Suggested Questions:</h3>
          {isLoadingSuggestions ? (
            <p>Loading suggestions...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded-full text-sm"
                  onClick={() => handleSuggestedQuestionClick(question)}
                  type="button"
                >
                  {question}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mb-4">
          <form onSubmit={handleChatSubmit} className="flex">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-grow border rounded-l px-4 py-2"
              placeholder="Ask a question..."
            />
            <button
              type="button"
              onClick={handleChatSubmit}
              disabled={isLoading || questionCount >= 10}
              className="bg-blue-500 text-white px-4 py-2 rounded-r"
            >
              Send
            </button>
          </form>
          <p className="text-sm text-gray-600 mt-2">
            Questions remaining: {10 - questionCount}
          </p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Your Prediction:</label>
          <div>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="prediction"
                value="Yes"
                checked={prediction === 'Yes'}
                onChange={(e) => setPrediction(e.target.value)}
              />
              <span className="ml-2">Yes</span>
            </label>
            <label className="inline-flex items-center ml-6">
              <input
                type="radio"
                className="form-radio"
                name="prediction"
                value="No"
                checked={prediction === 'No'}
                onChange={(e) => setPrediction(e.target.value)}
              />
              <span className="ml-2">No</span>
            </label>
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="confidence" className="block text-sm font-medium text-gray-700">
            Confidence Level (1-100):
          </label>
          <input
            type="range"
            id="confidence"
            min="1"
            max="100"
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
            className="w-full"
          />
          <span>{confidence}</span>
        </div>
        <button 
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Study'}
        </button>
      </form>
    </div>
  );
};

export default PredictionPage;