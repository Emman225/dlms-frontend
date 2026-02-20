import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const routeTitles: Record<string, string> = {
    '/accueil': 'Tableau de bord - DLMS',
    '/login': 'Connexion - DLMS',
    '/listeUtilisateur': 'Gestion des utilisateurs - DLMS',
    '/listeRole': 'Gestion des rôles - DLMS',
    '/listePoste': 'Gestion des postes - DLMS',
    '/listeCellule': 'Gestion des cellules - DLMS',
    '/listePermissions': 'Gestion des permissions - DLMS',
    '/listeFabricant': 'Gestion des fabricants - DLMS',
    '/equipements': 'Gestion des équipements - DLMS',
    '/compteurs': 'Gestion des compteurs - DLMS',
    '/commandes': 'Gestion des commandes - DLMS',
    '/typecommandes': 'Types de commandes - DLMS',
    '/lectureDonneesCompteur': 'Lecture des données - DLMS',
    '/listeEvenement': 'Événements - DLMS',
    '/listeAlarme': 'Alarmes - DLMS',
    '/lecture/statistiques': 'Statistiques de lecture - DLMS',
    '/lecture/derniere-quotidienne': 'Dernière lecture quotidienne - DLMS',
    '/lecture/evenements': 'Événements du compteur - DLMS',
    '/lecture/commandes': 'Commandes du compteur - DLMS',
    '/lecture/concentrateurs': 'Concentrateurs - DLMS',
    '/lecture/lectures': 'Lecture des index - DLMS',
}

export default function PageTitle() {
    const location = useLocation()

    useEffect(() => {
        // Basic title matching
        let title = 'DLMS'

        // Check exact path match
        if (routeTitles[location.pathname]) {
            title = routeTitles[location.pathname]
        } else {
            // Handle dynamic routes like /commandes/:id
            if (location.pathname.startsWith('/commandes/')) {
                title = 'Détail de commande - DLMS'
            }
        }

        document.title = title
    }, [location])

    return null
}
