>#!/usr/bin/env python3
"""Controle qualite d'un corpus de fragments poétiques.

    python3 check-corpus.py <corpus.txt> [--lang en|fr] [--min 2] [--max 11]

Verifie : doublons, longueur, ponctuation terminale, caracteres non-ASCII,
mots d'une autre langue.

REGLE : apres un changement de langue du corpus, relire la liste des mots
etrangers a la main. Les mots courts communs aux deux langues ("a", "la",
"son") produisent des faux positifs et font echouer un corpus sain.
"""
import argparse
import re
import sys
from collections import Counter

# Mots qui appartiennent a plusieurs langues : jamais un signal de langue etrangere.
SHARED = set("a la le les de du un une des et ou mais que qui ne ni son sa ses "
             "mon ma mes ton ta tes leur leurs en y on ou plus tres bien mal "
             "jour nuit homme femme ville rue mer ciel arbre main temps rien "
             "toujours jamais est sont etait etaient sera seront avoir ont "
             "etat ete avec pour par dans sur sous chez sans entre deux "
             "elle elles nous vous ils elles moi toi soi soi meme".split())

FRENCH = set("""le la les des du une et ou mais donc car ni que qui quoi dont
etait etaient sera seront avoir ont tres bien mal jour nuit homme femme
ville rue mer ciel arbre main coeur bouche oeil temps rien toujours jamais
""".split()) - SHARED

ENGLISH = set("""the and but so yet of at by for with about against between into
through during before after above below from over under again further then once
here there all any both each few more most other some such only own same than
too very can will just don should now are was were been being has had does did
""".split()) - SHARED

NON_ASCII_OK = set("áàâäãéèêëíìîïóòôöõúùûüýÿñçœæÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑÇŒÆ")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("corpus")
    ap.add_argument("--lang", choices=["en", "fr"], default="en")
    ap.add_argument("--min", type=int, default=2)
    ap.add_argument("--max", type=int, default=11)
    args = ap.parse_args()

    try:
        raw = open(args.corpus, encoding="utf-8").read()
    except OSError as e:
        print("lecture impossible :", e)
        return 2

    lines = [l.strip() for l in raw.splitlines() if l.strip()]

    print("fragments          :", len(lines))

    dups = [k for k, v in Counter(lines).items() if v > 1]
    print("doublons           :", len(dups))
    for d in dups:
        print("   !", d)

    lens = [len(l.split()) for l in lines]
    if lens:
        print("mots: min=%d max=%d moyenne=%.1f"
              % (min(lens), max(lens), sum(lens) / len(lens)))

    long = [(l, len(l.split())) for l in lines if len(l.split()) > args.max]
    print("trop longs         :", len(long))
    for l, n in long:
        print("   !", n, l)

    short = [(l, len(l.split())) for l in lines if len(l.split()) < args.min]
    print("trop courts        :", len(short))
    for l, n in short:
        print("   !", n, l)

    # La ponctuation finale est ajoutee par le generateur : un fragment ne
    # doit PAS en porter, sauf point d'exclamation legitime.
    punct = [l for l in lines if re.search(r"[.!?]$", l)]
    print("ponctuation finale :", len(punct), "(a eviter : la generation l'ajoute)")
    for l in punct[:10]:
        print("   !", l)

    odd = sorted({ch for l in lines for ch in l if ord(ch) > 127} - NON_ASCII_OK)
    print("non-ASCII suspects :", "".join(odd) if odd else "aucun")

    foreign = FRENCH if args.lang == "en" else ENGLISH
    hits = []
    for l in lines:
        for w in re.findall(r"[a-zà-ÿ]+", l.lower()):
            if w in foreign:
                hits.append((w, l))
                break
    print("mots etrangers     :", len(hits))
    for w, l in hits[:15]:
        print("   !", w, "->", l)

    ok = not dups and not long and not short and not punct and not hits
    print("\nRESULTAT:", "CORPUS PROPRE" if ok else "A CORRIGER")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
