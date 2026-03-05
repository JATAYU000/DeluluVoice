import re

with open("src/pages/Dashboard.tsx", "r") as f:
    text = f.read()

# 1. MOCK_TAPES replacements
text = text.replace(
    "{ id: '1', name: 'Midnight Cruising', color: 'linear-gradient(to bottom right, #ff5500, #ff8c00)', createdAt: new Date().toISOString() }",
    "{ id: '1', name: 'Midnight Cruising', color: 'linear-gradient(to bottom right, #ff5500, #ff8c00)', createdAt: '1987-05-12T00:00:00.000Z' }"
).replace(
    "{ id: '2', name: 'Neon Dreams', color: 'linear-gradient(to bottom right, #8b5cf6, #d946ef)', createdAt: new Date().toISOString() }",
    "{ id: '2', name: 'Neon Dreams', color: 'linear-gradient(to bottom right, #8b5cf6, #d946ef)', createdAt: '1989-11-23T00:00:00.000Z' }"
).replace(
    "{ id: '3', name: 'Cyberpunk Verse', color: 'linear-gradient(to bottom right, #10b981, #34d399)', createdAt: new Date().toISOString() }",
    "{ id: '3', name: 'Cyberpunk Verse', color: 'linear-gradient(to bottom right, #10b981, #34d399)', createdAt: '1992-02-14T00:00:00.000Z' }"
).replace(
    "{ id: '4', name: 'LoFi Study Beat', color: 'linear-gradient(to bottom right, #3b82f6, #60a5fa)', createdAt: new Date().toISOString() }",
    "{ id: '4', name: 'LoFi Study Beat', color: 'linear-gradient(to bottom right, #3b82f6, #60a5fa)', createdAt: '1995-08-08T00:00:00.000Z' }"
).replace(
    "{ id: '5', name: 'Hard Drill Pt 2', color: 'linear-gradient(to bottom right, #ef4444, #f87171)', createdAt: new Date().toISOString() }",
    "{ id: '5', name: 'Hard Drill Pt 2', color: 'linear-gradient(to bottom right, #ef4444, #f87171)', createdAt: '1998-12-31T00:00:00.000Z' }"
)

# 2. Track name limit and size
# Replace maxLength={25} -> 20
text = text.replace("maxLength={25}", "maxLength={20}")
# Replace text-xs with text-[10px] for the input editing area
text = text.replace('className="absolute top-1 left-6 right-6 text-center text-black/90 font-display font-black text-xs uppercase z-20 bg-white/50 border border-black/20 rounded px-1 outline-none ring-1 ring-orange-500"',
                    'className="absolute top-1 left-6 right-6 text-center text-black/90 font-display font-black text-[10px] uppercase z-20 bg-white/50 border border-black/20 rounded px-1 outline-none ring-1 ring-orange-500"')
# Replace text-xs with text-[10px] for the span text area
text = text.replace('className="absolute top-2 left-6 right-6 text-center text-black/80 font-display font-black text-xs uppercase truncate z-10"',
                    'className="absolute top-2 left-6 right-6 text-center text-black/80 font-display font-black text-[10px] uppercase truncate z-10"')

# 3. Move Date to Bottom Left
date_render_code = """                    <span className="text-black/60 font-mono text-[8px] font-bold tracking-widest mt-1 whitespace-nowrap">
                        {new Date(tape.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
                    </span>"""

# Remove from top
text = text.replace(date_render_code, "")

# Add to bottom left
text = text.replace(
    '<span className="text-black/60 font-mono text-[6px] font-bold tracking-widest invisible">AI</span>',
    """<span className="text-black/60 font-mono text-[8px] font-bold tracking-widest whitespace-nowrap mb-0.5">
                        {new Date(tape.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
                    </span>"""
)

with open("src/pages/Dashboard.tsx", "w") as f:
    f.write(text)
