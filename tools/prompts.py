#!/usr/bin/env python3
"""Gera img/prompts.json — prompts em inglês (prosa) para cada cena dos 4 vídeos."""
import json

H = (1344, 768)   # 16:9
V = (768, 1344)   # 9:16
VERT = ' Vertical portrait composition, main subject centered in the upper two thirds of the frame.'

P = {
 's1': 'A tidal wave of thousands of paper letters and envelopes pouring out of an open laptop on a dark wooden desk in a night office, a single empty chair pushed back, an amber desk lamp glowing, cool teal light spilling from the screen.',
 's2': 'Inside a vast dark server hall, a glowing amber humanoid silhouette made of pure light assembling floating translucent tools and glass modules in mid-air, like a craftsman building its own workshop.',
 's3': 'A lone person seen from behind standing at a threshold, a giant open door in a dark concrete wall with brilliant amber light flooding through, mist on the floor.',
 's4': 'Extreme close up of an elegant abstract mechanical eye made of glass and brass, its iris reflecting dozens of tiny glowing windows, dark background with teal and amber reflections.',
 's5': 'A dark stone maze seen from directly above, a single glowing amber thread of light winding around walls and dead ends toward the exit, cinematic top-down view.',
 's6': 'Two sleek humanoid figures made of glass and inner light exchanging a glowing envelope across a long dark boardroom table, city lights through the window at night.',
 's7': 'A calm night office where dozens of sticky notes and task cards dissolve into golden particles rising toward a single steady amber lantern held by a silhouette.',
 's8': 'Macro shot of a glowing magnifying glass hovering over a tall stack of paper ledgers, one thin red thread of light tracing a column of numbers, dark desk, amber lamp.',
 's9': 'Ten small glowing miniature game worlds floating like snow globes above a workbench, a designer\'s hand reaching for one, warm amber laboratory lighting.',
 's10': 'A narrow suspension bridge made of light stretching across a dark chasm toward a distant illuminated city, the last plank still missing, fog below.',
 's11': 'An old leather notebook on a desk, its pages turning into flowing golden threads that weave into the shape of a human profile, dark background.',
 's12': 'A woman in a dark studio calmly conducting several floating orbs of light like an orchestra conductor, each orb busy with its own task, cinematic side light.',
 's13': 'Five glowing lanterns shaped like question marks hanging in a dark corridor, a person walking toward them, amber and teal light.',
 's14': 'Dawn breaking over a dark city skyline, a single illuminated window in a tall building, hopeful warm light on the horizon.',
}

R = {
 'r1-s1': P['s1'], 'r1-s2': 'A blank empty notebook page on a dark desk lit by a single amber lamp, a pen resting untouched beside it, no writing at all.',
 'r1-s3': P['s2'], 'r1-s4': 'A warm morning kitchen with an open laptop and a steaming coffee cup, golden sunlight through the window, the screen glowing softly.',
 'r1-s5': P['s3'], 'r1-s6': P['s14'],
 'r2-s1': 'Close up of tired hands typing frantically on a keyboard in a dark room, harsh teal monitor light, scattered sticky notes.',
 'r2-s2': P['s7'], 'r2-s3': 'A glowing amber orb hovering above an empty night desk, the office chair empty, full moon through the window, long shadows.',
 'r2-s4': 'A dark open-plan office at three in the morning, rows of empty desks, only one monitor glowing warm amber, city lights outside.',
 'r2-s5': P['s6'], 'r2-s6': P['s12'],
 'r3-s1': 'A person seen from behind holding a glowing brass key, facing a colossal closed door with light leaking around its edges, dark hall.',
 'r3-s2': 'Cupped human hands holding a small glowing miniature city with tiny lights, dark background, warm light on the face of the hands.',
 'r3-s3': 'An open old book on a dark table emitting soft light, translucent floating photographs and memories rising from its pages.',
 'r3-s4': 'A lone sleek robot figure walking away down an empty road into thick fog at dawn, faint amber sunrise ahead.',
 'r3-s5': 'A handshake between a human hand and a hand made of glowing amber light particles, dark background, dramatic rim light.',
 'r3-s6': 'A tall watchtower on a cliff with a single beam of warm light sweeping over a dark valley at night, stars above.',
 'r3-s7': P['s14'],
}

itens = []
seed = 100
for k, pr in P.items():
    seed += 7
    itens.append({'id': f'p-{k}', 'prompt': pr, 'w': H[0], 'h': H[1], 'seed': seed})
    itens.append({'id': f'pv-{k}', 'prompt': pr + VERT, 'w': V[0], 'h': V[1], 'seed': seed + 1})
for k, pr in R.items():
    seed += 7
    itens.append({'id': k, 'prompt': pr + VERT, 'w': V[0], 'h': V[1], 'seed': seed})
json.dump(itens, open('img/prompts.json', 'w'), indent=1, ensure_ascii=False)
print(len(itens), 'prompts')
