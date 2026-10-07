"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, ScanLine, Users, Settings, Printer, LogOut, CheckCircle2, Search, Download, AlertTriangle, XCircle, Lock, Unlock, Trash2, Plus, Mail, Send } from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';
import { QRCodeSVG } from 'qrcode.react';

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  won_prize: string;
  used: boolean;
  created_at: string;
  is_validated?: boolean;
};

type Promo = {
  id: number;
  text_content: string;
  probability?: number;
  color?: string;
  isLost?: boolean;
  condition?: string;
};

const DEFAULT_COLORS = ["#00F0FF", "#1a1f3a", "#FF006E", "#0A0E27", "#5FF4FF", "#1a1f3a"];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pwd, setPwd] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [manualSearchQuery, setManualSearchQuery] = useState("");

  const [clients, setClients] = useState<Client[]>([]);
  const [promotions, setPromotions] = useState<Promo[]>([]);
  const [lockedFields, setLockedFields] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPromos, setIsSavingPromos] = useState(false);

  const [scanStatus, setScanStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [scanMessage, setScanMessage] = useState("");
  const [scannedClient, setScannedClient] = useState<Client | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  
  const [isManualPromoOpen, setIsManualPromoOpen] = useState(false);
  const [manualPromoStep, setManualPromoStep] = useState(1);
  const [isSendingManualPromo, setIsSendingManualPromo] = useState(false);
  const [manualPromoType, setManualPromoType] = useState<"existing" | "new">("existing");
  const [manualPromoClientId, setManualPromoClientId] = useState<string>("");
  const [manualPromoClientSearch, setManualPromoClientSearch] = useState<string>("");
  const [manualPromoNewClient, setManualPromoNewClient] = useState({ firstName: "", lastName: "", email: "" });
  const [manualPromoPrizeType, setManualPromoPrizeType] = useState<"wheel" | "custom">("wheel");
  const [manualPromoSelectedPrize, setManualPromoSelectedPrize] = useState<string>("");
  const [manualPromoCustomPrize, setManualPromoCustomPrize] = useState<string>("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  };

  const handleProbabilityChange = (idx: number, newValueStr: string) => {
    let newValue = parseFloat(newValueStr);
    if (isNaN(newValue) || newValue < 0) newValue = 0;

    const newPromos = [...promotions];
    const changedPromoId = newPromos[idx].id;
    
    newPromos[idx].probability = newValue;
    const newLockedFields = { ...lockedFields, [changedPromoId]: true };
    
    recalculateProbabilities(newLockedFields, newPromos, idx);
  };

  const toggleLock = (idx: number) => {
    const promoId = promotions[idx].id;
    const newLockedFields = { ...lockedFields };
    
    if (newLockedFields[promoId]) {
      newLockedFields[promoId] = false;
      setLockedFields(newLockedFields);
      recalculateProbabilities(newLockedFields, [...promotions]);
    } else {
      newLockedFields[promoId] = true;
      setLockedFields(newLockedFields);
    }
  };

  const removePromotion = (idx: number) => {
    if (promotions.length <= 2) {
      showToast("Il faut au moins 2 promotions sur la roue.", "error");
      return;
    }
    const newPromos = [...promotions];
    newPromos.splice(idx, 1);
    recalculateProbabilities(lockedFields, newPromos);
  };

  const addPromotion = () => {
    if (promotions.length >= 6) {
      showToast("Maximum 6 promotions autorisées.", "error");
      return;
    }
    const newPromos = [...promotions];
    const newId = Math.max(0, ...newPromos.map(p => p.id)) + 1;
    newPromos.push({
      id: newId,
      text_content: `Promotion ${newId}`,
      probability: 0,
      color: DEFAULT_COLORS[(newPromos.length) % DEFAULT_COLORS.length],
      isLost: false,
      condition: ''
    });
    recalculateProbabilities(lockedFields, newPromos);
  };

  const recalculateProbabilities = (currentLocked: Record<number, boolean>, promos: Promo[], changedIdx?: number) => {
    let lockedSum = 0;
    const unlockedIndices: number[] = [];
    
    promos.forEach((p, i) => {
      if (currentLocked[p.id]) {
        lockedSum += (p.probability || 0);
      } else {
        unlockedIndices.push(i);
      }
    });

    if (lockedSum > 100 && changedIdx !== undefined) {
      const excess = lockedSum - 100;
      promos[changedIdx].probability = Math.max(0, Number(((promos[changedIdx].probability || 0) - excess).toFixed(2)));
      lockedSum = 100;
    }

    if (unlockedIndices.length === 0 && lockedSum !== 100) {
      const otherIdx = promos.findIndex((_, i) => i !== changedIdx);
      if (otherIdx !== -1) {
        currentLocked[promos[otherIdx].id] = false;
        unlockedIndices.push(otherIdx);
        lockedSum -= (promos[otherIdx].probability || 0);
      }
    }

    const remaining = 100 - lockedSum;
    
    if (unlockedIndices.length > 0) {
      const share = Number((remaining / unlockedIndices.length).toFixed(2));
      let distributed = 0;
      unlockedIndices.forEach((unlockedIdx, i) => {
        if (i === unlockedIndices.length - 1) {
          promos[unlockedIdx].probability = Number((remaining - distributed).toFixed(2));
        } else {
          promos[unlockedIdx].probability = share;
          distributed += share;
        }
      });
    }
    
    setLockedFields(currentLocked);
    setPromotions(promos);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      if (res.ok) {
        setIsAuthenticated(true);
        fetchData();
      } else {
        alert("Mot de passe incorrect");
      }
    } catch (error) {
      alert("Erreur de connexion au serveur.");
    }
    setIsLoggingIn(false);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [clientsRes, promosRes] = await Promise.all([
        fetch('/api/admin/clients'),
        fetch('/api/promotions')
      ]);
      const clientsData = await clientsRes.json();
      const promosData = await promosRes.json();

      if (clientsData.clients) setClients(clientsData.clients);
      if (promosData.promotions) {
        let loadedPromos = promosData.promotions.map((p: any, index: number) => ({
          ...p,
          probability: p.probability !== undefined && p.probability !== null 
            ? Number(p.probability) 
            : Number((100 / promosData.promotions.length).toFixed(2)),
          color: p.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
          isLost: !!p.isLost,
          condition: p.condition || ''
        }));
        
        if (loadedPromos.length === 0) {
          loadedPromos = Array.from({ length: 6 }).map((_, i) => ({
            id: i + 1,
            text_content: `Promotion ${i + 1}`,
            probability: Number((100 / 6).toFixed(2)),
            color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
            isLost: false,
            condition: ''
          }));
        }

        const sum = loadedPromos.reduce((a: number, p: any) => a + p.probability, 0);
        if (loadedPromos.length > 0 && Math.abs(sum - 100) > 0.01) {
          loadedPromos[loadedPromos.length - 1].probability += Number((100 - sum).toFixed(2));
          loadedPromos[loadedPromos.length - 1].probability = Number(loadedPromos[loadedPromos.length - 1].probability.toFixed(2));
        }
        
        loadedPromos = loadedPromos.map((p: any) => ({ ...p, probability: Math.max(0, p.probability) }));
        
        setPromotions(loadedPromos);
        setLockedFields({});
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleScan = async (text: string) => {
    if (scanStatus === "loading") return;
    setScanStatus("loading");
    setScanMessage("");
    setScannedClient(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: text })
      });
      const data = await res.json();

      if (res.ok) {
        setScanStatus("success");
        setScanMessage("PROMOTION VALIDÉE !");
        setScannedClient(data.client);
        fetchData();
      } else {
        setScanStatus("error");
        setScanMessage(data.error);
      }
    } catch (error) {
      setScanStatus("error");
      setScanMessage("Erreur de connexion lors du scan.");
    }
    
    setTimeout(() => {
      setScanStatus("idle");
    }, 5000);
  };

  const handleRevoke = (clientId: string) => {
    showConfirm("Voulez-vous vraiment annuler cette offre ? Le client pourra ainsi rejouer.", async () => {
      try {
        const res = await fetch('/api/admin/clients/revoke', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId })
        });
        if (res.ok) {
          fetchData();
          showToast("Offre annulée avec succès !", "success");
        } else {
          showToast("Erreur lors de l'annulation.", "error");
        }
      } catch (error) {
        console.error(error);
        showToast("Erreur de connexion.", "error");
      }
    });
  };

  const handleDeleteClient = (clientId: string) => {
    showConfirm("Voulez-vous vraiment supprimer définitivement ce client de l'historique ?", async () => {
      try {
        const res = await fetch(`/api/admin/clients?clientId=${clientId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchData(); 
          showToast("Client supprimé avec succès !", "success");
        } else {
          showToast("Erreur lors de la suppression.", "error");
        }
      } catch (error) {
        showToast("Erreur de connexion.", "error");
      }
    });
  };

  const handleSendManualPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingManualPromo(true);

    try {
      let clientData = { firstName: "", lastName: "", email: "" };
      
      if (manualPromoType === "existing") {
        const client = clients.find(c => c.id === manualPromoClientId);
        if (!client) {
          showToast("Veuillez sélectionner un client.", "error");
          setIsSendingManualPromo(false);
          return;
        }
        clientData = { firstName: client.first_name, lastName: client.last_name, email: client.email };
      } else {
        if (!manualPromoNewClient.firstName || !manualPromoNewClient.lastName || !manualPromoNewClient.email) {
          showToast("Veuillez remplir tous les champs du client.", "error");
          setIsSendingManualPromo(false);
          return;
        }
        clientData = manualPromoNewClient;
      }

      const prize = manualPromoPrizeType === "wheel" ? manualPromoSelectedPrize : manualPromoCustomPrize;
      if (!prize) {
        showToast("Veuillez choisir ou saisir une promotion.", "error");
        setIsSendingManualPromo(false);
        return;
      }

      const matchedPromo = promotions.find(p => p.text_content === prize);
      const condition = manualPromoPrizeType === "wheel" ? (matchedPromo?.condition || "") : "";

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          email: clientData.email,
          wonPrize: prize,
          condition: condition,
          isAdmin: true
        })
      });

      if (res.ok) {
        showToast("Promotion envoyée avec succès !", "success");
        setIsManualPromoOpen(false);
        fetchData();
        setManualPromoNewClient({ firstName: "", lastName: "", email: "" });
        setManualPromoCustomPrize("");
      } else {
        showToast("Erreur lors de l'envoi.", "error");
      }
    } catch (error) {
      showToast("Erreur de connexion.", "error");
    }

    setIsSendingManualPromo(false);
  };

  const handleDeleteAllClients = () => {
    if (clients.length === 0) return showToast("L'historique est déjà vide.", "error");
    showConfirm("ATTENTION : Voulez-vous vraiment vider TOUT l'historique des clients ? Cette action est irréversible.", async () => {
      try {
        const res = await fetch('/api/admin/clients', {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchData(); 
          showToast("L'historique complet a été supprimé !", "success");
        } else {
          showToast("Erreur lors de la suppression globale.", "error");
        }
      } catch (error) {
        showToast("Erreur de connexion.", "error");
      }
    });
  };

  const handleValidateAndSend = (client: Client) => {
    const isFirstTime = !client.is_validated;
    const msg = isFirstTime 
      ? `Valider le lot de ${client.first_name} et lui envoyer son QR code par email ?`
      : `Renvoyer l'email avec le QR code à ${client.email} ?`;

    const matchedPromo = promotions.find(p => p.text_content === client.won_prize);
    const condition = matchedPromo?.condition || "";

    showConfirm(msg, async () => {
      try {
        const res = await fetch('/api/admin/resend-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: client.id,
            firstName: client.first_name,
            lastName: client.last_name,
            email: client.email,
            wonPrize: client.won_prize,
            condition: condition
          })
        });
        
        const data = await res.json();
        if (res.ok) {
          showToast(isFirstTime ? "Validé et envoyé !" : "Email renvoyé avec succès !", "success");
          fetchData();
        } else {
          showToast(data.error || "Erreur.", "error");
        }
      } catch (error) {
        console.error(error);
        showToast("Erreur serveur.", "error");
      }
    });
  };

  const handleSavePromotions = async () => {
    setIsSavingPromos(true);
    try {
      const res = await fetch('/api/promotions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promotions })
      });
      if (res.ok) {
        showToast("Promotions sauvegardées avec succès !", "success");
      } else {
        showToast("Erreur lors de la sauvegarde.", "error");
      }
    } catch (error) {
      showToast("Erreur serveur.", "error");
    }
    setIsSavingPromos(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl w-full max-w-sm border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Administration</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              type="password" 
              placeholder="Mot de passe d'accès" 
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              required
              className="w-full bg-[#0A0E27]/50 border border-white/20 rounded-xl p-4 text-white focus:outline-none focus:border-[#00F0FF]"
            />
            <button disabled={isLoggingIn} type="submit" className="w-full py-4 rounded-xl font-bold text-[#0A0E27] bg-[#00F0FF] hover:bg-white transition-colors disabled:opacity-50">
              {isLoggingIn ? "Connexion..." : "Se Connecter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalClients = clients.length;
  const usedPromos = clients.filter(c => c.used && !c.won_prize.includes("ANNULÉE")).length;
  const conversionRate = totalClients > 0 ? Math.round((usedPromos / totalClients) * 100) : 0;

  const today = new Date().toLocaleDateString('fr-FR');
  const todayPlayers = clients.filter(c => new Date(c.created_at).toLocaleDateString('fr-FR') === today).length;
  const pendingPromos = clients.filter(c => !c.used && !c.won_prize.includes("ANNULÉE")).length;
  const cancelledPromos = clients.filter(c => c.won_prize.includes("ANNULÉE")).length;

  const prizeCounts: Record<string, number> = {};
  clients.forEach(c => {
    if (!c.won_prize.includes("ANNULÉE")) {
      prizeCounts[c.won_prize] = (prizeCounts[c.won_prize] || 0) + 1;
    }
  });
  let mostWonPrize = "Aucun";
  let maxCount = 0;
  for (const [prize, count] of Object.entries(prizeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostWonPrize = prize;
    }
  }

  const filteredClients = clients.filter(c => 
    c.first_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050814] text-white flex flex-col md:flex-row relative pb-20 md:pb-0">
      
      {/* 📱 TOP HEADER (Mobile Only) */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[#0A0E27] border-b border-white/5 sticky top-0 z-50">
        <h1 className="text-xl font-[family-name:var(--font-orbitron)] font-black">
          <span className="text-white">CLEAN</span> <span className="text-[#00F0FF] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">WASH</span> <span className="font-normal text-white">& CO</span>
        </h1>
        <button onClick={() => setIsAuthenticated(false)} className="text-gray-400 hover:text-white p-2">
          <LogOut size={20} />
        </button>
      </header>

      {/* 💻 SIDEBAR (Desktop Only) */}
      <aside className="hidden md:flex w-64 bg-[#0A0E27] border-r border-white/5 flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-2xl font-[family-name:var(--font-orbitron)] font-black">
            <span className="text-white">CLEAN</span> <span className="text-[#00F0FF] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">WASH</span> <span className="font-normal text-white">& CO</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Admin Dashboard</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarButton icon={<LayoutDashboard />} label="Tableau de bord" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
          <SidebarButton icon={<ScanLine />} label="Scanner QR Code" active={activeTab === "scanner"} onClick={() => setActiveTab("scanner")} />
          <SidebarButton icon={<Users />} label="Liste des Clients" active={activeTab === "clients"} onClick={() => setActiveTab("clients")} />
          <SidebarButton icon={<Settings />} label="Gérer la Roulette" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
          <SidebarButton icon={<Printer />} label="Imprimer l'Affiche" active={activeTab === "print"} onClick={() => setActiveTab("print")} />
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-3 text-gray-400 hover:text-white w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
            <LogOut size={18} />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* 📱 BOTTOM NAVIGATION (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0E27]/90 backdrop-blur-xl border-t border-white/10 z-50 flex justify-around items-center p-2 pb-safe">
        <BottomNavButton icon={<LayoutDashboard size={22} />} label="Stats" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
        <BottomNavButton icon={<ScanLine size={24} />} label="Scanner" active={activeTab === "scanner"} onClick={() => setActiveTab("scanner")} isScanner />
        <BottomNavButton icon={<Users size={22} />} label="Clients" active={activeTab === "clients"} onClick={() => setActiveTab("clients")} />
        <BottomNavButton icon={<Settings size={22} />} label="Réglages" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
      </nav>

      {/* 📌 MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 w-full overflow-y-auto">
        
        {/* TAB: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Tableau de bord</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <StatCard title="Joueurs Totaux" value={totalClients.toString()} color="#00F0FF" />
              <StatCard title="Joueurs Aujourd'hui" value={todayPlayers.toString()} color="#5FF4FF" />
              <StatCard title="Promos Utilisées" value={usedPromos.toString()} color="#FF006E" />
              <StatCard title="Taux de Retour" value={`${conversionRate}%`} color="#FFBE0B" />
              
              <StatCard title="En Attente" value={pendingPromos.toString()} color="#f97316" />
              <StatCard title="Promos Annulées" value={cancelledPromos.toString()} color="#ef4444" />
              <div className="col-span-2">
                <StatCard title="Lot le plus gagné" value={mostWonPrize} color="#a855f7" />
              </div>
            </div>

            <div className="bg-[#0A0E27] rounded-3xl p-5 md:p-6 border border-white/5 mt-8 shadow-xl">
              <h3 className="font-bold mb-4">Derniers joueurs récents</h3>
              <div className="space-y-3">
                {isLoading ? (
                  <p className="text-gray-500 text-sm">Chargement...</p>
                ) : clients.slice(0, 5).map(c => (
                  <div key={c.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                      <p className="font-bold">{c.first_name} {c.last_name}</p>
                      <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString('fr-FR')}</p>
                    </div>
                    <span className="text-[#00F0FF] text-xs font-black bg-[#00F0FF]/10 border border-[#00F0FF]/20 px-3 py-1.5 rounded-full inline-block text-center">
                      {c.won_prize}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: SCANNER */}
        {activeTab === "scanner" && (
          <div className="space-y-4 max-w-xl mx-auto flex flex-col justify-center min-h-[70vh]">
            <h2 className="text-2xl font-bold text-center">Scanner au comptoir</h2>
            
            {scanStatus === "idle" && (
              <div className="flex flex-col gap-6">
                <div className="bg-[#0A0E27] p-2 md:p-4 rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden aspect-square max-w-[400px] w-full mx-auto flex items-center justify-center relative">
                  <div className="absolute inset-4 border-2 border-dashed border-[#00F0FF]/50 rounded-3xl pointer-events-none z-10" />
                  <Scanner 
                    onScan={(result) => {
                      if (result && result.length > 0) {
                        handleScan(result[0].rawValue);
                      }
                    }} 
                    onError={(error) => console.log(error?.message)}
                  />
                </div>
                
                <div className="bg-[#0A0E27] p-6 rounded-3xl border border-white/10">
                  <p className="text-sm text-gray-400 mb-4 text-center">Rechercher un client (Nom, Email, ID) :</p>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Taper pour chercher..."
                      value={manualSearchQuery}
                      onChange={(e) => setManualSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#00F0FF] text-white"
                    />
                  </div>

                  {manualSearchQuery.length > 1 && (
                    <div className="mt-2 max-h-48 overflow-y-auto bg-white/5 border border-white/10 rounded-xl divide-y divide-white/5 scrollbar-thin">
                      {clients.filter(c => 
                        c.first_name.toLowerCase().includes(manualSearchQuery.toLowerCase()) || 
                        c.last_name.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
                        c.email.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
                        c.id.includes(manualSearchQuery)
                      ).map(client => (
                        <button 
                          key={client.id}
                          onClick={() => {
                            setManualSearchQuery("");
                            handleScan(client.id);
                          }}
                          className="w-full text-left p-3 hover:bg-white/10 transition-colors flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold text-white text-sm">{client.first_name} {client.last_name}</p>
                            <p className="text-xs text-gray-400">{client.email}</p>
                          </div>
                          {client.used ? (
                            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold border border-green-500/20">Utilisé</span>
                          ) : (
                            <span className="text-[10px] bg-[#00F0FF]/20 text-[#00F0FF] px-2 py-1 rounded-full font-bold border border-[#00F0FF]/20">Valider</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {scanStatus === "loading" && (
              <div className="bg-[#0A0E27] rounded-[2rem] aspect-square flex items-center justify-center border border-white/10">
                <div className="w-16 h-16 border-4 border-[#00F0FF] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {scanStatus === "success" && scannedClient && (
              <div className="bg-green-500/10 border-2 border-green-500 p-8 rounded-[2rem] flex flex-col items-center justify-center aspect-square text-center animate-in fade-in zoom-in duration-300 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                <CheckCircle2 size={80} className="text-green-500 mb-6" />
                <h3 className="text-3xl font-black text-green-400 mb-2">VALIDÉ !</h3>
                <p className="text-xl font-bold text-white mt-4">{scannedClient.first_name} {scannedClient.last_name}</p>
                <div className="mt-6 bg-[#0A0E27] text-[#00F0FF] px-6 py-4 rounded-xl font-black text-xl border border-[#00F0FF]/30">
                  {scannedClient.won_prize}
                </div>
                <button onClick={() => setScanStatus("idle")} className="mt-8 bg-green-500 text-[#0A0E27] px-8 py-3 rounded-full font-bold w-full max-w-[250px]">
                  Scanner le suivant
                </button>
              </div>
            )}

            {scanStatus === "error" && (
              <div className="bg-red-500/10 border-2 border-red-500 p-8 rounded-[2rem] flex flex-col items-center justify-center aspect-square text-center animate-in fade-in zoom-in duration-300 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                <AlertTriangle size={80} className="text-red-500 mb-6" />
                <h3 className="text-2xl font-black text-red-500 mb-4 uppercase">Refusé</h3>
                <p className="text-lg font-bold text-white mb-2">{scanMessage}</p>
                <button onClick={() => setScanStatus("idle")} className="mt-8 bg-white text-red-500 px-8 py-3 rounded-full font-bold w-full max-w-[250px]">
                  Réessayer
                </button>
              </div>
            )}

            {scanStatus === "idle" && (
              <p className="text-center text-sm text-gray-400 mt-2 px-4">
                Pointez la caméra vers le QR Code reçu par le client.
              </p>
            )}
          </div>
        )}

        {/* TAB: CLIENTS */}
        {activeTab === "clients" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Base de données Clients</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  onClick={() => setIsManualPromoOpen(true)}
                  className="flex items-center justify-center gap-2 bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] px-4 py-3 rounded-xl transition-colors text-sm w-full sm:w-auto font-bold border border-[#00F0FF]/20"
                >
                  <Send size={16} /> Envoyer une Promo
                </button>
                <button 
                  onClick={handleDeleteAllClients}
                  className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-3 rounded-xl transition-colors text-sm w-full sm:w-auto font-bold border border-red-500/20"
                >
                  <Trash2 size={16} /> Tout Nettoyer
                </button>
                <button className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-colors text-sm w-full sm:w-auto font-medium">
                  <Download size={16} /> Exporter CSV
                </button>
              </div>
            </div>

            <div className="bg-[#0A0E27] rounded-3xl border border-white/5 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Recherche (nom, email)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#050814] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white/5 text-gray-400">
                    <tr>
                      <th className="p-4 font-medium">Client</th>
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium">Promotion</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredClients.map(c => (
                      <tr key={c.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold">{c.first_name} {c.last_name}</td>
                        <td className="p-4 text-gray-400">{c.email}</td>
                        <td className={`p-4 font-medium ${c.won_prize.includes("ANNULÉE") ? 'text-red-400 line-through' : 'text-[#00F0FF]'}`}>
                          {c.won_prize}
                        </td>
                        <td className="p-4 text-gray-500">{new Date(c.created_at).toLocaleString('fr-FR')}</td>
                        <td className="p-4 flex items-center gap-2">
                          {!c.is_validated && !c.won_prize.includes("ANNULÉE") ? (
                            <button 
                              onClick={() => handleValidateAndSend(c)}
                              className="bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1.5 rounded-md text-xs font-bold border border-green-500/30 transition-colors flex items-center gap-2"
                            >
                              <Send size={14} /> VALIDER & ENVOYER
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleValidateAndSend(c)}
                              title="Renvoyer l'email"
                              className="text-[#00F0FF] hover:text-white p-1 bg-[#00F0FF]/10 hover:bg-[#00F0FF]/30 rounded-md transition-colors"
                            >
                              <Mail size={16} />
                            </button>
                          )}
                          {c.used ? (
                            <span className="inline-flex items-center gap-1 text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-1 rounded-md text-xs font-bold">
                              <CheckCircle2 size={12} /> UTILISÉ
                            </span>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-1 rounded-md text-xs font-bold">
                                {c.is_validated ? 'EN ATTENTE' : 'NON VALIDÉ'}
                              </span>
                              <button 
                                onClick={() => handleRevoke(c.id)}
                                title="Annuler l'offre et autoriser le client à rejouer"
                                className="text-gray-400 hover:text-orange-400 p-1 bg-white/5 hover:bg-orange-400/10 rounded-md transition-colors"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => handleDeleteClient(c.id)}
                            title="Supprimer l'historique"
                            className="text-gray-500 hover:text-red-400 p-1 ml-2 bg-white/5 hover:bg-red-400/10 rounded-md transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredClients.length === 0 && !isLoading && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">Aucun client trouvé.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-white/5">
                {filteredClients.map(c => (
                  <div key={c.id} className="p-5 space-y-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-lg text-white">{c.first_name} {c.last_name}</p>
                        <p className="text-sm text-gray-400">{c.email}</p>
                      </div>
                      <div className="flex items-center">
                        {c.used ? (
                          <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-3 py-1 rounded-full text-xs font-bold border border-green-400/20">
                            <CheckCircle2 size={14}/> Utilisé
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full text-xs font-bold border border-orange-400/20">
                            En attente
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 mb-4 text-center">
                      <p className={`font-bold ${c.won_prize.includes("ANNULÉE") ? 'text-red-400 line-through' : 'text-[#00F0FF]'}`}>
                        {c.won_prize}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Le {new Date(c.created_at).toLocaleDateString('fr-FR')} à {new Date(c.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!c.is_validated && !c.won_prize.includes("ANNULÉE") ? (
                        <button 
                          onClick={() => handleValidateAndSend(c)}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 py-3 rounded-xl font-bold transition-colors border border-green-500/30 text-sm"
                        >
                          <Send size={16} /> VALIDER & ENVOYER
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleValidateAndSend(c)}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-3 rounded-xl font-semibold transition-colors border border-blue-500/20 text-sm"
                        >
                          <Mail size={16} /> Renvoyer Email
                        </button>
                      )}
                      
                      {!c.used && (
                        <button 
                          onClick={() => handleRevoke(c.id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 py-3 rounded-xl font-semibold transition-colors border border-orange-500/20 text-sm"
                        >
                          <XCircle size={16} /> Annuler
                        </button>
                      )}

                      <button 
                        onClick={() => handleDeleteClient(c.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl font-semibold transition-colors border border-red-500/20 text-sm"
                      >
                        <Trash2 size={16} /> Supprimer
                      </button>
                    </div>
                  </div>
                ))}
                {filteredClients.length === 0 && !isLoading && (
                  <div className="p-8 text-center text-gray-500">
                    Aucun client trouvé.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-3xl mx-auto pb-20 md:pb-0">
            <h2 className="text-2xl font-bold">Configuration de la Roulette</h2>
            <div className="bg-[#0A0E27] p-4 md:p-8 rounded-3xl border border-white/5 shadow-2xl">
              <div className="flex items-start gap-4 mb-8 bg-[#00F0FF]/5 p-4 rounded-2xl border border-[#00F0FF]/10">
                <Settings className="text-[#00F0FF] flex-shrink-0 mt-1" size={24} />
                <p className="text-gray-300 text-sm leading-relaxed">
                  Modifiez les lots de la roue et leurs probabilités. 
                  Verrouillez un pourcentage (<Lock size={14} className="inline text-[#00F0FF] mx-1" />) pour le fixer, les autres s'ajusteront automatiquement pour atteindre 100%. 
                  Les changements s'appliquent immédiatement sur le jeu public après sauvegarde.
                </p>
              </div>
              
              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-center text-gray-500 py-8 animate-pulse">Chargement des promotions...</p>
                ) : promotions.map((promo, idx) => (
                  <div key={promo.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-[#050814] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all shadow-lg group">
                    <div className="w-full sm:flex-1">
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-[#00F0FF] font-black text-sm border border-white/10 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                          {idx + 1}
                        </span>
                        <input 
                          type="text" 
                          value={promo.text_content}
                          onChange={(e) => {
                            const newPromos = [...promotions];
                            newPromos[idx].text_content = e.target.value;
                            setPromotions(newPromos);
                          }}
                          placeholder="Nom du lot..."
                          className="w-full bg-transparent border-none px-2 py-2 text-base md:text-lg focus:outline-none focus:ring-0 text-white font-semibold placeholder:text-gray-600"
                        />
                      </div>
                      
                      {((promo.condition && promo.condition.length > 0) || (promo as any).showCondition) ? (
                        <div className="mt-2 pl-11 pr-2">
                          <input
                            type="text"
                            value={promo.condition || ''}
                            onChange={(e) => {
                              const newPromos = [...promotions];
                              newPromos[idx].condition = e.target.value;
                              setPromotions(newPromos);
                            }}
                            placeholder="Condition d'utilisation (ex: Valable 1 mois)..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#00F0FF]"
                          />
                        </div>
                      ) : (
                        !promo.isLost && (
                          <div className="mt-2 pl-11">
                            <button
                              onClick={() => {
                                const newPromos = [...promotions];
                                (newPromos[idx] as any).showCondition = true;
                                setPromotions(newPromos);
                              }}
                              className="text-xs text-[#00F0FF] opacity-70 hover:opacity-100 transition-opacity"
                            >
                              + Ajouter une condition
                            </button>
                          </div>
                        )
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5 sm:border-l sm:pl-4">
                      
                      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white mr-2">
                        <input
                          type="checkbox"
                          checked={!!promo.isLost}
                          onChange={(e) => {
                            const newPromos = [...promotions];
                            newPromos[idx].isLost = e.target.checked;
                            if (e.target.checked && newPromos[idx].text_content.startsWith("Promotion")) {
                              newPromos[idx].text_content = "PERDU";
                            }
                            setPromotions(newPromos);
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#FF006E] focus:ring-[#FF006E] focus:ring-offset-0 cursor-pointer"
                        />
                        <span title="Si coché, le client ne gagne rien">Perdu</span>
                      </label>

                      <div className="flex items-center bg-white/5 px-4 py-2 rounded-xl border border-white/10 focus-within:border-[#00F0FF]/50 transition-colors">
                        <input 
                          type="number"
                          step="0.01"
                          value={promo.probability}
                          onChange={(e) => handleProbabilityChange(idx, e.target.value)}
                          className="w-16 bg-transparent border-none text-right text-white font-bold focus:outline-none"
                        />
                        <span className="text-[#00F0FF] font-black ml-2">%</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => toggleLock(idx)}
                          className={`p-2 rounded-lg transition-all ${lockedFields[promo.id] ? 'bg-[#00F0FF]/10 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
                          title={lockedFields[promo.id] ? "Déverrouiller pour recalcul auto" : "Verrouillé manuellement"}
                        >
                          {lockedFields[promo.id] ? <Lock size={18} /> : <Unlock size={18} />}
                        </button>
                        <button 
                          onClick={() => removePromotion(idx)}
                          className="p-2 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          title="Supprimer cette promotion"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={addPromotion}
                className="mt-6 flex items-center justify-center w-full py-4 rounded-2xl border-2 border-dashed border-white/10 text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all font-semibold"
              >
                <Plus size={20} className="mr-2" />
                Ajouter une promotion
              </button>

              <div className="mt-8 pt-8 border-t border-white/5">
                <button 
                  onClick={handleSavePromotions}
                  disabled={isSavingPromos || isLoading}
                  className="w-full py-4 rounded-xl font-black text-lg tracking-widest text-[#0A0E27] bg-gradient-to-r from-[#00F0FF] to-[#00D0FF] hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:active:scale-100"
                >
                  {isSavingPromos ? "SAUVEGARDE EN COURS..." : "SAUVEGARDER LA ROUE"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PRINT */}
        {activeTab === "print" && (
          <div className="space-y-6 pb-20 md:pb-0">
            <h2 className="text-2xl font-bold md:hidden">Affiche Comptoir</h2>
            
            <div className="bg-white p-8 md:p-12 rounded-3xl max-w-md mx-auto text-center shadow-2xl relative overflow-hidden print:shadow-none print:p-0">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#00F0FF] to-[#FF006E] print:hidden" />
              <h3 className="text-2xl md:text-3xl font-black text-[#0A0E27] mb-2 uppercase mt-2">Scannez & Jouez !</h3>
              <p className="text-gray-600 font-medium mb-6 md:mb-8 text-sm md:text-base px-4">Tentez votre chance à notre roulette 100% gagnante.</p>
              
              <div className="bg-white p-3 md:p-4 rounded-2xl border-4 border-[#0A0E27] inline-block shadow-xl mb-6 md:mb-8">
                {/* On pourrait mettre l'URL du site en production ici ! */}
                <QRCodeSVG value="https://roulette-cleanwash.fr" size={180} className="md:w-[220px] md:h-[220px]" />
              </div>
              
              <p className="text-xl md:text-2xl font-black text-[#FF006E] tracking-wider">CADEAUX À GAGNER</p>
              
              <button 
                onClick={() => window.print()}
                className="absolute bottom-4 right-4 bg-[#0A0E27] text-white p-4 rounded-full hover:bg-[#00F0FF] hover:text-[#0A0E27] transition-all print:hidden shadow-xl hover:scale-110 active:scale-95"
                title="Imprimer l'affiche"
              >
                <Printer size={24} />
              </button>
            </div>
          </div>
        )}

      </main>

      {/* 📌 MODAL SEND MANUAL PROMO */}
      {isManualPromoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0A0E27] p-6 md:p-8 rounded-[2rem] max-w-md w-full border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-thin flex flex-col min-h-[450px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">Envoyer une promo</h3>
              <button onClick={() => setIsManualPromoOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <XCircle size={28} />
              </button>
            </div>
            
            <form onSubmit={handleSendManualPromo} className="flex flex-col flex-1">
              
              {/* === STEP 1 === */}
              {manualPromoStep === 1 && (
                <div className="flex-1 flex flex-col justify-center gap-4 animate-in fade-in slide-in-from-right-4">
                  <h4 className="font-bold text-center text-lg text-gray-300 mb-4">À qui envoyons-nous l'offre ?</h4>
                  <button type="button" onClick={() => { setManualPromoType("existing"); setManualPromoStep(2); }} className="w-full py-6 rounded-2xl border-2 border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF] font-bold text-lg hover:bg-[#00F0FF]/20 hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                    Un client existant
                  </button>
                  <button type="button" onClick={() => { setManualPromoType("new"); setManualPromoStep(2); }} className="w-full py-6 rounded-2xl border-2 border-white/10 bg-white/5 text-white font-bold text-lg hover:bg-white/10 hover:scale-105 transition-all">
                    Un nouveau client
                  </button>
                </div>
              )}

              {/* === STEP 2 === */}
              {manualPromoStep === 2 && (
                <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4">
                  <h4 className="font-bold text-center text-lg text-[#00F0FF] mb-6">Détails du client</h4>
                  
                  {manualPromoType === "existing" ? (
                    <div className="space-y-4 flex-1">
                      {manualPromoClientId ? (
                        <div className="bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-2xl p-5 flex justify-between items-center shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                          <div>
                            <p className="text-white font-black text-xl">{clients.find(c => c.id === manualPromoClientId)?.first_name} {clients.find(c => c.id === manualPromoClientId)?.last_name}</p>
                            <p className="text-sm text-gray-300">{clients.find(c => c.id === manualPromoClientId)?.email}</p>
                          </div>
                          <button type="button" onClick={() => setManualPromoClientId("")} className="text-[#00F0FF] text-sm font-bold bg-[#00F0FF]/20 px-4 py-2 rounded-xl hover:bg-[#00F0FF]/30 transition-colors">
                            Changer
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input 
                              type="text" 
                              placeholder="Rechercher (nom, prénom, email)..." 
                              value={manualPromoClientSearch}
                              onChange={e => setManualPromoClientSearch(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-[#00F0FF] outline-none transition-colors"
                            />
                          </div>
                          <div className="mt-4 max-h-56 overflow-y-auto bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5 scrollbar-thin">
                            {clients.filter(c => 
                              c.first_name.toLowerCase().includes(manualPromoClientSearch.toLowerCase()) || 
                              c.last_name.toLowerCase().includes(manualPromoClientSearch.toLowerCase()) ||
                              c.email.toLowerCase().includes(manualPromoClientSearch.toLowerCase())
                            ).slice(0, 15).map(c => (
                              <button 
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setManualPromoClientId(c.id);
                                  setManualPromoClientSearch("");
                                }}
                                className="w-full text-left p-4 hover:bg-white/10 transition-colors flex justify-between items-center group"
                              >
                                <div>
                                  <p className="font-bold text-white text-lg">{c.first_name} {c.last_name}</p>
                                  <p className="text-sm text-gray-400">{c.email}</p>
                                </div>
                                <span className="text-xs font-bold text-[#00F0FF] border border-[#00F0FF]/30 bg-[#00F0FF]/10 px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">Sélectionner</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1">
                      <input type="text" placeholder="Prénom" value={manualPromoNewClient.firstName} onChange={e => setManualPromoNewClient({...manualPromoNewClient, firstName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-[#00F0FF] outline-none transition-colors" required />
                      <input type="text" placeholder="Nom" value={manualPromoNewClient.lastName} onChange={e => setManualPromoNewClient({...manualPromoNewClient, lastName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-[#00F0FF] outline-none transition-colors" required />
                      <input type="email" placeholder="Email" value={manualPromoNewClient.email} onChange={e => setManualPromoNewClient({...manualPromoNewClient, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-[#00F0FF] outline-none transition-colors" required />
                    </div>
                  )}

                  <div className="flex gap-3 pt-6 mt-auto">
                    <button type="button" onClick={() => setManualPromoStep(1)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors border border-white/10">
                      Retour
                    </button>
                    <button type="button" 
                      onClick={() => {
                        if (manualPromoType === "existing" && !manualPromoClientId) return showToast("Sélectionnez un client.", "error");
                        if (manualPromoType === "new" && (!manualPromoNewClient.firstName || !manualPromoNewClient.lastName || !manualPromoNewClient.email)) return showToast("Remplissez tous les champs.", "error");
                        setManualPromoStep(3);
                      }} 
                      className="flex-1 py-4 bg-[#00F0FF] hover:bg-white text-[#0A0E27] rounded-xl font-bold transition-colors"
                    >
                      Continuer
                    </button>
                  </div>
                </div>
              )}

              {/* === STEP 3 === */}
              {manualPromoStep === 3 && (
                <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4">
                  <h4 className="font-bold text-center text-lg text-[#FF006E] mb-6">Quelle offre envoyons-nous ?</h4>
                  
                  <div className="flex gap-2 mb-6">
                    <button type="button" onClick={() => setManualPromoPrizeType("wheel")} className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-colors ${manualPromoPrizeType === "wheel" ? "bg-[#FF006E]/20 text-[#FF006E] border-[#FF006E]" : "bg-transparent text-gray-400 border-white/10 hover:border-white/30"}`}>
                      Offre standard
                    </button>
                    <button type="button" onClick={() => setManualPromoPrizeType("custom")} className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-colors ${manualPromoPrizeType === "custom" ? "bg-[#FF006E]/20 text-[#FF006E] border-[#FF006E]" : "bg-transparent text-gray-400 border-white/10 hover:border-white/30"}`}>
                      Offre sur mesure
                    </button>
                  </div>

                  <div className="flex-1">
                    {manualPromoPrizeType === "wheel" ? (
                      <div className="relative">
                        <select 
                          value={manualPromoSelectedPrize} 
                          onChange={e => setManualPromoSelectedPrize(e.target.value)}
                          className="w-full bg-[#0A0E27] border border-white/20 rounded-2xl p-4 text-white focus:border-[#FF006E] outline-none text-lg appearance-none cursor-pointer"
                          required
                        >
                          <option value="" disabled className="text-gray-400">-- Sélectionner une offre --</option>
                          {promotions.map((p, idx) => (
                            <option key={idx} value={p.text_content} className="text-white">{p.text_content}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <textarea 
                          placeholder="Ex: Nettoyage Intégral OFFERT exceptionnellement !" 
                          value={manualPromoCustomPrize} 
                          onChange={e => setManualPromoCustomPrize(e.target.value)} 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-[#FF006E] outline-none min-h-[120px] resize-none transition-colors" 
                          required 
                        />
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs text-gray-300 flex gap-2 items-start">
                          <span className="text-[#00F0FF] font-black">ℹ️</span> 
                          <p>Cette offre sera envoyée <b>uniquement</b> à ce client. Elle ne s'ajoutera pas à la roue des autres joueurs.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-6 mt-auto border-t border-white/10">
                    <button type="button" onClick={() => setManualPromoStep(2)} className="w-1/3 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors border border-white/10">
                      Retour
                    </button>
                    <button type="submit" disabled={isSendingManualPromo} className="flex-1 py-4 bg-gradient-to-r from-[#00F0FF] to-[#FF006E] text-white rounded-xl font-black hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(255,0,110,0.3)]">
                      {isSendingManualPromo ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> ENVOI...</>
                      ) : (
                        <><Send size={20} /> ENVOYER L'OFFRE</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM TOAST */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300 ${
          toast.type === "success" 
            ? "bg-green-500/10 text-green-400 border border-green-500/20 backdrop-blur-md" 
            : "bg-red-500/10 text-red-400 border border-red-500/20 backdrop-blur-md"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          {toast.message}
        </div>
      )}

      {/* CUSTOM CONFIRM MODAL */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0A0E27] p-8 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <AlertTriangle className="text-orange-400" size={24} />
              Confirmation
            </h3>
            <p className="text-gray-300 mb-8">{confirmDialog.message}</p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-3 rounded-xl font-semibold bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="flex-1 py-3 rounded-xl font-bold bg-[#00F0FF] text-[#0A0E27] hover:bg-white transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function SidebarButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${
        active 
          ? "bg-[#00F0FF]/10 text-[#00F0FF] font-bold border border-[#00F0FF]/20 shadow-inner" 
          : "text-gray-400 hover:text-white hover:bg-white/5 font-medium"
      }`}
    >
      <span className={active ? "text-[#00F0FF]" : "text-gray-500"}>{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function BottomNavButton({ icon, label, active, isScanner, onClick }: { icon: React.ReactNode, label: string, active: boolean, isScanner?: boolean, onClick: () => void }) {
  if (isScanner) {
    return (
      <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center -mt-6 gap-1"
      >
        <div className={`p-4 rounded-full shadow-lg transition-transform ${active ? 'bg-[#FF006E] text-white shadow-[0_0_20px_rgba(255,0,110,0.5)] scale-110' : 'bg-[#00F0FF] text-[#0A0E27]'}`}>
          {icon}
        </div>
        <span className={`text-[10px] font-bold ${active ? 'text-[#FF006E]' : 'text-gray-400'}`}>{label}</span>
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 gap-1 p-2 transition-colors ${
        active ? "text-[#00F0FF]" : "text-gray-500"
      }`}
    >
      {icon}
      <span className={`text-[10px] font-semibold ${active ? 'text-[#00F0FF]' : ''}`}>{label}</span>
    </button>
  );
}

function StatCard({ title, value, color }: { title: string, value: string, color: string }) {
  return (
    <div className="bg-[#0A0E27] p-5 md:p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between h-full">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 blur-3xl rounded-full" style={{ backgroundColor: color }} />
      <h4 className="text-gray-400 text-xs md:text-sm font-medium mb-2">{title}</h4>
      <p className={`font-black leading-tight ${value.length > 15 ? 'text-lg md:text-xl' : value.length > 8 ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'}`} style={{ color }}>{value}</p>
    </div>
  );
}
