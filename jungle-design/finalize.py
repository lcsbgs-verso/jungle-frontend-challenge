exec(open('/workspace/jungle-design/extract.py').read().split('for d in [')[0])
doc=json.loads((base/'reference.json').read_text())
extra=['b53e92b0a22319c815ed771129d4efe16b3451ff9f17e22f1c96956c807fce7c','aa073e5cd6bcad7ef96bd4bd7b58c0716b989cc036be78b65468f6a70bf9255c','eed36cbdd9a848863127694764cc9ecf5f015d43ecbe6086054f376173309bfa','f4441935f613971c098f6fe47578a5357770ffc1254683901bb1b396bfff8ade','50edf3948cc3c1499fad28df8dc5c737dd3ca533c2b4c982509198e462b43a5e','900a0823ab5ed96e98289d2f602f5270cbdf8be83d3a6e3b415ead5f52661a95','2761e1f404cb51c81352453b82bd3f80f71aebc1586dfbee962524db22bbdd30']
from PIL import Image
for f,h in zip(doc['frames'],extra):
 raw=(src/(h+'.txt')).read_text();obj=json.loads(raw[raw.index('{'):raw.rindex('}')+1]);(base/'exports'/f"{f['id'].replace(':','-')}.json").write_text(json.dumps(obj,indent=2));url=obj['export']['url'];data=subprocess.check_output(["curl","-L","--fail","--silent","--show-error",url],timeout=60);Path(f['screenshot']).write_bytes(data);f['screenshot_resolution']='default node export';doc['downloads'].append({'url':url,'path':f['screenshot'],'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
for f in doc['frames']:
 im=Image.open(f['screenshot']);f['screenshot_pixels']=list(im.size)
 text=Path(f['context']).read_text()
 # Exact per-element class lists, including node ids, typography, spacing, colors, corners and geometry.
 f['element_classes']=[{'nodeId':nid,'classes':classes} for classes,nid in re.findall(r'className="([^"]*)"[^>]*data-node-id="([^"]+)"',text)]
(base/'reference.json').write_text(json.dumps(doc,indent=2,ensure_ascii=False))
notes=[
'Home: header/nav, hero com CTA EXPLORAR e três indicadores, filtros Coleções/Faixa de preço/Rede, tabs, ordenação, grid 3 colunas, paginação, banners, artigos e footer/newsletter.',
'Detalhe: miniaturas, imagem principal/zoom, preço/rating, edição selecionada 1/50, quantidade 1 com −/+, COMPRAR, Favoritar, tabs Detalhes/Avaliações, relacionados.',
'Carrinho: 3 itens com quantidades 2/6/9 e total 26.846 ETH; lixeira por item, cupom/Aplicar, Conectar e finalizar, Continuar explorando, relacionados.',
'Pagamento desktop: formulário de perfil/carteira, obrigatórios indicados com *, resumo 3 itens, carteira e rede em radio cards; Coinbase Wallet selecionada; Confirmar compra.',
'Confirmação: painel sobre fundo escuro sem header/footer visíveis, X fechar, mensagem Seus NFTs agora estão na sua carteira, id/data/total/carteira, itens, taxa e CTA Ver no Etherscan.',
'Login desktop: modal sobre home, Entrar ativo / Criar conta, X fechar, email/senha, olho, Esqueceu a senha?, Entrar, Google/Facebook. A home atrás difere da home principal: respeitar o frame.',
'Cadastro desktop: mesmo tratamento modal, Criar conta ativo, usuário/email/senha/confirmar senha, olhos, Google/Facebook.',
'Perfil desktop: sidebar com Dados do perfil ativo, campos perfil/ENS/avatar (Alterar/Remover), alteração de senha e Salvar.',
'Carteiras desktop: sidebar Carteiras ativo, Carteira principal com formulário, Adicionar, Salvar carteira; Carteira secundária vazia, opção Igual à carteira principal e Adicionar.',
'Home mobile: busca Explorar coleções + botão filtros; hero próprio, tabs horizontais, grid 2 colunas desencontradas (coluna direita +32px), barra inferior com home/favoritos/scan/carrinho/perfil.',
'Detalhe mobile: voltar/favorito, grande imagem, sheet com nome/rating/descrição/edições (1/50 ativo)/metadados; rodapé de compra com quantidade 1, 1.19 ETH, Comprar NFT e carrinho.',
'Carrinho mobile: 4 itens (diferente do desktop), quantidades 1/1/2/2; item Ivory com lixeira, cupom pill, subtotal 8.92 ETH, taxa 0.016 e total 8.936 ETH, Conectar e finalizar.',
'Pagamento mobile: carteira conectada Reserva/Principal, Reserva selecionada, Trocar carteira, menu de três pontos; WalletConnect/MetaMask/Coinbase, Coinbase selecionada; 8.936 ETH e Confirmar compra. Não é o formulário desktop simplesmente empilhado.',
'Login mobile: tela inteira KURIO, Entrar, email/senha com olho, Esqueceu a senha?, CTA, Google/Facebook, link Crie uma conta.',
'Cadastro mobile: tela inteira KURIO, Criar perfil de colecionador, usuário/email/senha/confirmar, CTA Criar perfil, Google/Facebook, link Entre agora.'
]
md=['# Referência Figma verificada: Jungle / Kurio','',
'Fonte: https://www.figma.com/design/CeU18pBkD6qZT9nJvCm4qn/Frontend-Challenge--Copy-?node-id=0-1',
'Página real: `0:1`, “Marketplace de NFTs GreenMint”. Leitura via MCP oficial, sessão `0efcc233-9a3c-4d7c-baa7-14271924fdca`. Nenhuma edição de Figma/repositório foi feita.',
'`figma-design-to-code` carregou com sucesso nesta execução. Contexto de alta fidelidade e screenshot solicitado para cada um dos 15 frames; exports foram baixados em seguida.',
'', '## Como usar','`reference.json` contém frames, dimensões, todas as layers com coordenadas locais, classes por node, tokens de cores/tipografia/espaçamento e mapa asset_usage (frame + variável + arquivo local). `contexts/<node-id>.txt` contém o retorno original completo, texto literal e posicionamento exato. Não usar o render do frame como imagem de implementação. Reusar os assets individuais sem redesenhar.',
'', '## Frames/estados reais','| Node | Frame | Dimensões Figma | Print local (px reais) |','|---|---|---|---|']
for f,note in zip(doc['frames'],notes):
 md.append(f"| {f['id']} | {f['name']} | {f['width']} × {f['height']} | `screenshots/{f['id'].replace(':','-')}.png` ({' × '.join(map(str,f['screenshot_pixels']))} |")
md+=['','## Estado visível e controles (não equivalem a wiring de protótipo)']
for f,note in zip(doc['frames'],notes):md+=['',f"### {f['id']} — {f['name']}",note,f"Contexto: `{f['context']}`."]
md+=['','## Tokens literais extraídos']
colors=sorted(set(tuple(c) for f in doc['frames'] for c in f['color_variables']))
for name,value in colors:md.append(f'- `{name}`: `{value}`')
md+=['','Tipografia: família literal `Roboto Mono`, estilos Regular / Medium / Bold. Ver `font_specs`, `sizes_px` e `element_classes` por frame para pesos/tamanhos/line-height exatos. Não substituir por fonte sans ou serif.']
for i in [0,9]:
 f=doc['frames'][i];md+=[f"- {f['name']} tamanhos de texto: {', '.join(f['sizes_px'])}; classes de spacing: {', '.join(f['spacing_classes'])}."]
md+=['','## Geometria verificável','Desktop home: 1440px, área de conteúdo 1200px com margens 120px; Top em y=24, header 45px, hero y local=77 e 1200×450. Products em x=120/y=647; sidebar 310px, grid x local=358 e largura 842px (gap 48px). Restante exato na metadata/contexto.',
'Mobile home: frame 414×896, padding horizontal 24px e top 40px, radius externo 40px, gap principal 16px. Hero 190px de altura; cards 175px de largura; coluna direita padding-top 32px. Não inferir que radius 40px do frame seja regra para viewport desktop.',
'', '## Limites / não inventar','- Não há frames mobile de confirmação, perfil ou carteiras nesta página; também não há tablet nem outros breakpoints explícitos. São decisões de implementação a validar, não referência extraída.',
'- Ferramentas usadas retornam representação estática. Transições de protótipo, hover/focus/erro/loading, comportamento de filtros/cupom/validação/auth/carteiras reais não foram verificados. Os controles acima são affordances visíveis; não afirmar integração real de pagamento ou OAuth.',
'- Mobile e desktop possuem textos/dados/layouts diferentes. Não normalizar silenciosamente. A home mobile tem “SEJA DONO DA CULTURA DIGITAL”; desktop “SEJA DONO DO FUTURO DA ARTE DIGITAL”.',
'- get_design_context na raiz 0:1 respondeu “nothing selected”; leitura de metadata na raiz funcionou, e todos os 15 frames específicos retornaram contexto normalmente. Não foi necessário selecionar/alterar o Figma.',
'- Assets fornecidos por cada contexto estão baixados. URLs são temporárias; implementação deve usar arquivos locais e mapear variável/contexto. JSONs de download_assets têm rawImages/svgAssets adicionais não necessariamente baixados, pois o conjunto de implementação é o dos contexts.',
'', '## Entrega','Todos os caminhos são da box, não de um agente cloud remoto. Encaminhar o arquivo `jungle-design-reference.tar.gz` ou copiar a pasta inteira antes de pedir implementação; caminhos locais não existem automaticamente no cloud.']
(base/'reference.md').write_text('\n'.join(md),encoding='utf-8')
print('Final: frames',len(doc['frames']),'color tokens',colors,'assets',len(list((base/'assets').iterdir())),'screenshots',len(list((base/'screenshots').iterdir())))
