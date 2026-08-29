import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, Target, TrendingUp, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

const DecisionInsightsModal = ({ isOpen, onClose, careerDecision }) => {
    console.log('DecisionInsightsModal render - isOpen:', isOpen, 'careerDecision:', careerDecision);

    if (!isOpen || !careerDecision) return null;

    const {
        career,
        reasoning,
        confidence,
        skill_match_percentage = 0,
        key_strengths = [],
        skill_gaps = [],
        time_to_job_ready,
        alternatives = [],
        industry_demand,
    } = careerDecision;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto glass-card rounded-2xl shadow-2xl"
                        style={{
                            scrollbarWidth: 'none', /* Firefox */
                            msOverflowStyle: 'none', /* IE and Edge */
                        }}
                    >
                        <style>{`
                            .glass-card::-webkit-scrollbar {
                                display: none; /* Chrome, Safari, Opera */
                            }
                        `}</style>
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-white/95 dark:bg-card/95 backdrop-blur-lg border-b border-gray-200 dark:border-border p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif italic">
                                        Career Decision Insights
                                    </h2>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                        Understanding why <span className="font-semibold text-foreground">{career}</span> is recommended for you
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-secondary rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* AI Reasoning */}
                            <div className="p-6 bg-orange-500/5 dark:bg-orange-500/10 rounded-2xl border border-orange-500/20">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="p-2 bg-orange-500/20 rounded-xl">
                                        <Lightbulb className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-foreground font-serif italic">AI Analysis</h3>
                                        <p className="text-xs text-muted-foreground font-mono">Confidence: {confidence}%</p>
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                                    {reasoning}
                                </p>
                            </div>

                            {/* Two Column Layout */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Your Strengths */}
                                {key_strengths.length > 0 && (
                                    <div className="p-5 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-100 dark:border-border">
                                        <div className="flex items-center gap-2 mb-4">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <h3 className="font-bold text-gray-900 dark:text-foreground">Your Strengths</h3>
                                        </div>
                                        <ul className="space-y-2">
                                            {key_strengths.map((strength, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                                    <span className="text-green-600 dark:text-green-400 mt-1">●</span>
                                                    <span>{strength}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Skill Gaps */}
                                {skill_gaps.length > 0 && (
                                    <div className="p-5 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-100 dark:border-border">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                            <h3 className="font-bold text-gray-900 dark:text-foreground">Areas to Develop</h3>
                                        </div>
                                        <ul className="space-y-2">
                                            {skill_gaps.map((gap, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                                    <span className="text-orange-600 dark:text-orange-400 mt-1">●</span>
                                                    <span>{gap}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-white dark:bg-accent rounded-xl border border-gray-200 dark:border-border text-center">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Skill Match</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-foreground">{skill_match_percentage}%</p>
                                </div>
                                <div className="p-4 bg-white dark:bg-accent rounded-xl border border-gray-200 dark:border-border text-center">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Industry Demand</p>
                                    <p className="text-2xl font-bold capitalize text-gray-900 dark:text-foreground">{industry_demand || 'Stable'}</p>
                                </div>
                                <div className="p-4 bg-white dark:bg-accent rounded-xl border border-gray-200 dark:border-border text-center col-span-2 md:col-span-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Time to Job Ready</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-foreground">{time_to_job_ready || 'TBD'}</p>
                                </div>
                            </div>

                            {/* Alternative Careers */}
                            {alternatives.length > 0 && (
                                <div className="p-6 bg-gray-50 dark:bg-accent/50 rounded-xl border border-gray-200 dark:border-border">
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-foreground">Alternative Career Paths</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {alternatives.map((alt, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 bg-white dark:bg-card rounded-lg border border-gray-200 dark:border-border hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900 dark:text-foreground mb-1">
                                                            {alt.career}
                                                        </h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {alt.reason}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Match</p>
                                                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                            {alt.match_score}%
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Next Steps CTA */}
                            <div className="p-6 bg-secondary/50 border border-border rounded-2xl">
                                <h3 className="font-bold text-base text-foreground mb-1 font-serif italic">Ready to Start Your Journey?</h3>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Your personalized learning roadmap is designed to help you achieve your career goals efficiently.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-all"
                                >
                                    View My Roadmap
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DecisionInsightsModal;
