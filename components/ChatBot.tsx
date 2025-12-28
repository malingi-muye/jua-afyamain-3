"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, X, Bot, Loader2, Sparkles } from "lucide-react"
import type { ChatMessage } from "../types"
import { sendMessageToChat } from "../services/geminiService"

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: "Hello! I am your clinic assistant. I can help with patient notes, operational questions, or medical info. How can I help?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    const responseText = await sendMessageToChat(userMsg.text)

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "model",
      text: responseText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, botMsg])
    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-4 sm:bottom-10 sm:right-6 md:bottom-10 md:right-10 w-14 h-14 md:w-16 md:h-16 bg-[#063a33] text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-all z-[110] flex items-center justify-center group ${isOpen ? "hidden" : "flex"}`}
      >
        <Sparkles className="w-6 h-6 md:w-7 md:h-7 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-10 sm:right-10 sm:w-[380px] sm:h-[550px] md:w-[420px] md:h-[600px] bg-white dark:bg-slate-800 sm:rounded-3xl shadow-2xl z-[110] flex flex-col border border-slate-100 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-5 duration-300 font-sans m-0 sm:m-0">
          {/* Header */}
          <div className="bg-[#063a33] px-4 sm:px-5 py-4 sm:py-5 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base sm:text-lg tracking-wide truncate">JuaAfya AI</h3>
                <div className="flex items-center space-x-1.5 opacity-80">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"></span>
                  <span className="text-xs sm:text-sm uppercase font-medium tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 sm:py-5 space-y-3 sm:space-y-4 bg-gray-50/50 dark:bg-slate-900/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] sm:max-w-[85%] px-4 py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base leading-relaxed shadow-sm break-words ${
                    msg.role === "user"
                      ? "bg-teal-600 text-white rounded-br-sm"
                      : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-600 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-700 px-4 py-3 sm:py-3.5 rounded-2xl rounded-bl-none border border-slate-100 dark:border-slate-600 shadow-sm flex items-center space-x-2 max-w-[90%] sm:max-w-[85%]">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base font-medium text-slate-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 sm:px-5 py-4 sm:py-5 bg-white dark:bg-slate-800 border-t border-slate-50 dark:border-slate-700 shrink-0 transition-colors">
            <div className="relative flex items-center gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your question..."
                className="w-full pl-4 pr-12 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-700 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-600 transition-all text-sm sm:text-base dark:text-white dark:placeholder-slate-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatBot
