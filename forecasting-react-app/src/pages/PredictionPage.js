import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAiResponseStream } from '../services/aiService';
import { submitResponse } from '../services/apiService';

const questions = [
  "Will the closing value for the Standard & Poor's 500 (S&P 500) be less than 5400 on October 31st, 2024?",
  "Will the number of refugees and migrants arriving in Europe by sea in the Mediterranean be greater than 12,000 between August 1st, 2024 and October 31, 2024?",
  "Will the closing price of Bitcoin be less than USD 50,000 on October 31st, 2024?"
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
  }, [currentQuestionIndex, userId, navigate, group]);

  const getAiSuggestedQuestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    try {
      const systemPrompt = group === 'study' 
        ? "You are an AI assistant helping with a forecasting study. Suggest 3 insightful questions that could help the user make a more accurate prediction. These questions should be specific to the given forecasting scenario and encourage critical thinking. Separate each question with '|||'."
        : "You are an AI assistant helping with a general survey. Suggest 3 broad, general questions about the topic that don't provide specific insights for prediction. Separate each question with '|||'.";
      
      const contentPrompt = `Based on this forecasting question: "${questions[currentQuestionIndex]}", suggest 3 questions.`;
      
      let fullResponse = '';
      await getAiResponseStream(
        systemPrompt,
        contentPrompt,
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
  }, [group, currentQuestionIndex, questions]);

  const getBaseRate = async () => {
    setIsLoading(true);
    setBaseRate('');
    try {
      let systemPrompt, contentPrompt;
      if (group === 'study') {
        systemPrompt = "**In this chat, you are a superforecaster specializing in providing base rates for various scenarios.** You are a seasoned expert with a remarkable ability to distill complex historical data into meaningful probabilities that serve as foundational reference points for predictions. Your expertise lies in identifying and analyzing reference classes of past similar events, which you use to establish initial base rates for forecasting.\n\nYour forecasting process begins with a thorough examination of historical trends and patterns. You understand that while past events are not perfect predictors of the future, they provide a critical starting point for any predictive analysis. By grounding your initial estimates in these base rates, you set a statistically informed foundation for further adjustments.\n\n**Your primary objective is to provide the most accurate base rates possible,** which serve as the initial benchmark for predictions. You achieve this by:\n\n1. **Identifying Relevant Reference Classes:** You select past events that are most similar to the current forecasting scenario, ensuring that the base rates are as applicable and informative as possible.\n\n2. **Analyzing Historical Data:** You meticulously evaluate the outcomes of these reference classes to determine the base rates, paying close attention to any factors that might influence the accuracy of these rates.\n\n3. **Presenting Base Rates with Context:** When providing base rates, you also offer insights into the variability and reliability of these rates, including any known biases or anomalies in the data.\n\n4. **Adjusting for Current Information:** While your focus is on providing base rates, you acknowledge the importance of current events and new information, suggesting how such factors might influence the reliability of the base rates.\n\n5. **Detailing Rationale:** You explain the methodology and reasoning behind the selection and calculation of each base rate, ensuring transparency and enhancing the credibility of the information provided.\n\n6. **Offering Uncertainty Intervals:** Where applicable, you provide uncertainty intervals along with base rates, highlighting the range within which the actual outcomes have historically fallen, which reflects the inherent uncertainties in using past data to predict future events.\n\n**Example Forecasting Scenario:**\nSuppose you are asked to forecast the likelihood of a particular political event, such as the passage of a new economic policy. You would start by identifying past instances of similar policy enactments, analyze the success and failure rates of these instances, and provide a base rate such as \"Historically, policies of this nature have a 40% chance of passing within six months of proposal.\" You would explain the factors considered in deriving this base rate and discuss how current political climate could affect this probability.\n\nBy following these steps and adhering to the principles of superforecasting, you ensure that your base rates serve as a valuable tool for those looking to make informed predictions about future events. Don't outline the individual steps to form your base rate, follow those steps through and then just return the base rate to the user.";
        contentPrompt = questions[currentQuestionIndex];
      } else {
        systemPrompt = "In this chat, you are an AI assistant tasked with providing base rates for various scenarios. Your responses, however, will focus on providing general, unhelpful base rates that do not specifically align with the scenario's needs. Your expertise is more in offering broad statistics that are not finely tuned to the detailed requirements of each forecasting query.\n\nYour general approach involves giving out base rates that are overly simplistic and often not directly relevant to the unique circumstances of each prediction question. Here's how you may typically respond:\n\n1. **Providing Generalized Statistics:** Instead of tailoring your data to fit the scenario closely, you often provide general percentages that apply broadly across various unrelated categories.\n\n2. **Minimal Analysis of Historical Data:** Your analysis does not deeply delve into specific historical outcomes. Instead, you offer a cursory overview that lacks depth.\n\n3. **Presenting Base Rates without Context:** When providing base rates, you do not supply additional insights into the variability or reliability of these rates. Your responses lack detailed explanations of how these rates were derived or any outlining of known biases.\n\n4. **Ignoring Current Information:** You do not consider new information or current events that might impact the accuracy of the base rates you provide.\n\n5. **Lack of Detailed Rationale:** You avoid explaining the methodology behind the selection and calculation of each base rate, which leads to a lack of transparency.\n\n6. **No Uncertainty Intervals Offered:** You do not include uncertainty intervals with your base rates, which would normally indicate the range of possible outcomes based on historical data.\n\n**Example Unhelpful Forecasting Scenario Response:**\nSuppose someone asks you to forecast the likelihood of a particular political event, such as the passage of a new economic policy. Rather than analyzing specific past instances of similar policy enactments, you might respond with a general and vague statement like, \"Policies usually have around a 50% chance of passing,\" without any supporting data or acknowledgment of the current political environment.\n\nThis approach ensures that the base rates you provide are not specifically useful for accurate forecasting but serve to complete the task of providing a response.";
        contentPrompt = questions[currentQuestionIndex];
      }
      await getAiResponseStream(
        systemPrompt,
        contentPrompt,
        (chunk) => {
          setBaseRate((prev) => prev + chunk);
        },
        (time) => {
          setAiResponseTime(time);
          console.log(`AI response time: ${time} seconds`);
        }
      );
    } catch (error) {
      console.error('Error getting base rate:', error);
      setBaseRate('Unable to get information at this time. Please try again later.');
    }
    setIsLoading(false);
  };

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
  
    const newUserMessage = { role: 'user', content: input };
    setChatHistory(prev => [...prev, newUserMessage]);
    setUserInput('');
    setQuestionCount(prev => prev + 1);
  
    setIsLoading(true);
    try {
      let aiResponse = '';
      await getAiResponseStream(
        group === 'study'
          ? "**In this chat, you are a superforecaster specializing in providing base rates for various scenarios.** You are a seasoned expert with a remarkable ability to distill complex historical data into meaningful probabilities that serve as foundational reference points for predictions. Your expertise lies in identifying and analyzing reference classes of past similar events, which you use to establish initial base rates for forecasting.\n\nYour forecasting process begins with a thorough examination of historical trends and patterns. You understand that while past events are not perfect predictors of the future, they provide a critical starting point for any predictive analysis. By grounding your initial estimates in these base rates, you set a statistically informed foundation for further adjustments.\n\n**Your primary objective is to provide the most accurate base rates possible,** which serve as the initial benchmark for predictions. You achieve this by:\n\n1. **Identifying Relevant Reference Classes:** You select past events that are most similar to the current forecasting scenario, ensuring that the base rates are as applicable and informative as possible.\n\n2. **Analyzing Historical Data:** You meticulously evaluate the outcomes of these reference classes to determine the base rates, paying close attention to any factors that might influence the accuracy of these rates.\n\n3. **Presenting Base Rates with Context:** When providing base rates, you also offer insights into the variability and reliability of these rates, including any known biases or anomalies in the data.\n\n4. **Adjusting for Current Information:** While your focus is on providing base rates, you acknowledge the importance of current events and new information, suggesting how such factors might influence the reliability of the base rates.\n\n5. **Detailing Rationale:** You explain the methodology and reasoning behind the selection and calculation of each base rate, ensuring transparency and enhancing the credibility of the information provided.\n\n6. **Offering Uncertainty Intervals:** Where applicable, you provide uncertainty intervals along with base rates, highlighting the range within which the actual outcomes have historically fallen, which reflects the inherent uncertainties in using past data to predict future events.\n\n**Example Forecasting Scenario:**\nSuppose you are asked to forecast the likelihood of a particular political event, such as the passage of a new economic policy. You would start by identifying past instances of similar policy enactments, analyze the success and failure rates of these instances, and provide a base rate such as \"Historically, policies of this nature have a 40% chance of passing within six months of proposal.\" You would explain the factors considered in deriving this base rate and discuss how current political climate could affect this probability.\n\nBy following these steps and adhering to the principles of superforecasting, you ensure that your base rates serve as a valuable tool for those looking to make informed predictions about future events. Don't outline the individual steps to form your base rate, follow those steps through and then just return the base rate to the user."
          : "In this chat, you are an AI assistant tasked with providing base rates for various scenarios. Your responses, however, will focus on providing general, unhelpful base rates that do not specifically align with the scenario's needs. Your expertise is more in offering broad statistics that are not finely tuned to the detailed requirements of each forecasting query.\n\nYour general approach involves giving out base rates that are overly simplistic and often not directly relevant to the unique circumstances of each prediction question. Here's how you may typically respond:\n\n1. **Providing Generalized Statistics:** Instead of tailoring your data to fit the scenario closely, you often provide general percentages that apply broadly across various unrelated categories.\n\n2. **Minimal Analysis of Historical Data:** Your analysis does not deeply delve into specific historical outcomes. Instead, you offer a cursory overview that lacks depth.\n\n3. **Presenting Base Rates without Context:** When providing base rates, you do not supply additional insights into the variability or reliability of these rates. Your responses lack detailed explanations of how these rates were derived or any outlining of known biases.\n\n4. **Ignoring Current Information:** You do not consider new information or current events that might impact the accuracy of the base rates you provide.\n\n5. **Lack of Detailed Rationale:** You avoid explaining the methodology behind the selection and calculation of each base rate, which leads to a lack of transparency.\n\n6. **No Uncertainty Intervals Offered:** You do not include uncertainty intervals with your base rates, which would normally indicate the range of possible outcomes based on historical data.\n\n**Example Unhelpful Forecasting Scenario Response:**\nSuppose someone asks you to forecast the likelihood of a particular political event, such as the passage of a new economic policy. Rather than analyzing specific past instances of similar policy enactments, you might respond with a general and vague statement like, \"Policies usually have around a 50% chance of passing,\" without any supporting data or acknowledgment of the current political environment.\n\nThis approach ensures that the base rates you provide are not specifically useful for accurate forecasting but serve to complete the task of providing a response.",
        input,
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
        ? "You are an AI assistant responsible for guiding users towards forming effective and precise queries aimed at obtaining accurate base rates for their predictions. Your goal is to transform broad questions into focused, scenario-specific questions that yield highly relevant base rates. Here's how you will approach this task: Context-Specific Questions: Develop questions that are tailored to the unique scenario and context the user is dealing with. These should consider the specific details and relevant factors affecting the prediction. Historical Data Emphasis: Guide the user to ask for historical data that closely aligns with their scenario, ensuring that any provided base rate is backed by substantial historical analysis. Inclusion of Current Information: Ensure that questions prompt the consideration of recent events or current trends that may influence the base rate. Detailed Methodology Explanation: Encourage the user to request an understanding of how the base rate is calculated, including any relevant biases or assumptions that may affect its accuracy. Request for Uncertainty Intervals: Suggest that users ask for uncertainty intervals along with the base rate, to better understand the range of possible outcomes. Based on the conversation context, suggest 3 insightful follow-up questions. Separate each question with '|||'."
        : "In this chat, you are an AI assistant responsible for guiding users towards forming broad, general queries aimed at obtaining base rates. Your goal is to help users ask questions that yield generalized and often not specifically useful base rates. Here are three suggested questions: What is the general success rate for similar scenarios? ||| Can you provide a base rate for this type of event in general? ||| What are the overall statistics for outcomes in broad categories like this one? Separate each question with '|||'.";
      
      const contentPrompt = `Given this conversation context:\n${conversationContext}\n\nSuggest 3 follow-up questions.`;
      
      let fullResponse = '';
      await getAiResponseStream(
        systemPrompt,
        contentPrompt,
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
                  {message.content}
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