# Core Processing

Logique principale pipeline Hunyuan3D.

**Contenu**:
- `hunyuan_processor.py` - Orchestration principale
- `models_3d.py` - Génération mesh + textures
- `post_processor.py` - Post-processing (cleanup, compression)
- `exporters.py` - Export GLB, USDZ

Pipeline: Input → Hunyuan3D → Post-process → Export
