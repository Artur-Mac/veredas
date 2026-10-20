"""Gera beats.json a partir de uma trilha licenciada (receita da REF-08).

Uso: python motion/audio/beats.py trilha.wav > motion/audio/beats.json
Requer: pip install librosa numpy soundfile

Ainda não usado: até 17/10/2026 nenhuma trilha foi fornecida. Enquanto isso,
`node motion/render.mjs audio` gera um mapa de ritmo provisório.
"""
import json
import sys

import librosa
import numpy as np

y, sr = librosa.load(sys.argv[1], sr=None, mono=True)
tempo, quadros = librosa.beat.beat_track(y=y, sr=sr)
batidas = librosa.frames_to_time(quadros, sr=sr)
forca = librosa.onset.onset_strength(y=y, sr=sr)
picos = librosa.util.peak_pick(forca, pre_max=3, post_max=3, pre_avg=3, post_avg=5, delta=0.5, wait=10)
ataques = librosa.frames_to_time(picos, sr=sr)

json.dump({
    "bpm": round(float(np.atleast_1d(tempo)[0]), 2),
    "beats": [round(float(t), 3) for t in batidas],
    "downbeats": [round(float(t), 3) for t in batidas[::4]],
    "hits": [round(float(t), 3) for t in ataques],
}, sys.stdout, indent=2)
