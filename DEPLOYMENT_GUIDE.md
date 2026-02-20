# 🚀 Guide de Déploiement IIS - DLMS Frontend

## 📋 Prérequis

- **Windows Server** avec IIS installé
- **Node.js** installé (pour le build)
- **URL Rewrite Module** pour IIS ([Télécharger ici](https://www.iis.net/downloads/microsoft/url-rewrite))

---

## 🔧 Configurations Effectuées

### ✅ 1. Configuration de l'API
- Fichier `.env` et `.env.production` configurés avec l'URL de l'API : `http://10.100.2.36:8081/api/`

### ✅ 2. Fichier `web.config`
- Créé dans le dossier `public/` pour gérer le routing React dans IIS
- Configure la réécriture d'URL pour les routes React
- Optimise les performances avec compression et cache

### ✅ 3. Configuration Vite
- Chemins relatifs pour les assets (`base: './'`)
- Optimisation du build de production
- Séparation des chunks vendor

---

## 📦 Étapes de Déploiement

### **Étape 1 : Build de Production**

Exécutez la commande suivante dans le terminal :

```powershell
npm run build:prod
```

Cette commande va :
- Compiler le TypeScript
- Créer un build optimisé dans le dossier `dist/`
- Copier le fichier `web.config` dans `dist/`

### **Étape 2 : Vérification du Build**

Vérifiez que le dossier `dist/` contient :
- `index.html`
- `web.config`
- Dossier `assets/` (avec les fichiers JS et CSS)

### **Étape 3 : Préparation du Serveur IIS**

Sur le serveur Windows :

1. **Installer URL Rewrite Module** si ce n'est pas déjà fait
   - Télécharger : https://www.iis.net/downloads/microsoft/url-rewrite
   
2. **Créer un nouveau site IIS** :
   - Ouvrir **IIS Manager**
   - Clic droit sur **Sites** → **Add Website**
   - Nom du site : `DLMS Frontend`
   - Chemin physique : Pointer vers le dossier qui contiendra les fichiers de `dist/`
   - Port : `80` ou autre port disponible

### **Étape 4 : Déployer les Fichiers**

Copiez **tout le contenu** du dossier `dist/` vers le dossier du site sur le serveur IIS.

### **Étape 5 : Configuration IIS**

1. Dans **IIS Manager**, sélectionnez votre site
2. Double-cliquez sur **URL Rewrite**
   - Vérifiez que la règle "React Routes" est présente
3. Double-cliquez sur **MIME Types**
   - Assurez-vous que `.json`, `.woff`, `.woff2`, `.svg` sont configurés

### **Étape 6 : Configuration du Pool d'Applications**

1. Sélectionnez **Application Pools**
2. Clic droit sur le pool de votre site → **Advanced Settings**
3. Configurez :
   - **.NET CLR Version** : `No Managed Code` (car c'est du contenu statique)
   - **Enable 32-Bit Applications** : `False`

### **Étape 7 : Démarrer le Site**

1. Dans **IIS Manager**, clic droit sur votre site
2. Cliquez sur **Start**

---

## 🧪 Tests Post-Déploiement

### 1. Tester l'accès au site
```
http://[IP_SERVEUR]/
```

### 2. Vérifier le routing React
- Essayez de naviguer vers différentes routes de votre application
- Actualisez la page (F5) sur une route spécifique
- Les routes doivent fonctionner sans erreur 404

### 3. Vérifier la connexion API
- Ouvrez la console du navigateur (F12)
- Vérifiez les appels vers `http://10.100.2.36:8081/api/`
- Assurez-vous qu'il n'y a pas d'erreurs CORS

---

## 🔍 Résolution de Problèmes

### Erreur 404 sur les routes
**Problème** : Les routes React retournent une erreur 404
**Solution** : 
- Vérifiez que le module **URL Rewrite** est installé
- Vérifiez que le fichier `web.config` est bien dans le dossier du site

### Erreur CORS
**Problème** : L'API refuse les requêtes (erreurs CORS)
**Solution** :
- Vérifiez la configuration CORS sur le backend API
- L'API doit autoriser les requêtes depuis l'IP du serveur IIS

### Resources 404 (CSS/JS)
**Problème** : Les fichiers CSS et JS ne se chargent pas
**Solution** :
- Vérifiez que `base: './'` est bien dans `vite.config.ts`
- Rebuilder avec `npm run build:prod`

### Erreur 500
**Problème** : Erreur interne du serveur
**Solution** :
- Vérifiez les logs IIS dans **Event Viewer**
- Vérifiez que le fichier `web.config` est valide (XML bien formé)

---

## 📝 Checklist de Déploiement

- [ ] URL de l'API configurée dans `.env.production`
- [ ] Build de production créé avec `npm run build:prod`
- [ ] URL Rewrite Module installé sur IIS
- [ ] Fichiers `dist/` copiés sur le serveur
- [ ] Site IIS créé et configuré
- [ ] `web.config` présent dans le dossier du site
- [ ] Pool d'applications configuré
- [ ] Site démarré dans IIS
- [ ] Tests de navigation effectués
- [ ] Tests de l'API effectués
- [ ] Pas d'erreurs dans la console du navigateur

---

## 🔄 Mises à Jour Futures

Pour mettre à jour l'application :

1. Effectuez vos modifications dans le code
2. Exécutez `npm run build:prod`
3. Arrêtez le site IIS
4. Remplacez les fichiers dans le dossier du site par le nouveau contenu de `dist/`
5. Redémarrez le site IIS

---

## 📞 Support

En cas de problème, vérifiez :
- Les logs IIS dans **Event Viewer** → **Windows Logs** → **Application**
- La console du navigateur (F12) pour les erreurs JavaScript
- Les appels réseau dans l'onglet **Network** de la console

---

**Date de création** : 2026-01-13
**Version** : 1.0
**API Backend** : http://10.100.2.36:8081/api/
