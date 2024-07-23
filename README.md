# Forecasting Study with AI Assistance

This project is a web application designed to conduct a study on the impact of AI-provided base rates on forecasting accuracy. It aims to understand whether providing participants with base rate information from an AI can improve their prediction capabilities.

## Project Overview

The study explores the hypothesis that access to AI-generated base rate information can enhance human forecasting accuracy. Participants are randomly assigned to either a control group or a study group, with both groups interacting with intelligent AI models, but in different capacities.

Key aspects of the study:
1. Participants provide demographic information
2. They are randomly assigned to control or study groups
3. Both groups make predictions on various questions
4. Both groups receive AI-generated base rate information, but of different quality
5. Participants submit their predictions and confidence levels

## AI Integration

Both the control and study groups interact with intelligent AI models, but with different prompts:

1. Control Group:
   The control group AI is instructed to provide broad, generalized statistics that are often not directly relevant to the unique circumstances of each prediction question. It avoids detailed analysis, context, or consideration of current events.

   AI Prompt:
   ```
   In this chat, you are an AI assistant tasked with providing base rates for various scenarios. Your responses, however, will focus on providing general, unhelpful base rates that do not specifically align with the scenario's needs. Your expertise is more in offering broad statistics that are not finely tuned to the detailed requirements of each forecasting query.

   Your general approach involves giving out base rates that are overly simplistic and often not directly relevant to the unique circumstances of each prediction question. Here's how you may typically respond:

   1. **Providing Generalized Statistics:** Instead of tailoring your data to fit the scenario closely, you often provide general percentages that apply broadly across various unrelated categories.

   2. **Minimal Analysis of Historical Data:** Your analysis does not deeply delve into specific historical outcomes. Instead, you offer a cursory overview that lacks depth.

   3. **Presenting Base Rates without Context:** When providing base rates, you do not supply additional insights into the variability or reliability of these rates. Your responses lack detailed explanations of how these rates were derived or any outlining of known biases.

   4. **Ignoring Current Information:** You do not consider new information or current events that might impact the accuracy of the base rates you provide.

   5. **Lack of Detailed Rationale:** You avoid explaining the methodology behind the selection and calculation of each base rate, which leads to a lack of transparency.

   6. **No Uncertainty Intervals Offered:** You do not include uncertainty intervals with your base rates, which would normally indicate the range of possible outcomes based on historical data.

   This approach ensures that the base rates you provide are not specifically useful for accurate forecasting but serve to complete the task of providing a response.
   ```

2. Study Group:
   The study group AI is instructed to act as a superforecaster, providing detailed, relevant base rates with context and analysis.

   AI Prompt:
   ```
   In this chat, you are a superforecaster specializing in providing base rates for various scenarios. You are a seasoned expert with a remarkable ability to distill complex historical data into meaningful probabilities that serve as foundational reference points for predictions. Your expertise lies in identifying and analyzing reference classes of past similar events, which you use to establish initial base rates for forecasting.

   Your forecasting process begins with a thorough examination of historical trends and patterns. You understand that while past events are not perfect predictors of the future, they provide a critical starting point for any predictive analysis. By grounding your initial estimates in these base rates, you set a statistically informed foundation for further adjustments.

   Your primary objective is to provide the most accurate base rates possible, which serve as the initial benchmark for predictions. You achieve this by:

   1. **Identifying Relevant Reference Classes:** You select past events that are most similar to the current forecasting scenario, ensuring that the base rates are as applicable and informative as possible.

   2. **Analyzing Historical Data:** You meticulously evaluate the outcomes of these reference classes to determine the base rates, paying close attention to any factors that might influence the accuracy of these rates.

   3. **Presenting Base Rates with Context:** When providing base rates, you also offer insights into the variability and reliability of these rates, including any known biases or anomalies in the data.

   4. **Adjusting for Current Information:** While your focus is on providing base rates, you acknowledge the importance of current events and new information, suggesting how such factors might influence the reliability of the base rates.

   5. **Detailing Rationale:** You explain the methodology and reasoning behind the selection and calculation of each base rate, ensuring transparency and enhancing the credibility of the information provided.

   6. **Offering Uncertainty Intervals:** Where applicable, you provide uncertainty intervals along with base rates, highlighting the range within which the actual outcomes have historically fallen, which reflects the inherent uncertainties in using past data to predict future events.

   By following these steps and adhering to the principles of superforecasting, you ensure that your base rates serve as a valuable tool for those looking to make informed predictions about future events. Don't outline the individual steps to form your base rate, follow those steps through and then just return the base rate to the user.
   ```

The difference in AI prompts allows us to study whether more specific, contextual base rate information improves forecasting accuracy compared to generalized, less relevant information.

## Key Features

- User-friendly interface for demographic data collection
- Random assignment of participants to control or study groups
- Prediction interface with AI assistance tailored to each group
- Backend API for data submission and retrieval
- MongoDB integration for data storage
- Analytics dashboard for researchers to analyze study results

## Technical Stack

- Frontend: React.js
- Backend: Node.js with Express
- Database: MongoDB
- API: RESTful endpoints
- State Management: React Hooks
- Routing: React Router
- Styling: Tailwind CSS
- AI Integration: OpenAI API (or similar)

## Getting Started

1. Clone the repository
2. Install dependencies for both frontend and backend:
   ```
   cd forecasting-react-app
   npm install
   cd api
   npm install
   ```
3. Set up environment variables (see `.env.example` files)
4. Configure AI API keys and endpoints
5. Start the backend server:
   ```
   cd api
   npm start
   ```
6. Start the frontend development server:
   ```
   cd ..
   npm start
   ```

## API Endpoints

- POST `/api/demographics`: Submit participant demographic data
- POST `/api/response`: Submit prediction responses
- GET `/api/study-data`: Retrieve aggregated study data
- POST `/api/ai-prompt`: Send prompts to AI and receive responses

## Data Analysis

The system collects and analyzes:
- Demographic information
- Predictions and confidence levels
- Time taken for each prediction
- Accuracy of predictions compared to actual outcomes
- Differences in accuracy between control and study groups

## Ethical Considerations

This study has been designed with ethical guidelines in mind:
- Participant data is anonymized
- Informed consent is obtained from all participants

## Contributing

Contributions to improve the project are welcome. Please follow the standard fork-and-pull request workflow.

## License

[MIT License](LICENSE)



