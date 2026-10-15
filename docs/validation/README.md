# Validação do jogo 3D — 15/10/2026

Código verificado: `b745c0ac20daea7eb8f8cc5711d29556825540cd`.

Execução: https://github.com/tsvalencio-IA/hq/actions/runs/38805857656

Resultado: **87 verificações aprovadas**, sem erros de JavaScript e sem falhas de carregamento de recursos.

- Quatro modelos volumétricos articulados; posições, normais e matrizes válidas.
- Entrada principal redireciona ao mundo 3D.
- Teclado, joystick, giro de câmera, salto e aceno.
- 18 devoluções cobrindo Luna e Liz, os três brinquedos e três regiões do mapa; recompensa somente após a devolução.
- Lançamento adicional por mira no chão, conferindo a posição 3D escolhida e a devolução.
- Missões da oficina, tecnologia, seis checkpoints de corrida e coleta das quinze estrelas.
- Seleção do avatar e persistência de estrelas, conquistas e devoluções após recarregar a página.
- Chromium em 1440×900, 393×852, 320×568 e 852×393; telas móveis emuladas.

`report.json` guarda as verificações individuais. As imagens são capturas do renderizador real do jogo, com compressão WebP. A captura de computador usa posições controladas pelo teste para permitir a inspeção dos quatro personagens de frente.

Os modelos são recriações em malhas procedurais a partir da ficha aprovada, não arquivos tridimensionais originais dessa ficha. A validação automatizada de funcionamento não demonstra identidade visual perfeita com a ilustração e não substitui teste num aparelho Android físico.
