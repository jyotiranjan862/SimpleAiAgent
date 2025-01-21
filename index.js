// Import the required Google Generative AI library
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Generative AI with the API key
const genAI = new GoogleGenerativeAI("AIzaSyCCyR9YKkkeAwney9VyRGwQs4ZhHZQUN2E");

// Mock API to simulate fetching temperature data for a city
async function getCityTemperature(city) {
  const cityData = {
    London: { temperature: 15, unit: "Celsius" },
    NewYork: { temperature: 22, unit: "Celsius" },
    Tokyo: { temperature: 18, unit: "Celsius" },
  };

  const data = cityData[city] || { temperature: "N/A", unit: "N/A" };
  return data;
}

// Mock API to simulate fetching capital of a country
async function getCapitalOfCountry(country) {
  const countryData = {
    USA: "Washington D.C.",
    Japan: "Toko",
    France: "Paris",
    India: "New Delhi",
  };

  const capital = countryData[country] || "Unknown";
  return { capital };
}

// Define the function declarations for "getTemperature" and "getCapitalOfCountry"
const getTemperatureFunctionDeclaration = {
  name: "getTemperature",
  parameters: {
    type: "OBJECT",
    description: "Fetch the current temperature for a specified city.",
    properties: {
      city: {
        type: "STRING",
        description: "Name of the city to fetch the temperature for.",
      },
    },
    required: ["city"],
  },
};

const getCapitalOfCountryFunctionDeclaration = {
  name: "getCapitalOfCountry",
  parameters: {
    type: "OBJECT",
    description: "Fetch the capital city of a specified country.",
    properties: {
      country: {
        type: "STRING",
        description: "Name of the country to fetch the capital for.",
      },
    },
    required: ["country"],
  },
};

// Map the declared functions to their executable code
const functions = {
  getTemperature: async ({ city }) => {
    return getCityTemperature(city);
  },
  getCapitalOfCountry: async ({ country }) => {
    return getCapitalOfCountry(country);
  },
};

// Get the generative model with support for function calling
const generativeModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  tools: {
    functionDeclarations: [
      getTemperatureFunctionDeclaration,
      getCapitalOfCountryFunctionDeclaration,
    ],
  },
});

async function fetchCityTemperature() {
  try {
    const chat = generativeModel.startChat();
    const systemprompt = `
      You should first try to provide a direct answer to the user's query based on your knowledge.
      If the answer is not available from your knowledge, call the appropriate function to fetch the data.
      If the function is called, please provide the result.
    `;
    const userprompt = "What is the capital of Japan?";  // A query for the capital city of Japan
    const prompt = systemprompt + " " + userprompt;

    const result = await chat.sendMessage(prompt);
    // console.log("Raw model response:", result);  

    // Check if the response contains a function call or direct response
    const functionCalls = result.response?.functionCalls();

    if (!functionCalls || functionCalls.length === 0) {
      // Direct model response (no function call required)
      if (result.response && result.response.text) {
        console.log("Direct model response:", result.response.text());
      } else {
        console.log("No direct response or text found.");
      }
      return;
    }

    // If there are function calls, process them
    const call = functionCalls[0];
    if (!call || !call.name) {
      console.log("Invalid function call object.");
      return;
    }

    // Call the corresponding function
    const apiResponse = await functions[call.name](call.args);

    // Send the API response back to the model
    const result2 = await chat.sendMessage([{
      functionResponse: {
        name: call.name,
        response: apiResponse,
      },
    }]);

    console.log("Model's response after function call:", result2.response.text());
  } catch (error) {
    console.error("Error occurred during the process:", error);
  }
}

fetchCityTemperature();
