"""
Paysage de l'espace latent — généré avec numpy + Pillow.
Chaque pixel est une interpolation douce entre des ondes sinusoïdales
empilées, comme les dimensions invisibles d'un modèle génératif.
"""

import numpy as np
from PIL import Image, ImageFilter

W, H = 1920, 1080
np.random.seed(2026)

x = np.linspace(-3, 3, W)
y = np.linspace(-2, 2, H)
X, Y = np.meshgrid(x, y)


def fbm(a, b, octaves=6, lacunarity=2.0, gain=0.5):
    """Bruit fractal simple à base de sinus."""
    val = np.zeros_like(a)
    amp = 1.0
    freq = 1.0
    for i in range(octaves):
        phase = np.random.uniform(0, 2 * np.pi)
        val += amp * np.sin(freq * a + np.random.uniform(0, 2 * np.pi)) * np.cos(freq * b + phase)
        freq *= lacunarity
        amp *= gain
    return val


# Trois canaux avec des transformations légèrement différentes
c1 = fbm(X + 0.7 * Y, Y - 0.4 * X, octaves=5)
c2 = fbm(Y * 1.3, X * 0.8 + c1 * 0.2, octaves=5)
c3 = fbm(X * 0.9 - c2 * 0.15, Y * 1.1 + c1 * 0.1, octaves=5)

# Normalisation
def norm(z):
    z = (z - z.min()) / (z.max() - z.min() + 1e-9)
    return z

c1, c2, c3 = map(norm, (c1, c2, c3))

# Palette onirique : violet → magenta → bleu profond → rose chaud
R = 0.25 + 0.55 * c1 + 0.35 * np.sin(2 * np.pi * c3)
G = 0.10 + 0.40 * c2 + 0.35 * np.cos(2 * np.pi * c1)
B = 0.50 + 0.45 * c3 + 0.25 * np.sin(2 * np.pi * (c2 + c3))

rgb = np.stack([R, G, B], axis=-1)
rgb = np.clip(rgb, 0, 1)
rgb = (rgb * 255).astype(np.uint8)

img = Image.fromarray(rgb, mode='RGB')

# Léger flou gaussien pour un effet "glow" organique
img = img.filter(ImageFilter.GaussianBlur(radius=1.2))

# Ajout de quelques "étoiles" / points de condensation
arr = np.array(img).astype(np.float32)
for _ in range(900):
    px = np.random.randint(0, W)
    py = np.random.randint(0, H)
    intensity = np.random.uniform(0.6, 1.0)
    size = np.random.randint(1, 4)
    colors = np.array([
        [255, 220, 255],  # blanc-rose
        [200, 240, 255],  # bleu glacier
        [255, 180, 220],  # magenta doux
        [255, 245, 200],  # or pâle
    ])
    color = colors[np.random.randint(len(colors))]
    arr[max(0, py-size):min(H, py+size+1), max(0, px-size):min(W, px+size+1)] += color[None, None, :] * intensity * 0.35

arr = np.clip(arr, 0, 255).astype(np.uint8)
img = Image.fromarray(arr, mode='RGB')

img.save('/workspace/latent_space.png', optimize=True)
print("Image sauvegardée : /workspace/latent_space.png")
print("Dimensions :", img.size)
