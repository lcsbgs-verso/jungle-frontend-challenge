# Referência Figma verificada: Jungle / Kurio

Fonte: https://www.figma.com/design/CeU18pBkD6qZT9nJvCm4qn/Frontend-Challenge--Copy-?node-id=0-1
Página real: `0:1`, “Marketplace de NFTs GreenMint”. Leitura via MCP oficial, sessão `0efcc233-9a3c-4d7c-baa7-14271924fdca`. Nenhuma edição de Figma/repositório foi feita.
`figma-design-to-code` carregou com sucesso nesta execução. Contexto de alta fidelidade e screenshot solicitado para cada um dos 15 frames; exports foram baixados em seguida.

## Como usar
`reference.json` contém frames, dimensões, todas as layers com coordenadas locais, classes por node, tokens de cores/tipografia/espaçamento e mapa asset_usage (frame + variável + arquivo local). `contexts/<node-id>.txt` contém o retorno original completo, texto literal e posicionamento exato. Não usar o render do frame como imagem de implementação. Reusar os assets individuais sem redesenhar.

## Frames/estados reais
| Node | Frame | Dimensões Figma | Print local (px reais) |
|---|---|---|---|
| 2:2 | Desktop / Início | 1440 × 3668 | `screenshots/2-2.png` (1440 × 3668 |
| 10:244 | Desktop / Detalhes do NFT | 1440 × 2246.000244140625 | `screenshots/10-244.png` (1440 × 2246 |
| 11:1278 | Desktop / Carrinho de NFTs | 1440 × 1754.0001220703125 | `screenshots/11-1278.png` (1440 × 1754 |
| 11:2862 | Desktop / Pagamento | 1440 × 1657 | `screenshots/11-2862.png` (1440 × 1657 |
| 11:4385 | Desktop / Confirmação de Pedido | 1440 × 1657 | `screenshots/11-4385.png` (1440 × 1657 |
| 9:115 | Desktop / Login | 1440 × 1981 | `screenshots/9-115.png` (1440 × 1981 |
| 9:1022 | Desktop / Cadastro | 1440 × 1981 | `screenshots/9-1022.png` (1440 × 1981 |
| 9:1238 | Desktop / Perfil do Colecionador | 1440 × 1080 | `screenshots/9-1238.png` (1440 × 1080 |
| 9:1670 | Desktop / Carteiras | 1440 × 1080 | `screenshots/9-1670.png` (1440 × 1080 |
| 14:5226 | Mobile / Início | 414 × 896 | `screenshots/14-5226.png` (414 × 896 |
| 15:5536 | Mobile / Detalhes do NFT | 414 × 896 | `screenshots/15-5536.png` (414 × 896 |
| 16:360 | Mobile / Carrinho de NFTs | 414 × 896 | `screenshots/16-360.png` (414 × 896 |
| 16:748 | Mobile / Pagamento | 414 × 896 | `screenshots/16-748.png` (414 × 896 |
| 16:1022 | Mobile / Login | 414 × 896 | `screenshots/16-1022.png` (414 × 896 |
| 16:1228 | Mobile / Cadastro | 414 × 896 | `screenshots/16-1228.png` (414 × 896 |

## Estado visível e controles (não equivalem a wiring de protótipo)

### 2:2 — Desktop / Início
Home: header/nav, hero com CTA EXPLORAR e três indicadores, filtros Coleções/Faixa de preço/Rede, tabs, ordenação, grid 3 colunas, paginação, banners, artigos e footer/newsletter.
Contexto: `/workspace/jungle-design/contexts/2-2.txt`.

### 10:244 — Desktop / Detalhes do NFT
Detalhe: miniaturas, imagem principal/zoom, preço/rating, edição selecionada 1/50, quantidade 1 com −/+, COMPRAR, Favoritar, tabs Detalhes/Avaliações, relacionados.
Contexto: `/workspace/jungle-design/contexts/10-244.txt`.

### 11:1278 — Desktop / Carrinho de NFTs
Carrinho: 3 itens com quantidades 2/6/9 e total 26.846 ETH; lixeira por item, cupom/Aplicar, Conectar e finalizar, Continuar explorando, relacionados.
Contexto: `/workspace/jungle-design/contexts/11-1278.txt`.

### 11:2862 — Desktop / Pagamento
Pagamento desktop: formulário de perfil/carteira, obrigatórios indicados com *, resumo 3 itens, carteira e rede em radio cards; Coinbase Wallet selecionada; Confirmar compra.
Contexto: `/workspace/jungle-design/contexts/11-2862.txt`.

### 11:4385 — Desktop / Confirmação de Pedido
Confirmação: painel sobre fundo escuro sem header/footer visíveis, X fechar, mensagem Seus NFTs agora estão na sua carteira, id/data/total/carteira, itens, taxa e CTA Ver no Etherscan.
Contexto: `/workspace/jungle-design/contexts/11-4385.txt`.

### 9:115 — Desktop / Login
Login desktop: modal sobre home, Entrar ativo / Criar conta, X fechar, email/senha, olho, Esqueceu a senha?, Entrar, Google/Facebook. A home atrás difere da home principal: respeitar o frame.
Contexto: `/workspace/jungle-design/contexts/9-115.txt`.

### 9:1022 — Desktop / Cadastro
Cadastro desktop: mesmo tratamento modal, Criar conta ativo, usuário/email/senha/confirmar senha, olhos, Google/Facebook.
Contexto: `/workspace/jungle-design/contexts/9-1022.txt`.

### 9:1238 — Desktop / Perfil do Colecionador
Perfil desktop: sidebar com Dados do perfil ativo, campos perfil/ENS/avatar (Alterar/Remover), alteração de senha e Salvar.
Contexto: `/workspace/jungle-design/contexts/9-1238.txt`.

### 9:1670 — Desktop / Carteiras
Carteiras desktop: sidebar Carteiras ativo, Carteira principal com formulário, Adicionar, Salvar carteira; Carteira secundária vazia, opção Igual à carteira principal e Adicionar.
Contexto: `/workspace/jungle-design/contexts/9-1670.txt`.

### 14:5226 — Mobile / Início
Home mobile: busca Explorar coleções + botão filtros; hero próprio, tabs horizontais, grid 2 colunas desencontradas (coluna direita +32px), barra inferior com home/favoritos/scan/carrinho/perfil.
Contexto: `/workspace/jungle-design/contexts/14-5226.txt`.

### 15:5536 — Mobile / Detalhes do NFT
Detalhe mobile: voltar/favorito, grande imagem, sheet com nome/rating/descrição/edições (1/50 ativo)/metadados; rodapé de compra com quantidade 1, 1.19 ETH, Comprar NFT e carrinho.
Contexto: `/workspace/jungle-design/contexts/15-5536.txt`.

### 16:360 — Mobile / Carrinho de NFTs
Carrinho mobile: 4 itens (diferente do desktop), quantidades 1/1/2/2; item Ivory com lixeira, cupom pill, subtotal 8.92 ETH, taxa 0.016 e total 8.936 ETH, Conectar e finalizar.
Contexto: `/workspace/jungle-design/contexts/16-360.txt`.

### 16:748 — Mobile / Pagamento
Pagamento mobile: carteira conectada Reserva/Principal, Reserva selecionada, Trocar carteira, menu de três pontos; WalletConnect/MetaMask/Coinbase, Coinbase selecionada; 8.936 ETH e Confirmar compra. Não é o formulário desktop simplesmente empilhado.
Contexto: `/workspace/jungle-design/contexts/16-748.txt`.

### 16:1022 — Mobile / Login
Login mobile: tela inteira KURIO, Entrar, email/senha com olho, Esqueceu a senha?, CTA, Google/Facebook, link Crie uma conta.
Contexto: `/workspace/jungle-design/contexts/16-1022.txt`.

### 16:1228 — Mobile / Cadastro
Cadastro mobile: tela inteira KURIO, Criar perfil de colecionador, usuário/email/senha/confirmar, CTA Criar perfil, Google/Facebook, link Entre agora.
Contexto: `/workspace/jungle-design/contexts/16-1228.txt`.

## Tokens literais extraídos
- `border`: `#3f2319`
- `border-soft`: `#55321f`
- `foreground`: `#f5f1eb`
- `ink`: `#140d0a`
- `primary`: `#d28a4c`
- `secondary`: `#b39463`
- `surface-card`: `#241612`
- `surface-dark`: `#38220f`
- `surface-raised`: `#2f1d15`
- `text-accent`: `#e89b55`
- `text-coral`: `#f0805f`
- `text-primary`: `#f7f3ec`
- `text-secondary`: `#cfb28c`

Tipografia: família literal `Roboto Mono`, estilos Regular / Medium / Bold. Ver `font_specs`, `sizes_px` e `element_classes` por frame para pesos/tamanhos/line-height exatos. Não substituir por fonte sans ou serif.
- Desktop / Início tamanhos de texto: 0px, 10px, 12px, 13px, 14px, 15px, 16px, 17px, 18px, 22px, 24px, 28px, 43px, 9px; classes de spacing: gap-[10px], gap-[124px], gap-[12px], gap-[16px], gap-[20px], gap-[24px], gap-[28px], gap-[32px], gap-[40px], gap-[44px], gap-[48px], gap-[4px], gap-[6px], gap-[72px], gap-[88px], gap-[8px], gap-[92px], gap-[96px], p-[105px], p-[164px], p-[174px], p-[20px], p-[23px], p-[24px], p-[25px], p-[299px], p-[2px], p-[31px], p-[32px], p-[343px], p-[37px], p-[8.15px], p-[8px], p-[94px], pb-[10px], pb-[16px], pb-[24px], pb-[28px], pb-[32px], pb-[4px], pb-[8px], pl-[12px], pl-[16px], pl-[20px], pl-[28px], pl-[40px], pl-[8px], pr-[12px], pr-[36px], pr-[4px], pt-[12px], pt-[20px], pt-[24px], pt-[28px], pt-[6px], pt-[8px], px-[120px], px-[12px], px-[16px], px-[20px], px-[4px], py-[10px], py-[12px], py-[24px], py-[8px].
- Mobile / Início tamanhos de texto: 12px, 13px, 14px, 15px, 16px, 18px; classes de spacing: gap-[10px], gap-[16px], gap-[24px], gap-[4px], gap-[6px], gap-[8px], p-[12px], p-[16px], p-[23px], pb-[12px], pb-[140px], pb-[20px], pl-[12px], pl-[133px], pl-[8px], pr-[129px], pr-[8px], pt-[12px], pt-[20px], pt-[32px], pt-[40px], px-[24px], px-[4px], py-[12px].

## Geometria verificável
Desktop home: 1440px, área de conteúdo 1200px com margens 120px; Top em y=24, header 45px, hero y local=77 e 1200×450. Products em x=120/y=647; sidebar 310px, grid x local=358 e largura 842px (gap 48px). Restante exato na metadata/contexto.
Mobile home: frame 414×896, padding horizontal 24px e top 40px, radius externo 40px, gap principal 16px. Hero 190px de altura; cards 175px de largura; coluna direita padding-top 32px. Não inferir que radius 40px do frame seja regra para viewport desktop.

## Limites / não inventar
- Não há frames mobile de confirmação, perfil ou carteiras nesta página; também não há tablet nem outros breakpoints explícitos. São decisões de implementação a validar, não referência extraída.
- Ferramentas usadas retornam representação estática. Transições de protótipo, hover/focus/erro/loading, comportamento de filtros/cupom/validação/auth/carteiras reais não foram verificados. Os controles acima são affordances visíveis; não afirmar integração real de pagamento ou OAuth.
- Mobile e desktop possuem textos/dados/layouts diferentes. Não normalizar silenciosamente. A home mobile tem “SEJA DONO DA CULTURA DIGITAL”; desktop “SEJA DONO DO FUTURO DA ARTE DIGITAL”.
- get_design_context na raiz 0:1 respondeu “nothing selected”; leitura de metadata na raiz funcionou, e todos os 15 frames específicos retornaram contexto normalmente. Não foi necessário selecionar/alterar o Figma.
- Assets fornecidos por cada contexto estão baixados. URLs são temporárias; implementação deve usar arquivos locais e mapear variável/contexto. JSONs de download_assets têm rawImages/svgAssets adicionais não necessariamente baixados, pois o conjunto de implementação é o dos contexts.

## Entrega
Todos os caminhos são da box, não de um agente cloud remoto. Encaminhar o arquivo `jungle-design-reference.tar.gz` ou copiar a pasta inteira antes de pedir implementação; caminhos locais não existem automaticamente no cloud.