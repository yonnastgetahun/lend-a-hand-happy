import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, User, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Contact {
  id: string;
  name: string;
  email?: string;
}

const mockContacts: Contact[] = [
  { id: "1", name: "Sarah Chen", email: "sarah@example.com" },
  { id: "2", name: "Marcus Johnson", email: "marcus@example.com" },
  { id: "3", name: "Emma Davis", email: "emma@example.com" },
  { id: "4", name: "Alex Rivera", email: "alex@example.com" },
  { id: "5", name: "Jordan Kim", email: "jordan@example.com" },
  { id: "6", name: "Taylor Smith", email: "taylor@example.com" },
  { id: "7", name: "Casey Lee", email: "casey@example.com" },
  { id: "8", name: "Morgan Brown", email: "morgan@example.com" },
];

export default function SelectContact() {
  const navigate = useNavigate();
  const location = useLocation();
  const item = location.state?.item;
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const filteredContacts = mockContacts.filter((contact) =>
    contact.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleContinue = () => {
    if (selectedContact && item) {
      navigate("/set-reminder", {
        state: { item, contact: selectedContact },
      });
    }
  };

  if (!item) {
    navigate("/add-item");
    return null;
  }

  return (
    <div className="min-h-screen bg-warm-white">
      <header className="bg-cream border-b border-border">
        <div className="container px-6 py-4">
          <h1 className="text-xl font-serif text-foreground">Select Contact</h1>
        </div>
      </header>

      <main className="container px-6 py-6 max-w-lg mx-auto">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-light" />
          <Input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-cream border-border"
          />
        </div>

        <div className="space-y-2">
          {filteredContacts.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => setSelectedContact(contact)}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                selectedContact?.id === contact.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-cream"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{contact.name}</p>
                {contact.email && (
                  <p className="text-sm text-earth-light">{contact.email}</p>
                )}
              </div>
              {selectedContact?.id === contact.id && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}

          {filteredContacts.length === 0 && (
            <div className="text-center py-12 text-earth-light">
              <p>No contacts found</p>
            </div>
          )}
        </div>

        <div className="mt-8">
          <Button
            onClick={handleContinue}
            disabled={!selectedContact}
            className="w-full bg-primary hover:bg-primary-dark text-primary-foreground disabled:opacity-50"
          >
            Continue
          </Button>
        </div>
      </main>
    </div>
  );
}
