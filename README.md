# Universo thIAguinho — Aventuras em Família 3D

[Jogar](https://tsvalencio-ia.github.io/hq/3d/?v=20261016-acoes) · [Personagens de referência](https://tsvalencio-ia.github.io/hq/3d/personagens.html)

Mundo aberto individual para navegador, com recriações 3D articuladas de Thiago, Thamis, Luna (clara/creme) e Liz (preta/branca), baseadas na ficha visual aprovada. A entrada principal do GitHub Pages abre o mundo 3D.

## Aventuras

- Luna e Liz buscam bolinha, disco e ossinho em qualquer região do mapa. A recompensa só é registrada depois da devolução. Duas devoluções de cada cachorrinha desbloqueiam a conquista da família.
- Corrida por seis checkpoints no parque.
- Oficina: missão de diagnóstico elétrico com decisões baseadas em leituras **simuladas e didáticas**.
- Tecnologia: quatro desafios de lógica e de preservação de dados.
- Exploração: quinze estrelas escondidas pelo mapa.

Nove novas tarefas em três áreas, com três etapas visíveis cada: roda, motor e lavagem na oficina; jardim, refeição de Luna e Liz e organização em casa; computador, rede e aplicativo no estúdio. O personagem se aproxima e executa cada ação com o próprio corpo, ferramentas e objetos 3D. Cada etapa começa por comando do jogador e pode ser pausada ou revista. Girar a câmera, elevar, baixar e aproximar continuam disponíveis durante as atividades e os desafios anteriores.

O quadro **📋 Objetivos** abre todas as tarefas. O botão **AÇÃO** mostra as tarefas do local. O progresso de cada etapa fica salvo, e a recompensa de cada tarefa só é entregue uma vez. Concluir as três tarefas de cada área libera uma conquista adicional.

Oito conquistas ao todo. Personagem selecionado, estrelas, conquistas e devoluções são salvos no armazenamento local do navegador. Não há autenticação, multiplayer, Firebase ou backend.

## Controles

| Ação | Computador | Celular |
|---|---|---|
| Andar | WASD ou setas | Joystick |
| Correr | Shift | Segurar CORRER |
| Pular | Espaço | PULAR |
| Arremessar | F | LANÇAR |
| Interagir | E | AÇÃO |
| Câmera | Arrastar + roda do mouse | Arrastar + pinça |
| Escolher personagem/destino | Menu | Menu |

Os quatro personagens usam malhas com volume e articulações, em vez das imagens planas ou do modo geométrico antigo. Árvores entre a câmera e os personagens ficam transparentes. A ficha de referência e as recriações em 3D estão descritas em [3d/README_PERSONAGENS.md](3d/README_PERSONAGENS.md).

## Estrutura e verificação

- `3d/index.html`: mundo WebGL, controles, interface, missões e progresso local.
- `3d/mascotes-3d.js`: malhas dos quatro personagens e articulações.
- `tests/geometry.mjs`: matrizes, vértices, normais, volume e movimento das articulações.
- `3d/atividades.js` e `3d/atividades.css`: quadro de objetivos, tarefas com atuação e câmera livre.
- `tests/activities.mjs`: etapas, pausa, câmera, recompensas, retomada e telas móveis.
- `tests/game.mjs`: navegador, devoluções com as duas cachorras, missões, progresso e telas de celular/computador.
- `.github/workflows/validate-3d.yml`: executa os testes e guarda relatório e capturas no artefato `game-3d-proof`.

Para reproduzir: `npm ci`, `npx playwright install --with-deps chromium`, `npm test`. A validação em navegador emula telas móveis; não equivale a um teste em aparelho Android físico.

As versões anteriores permanecem no histórico Git e nos diretórios de versões.
