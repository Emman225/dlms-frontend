import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PrivateRoute from './routes/PrivateRoute'
import UsersList from './pages/UsersList'
import RolesList from './pages/RolesList'
import PostesList from './pages/PostesList'
import FabricantsList from './pages/FabricantsList'
import EquipementsList from './pages/EquipementsList'
import CompteursList from './pages/CompteursList'
import CommandesList from './pages/CommandesList'
import DetailCommande from './pages/DetailCommande'
import TypeCommandesList from './pages/TypeCommandesList'
import LectureDonneesCompteurList from './pages/LectureDonneesCompteurList'
import EvenementsList from './pages/EvenementsList'
import LectureStatistiques from './pages/LectureStatistiques'
import LectureDerniereQuotidienne from './pages/LectureDerniereQuotidienne'
import LectureConcentrateurs from './pages/LectureConcentrateurs'
import CellulesList from './pages/CellulesList'
import PermissionsList from './pages/PermissionsList'
import AlarmesList from './pages/AlarmesList'
import ResultatCommandeCompteur from './pages/ResultatCommandeCompteur'

import PageTitle from './components/common/PageTitle'

export default function App() {
  return (
    <BrowserRouter>
      <PageTitle />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route path="/accueil" element={<Dashboard />} />
          <Route path="/listeUtilisateur" element={<UsersList />} />
          <Route path="/listeRole" element={<RolesList />} />
          <Route path="/listePoste" element={<PostesList />} />
          <Route path="/listeCellule" element={<CellulesList />} />
          <Route path="/listePermissions" element={<PermissionsList />} />
          <Route path="/listeFabricant" element={<FabricantsList />} />
          <Route path="/equipements" element={<EquipementsList />} />
          <Route path="/compteurs" element={<CompteursList />} />
          <Route path="/commandes" element={<CommandesList />} />
          <Route path="/commandes/:id" element={<DetailCommande />} />
          <Route path="/commandes/resultats/:commandeCompteurId" element={<ResultatCommandeCompteur />} />
          <Route path="/typecommandes" element={<TypeCommandesList />} />
          <Route path="/lectureDonneesCompteur" element={<LectureDonneesCompteurList />} />
          <Route path="/listeEvenement" element={<EvenementsList />} />
          <Route path="/listeAlarme" element={<AlarmesList />} />
          {/* Routes dédiées aux onglets Lectures */}
          <Route path="/lecture/statistiques" element={<LectureStatistiques />} />
          <Route path="/lecture/derniere-quotidienne" element={<LectureDerniereQuotidienne />} />
          <Route path="/lecture/evenements" element={<EvenementsList />} />
          <Route path="/lecture/commandes" element={<CommandesList />} />
          <Route path="/lecture/concentrateurs" element={<LectureConcentrateurs />} />
          <Route path="/lecture/lectures" element={<LectureDonneesCompteurList />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
