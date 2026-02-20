# 🚀 Déploiement DLMS Frontend sur IIS - Guide Rapide

## ✅ Configuration Effectuée

Votre projet React est maintenant **prêt pour le déploiement sur IIS** ! Toutes les configurations nécessaires ont été effectuées.

---

## 📁 Fichiers Créés/Modifiés

### Fichiers de Configuration
- ✅ `.env` - URL API mise à jour : `http://10.100.2.36:8081/api/`
- ✅ `.env.production` - Configuration de production
- ✅ `vite.config.ts` - Optimisations pour IIS (chemins relatifs, build optimisé)
- ✅ `public/web.config` - Configuration IIS pour le routing React
- ✅ `public/.htaccess` - Alternative pour Apache (si besoin)

### Documentation
- 📖 **`DEPLOYMENT_GUIDE.md`** - Guide complet de déploiement étape par étape
- 📋 **`DEPLOYMENT_CHECKLIST.md`** - Checklist imprimable pour le déploiement
- 🔒 **`CORS_CONFIG.md`** - Configuration CORS pour tous les types de backend

### Scripts
- 🛠️ **`deploy-iis.ps1`** - Script PowerShell automatisé pour déployer sur IIS
- 📦 `package.json` - Ajout du script `build:prod`

### Build
- ✅ **`dist/`** - Build de production prêt à déployer

---

## 🎯 Déploiement en 3 Étapes

### 🔹 Étape 1 : Build de Production (✅ Déjà fait)

```powershell
npm run build:prod
```

Le dossier `dist/` contient maintenant tous les fichiers prêts à être déployés.

---

### 🔹 Étape 2 : Déployer sur IIS

#### Option A : Déploiement Manuel

1. Copiez tout le contenu du dossier `dist/` vers votre serveur IIS
2. Créez un nouveau site dans IIS Manager
3. Configurez le pool d'applications (No Managed Code)
4. Démarrez le site

**Détails complets** → Voir `DEPLOYMENT_GUIDE.md`

#### Option B : Script Automatique (Recommandé)

```powershell
# Ouvrez PowerShell en tant qu'Administrateur
# Modifiez les chemins dans deploy-iis.ps1 selon votre serveur
.\deploy-iis.ps1
```

---

### 🔹 Étape 3 : Configuration CORS Backend

Configurez le backend API (`http://10.100.2.36:8081`) pour autoriser les requêtes depuis votre serveur IIS.

**Guide détaillé pour tous les frameworks** → Voir `CORS_CONFIG.md`

---

## 📋 Pré-requis Serveur IIS

Avant de déployer, assurez-vous que :

- [ ] **IIS** est installé sur Windows Server
- [ ] **URL Rewrite Module** est installé  
  👉 [Télécharger ici](https://www.iis.net/downloads/microsoft/url-rewrite)
- [ ] Vous avez les **droits administrateur**

---

## 🧪 Test Rapide

Une fois déployé, testez :

1. **Accès au site** : Ouvrez `http://[IP_SERVEUR]` dans un navigateur
2. **Console du navigateur** (F12) : Vérifiez qu'il n'y a pas d'erreurs
3. **Navigation** : Testez la navigation entre les pages
4. **Actualisation** : Appuyez sur F5 sur une page - elle ne devrait pas donner d'erreur 404
5. **API** : Vérifiez dans l'onglet Network que les appels vers l'API fonctionnent

---

## 📚 Documentation Complète

| Fichier | Description |
|---------|-------------|
| **DEPLOYMENT_GUIDE.md** | Guide détaillé avec toutes les étapes de déploiement |
| **DEPLOYMENT_CHECKLIST.md** | Checklist à suivre pendant le déploiement |
| **CORS_CONFIG.md** | Configuration CORS pour le backend |
| **deploy-iis.ps1** | Script automatisé de déploiement |

---

## ⚙️ Configuration Technique

| Paramètre | Valeur |
|-----------|--------|
| **URL API** | `http://10.100.2.36:8081/api/` |
| **Build Tool** | Vite 7.1.7 |
| **Framework** | React 19.1.1 |
| **Serveur** | IIS (Windows) |
| **Base Path** | Relatif (`./`) |

---

## 🔄 Mettre à Jour l'Application

Pour les futures mises à jour :

```powershell
# 1. Rebuild
npm run build:prod

# 2. Redéployer avec le script
.\deploy-iis.ps1
```

---

## 🆘 Besoin d'Aide ?

### Problèmes Courants

| Problème | Solution |
|----------|----------|
| **Erreur 404 sur les routes** | Vérifier que URL Rewrite Module est installé et que `web.config` est présent |
| **Erreur CORS** | Configurer le backend (voir `CORS_CONFIG.md`) |
| **CSS/JS ne chargent pas** | Vérifier `base: './'` dans `vite.config.ts` |
| **Erreur 500** | Consulter Event Viewer dans Windows |

### Logs à Consulter

- **Windows Event Viewer** → Logs → Application
- **Console du navigateur** (F12)
- **IIS Logs** (dans le dossier du site)

---

## 🎉 C'est Prêt !

Votre application React est maintenant **100% prête** pour le déploiement sur IIS.

Suivez simplement la **DEPLOYMENT_CHECKLIST.md** pour ne rien oublier !

---

**Dernière mise à jour** : 2026-01-13  
**Version** : 1.0  
**Status** : ✅ Prêt pour le déploiement
