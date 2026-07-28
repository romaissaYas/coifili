'use client';

import { useState } from 'react';
import {
  CalendarDays,
  CalendarCheck,
  Scissors,
  Clock,
  LayoutDashboard,
  Users,
  ShoppingBag,
  CreditCard,
  Menu,
  X,
  LogOut,
  Bell,
} from 'lucide-react';
import { logout } from '@/lib/logout';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useHoraires } from '@/hooks/useHoraires';
import { usePrestations } from '@/hooks/usePrestations';
import { useEmployes } from '@/hooks/useEmployes';
import { useRendezVous } from '@/hooks/useRendezVous';
import { useAgendaFiltre } from '@/hooks/useAgendaFiltre';
import DashboardTab from '@/components/dashboard/tabs/DashboardTab';
import AgendaTab from '@/components/dashboard/tabs/AgendaTab';
import HorairesTab from '@/components/dashboard/tabs/HorairesTab';
import PrestationsTab from '@/components/dashboard/tabs/PrestationsTab';
import EmployesTab from '@/components/dashboard/tabs/EmployesTab';
import ProduitsBoutiqueTab from '@/components/dashboard/tabs/ProduitsBoutiqueTab';
import MonAbonnementTab from '@/components/dashboard/tabs/MonAbonnementTab';
import ReservationsTab from '@/components/dashboard/tabs/ReservationsTab';
import NotificationsTab from '@/components/dashboard/tabs/NotificationsTab';
import NotificationBell from '@/components/dashboard/NotificationBell';
import type { RendezVous } from '@/types/rendezvous';

const tabs = [
  { name: 'Dashboard', icon: <LayoutDashboard size={20} />, key: 'dashboard' },
  { name: 'Agenda', icon: <CalendarDays size={20} />, key: 'agenda' },
  { name: 'Réservations', icon: <CalendarCheck size={20} />, key: 'reservations' },
  { name: 'Horaires', icon: <Clock size={20} />, key: 'horaires' },
  { name: 'Prestations', icon: <Scissors size={20} />, key: 'prestations' },
  { name: 'Mes Produits', icon: <ShoppingBag size={20} />, key: 'boutique' },
  { name: 'Employés', icon: <Users size={20} />, key: 'employes' },
  { name: 'Notifications', icon: <Bell size={20} />, key: 'notifications' },
  { name: 'Mon abonnement', icon: <CreditCard size={20} />, key: 'abonnement' },
];

function initiales(prenom?: string, nom?: string) {
  return `${(prenom ?? '').charAt(0)}${(nom ?? '').charAt(0)}`.toUpperCase() || 'S';
}

export default function EspaceCoiffeur() {
  const user = useAuthUser();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  const horairesState = useHoraires();
  const prestationsState = usePrestations(user);
  const employesState = useEmployes(user);
  const { rendezvous, loadingRendezvous, fetchRendezvous, stats, loadingStats, fetchStats } = useRendezVous();
  const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVous | null>(null);
  const agendaFiltreState = useAgendaFiltre(rendezvous);

  // Rafraîchit tout ce qui peut avoir changé après une action sur un
  // rendez-vous (les statistiques et les compteurs employés en dépendent).
  const rafraichirApresAction = () => {
    fetchRendezvous();
    fetchStats();
    employesState.fetchEmployes();
  };

  const handleTabClick = (key: string) => {
    setActiveTab(key);
    setMenuOpen(false);
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-rose-500" />
          <p className="mt-4 text-sm text-slate-500">Chargement…</p>
        </div>
      </div>
    );
  }

  const activeName = tabs.find((t) => t.key === activeTab)?.name ?? '';

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Marque */}
      <div className="flex items-center gap-3 px-6 py-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-sm">
          <Scissors size={20} />
        </span>
        <div>
          <p className="text-lg font-extrabold tracking-tight text-slate-900">Coifili</p>
          <p className="-mt-1 text-xs font-medium text-slate-400">Espace Pro</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Navigation principale">
        {tabs.map((tab) => {
          const actif = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              aria-current={actif ? 'page' : undefined}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 ${
                actif
                  ? 'bg-rose-50 text-rose-700 shadow-sm ring-1 ring-rose-100'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className={actif ? 'text-rose-600' : 'text-slate-400 group-hover:text-slate-600'}>
                {tab.icon}
              </span>
              {tab.name}
            </button>
          );
        })}
      </nav>

      {/* Carte utilisateur */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-sm font-bold text-white">
            {initiales(user.firstName, user.lastName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-slate-400">Salon #{user.salonId}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
        >
          <LogOut size={18} className="text-slate-400" />
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Barre supérieure (mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:hidden">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white">
            <Scissors size={16} />
          </span>
          <span className="font-bold tracking-tight text-slate-900">Coifili</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-xs font-bold text-white">
            {initiales(user.firstName, user.lastName)}
          </span>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar — statique sur desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white md:block">
          {sidebar}
        </aside>

        {/* Drawer — mobile */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-2xl">
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer le menu"
                className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        {/* Contenu */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {/* Fil d'Ariane + notifications (desktop) */}
          <div className="mb-4 hidden items-center justify-between md:flex">
            <nav className="flex items-center gap-1.5 text-sm text-slate-400" aria-label="Fil d'Ariane">
              <span>Espace Pro</span>
              <span aria-hidden>/</span>
              <span className="font-medium text-slate-600">{activeName}</span>
            </nav>
            <NotificationBell />
          </div>

          {activeTab === 'dashboard' && <DashboardTab stats={stats} loadingStats={loadingStats} />}

          {activeTab === 'agenda' && (
            <AgendaTab
              loadingRendezvous={loadingRendezvous}
              agendaFiltre={agendaFiltreState.agendaFiltre}
              employes={employesState.employes}
              vueAgenda={agendaFiltreState.vueAgenda}
              setVueAgenda={agendaFiltreState.setVueAgenda}
              filtreEmployeId={agendaFiltreState.filtreEmployeId}
              setFiltreEmployeId={agendaFiltreState.setFiltreEmployeId}
              filtreStatut={agendaFiltreState.filtreStatut}
              setFiltreStatut={agendaFiltreState.setFiltreStatut}
              rechercheClient={agendaFiltreState.rechercheClient}
              setRechercheClient={agendaFiltreState.setRechercheClient}
              selectedRendezVous={selectedRendezVous}
              setSelectedRendezVous={setSelectedRendezVous}
              onUpdated={rafraichirApresAction}
            />
          )}

          {activeTab === 'reservations' && <ReservationsTab />}

          {activeTab === 'horaires' && (
            <HorairesTab
              horaires={horairesState.horaires}
              toggleOuvert={horairesState.toggleOuvert}
              ajouterCreneau={horairesState.ajouterCreneau}
              changerCreneau={horairesState.changerCreneau}
              enregistrerHoraires={horairesState.enregistrerHoraires}
              telechargerPDF={horairesState.telechargerPDF}
            />
          )}

          {activeTab === 'boutique' && <ProduitsBoutiqueTab />}

          {activeTab === 'notifications' && <NotificationsTab />}

          {activeTab === 'abonnement' && <MonAbonnementTab />}

          {activeTab === 'prestations' && (
            <PrestationsTab
              prestations={prestationsState.prestations}
              showAddPopup={prestationsState.showAddPopup}
              setShowAddPopup={prestationsState.setShowAddPopup}
              newPrestation={prestationsState.newPrestation}
              setNewPrestation={prestationsState.setNewPrestation}
              handleAddPrestation={prestationsState.handleAddPrestation}
            />
          )}

          {activeTab === 'employes' && (
            <EmployesTab
              employes={employesState.employes}
              loadingEmployes={employesState.loadingEmployes}
              popupOpen={employesState.popupOpen}
              setPopupOpen={employesState.setPopupOpen}
              nom={employesState.nom}
              setNom={employesState.setNom}
              poste={employesState.poste}
              setPoste={employesState.setPoste}
              message={employesState.message}
              handleAddEmploye={employesState.handleAddEmploye}
            />
          )}
        </main>
      </div>
    </div>
  );
}
