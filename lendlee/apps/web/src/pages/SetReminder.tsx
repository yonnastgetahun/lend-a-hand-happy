import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format, addDays } from "date-fns";
import { Calendar, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface Item {
  title: string;
  category: string;
  photo?: string;
}

interface Contact {
  id: string;
  name: string;
}

const quickDates = [
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
];

export default function SetReminder() {
  const navigate = useNavigate();
  const location = useLocation();
  const item = location.state?.item as Item | undefined;
  const contact = location.state?.contact as Contact | undefined;
  const [reminderDate, setReminderDate] = useState<Date | undefined>(
    addDays(new Date(), 14)
  );
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      // TODO: Save loan to backend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to create loan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to skip:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!item || !contact) {
    navigate("/add-item");
    return null;
  }

  return (
    <div className="min-h-screen bg-warm-white">
      <header className="bg-cream border-b border-border">
        <div className="container px-6 py-4">
          <h1 className="text-xl font-serif text-foreground">Set Reminder</h1>
        </div>
      </header>

      <main className="container px-6 py-6 max-w-lg mx-auto">
        <div className="mb-6 p-4 rounded-xl bg-cream border border-border">
          <p className="text-sm text-earth-light mb-1">Lending to</p>
          <p className="font-medium text-foreground">{contact.name}</p>
          <p className="text-sm text-earth-light mt-2 mb-1">Item</p>
          <p className="font-medium text-foreground">{item.title}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-serif text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            When would you like a reminder?
          </h2>

          <div className="mb-4">
            <p className="text-sm text-earth-light mb-3">Quick select</p>
            <div className="flex flex-wrap gap-2">
              {quickDates.map((qd) => (
                <button
                  key={qd.days}
                  type="button"
                  onClick={() => setReminderDate(addDays(new Date(), qd.days))}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    reminderDate &&
                    format(reminderDate, "yyyy-MM-dd") ===
                      format(addDays(new Date(), qd.days), "yyyy-MM-dd")
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-earth"
                  }`}
                >
                  {qd.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-earth-light mb-3">Or pick a date</p>
            <div className="p-4 rounded-xl border border-border bg-cream">
              <CalendarComponent
                mode="single"
                selected={reminderDate}
                onSelect={setReminderDate}
                fromDate={new Date()}
                className="w-full"
              />
            </div>
          </div>

          {reminderDate && (
            <p className="mt-4 text-center text-sm text-earth-light">
              Reminder set for{" "}
              <span className="font-medium text-foreground">
                {format(reminderDate, "MMMM d, yyyy")}
              </span>
            </p>
          )}
        </div>

        <div className="space-y-3 mt-8">
          <Button
            onClick={handleComplete}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            {loading ? "Saving..." : "Lend Item"}
          </Button>

          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={loading}
            className="w-full text-earth-light hover:text-earth"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Skip reminder
          </Button>
        </div>
      </main>
    </div>
  );
}
