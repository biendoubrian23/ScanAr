# 🛠️ Scripts - ScanAR

Scripts utilitaires pour développement, déploiement et maintenance.

## 📋 Contenu

### Development
- **setup.sh** - Setup initial (install deps, git hooks, env)
- **dev.sh** - Lancer tous les services dev
- **test.sh** - Exécuter tests
- **lint.sh** - Linter + formatter

### Utilities
- **db-seed.sql** - Données initiales dev
- **reset-db.sh** - Reset database complète
- **clear-redis.sh** - Vider Redis queue
- **generate-env.sh** - Générer .env template

### Deployment
- **deploy.sh** - Déploiement production
- **backup.sh** - Backup database

### Maintenance
- **logs.sh** - Afficher logs tous services
- **health-check.sh** - Vérifier santé services
- **clean-storage.sh** - Nettoyer old uploads
- **monitor.sh** - Monitor resources

### Image Processing
- **process-batch.py** - Traiter batch images
- **validate-model.py** - Valider modèles 3D

### AI/GPU
- **test-hunyuan3d.py** - Tester Hunyuan3D
- **benchmark-gpu.py** - Benchmark GPU performance

## 🚀 Usage

```bash
# Setup initial
bash scripts/setup.sh

# Dev
bash scripts/dev.sh

# Tests
bash scripts/test.sh

# Reset complete
bash scripts/reset-db.sh && bash scripts/clear-redis.sh

# Deploy
bash scripts/deploy.sh
```

## 📝 À Ajouter

- Scripts spécifiques au besoin
- Numérotation claire des scripts
- Documentation dans chaque script
