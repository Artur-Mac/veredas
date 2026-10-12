# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=11"]
# ///
from math import cos, pi, sin
from pathlib import Path

from PIL import Image, ImageDraw

TAMANHO = 1024
SUPERAMOSTRAGEM = 4
DESTINO = Path(__file__).resolve().parents[2] / "assets" / "images"

TINTA = (14, 31, 27, 255)
GRADE = (24, 48, 42, 255)
MARE_ESCURO = (76, 205, 184, 255)
AZULEJO_ESCURO = (141, 165, 255, 255)
MARE_CLARO = (8, 112, 95, 255)
AZULEJO_CLARO = (27, 67, 192, 255)
BRANCO = (255, 255, 255, 255)

PEGADA = [(392, 372), (612, 340), (628, 452), (676, 446), (700, 620), (424, 660)]


def escalar(pontos, fator):
    cx, cy = TAMANHO / 2, TAMANHO / 2
    return [(((x - cx) * fator + cx) * SUPERAMOSTRAGEM, ((y - cy) * fator + cy) * SUPERAMOSTRAGEM) for x, y in pontos]


def circulo_tracejado(desenho, centro, raio, cor, espessura, tracos=36):
    passo = 2 * pi / tracos
    for i in range(tracos):
        inicio = i * passo
        fim = inicio + passo * 0.58
        pontos = [
            (
                (centro[0] + raio * cos(inicio + (fim - inicio) * t / 8)) * SUPERAMOSTRAGEM,
                (centro[1] + raio * sin(inicio + (fim - inicio) * t / 8)) * SUPERAMOSTRAGEM,
            )
            for t in range(9)
        ]
        desenho.line(pontos, fill=cor, width=espessura * SUPERAMOSTRAGEM, joint="curve")


def desenhar(fundo, grade, cor_raio, cor_pegada, fator=1.0, ocorrencias=True):
    lado = TAMANHO * SUPERAMOSTRAGEM
    imagem = Image.new("RGBA", (lado, lado), fundo if fundo is not None else (0, 0, 0, 0))
    desenho = ImageDraw.Draw(imagem)
    if grade is not None:
        for posicao in range(0, TAMANHO + 1, 64):
            desenho.line([(posicao * SUPERAMOSTRAGEM, 0), (posicao * SUPERAMOSTRAGEM, lado)], fill=grade, width=2 * SUPERAMOSTRAGEM)
            desenho.line([(0, posicao * SUPERAMOSTRAGEM), (lado, posicao * SUPERAMOSTRAGEM)], fill=grade, width=2 * SUPERAMOSTRAGEM)
    centro = (TAMANHO / 2, TAMANHO / 2)
    circulo_tracejado(desenho, centro, 300 * fator, cor_raio, max(int(16 * fator), 6))
    desenho.polygon(escalar(PEGADA, fator), fill=cor_pegada)
    if ocorrencias:
        for x, y in [(300, 640), (716, 300)]:
            px = ((x - centro[0]) * fator + centro[0]) * SUPERAMOSTRAGEM
            py = ((y - centro[1]) * fator + centro[1]) * SUPERAMOSTRAGEM
            raio = 30 * fator * SUPERAMOSTRAGEM
            desenho.ellipse([px - raio, py - raio, px + raio, py + raio], outline=cor_pegada, width=int(14 * fator * SUPERAMOSTRAGEM))
    return imagem.resize((TAMANHO, TAMANHO), Image.LANCZOS)


def salvar(imagem, nome, tamanho=None):
    final = imagem if tamanho is None else imagem.resize((tamanho, tamanho), Image.LANCZOS)
    final.save(DESTINO / nome)
    print(f"{nome}: {final.size[0]}x{final.size[1]}")


def main():
    DESTINO.mkdir(parents=True, exist_ok=True)
    icone = desenhar(TINTA, GRADE, MARE_ESCURO, AZULEJO_ESCURO)
    salvar(icone, "icon.png")
    salvar(icone, "favicon.png", 48)
    salvar(Image.new("RGBA", (TAMANHO, TAMANHO), TINTA), "android-icon-background.png")
    salvar(desenhar(None, None, MARE_ESCURO, AZULEJO_ESCURO, fator=0.82), "android-icon-foreground.png")
    salvar(desenhar(None, None, BRANCO, BRANCO, fator=0.82), "android-icon-monochrome.png")
    salvar(desenhar(None, None, MARE_CLARO, AZULEJO_CLARO, ocorrencias=False), "splash-icon.png")
    salvar(desenhar(None, None, MARE_ESCURO, AZULEJO_ESCURO, ocorrencias=False), "splash-icon-dark.png")


if __name__ == "__main__":
    main()
