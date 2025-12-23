import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { generateDailyBriefing } from "../../services/geminiService"

interface DashboardStats {
    todayPatients: number
    todayAppointments: number
    completedVisits: number
    lowStockCount: number
    todayRevenue: number
}

interface AIBriefingCardProps {
    stats: DashboardStats
}

export function AIBriefingCard({ stats }: AIBriefingCardProps) {
    const [briefing, setBriefing] = useState("")
    const [isLoadingBriefing, setIsLoadingBriefing] = useState(false)

    const handleGetBriefing = async () => {
        setIsLoadingBriefing(true)
        const result = await generateDailyBriefing(
            stats.todayAppointments,
            stats.lowStockCount,
            `${stats.todayRevenue.toLocaleString()} KSh`
        )
        setBriefing(result)
        setIsLoadingBriefing(false)
    }

    return (
        <div className="bg-gradient-to-br from-brand-blue to-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-brand-blue/25">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold">AI Daily Briefing</h3>
                    <p className="text-xs text-blue-100">Powered by Gemini AI</p>
                </div>
            </div>

            {briefing ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-sm leading-relaxed">
                    {briefing}
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-blue-100 leading-relaxed">
                        Get an AI-powered summary of your clinic's performance, key metrics, and
                        personalized recommendations.
                    </p>
                    <button
                        onClick={handleGetBriefing}
                        disabled={isLoadingBriefing}
                        className="w-full py-3 px-4 bg-white text-brand-blue font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoadingBriefing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generate Briefing
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}
