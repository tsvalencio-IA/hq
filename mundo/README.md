# Universo thIAguinho — Mundo Aberto (solo)
Versão 1.0 — rota separada /hq/mundo/
Inspirado no projeto do próprio usuário OTThi-World3, adotando a lógica de câmera orbital, joystick, exploração e missões em mundo aberto. Não transfere credenciais, autenticação, Firebase nem multiplayer.
## Controles
Android: joystick esquerdo anda; arraste a cena para girar câmera 360° e olhar para cima/baixo; dois dedos dão zoom; botões CORRER/PULAR/AÇÃO. Os botões ▲ ▼ inclinam a câmera, + e - regulam zoom.
Desktop: WASD ou setas para andar, Shift para correr, Espaço para pular, E para interagir, arrastar com mouse para câmera e rolagem para zoom.
## Missões
1. 🐾 Luna & Liz: arremesso com trajetória, cachorro busca, pega e devolve. Precisam completar duas entregas cada.
2. 🔧 Oficina: análise de circuito de carga simulado, com decisões orientadas por medições.
3. 💻 Sistemas: quatro desafios de correção lógica e testes.
4. 🏃 Corrida: passar por cinco pontos em sequência, com limite de tempo.
## Arquitetura
Um único HTML autocontido (CSS, JS e imagens incorporados). Funciona sem bibliotecas externas e sem conexão após download. Perspectiva 3D em coordenadas espaciais via renderer Canvas 2D; personagens são sprites 2.5D sempre orientados à câmera (não malhas 3D). Sem conta nem sync: conquistas, moedas, avatar e posição ficam exclusivamente em localStorage no próprio navegador.
## Origem
Repositório de referência: https://github.com/tsvalencio-IA/OTThi-World3
Esta pasta é independente e NÃO modifica o jogo já publicado em /hq/.
