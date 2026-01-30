import { useState } from "react";
import { ArrowLeft, Phone, Mail, MessageSquare, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const ContactSupport = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            toast.error("Please enter a message");
            return;
        }

        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast.success("Message sent! Support team will contact you shortly.");
        setMessage("");
        setIsSubmitting(false);
    };

    return (
        <div className="mobile-container min-h-screen bg-muted pb-8">
            <div className="sticky top-0 bg-background z-10 px-6 py-4 border-b border-border flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                    <ArrowLeft size={24} className="text-foreground" />
                </button>
                <h1 className="text-xl font-bold text-foreground">Help & Support</h1>
            </div>

            <div className="px-6 py-6 space-y-8">
                {/* Official Channels */}
                <div className="grid grid-cols-2 gap-4">
                    <a href="tel:1913" className="card-elevated flex flex-col items-center justify-center p-6 gap-3 active:scale-95 transition-transform">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <Phone size={24} />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Toll Free</p>
                            <p className="text-lg font-bold text-foreground">1913</p>
                        </div>
                    </a>

                    <a href="mailto:support@civiclens.gov.in" className="card-elevated flex flex-col items-center justify-center p-6 gap-3 active:scale-95 transition-transform">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <Mail size={24} />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Email Us</p>
                            <p className="text-sm font-bold text-foreground truncate w-full max-w-[120px]">support@civiclens.gov.in</p>
                        </div>
                    </a>
                </div>

                {/* FAQ Link (Placeholder) */}
                <div className="bg-muted/50 rounded-2xl p-4 flex items-center gap-4">
                    <MessageSquare className="text-primary" size={24} />
                    <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Frequently Asked Questions</h3>
                        <p className="text-xs text-muted-foreground">Find answers to common issues instantly.</p>
                    </div>
                    <button className="text-primary text-sm font-bold bg-background px-3 py-1.5 rounded-lg border border-border">
                        View FAQs
                    </button>
                </div>

                {/* Feedback Form */}
                <div>
                    <h2 className="text-lg font-bold text-foreground mb-4">Send us a Message</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe your issue or suggestion..."
                            className="input-field min-h-[150px] resize-none p-4"
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`btn-primary w-full flex items-center justify-center gap-2 ${isSubmitting ? "opacity-70" : ""}`}
                        >
                            {isSubmitting ? "Sending..." : (
                                <>
                                    <Send size={18} />
                                    Send Message
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center pt-8 text-xs text-muted-foreground">
                    <p>CivicLens v1.0.2</p>
                    <p>Powered by Smart City Initiative</p>
                </div>
            </div>
        </div>
    );
};

export default ContactSupport;
