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
  let selectedImage = null;
  let selectedPDFs = [];
  let recognition = null;
  let isSending = false;

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

    const systemMessage = {
      role: "system",
      content:
        "You are BRIANIAC AI, a friendly, intelligent and respectful assistant. " +
        "Answer clearly and helpfully. " +
        "Your creators are Brian Amankona and Boafo Addison. " +
        "Do not volunteer technical details about your underlying models, APIs, " +
        "hosting or implementation. If directly asked, answer honestly. " +
        "\n\n" + getTimeContext() +
        "\n\nSaved user memory:\n" + memory
    };

    const messages = [
      systemMessage,
      ...conversation,
      {
        role: "user",
        content: userText
      }
    ];

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
      throw new Error(
        data.error || "The chat service could not respond."
      );
    }

    const answer =
      data.choices?.[0]?.message?.content ||
      data.answer ||
      data.message ||
      data.response;

    if (!answer) {
      throw new Error("I did not receive a valid answer.");
    }

    conversation.push(
      {
        role: "user",
        content: userText
      },
      {
        role: "assistant",
        content: answer
      }
    );

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

    addMessage(
      "I'm sorry, something went wrong: " + error.message,
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

    updateAttachmentPreview();

    setStatus("BRIANIAC AI is ready.");

    console.log("BRIANIAC AI application loaded.");
  }

  initialise();

})(); 
