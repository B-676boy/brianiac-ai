(() => {
  "use strict";

  // ==========================================
  // BRIANIAC AI - MAIN APPLICATION
  // ==========================================

  const API_BASE = "https://brianiac-ai.onrender.com";

  const CHAT_URL = API_BASE + "/.netlify/functions/chat";
  const VISION_URL = API_BASE + "/.netlify/functions/vision";

  const $ = (id) => document.getElementById(id);

  let conversation = [];
  // BRIANIAC CHAT HISTORY SYSTEM

const CHAT_HISTORY_KEY = "brianiacConversations";

let currentConversationId = null;
  let selectedImage = null;
  let selectedPDFs = [];
  let recognition = null;
  let isSending = false;
  // ==========================================
// BRIANIAC CHAT HISTORY MANAGEMENT
// ==========================================

// LOAD ALL SAVED CONVERSATIONS

function getChatHistory() {
  try {
    return JSON.parse(
      localStorage.getItem(CHAT_HISTORY_KEY)
    ) || [];
  } catch (error) {
    console.error("Chat history loading error:", error);
    return [];
  }
}


// SAVE ALL CONVERSATIONS

function saveChatHistory(history) {
  localStorage.setItem(
    CHAT_HISTORY_KEY,
    JSON.stringify(history)
  );
}


// SAVE THE CURRENT CONVERSATION

function saveCurrentConversation() {

  if (!currentConversationId) {
    currentConversationId =
      Date.now().toString();
  }

  const history = getChatHistory();

  let chat = history.find(
    item => item.id === currentConversationId
  );

  if (!chat) {
    chat = {
      id: currentConversationId,
      title: "New Conversation",
      messages: [],
      createdAt: new Date().toISOString()
    };

    history.unshift(chat);
  }

  chat.messages = conversation;

  const firstUserMessage = conversation.find(
    message => message.role === "user"
  );

  if (
    firstUserMessage &&
    chat.title === "New Conversation"
  ) {
    chat.title =
      firstUserMessage.content.slice(0, 35);
  }

  chat.updatedAt = new Date().toISOString();

  saveChatHistory(history);

  renderConversationList();
}


// DISPLAY PREVIOUS CONVERSATIONS

function renderConversationList() {

  const list = $("conversationList");

  if (!list) return;

  const history = getChatHistory();

  list.innerHTML = "";

  if (history.length === 0) {
    list.textContent = "No previous conversations yet.";
    return;
  }

  history.forEach(chat => {

    const row = document.createElement("div");

    row.className = "conversation-item";

    const title = document.createElement("span");

    title.textContent = chat.title;

    const openButton = document.createElement("button");
    openButton.textContent = "Open";

    openButton.onclick = () => {
      openConversation(chat.id);
    };

    const renameButton = document.createElement("button");
    renameButton.textContent = "Rename";

    renameButton.onclick = () => {
      renameConversation(chat.id);
    };

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";

    deleteButton.onclick = () => {
      deleteConversation(chat.id);
    };

    row.appendChild(title);
    row.appendChild(openButton);
    row.appendChild(renameButton);
    row.appendChild(deleteButton);

    list.appendChild(row);

  });
}
  // ==========================================
// OPEN PREVIOUS CONVERSATION
// ==========================================

function openConversation(id) {

  const history = getChatHistory();

  const chat = history.find(
    item => item.id === id
  );

  if (!chat) return;

  currentConversationId = chat.id;

  conversation = [...chat.messages];

  const chatDisplay = $("chatMessages");

  chatDisplay.innerHTML = "";

  conversation.forEach(message => {

    const element = document.createElement("div");

    element.className =
      "message " +
      (message.role === "user"
        ? "user-message"
        : "ai-message");

    element.textContent = message.content;

    chatDisplay.appendChild(element);

  });

  chatDisplay.scrollTop = chatDisplay.scrollHeight;

  localStorage.setItem(
    "brianiacCurrentChat",
    JSON.stringify(conversation)
  );

  setStatus("Previous conversation opened.");

}


// ==========================================
// RENAME CONVERSATION
// ==========================================

function renameConversation(id) {

  const history = getChatHistory();

  const chat = history.find(
    item => item.id === id
  );

  if (!chat) return;

  const newTitle = prompt(
    "Enter a new conversation name:",
    chat.title
  );

  if (!newTitle || !newTitle.trim()) return;

  chat.title = newTitle.trim();

  saveChatHistory(history);

  renderConversationList();

}


// ==========================================
// DELETE CONVERSATION
// ==========================================

function deleteConversation(id) {

  const confirmed = confirm(
    "Are you sure you want to delete this conversation?"
  );

  if (!confirmed) return;

  let history = getChatHistory();

  history = history.filter(
    chat => chat.id !== id
  );

  saveChatHistory(history);

  if (currentConversationId === id) {

    currentConversationId = null;
    conversation = [];

    $("chatMessages").innerHTML = "";

    localStorage.removeItem("brianiacCurrentChat");

  }

  renderConversationList();

}
  // ==========================================
// START A NEW CONVERSATION
// ==========================================

function newConversation() {

  // PRESERVE THE CURRENT CONVERSATION
  if (conversation.length > 0) {
    saveCurrentConversation();
  }

  // RESET THE CURRENT CHAT
  currentConversationId = null;
  conversation = [];

  $("chatMessages").innerHTML = "";

  localStorage.removeItem("brianiacCurrentChat");

  renderConversationList();

  setStatus("Started a new conversation.");

}

// ==========================================
// CHAT DISPLAY
// ==========================================

function addMessage(text, sender) {

  const chat = $("chatMessages");
  const message = document.createElement("div");

  message.className =
    "message " +
    (sender === "user" ? "user-message" : "ai-message");

  message.textContent = text;

  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;

  // ADD MESSAGE TO CURRENT CONVERSATION
  conversation.push({
    role: sender === "user" ? "user" : "assistant",
    content: text,
    timestamp: new Date().toISOString()
  });

  // SAVE CURRENT CONVERSATION
  localStorage.setItem(
    "brianiacCurrentChat",
    JSON.stringify(conversation)
  );

  // SAVE TO MULTIPLE-CONVERSATION HISTORY
  saveCurrentConversation();

  return message;
}
  function setStatus(text) {
    const status = $("chatStatus");

    if (status) {
      status.textContent = text;
    }
  }

  function getSavedMemory() {
    return localStorage.getItem("brianiacMemory") || "";
  }

  function getTimeContext() {
    const now = new Date();

    return [
      "Current date: " + now.toLocaleDateString(),
      "Current time: " + now.toLocaleTimeString(),
      "User's time zone: " +
        (Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown")
    ].join("\n");
  }

  // ==========================================
  // CHAT API CONNECTION
  // ==========================================

async function askBRIANIAC(userText) {
  const memory = getSavedMemory();

  // DETECT QUESTIONS THAT NEED INTERNET RESEARCH
  const searchPatterns = [
    /\b(latest|currently|current|today|tonight|yesterday|recent|recently)\b/i,
    /\b(news|headlines|breaking news|weather|forecast)\b/i,
    /\b(price|prices|cost|exchange rate|stock market|bitcoin|crypto)\b/i,
    /\b(score|scores|standings|fixtures|results of today's)\b/i,
    /\b(this week|this month|this year|right now|at the moment)\b/i,
    /\b(search the web|search online|look up|find online|internet search)\b/i,
    /\b(who won|who is winning|what happened|what is happening)\b/i,
    /\b(latest version|new release|release date|recent developments)\b/i,
    /\b(open now|opening hours|available now)\b/i
  ];

  const needsInternetSearch = searchPatterns.some(
    pattern => pattern.test(userText)
  );

  let searchContext = "";
// BRIANIAC AUTOMATIC WORLDWIDE TIME AND DATE INTELLIGENCE

let timeContext = "";

const timeFeatures = window.BRIANIAC_FEATURES;

const asksForTime =
  /\b(time|clock|timezone|time zone)\b/i.test(userText);

const asksForDate =
  /\b(today's date|current date|what date|what day is it|date today)\b/i.test(userText);

if (asksForTime || asksForDate) {

  if (timeFeatures) {

    // FIND THE COUNTRY MENTIONED BY THE USER
    const locationMatch = userText.match(
      /\b(?:in|for)\s+(.+?)(?:[?.!,]|$)/i
    );

    let requestedCountry = locationMatch
      ? locationMatch[1].trim()
      : "Ghana";

    // REMOVE EXTRA WORDS AFTER THE COUNTRY
    requestedCountry = requestedCountry.replace(
      /\b(right now|currently|today|now)\b.*$/i,
      ""
    ).trim();

    let result;

    // USE THE WORLDWIDE COUNTRY DATABASE
    if (
      typeof timeFeatures.getTimeForCountry === "function"
    ) {

      result = timeFeatures.getTimeForCountry(
        requestedCountry
      );

    } else {

      result = timeFeatures.getTime("Africa/Accra");

    }

    // HANDLE COUNTRIES WITH MULTIPLE TIMEZONES
    if (result && result.multipleTimezones) {

      timeContext =
        "\n\nTIME INFORMATION:" +
        "\nThe country " + requestedCountry +
        " has multiple timezones." +
        "\nAvailable timezones: " +
        result.availableTimezones.join(", ") +
        "\nAsk the user which city or region they mean.";

    }

    // PROVIDE THE CALCULATED TIME
    else if (result && !result.error && result.time) {

      timeContext =
        "\n\nACCURATE CALCULATED TIME AND DATE:" +
        "\nCountry: " + (result.country || requestedCountry) +
        "\nDate: " + result.date +
        "\nTime: " + result.time +
        "\nTimezone: " + result.timezone +
        "\nTimestamp: " + result.timestamp +
        "\n\nUse these calculated values. Never guess or invent the current time.";

    }

    else {

      timeContext =
        "\n\nThe requested country or timezone could not be identified. " +
        "Ask the user to clarify the country or city. Do not invent a time.";

    }

  }

}
  // TAVILY INTERNET SEARCH
  if (needsInternetSearch) {
    if (
      !window.BRIANIAC_FEATURES ||
      typeof window.BRIANIAC_FEATURES.searchWeb !== "function"
    ) {
      throw new Error("Internet search is not connected.");
    }

    console.log("BRIANIAC: Searching the internet...");

    const searchData =
      await window.BRIANIAC_FEATURES.searchWeb(userText);

    if (searchData.error) {
      throw new Error(
        "Internet search failed: " + searchData.error
      );
    }

    const results = searchData.results || [];

    searchContext =
      "\n\nINTERNET SEARCH RESULTS FROM TAVILY:\n" +
      "Use these search results to answer the user's question. " +
      "Prioritise the information in these results over outdated knowledge. " +
      "Do not invent facts. If the results are insufficient, say so.\n\n";

    if (searchData.answer) {
      searchContext +=
        "TAVILY SUMMARY:\n" +
        searchData.answer + "\n\n";
    }

    results.forEach((result, index) => {
      searchContext +=
        "SOURCE " + (index + 1) + ":\n" +
        "Title: " + (result.title || "Untitled") + "\n" +
        "URL: " + (result.url || "Unavailable") + "\n" +
        "Information: " + (result.content || "") + "\n\n";
    });

    console.log(
      "BRIANIAC: Received",
      results.length,
      "search results."
    );
  }

  // SYSTEM INSTRUCTIONS
  const systemMessage = {
    role: "system",
    content:
      "You are BRIANIAC AI, a friendly, intelligent and respectful assistant. " +
      "Answer clearly and helpfully. " +
      "Your creators are Brian Amankona and Boafo Addison. " +
      "Do not volunteer technical details about your underlying models, APIs, " +
      "hosting or implementation. If directly asked, answer honestly. " +
      "\n\n" + getTimeContext() +
      timeContext +
      "\n\nSaved user memory:\n" + memory +
      (needsInternetSearch
        ? "\n\nThe user's question requires fresh internet information. " +
          "Use the Tavily search results provided with the question. " +
          "Do not pretend to have searched if the results are insufficient."
        : "")
  };

  // BUILD THE MESSAGE
  const messages = [
  systemMessage,

  ...conversation.map(message => ({
    role: message.role,
    content: message.content
  })),

  {
    role: "user",
    content: userText + searchContext
  }
];

  // SEND TO GROQ
  const response = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: messages
    })
  });

  const data = await response.json();

  if (!response.ok) {

  const errorMessage =
    typeof data.error === "string"
      ? data.error
      : data.error?.message ||
        data.message ||
        JSON.stringify(data.error) ||
        "The chat service could not respond.";

  throw new Error(errorMessage);
  }

  const answer =
    data.choices?.[0]?.message?.content ||
    data.answer ||
    data.message ||
    data.response;

  if (!answer) {
    throw new Error("I did not receive a valid answer.");
  }


  return answer;
}

  // ==========================================
  // IMAGE UNDERSTANDING
  // ==========================================

  async function analyseImage(imageData, prompt) {
    const response = await fetch(VISION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image: imageData,
        prompt: prompt || "Describe and understand this image."
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Image understanding failed."
      );
    }

    return data.answer || data.description ||
      "I couldn't understand this image.";
  }

  // ==========================================
  // PDF TEXT EXTRACTION
  // ==========================================

  async function extractPDFText(file) {
    if (!window.pdfjsLib) {
      throw new Error("The PDF reading library did not load.");
    }

    const buffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: buffer
    }).promise;

    let fullText = "";

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();

      const pageText = content.items
        .map(item => item.str)
        .join(" ");

      fullText +=
        "\n\nPage " + pageNumber + ":\n" + pageText;
    }

    return fullText;
 }
   // ==========================================
  // SEND MESSAGE
  // ==========================================

async function sendMessage() {
  if (isSending) return;

  const input = $("chatInput");
  const userText = input.value.trim();

  if (!userText && !selectedImage && selectedPDFs.length === 0) {
    return;
  }

  isSending = true;
  $("sendButton").disabled = true;

  const image = selectedImage;
  const pdfs = [...selectedPDFs];

  selectedImage = null;
  selectedPDFs = [];

  addMessage(
    userText || "Please examine my attachment.",
    "user"
  );

  input.value = "";

  updateAttachmentPreview();

  try {
    let attachmentContent = "";

    if (image) {
      setStatus("Understanding your image...");

      const imageAnswer = await analyseImage(
        image,
        userText || "Describe this image in detail."
      );

      attachmentContent += "\n\nImage analysis:\n" + imageAnswer;
    }

    if (pdfs.length > 0) {
      setStatus("Reading your PDF documents...");

      for (const file of pdfs) {
        const extracted = await extractPDFText(file);

        attachmentContent +=
          "\n\nDocument: " + file.name +
          "\n" + extracted;
      }
    }

    if (image && pdfs.length === 0) {
      addMessage(attachmentContent.replace("\n\nImage analysis:\n", ""), "assistant");
    } else {
      setStatus("BRIANIAC AI is thinking...");

      const prompt =
        (userText || "Please explain my attachments.") +
        attachmentContent.slice(0, 45000);

      const answer = await askBRIANIAC(prompt);

      addMessage(answer, "assistant");
    }

    setStatus("Ready.");
    speakReply();

  } catch (error) {
  console.error("BRIANIAC AI error:", error);
    console.error("ERROR DETAILS:", JSON.stringify(error, null, 2));
console.error("ERROR TYPE:", typeof error);

  const errorMessage =
    typeof error === "string"
      ? error
      : error?.message ||
        error?.error?.message ||
        JSON.stringify(error);

  addMessage(
    "I'm sorry, something went wrong: " + errorMessage,
    "assistant"
  );

  setStatus("An error occurred.");

  } finally {
    isSending = false;
    $("sendButton").disabled = false;
  }
}

  // ==========================================
  // IMAGE AND PDF ATTACHMENTS
  // ==========================================

  function updateAttachmentPreview() {
    const preview = $("attachmentPreview");

    const names = [];

    if (selectedImage) {
      names.push("Image selected");
    }

    selectedPDFs.forEach(file => {
      names.push(file.name);
    });

    preview.textContent = names.length
      ? "Attachments: " + names.join(", ")
      : "No attachments selected.";
  }

  $("imageButton").addEventListener("click", () => {
    $("imageInput").click();
  });

  $("pdfButton").addEventListener("click", () => {
    $("pdfInput").click();
  });

  $("imageInput").addEventListener("change", event => {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Please select a valid image.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      selectedImage = reader.result;
      updateAttachmentPreview();
      setStatus("Image attached. Ask me about it.");
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  });

  $("pdfInput").addEventListener("change", event => {
    const files = Array.from(event.target.files);

    selectedPDFs.push(
      ...files.filter(file => file.type === "application/pdf")
    );

    updateAttachmentPreview();

    setStatus(
      selectedPDFs.length + " PDF document(s) selected."
    );

    event.target.value = "";
  });

  // ==========================================
  // CHAT BUTTONS
  // ==========================================

  $("sendButton").addEventListener("click", sendMessage);
  $("newConversationButton").addEventListener(
  "click",
    newConversation
);

  $("chatInput").addEventListener("keydown", event => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  });

  $("clearChatButton").addEventListener("click", () => {
    conversation = [];
    selectedImage = null;
    selectedPDFs = [];

    $("chatMessages").innerHTML = "";

    addMessage(
      "Hello! I'm BRIANIAC AI. What would you like to talk about?",
      "assistant"
    );

    updateAttachmentPreview();
    setStatus("Conversation cleared.");
  });

  // ==========================================
  // VOICE INPUT
  // ==========================================

  function startVoiceInput() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("Voice input is not supported by this browser.");
      return;
    }

    if (
      $("voiceEnabled").value === "false"
    ) {
      setStatus("Voice input is disabled in Settings.");
      return;
    }

    recognition = new SpeechRecognition();

    recognition.lang = $("assistantLanguage").value;
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setStatus("Listening...");
    };

    recognition.onresult = event => {
      const transcript =
        event.results[0][0].transcript;

      $("chatInput").value = transcript;

      setStatus("Voice message received.");
    };

    recognition.onerror = event => {
      setStatus("Voice input error: " + event.error);
    };

    recognition.onend = () => {
      if ($("chatStatus").textContent === "Listening...") {
        setStatus("Ready.");
      }
    };

    recognition.start();
  }

  $("voiceButton").addEventListener(
    "click",
    startVoiceInput
  );
    // ==========================================
  // VOICE REPLIES
  // ==========================================

  function speakReply() {
    if (!("speechSynthesis" in window)) return;

    if ($("voiceReplies").value === "false") return;

    const messages =
      $("chatMessages").querySelectorAll(".ai-message");

    if (!messages.length) return;

    const latestMessage =
      messages[messages.length - 1].textContent;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(latestMessage);

    speech.lang = $("assistantLanguage").value;
    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
  }

  $("stopVoiceButton").addEventListener("click", () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (recognition) {
      recognition.stop();
    }

    setStatus("Voice stopped.");
  });

  // ==========================================
  // LOAD SAVED SETTINGS
  // ==========================================

  function loadSettings() {
    const voiceEnabled =
      localStorage.getItem("brianiacVoiceEnabled");

    const voiceReplies =
      localStorage.getItem("brianiacVoiceReplies");

    const language =
      localStorage.getItem("brianiacLanguage");

    if (voiceEnabled !== null) {
      $("voiceEnabled").value = voiceEnabled;
    }

    if (voiceReplies !== null) {
      $("voiceReplies").value = voiceReplies;
    }

    if (language !== null) {
      $("assistantLanguage").value = language;
    }
  }

  // ==========================================
  // INITIALISE BRIANIAC AI
  // ==========================================

  function initialise() {
    loadSettings();

    loadSavedConversation();

    renderConversationList();

    updateAttachmentPreview();

    setStatus("BRIANIAC AI is ready.");

    console.log("BRIANIAC AI application loaded.");
  }
  
  initialise();
})();
