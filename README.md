# Universo thIAguinho — HQ Jogável V4.2

Jogo em pseudo-3D para navegador, com os personagens Thiago, Thamis, Luna (branca/creme) e Liz (preta/branca). As artes caricaturadas e os cenários estão incorporados ao arquivo principal.

**Jogar:** https://tsvalencio-ia.github.io/hq/?v=4.2

## Fases
- **Família — Luna e Liz:** escolha a cachorrinha e o brinquedo, toque ou arraste para arremessar; acompanhe a busca, a captura e a devolução. Vitória após duas devoluções de cada uma.
- **Corrida:** inicie o percurso, salte cones, agache para evitar barreiras e acelere até a chegada. Existe pontuação, colisão e perda de vidas.
- **Oficina:** simulação didática de leitura de três parâmetros, decisões de diagnóstico e interação com o reparo ilustrado. **Valores e defeitos são fictícios; não é um diagnóstico de veículo real.**
- **Sistemas:** organize as etapas Ideia → Protótipo → Teste → Deploy e resolva os bugs apresentados.

## Android e computador
- Interface responsiva, com controles por toque; também funciona com mouse.
- Narração opcional por síntese de fala do navegador, quando compatível.
- O progresso de capítulos concluídos é salvo localmente no navegador.
- Sem autenticação, Firebase ou coleta de dados.

## Arquivos
`index.html` é autocontido: imagens, estilos e lógica do jogo ficam no mesmo arquivo para facilitar a publicação pelo GitHub Pages. Arquivos da V3 foram preservados no repositório apenas como histórico.

## Validação
Testes automatizados com Playwright/Chromium em 320×640, 360×740, 390×844 e 1280×800 sem rolagem horizontal e com imagens carregadas. Os quatro fluxos de vitória foram exercitados no Chromium. O funcionamento ainda precisa ser validado num Android físico.

## Observação de fidelidade
Os personagens são ilustrações 2.5D inspiradas nas artes aprovadas. As animações são estilizadas e não constituem modelos tridimensionais totalmente articulados.
