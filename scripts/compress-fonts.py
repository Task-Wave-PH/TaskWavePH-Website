"""Generate WOFF2 from original Poppins TTFs; requires fonttools and brotli."""
from pathlib import Path
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent / "public/fonts/poppins"
for source in sorted(root.glob("Poppins-*.ttf")):
    font = TTFont(source, recalcTimestamp=False)
    destination = source.with_suffix(".woff2")
    font.flavor = "woff2"
    font.save(destination)
    converted = TTFont(destination)
    assert font.getBestCmap() == converted.getBestCmap()
    assert font.getGlyphOrder() == converted.getGlyphOrder()
    assert font["hmtx"].metrics == converted["hmtx"].metrics
    assert font["OS/2"].usWeightClass == converted["OS/2"].usWeightClass
    print(f"{source.name}: {source.stat().st_size} -> {destination.stat().st_size} bytes")
