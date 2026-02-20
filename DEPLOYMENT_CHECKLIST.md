# ✅ CHECKLIST DE DÉPLOIEMENT IIS - DLMS FRONTEND

Date de déploiement : _______________

---

## 📦 PRÉPARATION DU BUILD

- [ ] Configuration de l'URL API dans `.env.production` : `http://10.100.2.36:8081/api/`
- [ ] Build de production créé avec : `npm run build:prod`
- [ ] Vérification que le dossier `dist/` contient :
  - [ ] `index.html`
  - [ ] `web.config`
  - [ ] Dossier `assets/`
- [ ] Taille totale du build : _______ MB

---

## 🖥️ SERVEUR IIS - PRÉREQUIS

- [ ] Windows Server avec IIS installé
- [ ] **URL Rewrite Module** installé ([Télécharger](https://www.iis.net/downloads/microsoft/url-rewrite))
- [ ] Droits administrateur pour configurer IIS
- [ ] Dossier de destination créé : __________________

---

## 🔧 CONFIGURATION IIS

### 1. Création du Site
- [ ] Site IIS créé
  - Nom du site : __________________
  - Port : __________________
  - Chemin physique : __________________

### 2. Pool d'Applications
- [ ] Pool d'applications configuré
  - Nom : __________________
  - .NET CLR Version : **No Managed Code**
  - Enable 32-Bit Applications : **False**

### 3. Configuration du Site
- [ ] Fichiers `dist/` copiés vers le dossier du site
- [ ] Fichier `web.config` présent à la racine
- [ ] URL Rewrite : Règle "React Routes" visible
- [ ] MIME Types vérifiés (`.json`, `.woff`, `.woff2`, `.svg`)

---

## 🚀 DÉMARRAGE

- [ ] Site IIS démarré
- [ ] Pool d'applications démarré
- [ ] Aucune erreur dans "Event Viewer"

---

## 🧪 TESTS POST-DÉPLOIEMENT

### Tests d'Accès
- [ ] Site accessible : `http://_______________`
- [ ] Page d'accueil se charge correctement
- [ ] Styles CSS appliqués
- [ ] JavaScript fonctionne

### Tests de Navigation
- [ ] Navigation entre les pages fonctionne
- [ ] Actualisation (F5) sur une route ne donne pas d'erreur 404
- [ ] Bouton retour du navigateur fonctionne

### Tests API
- [ ] Console du navigateur ouverte (F12)
- [ ] Appels API vers `http://10.100.2.36:8081/api/` visibles dans l'onglet Network
- [ ] **Pas d'erreurs CORS**
- [ ] Données affichées correctement

### Tests de Performance
- [ ] Temps de chargement initial : _______ secondes
- [ ] Aucune erreur dans la console
- [ ] Onglet Network : status 200 pour tous les fichiers

---

## 🔒 CONFIGURATION BACKEND (CORS)

- [ ] Backend configuré pour autoriser l'origine : `http://_______________`
- [ ] Méthodes HTTP autorisées : GET, POST, PUT, DELETE, OPTIONS
- [ ] Headers autorisés : Content-Type, Authorization
- [ ] Backend redémarré après configuration CORS
- [ ] Test CORS réussi (pas d'erreur dans la console)

---

## 🔍 RÉSOLUTION DE PROBLÈMES

### Si erreur 404 sur les routes :
- [ ] Vérifier que URL Rewrite Module est installé
- [ ] Vérifier que `web.config` est à la racine du site
- [ ] Rebuilder avec `npm run build:prod`

### Si erreur CORS :
- [ ] Vérifier la configuration CORS côté backend (voir `CORS_CONFIG.md`)
- [ ] Vérifier que le backend autorise l'IP du serveur IIS
- [ ] Vérifier les logs du backend

### Si les CSS/JS ne chargent pas :
- [ ] Vérifier que `base: './'` est dans `vite.config.ts`
- [ ] Vérifier les chemins dans le Network tab du navigateur
- [ ] Rebuilder le projet

### Si erreur 500 :
- [ ] Consulter Event Viewer → Windows Logs → Application
- [ ] Vérifier que `web.config` est valide (XML bien formé)
- [ ] Vérifier les permissions du dossier

---

## 📊 MONITORING

### Logs à Surveiller
- [ ] Event Viewer → Windows Logs → Application
- [ ] IIS Manager → Logging
- [ ] Console navigateur (erreurs JavaScript)

### Fichiers de Log IIS
Emplacement : __________________

---

## 🔄 PROCÉDURE DE MISE À JOUR

Pour les futures mises à jour :

1. [ ] Faire les modifications dans le code source
2. [ ] Exécuter : `npm run build:prod`
3. [ ] Arrêter le site IIS
4. [ ] Remplacer les fichiers dans le dossier de destination
5. [ ] Redémarrer le site IIS
6. [ ] Tester l'application
7. [ ] Vérifier la console pour les erreurs

Ou utiliser le script automatique :
```powershell
.\deploy-iis.ps1
```

---

## 📝 INFORMATIONS DE PRODUCTION

| Paramètre | Valeur |
|-----------|--------|
| **URL Frontend** | http://_________________ |
| **URL API Backend** | http://10.100.2.36:8081/api/ |
| **Serveur IIS** | _________________ |
| **Nom du Site IIS** | _________________ |
| **Pool d'Applications** | _________________ |
| **Version Node.js** | _________________ |
| **Version React** | 19.1.1 |
| **Version Vite** | 7.1.7 |

---

## ✅ VALIDATION FINALE

- [ ] Application accessible publiquement
- [ ] Toutes les fonctionnalités testées
- [ ] Aucune erreur dans la console
- [ ] Performance acceptable
- [ ] CORS configuré correctement
- [ ] Documentation à jour

---

## 👥 SIGNATURES

**Développeur** : _________________ Date : _______

**Responsable IT** : _________________ Date : _______

**Validé par** : _________________ Date : _______

---

## 📞 CONTACTS SUPPORT

- **Développement** : _________________
- **Infrastructure** : _________________
- **Backend API** : _________________

---

**Version** : 1.0  
**Dernière mise à jour** : 2026-01-13  
**Status** : ☐ En préparation  ☐ En cours  ☐ Déployé  ☐ Validé
