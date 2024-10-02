# Forecasting Study with AI Assistance

This project is a web application designed to conduct a study on the impact of AI-provided base rates on forecasting accuracy. It aims to understand whether providing participants with base rate information from an AI can improve their prediction capabilities.

## Project Overview

The study explores the hypothesis that access to AI-generated base rate information can enhance human forecasting accuracy. Participants are randomly assigned to either a control group, a study group, or a prediction group, with each group interacting with intelligent AI models in different capacities.

Key aspects of the study:
1. Participants are assigned to control, study, or prediction groups
2. All groups make predictions on various questions
3. Groups receive AI-generated base rate information of different quality
4. Participants submit their predictions and confidence levels

## AI Integration

The control and study groups interact with intelligent AI models using different prompts:

1. Control Group:
   The control group AI provides broad, generalized statistics that are often not directly relevant to the unique circumstances of each prediction question.

2. Study Group:
   The study group AI acts as a superforecaster, providing detailed, relevant base rates with context and analysis.

3. Prediction Group:
   This group interacts with an AI that can respond to general queries and provide probabilistic forecasts when explicitly asked.

## Key Features

- User-friendly interface for prediction input
- Random assignment of participants to groups, with functionality to direct participants to specific groups:
  - /group/a: Assigns user to the control group
  - /group/b: Assigns user to the study group
  - /group/c: Assigns user to the prediction group
  Users visiting these URLs will be automatically assigned to the corresponding group
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
- AI Integration: OpenAI API

## Getting Started

1. Clone the repository
2. Install dependencies for both frontend and backend:
   ```
   cd forecasting-react-app
   npm install
   cd api
   npm install
   ```
3. Set up environment variables
4. Configure API keys and endpoints - current setup is OpenAI and MongoDB, you will need API keys for these.
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
- POST `/api/ai-stream`: Send prompts to AI and receive responses

## Data Analysis

The system collects and analyzes:
- Predictions and confidence levels
- Time taken for each prediction
- AI response time
- Number of questions asked to AI
- Base rates provided by AI

## Ethical Considerations

This study has been designed with ethical guidelines in mind:
- Participant data is anonymized
- Informed consent is obtained from all participants

## Contributing

Contributions to improve the project are welcome. Please follow the standard fork-and-pull request workflow.

## License

[MIT License](LICENSE)