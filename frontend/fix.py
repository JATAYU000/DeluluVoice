import re

with open("src/pages/Dashboard.tsx", "r") as f:
    content = f.read()

# 1. setTimeout duration tweaks (inserting)
content = re.sub(r"setTimeout\(\(\) => \{\s*setSelectedTape\(tape\);\s*setPlayerState\('inserting'\);\s*\}, \d+\);", 
                 "setTimeout(() => {\\n                setSelectedTape(tape);\\n                setPlayerState('inserting');\\n            }, 600);", content)

# setTimeout duration tweaks (idle)
content = re.sub(r"setTimeout\(\(\) => \{\s*setSelectedTape\(null\);\s*setPlayerState\('idle'\);\s*\}, \d+\);",
                 "setTimeout(() => {\\n            setSelectedTape(null);\\n            setPlayerState('idle');\\n        }, 600);", content)

# setTimeout duration tweaks (ready)
content = re.sub(r"const timer = setTimeout\(\(\) => \{\s*setPlayerState\('ready'\);\s*\}, \d+\);",
                 "const timer = setTimeout(() => {\\n                setPlayerState('ready');\\n            }, 50);", content)

# 2. Replacing framer-motion in Shelf
content = re.sub(r'<motion\.div\s+layoutId=\{`tape-\$\{tape\.id\}`\}\s+className="w-full h-full z-10 relative pointer-events-none"\s+transition=\{\{ type: "spring", stiffness: 120, damping: 20, mass: 1 \}\}\s*>\s*<CassetteGraphic tape=\{tape\} />\s*</motion\.div>',
                 '<div className="w-full h-full z-10 relative pointer-events-none transition-transform">\\n                                                                <CassetteGraphic tape={tape} />\\n                                                            </div>', content)

content = re.sub(r'<motion\.div\s+layoutId=\{`tape-\$\{tape\.id\}`\}\s+className="w-full h-full z-10 relative pointer-events-none"\s*>\s*<CassetteGraphic tape=\{tape\} />\s*</motion\.div>',
                 '<div className="w-full h-full z-10 relative pointer-events-none transition-transform">\\n                                                                <CassetteGraphic tape={tape} />\\n                                                            </div>', content)

# 3. Deck Transitions
content = re.sub(r'transition-(transform|all) duration-\[\d+ms\] ease-[a-zA-Z0-9\[\]\(\)\.,-]+', 'transition-all duration-[600ms] ease-out', content)

content = re.sub(r'style=\{\{\s*transform: \(playerState === \'ready\' \|\| playerState === \'playing\'\)\s*\?\s*\'translateY\(0\) scale\(1\)\'\s*:\s*\'translateY\(-180px\) scale\([0-9\.]+\)\',\s*\}\}',
                 "style={{\\n                                                transform: (playerState === 'ready' || playerState === 'playing')\\n                                                    ? 'translateY(0) scale(1)'\\n                                                    : 'translateY(-180px) scale(0.8)',\\n                                                opacity: (playerState === 'idle') ? 0 : 1\\n                                            }}", content)

content = re.sub(r'<motion\.div\s+layoutId=\{`tape-\$\{selectedTape\.id\}`\}\s+className="w-full h-full(?: drop-shadow-2xl)?"(?:\s+transition=\{\{ type: "spring", stiffness: 120, damping: 20, mass: 1 \}\})?\s*>\s*<CassetteGraphic tape=\{selectedTape\} />\s*</motion\.div>',
                 '<div className="w-full h-full drop-shadow-2xl">\\n                                                    <CassetteGraphic tape={selectedTape} />\\n                                                </div>', content)

with open("src/pages/Dashboard.tsx", "w") as f:
    f.write(content)
