# 🔒 Configuration CORS pour le Backend API

## ⚠️ Configuration Requise sur le Backend

Pour que votre application React déployée sur IIS puisse communiquer avec l'API backend située à `http://10.100.2.36:8081`, vous devez configurer **CORS** (Cross-Origin Resource Sharing) sur le serveur API.

---

## 📋 Prérequis

L'API doit autoriser les requêtes provenant de :
- **L'IP/domaine du serveur IIS** où est déployé le frontend
- **Exemple** : `http://192.168.1.100` ou `http://dlms.example.com`

---

## 🔧 Configuration selon le Backend

### Si votre backend est en **Node.js/Express**

```javascript
const cors = require('cors');

// Option 1: Autoriser toutes les origines (DEV uniquement)
app.use(cors());

// Option 2: Autoriser des origines spécifiques (PRODUCTION - RECOMMANDÉ)
app.use(cors({
  origin: [
    'http://IP_SERVEUR_IIS',
    'http://dlms.example.com',
    'http://localhost:5173' // Pour le développement local
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Si votre backend est en **ASP.NET Core**

Dans `Program.cs` ou `Startup.cs` :

```csharp
// Dans ConfigureServices
services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        builder => builder
            .WithOrigins(
                "http://IP_SERVEUR_IIS",
                "http://dlms.example.com",
                "http://localhost:5173"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

// Dans Configure
app.UseCors("AllowFrontend");
```

### Si votre backend est en **Spring Boot (Java)**

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins(
                        "http://IP_SERVEUR_IIS",
                        "http://dlms.example.com",
                        "http://localhost:5173"
                    )
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

### Si votre backend est en **PHP (Laravel)**

Dans `config/cors.php` :

```php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://IP_SERVEUR_IIS',
        'http://dlms.example.com',
        'http://localhost:5173',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

Puis dans `app/Http/Kernel.php`, assurez-vous que le middleware CORS est activé :

```php
protected $middleware = [
    // ...
    \Fruitcake\Cors\HandleCors::class,
];
```

### Si votre backend est en **Python (Django)**

Installez `django-cors-headers` :

```bash
pip install django-cors-headers
```

Dans `settings.py` :

```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ...
]

CORS_ALLOWED_ORIGINS = [
    "http://IP_SERVEUR_IIS",
    "http://dlms.example.com",
    "http://localhost:5173",
]

CORS_ALLOW_CREDENTIALS = True
```

### Si votre backend est en **Python (Flask)**

Installez `flask-cors` :

```bash
pip install flask-cors
```

Dans votre application :

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=[
    "http://IP_SERVEUR_IIS",
    "http://dlms.example.com",
    "http://localhost:5173"
], supports_credentials=True)
```

---

## 🧪 Test de la Configuration CORS

### 1. Dans la console du navigateur

Après avoir déployé le frontend et configuré CORS sur le backend, ouvrez votre application dans le navigateur et appuyez sur **F12** pour ouvrir la console.

Vérifiez qu'il n'y a **pas** d'erreurs comme :
```
Access to XMLHttpRequest at 'http://10.100.2.36:8081/api/...' from origin 'http://IP_SERVEUR_IIS' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 2. Test manuel avec cURL

```bash
curl -H "Origin: http://IP_SERVEUR_IIS" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     --verbose \
     http://10.100.2.36:8081/api/
```

Vous devriez voir dans la réponse :
```
Access-Control-Allow-Origin: http://IP_SERVEUR_IIS
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 🔐 Recommandations de Sécurité

### ✅ À FAIRE en Production
- **Spécifiez les origines exactes** au lieu d'utiliser `*` (wildcard)
- **Activez `credentials: true`** seulement si vous utilisez des cookies/sessions
- **Listez uniquement les méthodes HTTP nécessaires**
- **Utilisez HTTPS** pour les communications en production

### ❌ À ÉVITER en Production
- **NE PAS** utiliser `*` comme origine (permet toutes les origines)
- **NE PAS** autoriser toutes les origines si vous utilisez `credentials: true`
- **NE PAS** exposer des headers sensibles inutilement

---

## 📝 Checklist Backend

- [ ] Middleware CORS installé
- [ ] Configuration CORS avec l'IP/domaine du serveur IIS
- [ ] Méthodes HTTP autorisées (GET, POST, PUT, DELETE, OPTIONS)
- [ ] Headers autorisés (Content-Type, Authorization)
- [ ] Credentials activés si nécessaire
- [ ] Redémarrage du serveur backend après configuration
- [ ] Test des appels API depuis le frontend déployé
- [ ] Pas d'erreurs CORS dans la console du navigateur

---

## 🆘 Problèmes Courants

### Erreur: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Solution** : Le backend n'a pas la configuration CORS ou n'autorise pas l'origine du frontend.

### Erreur: "CORS policy: The value of the 'Access-Control-Allow-Origin' header must not be the wildcard '*'"
**Solution** : Si vous utilisez `credentials: true`, vous devez spécifier une origine exacte, pas `*`.

### Erreur: "CORS policy: Request header field Authorization is not allowed"
**Solution** : Ajoutez 'Authorization' dans les `allowedHeaders` de la configuration CORS.

---

**Configuration Frontend** : ✅ Complète  
**URL API Backend** : `http://10.100.2.36:8081/api/`  
**Prochaine étape** : Configurer CORS sur le backend selon votre framework
